# Design

## Context

Lihat `proposal.md` untuk motivasi. Kondisi saat ini yang membentuk pendekatan:

- `server/src/app.js` membuat satu Express app dengan `createApp(db, { corsOrigins, healthCheckTimeoutMs })`; seluruh handler memakai repository async dan mengembalikan envelope `{ success, data }` / `{ success, message, errors }`.
- `server/src/schema.js` sudah memiliki kolom `user_id` bertipe `text` yang nullable pada `categories` dan `tasks`, beserta index `idx_categories_user_id` dan `idx_tasks_user_id`. Belum ada tabel `users`, `sessions`, atau filter kepemilikan.
- Unique index `(user_id, lower(name)) NULLS NOT DISTINCT` sudah ada, sehingga keunikan kategori per pemilik dapat dipakai tanpa migration ulang.
- Migration Drizzle yang ada: `0000_daily_aqueduct.sql`, `0001_category_unique.sql`, `0002_seed_categories.sql`. Seed kategori global memakai `user_id` NULL.
- `server/src/config.js` memvalidasi `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `CORS_ORIGIN`; CORS saat ini `credentials: false`.
- `client/src/api.js` memakai `fetch` tanpa `credentials`; `client/src/routing.js` memiliki `/` dan `/app` dengan gate `VITE_PUBLIC_DEPLOYMENT` yang mengalihkan `/app` ke `/` pada build publik.
- Integration test memakai `server/.env.test`, `resetTestSchema`, `runTestMigrations`, dan `truncateTestTables` yang saat ini men-truncate `tasks, categories` lalu menanam seed kategori global.
- `migrate-sqlite-to-neon-drizzle` dan `add-public-landing-page` sudah diarsipkan dan disinkronkan ke main specs. Main `public-landing` saat ini memblokir `/app` pada deployment publik dan belum menautkan autentikasi; change ini menggantikannya dengan guard sesi.

## Goals / Non-Goals

**Goals:**

- Autentikasi akun dengan register, login, logout, dan sesi yang dapat dicabut.
- Isolasi data end-to-end: repository, API, statistik, dan UI hanya menampilkan data pemilik sesi.
- Mempertahankan envelope API dan endpoint/payload yang sudah ada; hanya menambah endpoint autentikasi dan status error baru.
- Migration additive yang tidak mengubah migration lama dan tidak menghapus data lama.
- UI yang sama untuk semua pengguna, dengan halaman autentikasi yang konsisten dengan design system.

**Non-Goals:**

- Verifikasi email, reset password, OAuth/SSO, 2FA, penghapusan akun, role/admin, audit log, dan sinkronisasi data legacy otomatis.
- Perubahan stack, rewrite UI, deployment, atau perubahan production database pada change ini.
- Rate limiting terdistribusi atau proteksi DDoS tingkat edge.
- Kustomisasi tema/tata letak per pengguna.

## Decisions

### 1. Sesi opaque berbasis cookie, bukan JWT

Sesi disimpan di tabel `sessions`; browser hanya menerima token acak 32 byte (base64url) melalui cookie `HttpOnly`. Server menyimpan SHA-256 dari token, sehingga database leak tidak langsung memberikan token aktif. Logout menghapus baris sesi dan cookie, sehingga revocation langsung berlaku.

- **Alternatif ditolak:** JWT stateless (revocation sulit dan butuh refresh-token flow), token di `localStorage` (rentan XSS), session di memori (hilang saat restart dan tidak cocok multi-instance).
- **Cookie:** nama `ptm_session`, `HttpOnly`, `Path=/`, `Secure` pada production, `Max-Age` dari `SESSION_TTL_HOURS` (default 168 jam).
- **Topologi first-party (wajib):** deployment yang didukung harus membuat cookie sesi bersifat first-party, melalui salah satu dari: (a) frontend dan backend pada subdomain dari registrable domain yang sama (mis. `app.example.com` + `api.example.com`) dengan `SameSite=Lax`, atau (b) reverse proxy/rewrite same-origin (mis. Vercel meneruskan `/api` ke Render) sehingga browser melihat satu origin. Ini menghindari ketergantungan pada cookie pihak ketiga.
- **`SameSite=None` hanya fallback:** dipakai hanya bila cross-site tidak dapat dihindari, selalu dengan `Secure`, dan didokumentasikan sebagai konfigurasi yang tidak didukung pada browser yang memblokir cookie pihak ketiga.
- **Rotasi:** login selalu membuat token sesi baru; token lama tidak dipakai ulang.

### 2. CSRF synchronizer token + pemeriksaan Origin

CSRF dicegah berlapis, bukan hanya mengandalkan `SameSite`. Semua request mutasi (`POST`, `PATCH`, `DELETE`) memeriksa header `Origin` yang wajib ada dan berasal dari allowlist CORS; request tanpa `Origin` ditolak. Register dan login juga mewajibkan `Content-Type: application/json` untuk mencegah simple-form cross-site request. Setelah sesi terbentuk, logout dan seluruh mutasi data wajib membawa token CSRF synchronizer yang tersimpan pada baris sesi dan dibandingkan dengan `crypto.timingSafeEqual` melalui header `X-CSRF-Token`.

- **Register/login (pre-auth):** belum ada sesi, sehingga kontrol CSRF adalah Origin wajib + allowlist + `Content-Type: application/json`.
- **Logout dan mutasi data (terautentikasi):** token CSRF synchronizer wajib; logout tanpa token valid ditolak `403` dan sesi tetap aktif. Logout tanpa sesi valid bersifat idempoten dan hanya membersihkan cookie.
- **Alternatif ditolak:** double-submit cookie tanpa pengikatan sesi (lebih lemah), `SameSite=Strict` (tidak mengirim cookie pada cross-site fetch dan tidak menyelesaikan CSRF pre-auth).
- **CORS:** `credentials: true`, origin eksplisit tanpa wildcard, `allowedHeaders: ['Content-Type', 'X-CSRF-Token']`, metode `GET, POST, PATCH, DELETE, OPTIONS`.

### 3. Password memakai Argon2id

Dependency `argon2` dipakai dengan mode Argon2id dan parameter minimal OWASP (memory 19 MiB, time cost 2, parallelism 1) atau default library yang setara. Password 8–128 karakter; email di-trim, di-lowercase, divalidasi format dan panjang maksimal 254.

- Login memakai pesan generik "Email atau password salah" untuk email tidak dikenal maupun password salah.
- Untuk mengurangi timing enumeration, email tidak dikenal tetap menjalankan verifikasi Argon2 terhadap hash dummy.
- **Alternatif ditolak:** bcrypt (baik, tetapi Argon2id lebih disarankan OWASP saat ini), scrypt buatan sendiri (rawan kesalahan implementasi).

### 4. ID pengguna berupa UUID teks

`users.id` bertipe `text` dan dibuat dengan `crypto.randomUUID()` dari aplikasi. Ini cocok dengan kolom `user_id text` yang sudah ada, sehingga tidak perlu mengubah tipe kolom, tidak mengubah ID tugas/kategori, dan tidak mengulang migration lama.

- **Alternatif ditolak:** `users.id` integer/serial (memerlukan ALTER pada `tasks.user_id` dan `categories.user_id` beserta data), atau UUID pada ID tugas/kategori (di luar scope dan bertentangan dengan keputusan change sebelumnya).

### 5. Migration additive baru, tanpa menyentuh `0000`–`0002`

Migration baru (di-generate Drizzle Kit, diberi nomor berikutnya) menambahkan:

- `users`: `id text PK`, `email text NOT NULL`, `password_hash text NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, unique index pada `lower(email)`.
- `sessions`: `id text PK`, `user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `token_hash text NOT NULL UNIQUE`, `csrf_token text NOT NULL`, `expires_at timestamptz NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, index pada `user_id` dan `expires_at`.
- Foreign key `tasks.user_id → users.id` dan `categories.user_id → users.id`, keduanya `ON DELETE CASCADE` untuk integritas.

