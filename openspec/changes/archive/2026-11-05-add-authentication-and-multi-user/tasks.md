# Tasks

## 1. Prasyarat dan dependency

- [x] 1.1 Koordinasikan prasyarat change: setelah disetujui, arsipkan/disinkronkan `migrate-sqlite-to-neon-drizzle` agar main specs memakai Neon/Drizzle, dan selesaikan/arsipkan `add-public-landing-page` sebelum mengubah gate `/app`; verifikasi `openspec list --specs` dan `openspec validate migrate-sqlite-to-neon-drizzle --strict` konsisten.
- [x] 1.2 Tambahkan dependency server `argon2` dan `cookie`; verifikasi `npm install`, `npm ls argon2 cookie`, dan `npm run build` tetap berhasil.
- [x] 1.3 Tambahkan validasi konfigurasi `SESSION_TTL_HOURS`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE`, dan `AUTH_COOKIE_NAME` pada `server/src/config.js`; verifikasi unit test konfigurasi valid, default development/production, dan nilai tidak valid.
- [x] 1.4 Perbarui `server/.env.example` dan `server/.env.test.example` dengan variabel sesi/cookie; verifikasi `git check-ignore` tetap mengabaikan file environment nyata dan tidak ada secret di repository.
- [x] 1.5 Tambahkan dev dependency client `jsdom`, `@testing-library/react`, dan `@testing-library/user-event`, lalu konfigurasikan environment test komponen tanpa merusak test node yang ada; verifikasi `npm run test -w client` tetap lulus dan satu smoke test komponen dapat dijalankan.

## 2. Schema, migration, dan helper test

- [x] 2.1 Tambahkan tabel `users` dan `sessions`, serta referensi foreign key `tasks.user_id`/`categories.user_id` ke `users.id` pada `server/src/schema.js`; verifikasi `npm run db:generate` menghasilkan migration bernomor baru dan tidak mengubah `0000`–`0002`.
- [x] 2.2 Tinjau dan sesuaikan migration baru agar memuat unique index `lower(email)`, unique `token_hash`, index `user_id`/`expires_at`, dan cascade delete yang benar; terapkan ke Neon test branch dua kali dan verifikasi idempotent serta data legacy `user_id` NULL tetap ada.
- [x] 2.3 Tambahkan integration test migration untuk tabel `users`/`sessions`, unique email case-insensitive, unique token sesi, foreign key cascade, dan keberadaan data legacy tanpa pemilik; verifikasi test lulus pada database test.
- [x] 2.4 Perbarui `server/test/helpers/test-db.js` agar `truncateTestTables` membersihkan `sessions`, `users`, `tasks`, dan `categories` secara berurutan, serta sediakan helper membuat user + sesi uji; verifikasi seluruh test server yang ada dapat memakai helper baru.

## 3. Autentikasi inti

- [x] 3.1 Implementasikan modul hashing password Argon2id dan verifikasi password; tambahkan unit test hash unik, verifikasi benar/salah, serta batas panjang 8–128 karakter.
- [x] 3.2 Implementasikan helper token acak, hash token, pembuatan/parsing cookie, dan perbandingan timing-safe; tambahkan unit test untuk atribut cookie development/production dan panjang token.
- [x] 3.3 Implementasikan repository `users` (create, find by email case-insensitive, find by id) dan `sessions` (create, find valid by token hash, delete, delete expired); tambahkan integration test terhadap database test.
- [x] 3.4 Implementasikan service registrasi dalam satu transaksi yang membuat user, tiga kategori bawaan, dan sesi; tambahkan test registrasi sukses, email duplikat, rollback saat pembuatan kategori gagal, dan password tidak tersimpan plaintext.
- [x] 3.5 Implementasikan service login, logout, dan sesi aktif dengan rotasi token, dummy hash verification untuk email tidak dikenal, dan pesan generik; tambahkan test login sukses/gagal, token lama tidak berlaku, dan logout idempoten.
- [x] 3.6 Implementasikan pembuatan/verifikasi token CSRF dan pemeriksaan header `Origin`; tambahkan unit test token cocok, token salah, token hilang, dan origin tidak diizinkan.
- [x] 3.7 Implementasikan pembatas percobaan login/register in-memory best-effort; tambahkan unit test batas, jendela waktu, dan respons `429` generik.

## 4. Middleware dan endpoint autentikasi

- [x] 4.1 Tambahkan `UnauthorizedError`, `ForbiddenError`, dan `RateLimitError` beserta pemetaan envelope/status pada error handler; verifikasi unit/integration test status `401`, `403`, dan `429` tanpa detail sensitif.
- [x] 4.2 Implementasikan middleware `requireAuth`, `requireCsrf`, pemeriksaan Origin wajib untuk mutasi, dan pemuatan sesi dari cookie; tambahkan integration test request tanpa sesi, sesi kedaluwarsa, CSRF valid/tidak valid, serta Origin valid/asing/hilang untuk register, login, logout, dan mutasi data.
- [x] 4.3 Tambahkan route `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, dan `GET /api/auth/me` sebelum route data; verifikasi integration test envelope, status, cookie, CSRF pada logout, dan body tanpa password/token sesi.
- [x] 4.4 Ubah konfigurasi CORS menjadi `credentials: true` dengan allowlist eksplisit dan header `X-CSRF-Token`; verifikasi integration test preflight origin diizinkan/ditolak, `Content-Type: application/json` untuk register/login, serta cookie tidak dikirim ke origin asing.
- [x] 4.5 Pastikan `GET /api/health` tetap publik sebelum middleware autentikasi; verifikasi health `200`/`503` tetap berjalan tanpa sesi dan tidak memuat detail koneksi.