Kolom `user_id` tetap nullable di database karena data legacy. Aplikasi selalu mengisi `user_id` untuk data baru, dan seluruh query mensyaratkan pemilik. Menambahkan `NOT NULL` langsung akan gagal pada data legacy dan tidak dilakukan.

Seed kategori global dari `0002` tidak dihapus. Data tersebut tetap ada dengan `user_id` NULL dan tidak terlihat.

### 6. Kategori bawaan per pengguna

Registrasi membuat user, tiga kategori bawaan (`Pribadi`, `Pekerjaan`, `Belajar`; `is_default = true`; `sort_order` 1–3), dan sesi dalam satu transaksi. Jika salah satu langkah gagal, seluruh registrasi di-rollback. Seed global lama tidak dipakai untuk pengguna baru.

### 7. Middleware autentikasi dan otorisasi eksplisit

Urutan route:

1. `GET /api/health` (publik, tanpa auth).
2. `POST /api/auth/register`, `POST /api/auth/login` (publik; wajib `Origin` allowlist dan `Content-Type: application/json`).
3. `POST /api/auth/logout` (idempoten bila tidak ada sesi; bila sesi ada, wajib `requireAuth` + `requireCsrf`).
4. `GET /api/auth/me` (memerlukan sesi).
5. `requireAuth` untuk seluruh route data berikutnya.
6. `requireCsrf` untuk seluruh `POST`, `PATCH`, dan `DELETE` yang terautentikasi, termasuk logout ketika sesi ada.

`requireAuth` membaca cookie, mencari sesi yang belum kedaluwarsa, memuat user, lalu menempelkan `req.auth = { user, session }`. Sesi tidak valid → `401`.

### 8. Ownership sebagai parameter wajib di repository

Seluruh fungsi repository menerima `userId` sebagai argumen wajib:

- `listTasks(db, userId, filters)`, `getTaskById(db, userId, id)`, `createTask(db, userId, data)`, `updateTask(db, userId, id, updates)`, `deleteTask(db, userId, id)`.
- `listCategories(db, userId)`, `getCategoryById(db, userId, id)`, `findCategoryByName(db, userId, name, { excludeId })`, `createCategory(db, userId, { name })`, `renameCategory(db, userId, id, { name })`, `deleteCategory(db, userId, id)`.
- `getTaskStats(db, userId)`.

Setiap query menambahkan `eq(table.userId, userId)`. Join kategori pada tugas memakai `AND categories.id = tasks.category_id AND categories.user_id = userId`. `ensureCategoryExists(db, id, userId)` memakai lookup ter-scope; kategori milik pengguna lain diperlakukan sebagai "Kategori tidak ditemukan" (`400`), sehingga tidak ada kebocoran. Get/update/delete data milik pengguna lain menghasilkan `null`/`false` dan handler mengembalikan `404`.

### 9. Konfigurasi baru

`server/src/config.js` menambahkan validasi:

- `SESSION_TTL_HOURS` (integer > 0, default 168).
- `AUTH_COOKIE_SECURE` (boolean; default `true` bila `NODE_ENV=production`, `false` untuk development/test).
- `AUTH_COOKIE_SAME_SITE` default `Lax` untuk topologi first-party; nilai `None` hanya boleh dipakai eksplisit bersama `AUTH_COOKIE_SECURE=true` sebagai fallback cross-site.
- `AUTH_COOKIE_NAME` opsional (default `ptm_session`).

CORS tetap memakai `CORS_ORIGIN` eksplisit, tetapi `credentials` diubah menjadi `true`. `VITE_PUBLIC_DEPLOYMENT` tidak lagi menjadi pembatas keamanan; backend tetap memeriksa sesi.

### 10. Perubahan frontend