## 5. Ownership dan isolasi data

- [x] 5.1 Refactor repository tugas agar seluruh fungsi menerima `userId`, memfilter `tasks.user_id`, dan join kategori juga dibatasi pemilik; tambahkan integration test list/get/create/update/delete untuk dua pengguna.
- [x] 5.2 Refactor repository kategori agar seluruh fungsi menerima `userId`, pencarian nama ter-scope per pengguna, dan create mengisi `user_id`; tambahkan integration test keunikan per pengguna dan akses lintas pengguna.
- [x] 5.3 Refactor repository statistik agar menerima `userId` dan hanya menghitung tugas milik pengguna; tambahkan integration test total/status/prioritas terisolasi.
- [x] 5.4 Perbarui handler API agar memakai `req.auth.user.id`, memanggil `ensureCategoryExists` ter-scope, dan mengembalikan `404` untuk data pengguna lain; tambahkan matriks test IDOR untuk tugas dan kategori.
- [x] 5.5 Tambahkan integration test yang memastikan data `user_id` NULL tidak muncul pada list, get, statistik, atau mutasi, serta tidak diberikan otomatis saat registrasi pengguna baru.
- [x] 5.6 Verifikasi user A tidak dapat memakai `category_id` milik user B saat membuat atau mengubah tugas; tambahkan test yang memastikan respons `400` dan tidak ada perubahan data.

## 6. Client: API, state auth, dan routing

- [x] 6.1 Perbarui `client/src/api.js` agar memakai `credentials: 'include'`, menyimpan token CSRF di memori, mengirim `X-CSRF-Token` pada mutasi, dan menangani `401`; tambahkan unit test URL, header, dan callback auth-expired.
- [x] 6.2 Tambahkan state autentikasi level aplikasi dengan pemuatan awal `GET /api/auth/me` dan status loading/authenticated/unauthenticated; tambahkan unit test transisi state, status loading yang tidak redirect prematur, dan pembersihan saat `401`.
- [x] 6.3 Perluas `client/src/routing.js` untuk `/login`, `/register`, dan guard `/app`; tambahkan unit test mode lokal/publik, redirect sesi tidak valid, dan redirect pengguna terautentikasi dari `/login`/`/register` ke `/app`.
- [x] 6.4 Tambahkan halaman register dan login memakai komponen UI yang ada, validasi inline Bahasa Indonesia, state loading/error, dan redirect ke `/app`; verifikasi dengan unit test helper form (jika ada) dan `npm run build -w client`.
- [x] 6.5 Hubungkan `App`/`AppWorkspace` dengan state auth, aksi logout, dan pengarahan ke login saat `401`; verifikasi `npm run build -w client` dan test client yang ada tetap lulus.
- [x] 6.6 Tambahkan test komponen (jsdom/Testing Library) untuk seluruh matriks guard: `/app` tanpa sesi → `/login`, status loading tidak redirect prematur, sesi valid → workspace, login gagal tetap di `/login`, register gagal tetap di `/register`, login/register berhasil → `/app`, pengguna terautentikasi membuka `/login`/`/register` → `/app`, `401` → `/login`, logout membuat `/app` kembali ke `/login`, dan tautan Masuk/Daftar di landing menuju halaman autentikasi; verifikasi seluruh test lulus.