- `client/src/api.js`: `request` memakai `credentials: 'include'`, menyimpan token CSRF di memori modul, mengirim `X-CSRF-Token` pada request mutasi, dan memicu callback "auth expired" saat menerima `401`.
- Auth state disimpan di level `App` dengan tiga status: `loading`, `authenticated`, `unauthenticated`. Saat mount, panggil `GET /api/auth/me`; hasilnya menentukan status dan token CSRF.
- Matriks navigasi yang harus diuji:
  - `/app` tanpa sesi → `/login`, workspace tidak di-mount.
  - `/app` saat status `loading` → tampilkan state loading, jangan redirect sebelum `/me` selesai.
  - `/app` dengan sesi valid → mount workspace.
  - `/login` atau `/register` dengan sesi valid → `/app` (pengguna yang sudah login tidak perlu login ulang).
  - Login/register gagal → tetap di halaman form, tampilkan error, status tetap `unauthenticated`, jangan pernah navigasi ke `/app`.
  - Login/register berhasil → set status `authenticated`, simpan CSRF, lalu navigasi ke `/app`.
  - Logout berhasil → hapus state, lalu `/app` berikutnya diarahkan ke `/login`; kegagalan API logout ditampilkan sebagai error dan tidak boleh mengklaim sesi berakhir sebelum server mengonfirmasi.
  - `401` dari endpoint mana pun → bersihkan state dan arahkan ke `/login`.
- Routing: `/` tetap landing publik, `/login` dan `/register` baru, `/app` hanya untuk sesi valid. Pada build dengan `VITE_PUBLIC_DEPLOYMENT=true`, `/app` tidak lagi otomatis dialihkan ke `/`; pengguna terautentikasi boleh masuk, pengguna tanpa sesi diarahkan ke `/login`.
- Landing page menambahkan tautan `Masuk` dan `Daftar` pada shell publik yang menuju `/login` dan `/register` (bukan `/app`), serta memperbarui copy/FAQ agar menyatakan akun dan multi-user tersedia secara faktual. Landing tetap tidak me-mount workspace atau memanggil API data pengguna.
- `AppWorkspace` menerima identitas pengguna dan aksi logout; logout memanggil API, membersihkan state, lalu kembali ke `/login` atau landing.
- Halaman login/register memakai primitif UI, token warna, dan pola feedback yang sudah ada; tidak ada layout khusus per pengguna.

### 11. Pengujian client untuk guard rute

Test client memakai Vitest dengan `jsdom` dan `@testing-library/react`/`@testing-library/user-event` untuk menguji perilaku route dan form, sementara test murni yang sudah ada tetap berjalan di environment node. Matriks minimal yang harus otomatis: akses `/app` tanpa sesi, status loading, sesi valid, login gagal tidak redirect, login berhasil ke `/app`, pengguna terautentikasi membuka `/login`/`/register`, sesi berakhir (`401`), dan logout memblokir `/app`.

### 12. Rate limiting best-effort pada autentikasi

Login dan register memakai pembatas fixed-window in-memory per kombinasi IP + email (misalnya 10 percobaan per menit), dengan pesan `429` generik. Ini hanya lapisan pertahanan tambahan; pada deployment multi-instance, pembatasan terdistribusi/WAF tetap menjadi rekomendasi operasional.

### 13. Penanganan data legacy

Data `user_id` NULL tetap disimpan dan di-backup. Tidak ada penugasan otomatis saat registrasi. Operator dapat menetapkan pemilik secara eksplisit dengan SQL operasional setelah membuat akun tujuan, misalnya `UPDATE tasks SET user_id = '<uuid>' WHERE user_id IS NULL` dan `UPDATE categories SET user_id = '<uuid>' WHERE user_id IS NULL`. Prosedur ini didokumentasikan dan tidak dijalankan otomatis oleh aplikasi.

## Risks / Trade-offs