## 7. UI shell, dokumentasi, dan deployment readiness

- [x] 7.1 Tambahkan identitas pengguna dan kontrol logout pada shell workspace tanpa mengubah struktur desain; verifikasi build client dan tidak ada regresi layout pada test/manual.
- [x] 7.2 Sesuaikan halaman autentikasi agar responsif dan konsisten dengan design system (token warna, spacing, fokus, error); verifikasi build dan pemeriksaan keyboard manual.
- [x] 7.3 Ubah semantik `VITE_PUBLIC_DEPLOYMENT` sehingga build publik tetap menampilkan landing dan `/app` hanya untuk sesi valid (bukan redirect buta); verifikasi unit test routing dan build publik/lokal.
- [x] 7.4 Dokumentasikan register/login/logout, variabel environment sesi/cookie, CORS credentials, batas keamanan deployment, penanganan data legacy, dan rollback di README; verifikasi perintah yang didokumentasikan dijalankan sesuai instruksi tanpa secret.
- [x] 7.5 Dokumentasikan prosedur operasional penetapan pemilik data legacy (SQL eksplisit) dan penegasan bahwa data NULL tidak terlihat; verifikasi contoh SQL tidak dijalankan otomatis dan tidak memuat kredensial.
- [x] 7.6 Dokumentasikan topologi cookie first-party (domain same-site atau proxy/rewrite `/api` same-origin), risiko third-party cookie pada Vercel → Render, dan batas `SameSite=None`; verifikasi dev same-origin proxy berfungsi dan dokumentasi menyatakan konfigurasi cross-site tanpa proxy sebagai tidak didukung.
- [x] 7.7 Perbarui landing page dengan tautan Masuk/Daftar ke `/login` dan `/register`, perbarui copy/FAQ agar sesuai ketersediaan authentication tanpa klaim palsu, dan pastikan landing tetap tidak me-mount workspace atau memanggil API data pengguna; verifikasi build client dan smoke test landing pada Chrome, Firefox, dan Edge.

## 8. Verifikasi integrasi akhir

- [x] 8.1 Jalankan `npm test`, `npm run test:integration -w server`, dan `npm run build`; verifikasi seluruh test server/client/integration serta build lulus.
- [x] 8.2 Jalankan smoke test browser di Firefox: akses landing dan tautan Masuk/Daftar, register dua akun, logout, login, buat/ubah/hapus tugas dan kategori, cek Dashboard, filter, pencarian, modal, dialog hapus, dan DnD; verifikasi tidak ada data akun lain yang terlihat.
- [x] 8.3 Verifikasi keamanan: cookie `HttpOnly`/`Secure`/`SameSite`, CSRF/Origin untuk register, login, logout, dan seluruh mutasi data, `401` tanpa sesi, `404` lintas pengguna, `403` CSRF/Origin salah, `429` rate limit, dan tidak ada password/hash/token sesi pada respons atau log.
- [x] 8.4 Periksa `git status` dan diff: hanya file change ini dan implementasi terkait yang berubah, migration `0000`–`0002` tidak berubah, change yang sudah diarsipkan tidak tersentuh, dan tidak ada secret/URL production.
- [x] 8.5 Jalankan `openspec validate add-authentication-and-multi-user --strict`; verifikasi seluruh artefak valid dan konsisten dengan proposal, design, serta spec delta.
- [x] 8.6 Jalankan seluruh automated test guard route (task 6.6) dan test integration `401` backend; verifikasi setiap kondisi route pada review (akses tanpa sesi, redirect ke login, login gagal, login berhasil, pengguna sudah login, logout, sesi berakhir) memiliki test yang lulus.

## Workflow follow-up

- Lengkapi prasyarat arsip: `migrate-sqlite-to-neon-drizzle` dan `add-public-landing-page` diselesaikan/diarsipkan lebih dulu.
- Setelah implementasi dan review disetujui, jalankan workflow Apply, lalu arsipkan change ini dan verifikasi hasil arsip.