- **Third-party cookie diblokir browser → sesi hilang di Vercel/Render** → Safari ITP, Firefox ETP, dan pembatasan cookie pihak ketiga di Chromium dapat memblokir cookie `SameSite=None` ketika frontend dan backend berada pada situs berbeda. Mitigasi utama: deployment wajib memakai domain same-site (subdomain dari registrable domain yang sama) atau proxy/rewrite same-origin; `SameSite=None` hanya fallback yang didokumentasikan. Uji integrasi lokal memakai proxy Vite same-origin, dan dokumentasi deployment menyatakan konfigurasi cross-site tanpa proxy sebagai tidak didukung.
- **Cookie salah konfigurasi → login loop** → Turunkan atribut cookie dari environment, uji varian development (Lax, non-secure) dan deployment first-party (Lax/Strict, secure), serta dokumentasikan syarat HTTPS.
- **CSRF token hilang saat refresh** → Token dikembalikan ulang oleh `/api/auth/me`; UI menunggu status auth selesai sebelum mengirim mutasi.
- **CSRF pre-auth tidak memakai token sesi** → Register/login dilindungi Origin wajib + allowlist + `Content-Type: application/json`; request tanpa Origin ditolak. Test mencakup origin valid, origin asing, dan origin hilang.
- **Guard client dilewati** → Backend tetap menolak tanpa sesi (`401`); guard client hanya defense-in-depth, bukan satu-satunya kontrol.
- **Test route tidak menangkap regresi navigasi** → Wajibkan test komponen `jsdom`/Testing Library untuk seluruh matriks guard sebelum Apply.
- **Data legacy tampak "hilang"** → Data tidak dihapus, hanya tidak terlihat; dokumentasikan prosedur penetapan pemilik dan sertakan backup.
- **Argon2 native build gagal di platform deployment** → Gunakan versi dengan prebuilt binary atau pastikan build tools tersedia; dokumentasikan di README. Alternatif `@node-rs/argon2` dipertimbangkan bila build native bermasalah.
- **Rate limiting in-memory tidak efektif multi-instance** → Dokumentasikan sebagai best-effort; rekomendasikan rate limit di edge/reverse proxy untuk production.
- **Delta bertabrakan dengan spec hasil arsip** → `migrate-sqlite-to-neon-drizzle` dan `add-public-landing-page` sudah diarsipkan; delta change ini secara eksplisit menghapus/mengubah requirement lama yang bertentangan (single-user, batas deployment publik, larangan authentication) dan wajib divalidasi ulang sebelum Apply.
- **Perubahan signature repository memecahkan test lama** → Pusatkan helper pembuatan user/sesi dan seed per pengguna; jalankan seluruh suite server/client sebelum Apply.
- **Timing/enumerasi email** → Pesan generik dan dummy hash verification; tetap ada risiko timing residual yang kecil.
- **XSS tetap dapat melakukan aksi atas nama user** → Cookie HttpOnly mengurangi pencurian token, tetapi bukan pencegahan XSS; sanitasi/React escaping yang ada dipertahankan, CSP di luar scope.
- **User deletion (jika ditambahkan nanti) menghapus data via cascade** → Fitur penghapusan akun tidak termasuk scope; keputusan cascade didokumentasikan.

## Migration Plan

1. **Prasyarat:** `migrate-sqlite-to-neon-drizzle` dan `add-public-landing-page` sudah diarsipkan; main specs sudah memakai PostgreSQL/Drizzle dan gate landing publik. Change ini menyelaraskan kembali requirement yang berubah karena authentication.
2. Terapkan migration baru pada Neon test branch, jalankan seluruh test server/client/integration, lalu verifikasi manual alur register/login/logout dan isolasi dua akun.
3. Deploy migration sebagai pre-deploy (di luar change ini), lalu deploy backend/frontend dengan topologi cookie first-party (domain same-site atau proxy/rewrite `/api` same-origin). Konfigurasi cross-site tanpa proxy dan tanpa domain same-site tidak didukung. Tidak ada perubahan production database pada change ini.
4. **Rollback:** karena migration bersifat additive, kode versi sebelumnya tetap dapat berjalan dengan mengabaikan tabel `users`/`sessions`. Jika perlu rollback penuh, hentikan backend, kembalikan deployment ke revisi sebelumnya, dan pulihkan snapshot Neon; jangan menghapus data tugas/kategori legacy. Backup SQLite dan snapshot tetap dipertahankan sampai rollback window ditutup.
5. Setelah stabil dan disetujui, arsipkan change dan sinkronkan spec.

## Open Questions

- Kebijakan retensi/pembersihan baris `sessions` yang kedaluwarsa (cron vs opportunistic cleanup) dapat diputuskan saat operasional tanpa mengubah spesifikasi atau pendekatan.
