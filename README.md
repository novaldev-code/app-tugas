# Manajer Tugas Pribadi

Aplikasi web multi-user untuk mengelola tugas pribadi. Mendukung register/login, Task List, Kanban, Dashboard, kategori, pencarian, filter, pengurutan, dan drag-and-drop status dengan isolasi data per akun. Seluruh antarmuka menggunakan Bahasa Indonesia.

## Teknologi

- Frontend: React 19 + Vite 8
- Backend: Node.js + Express 5
- Database: Neon PostgreSQL melalui Drizzle ORM dan driver `pg`
- Autentikasi: sesi cookie `HttpOnly`, Argon2id, dan CSRF token
- Drag-and-drop: `@dnd-kit/core`
- Test: Vitest + Supertest + Testing Library

## Struktur Proyek

```text
.
├── client/                  # React + Vite
│   ├── src/components/      # Task List, Kanban, Dashboard, modal, filter
│   └── vite.config.js       # Proxy /api ke backend
├── server/                  # Express + PostgreSQL
│   ├── drizzle/             # Drizzle migration dan metadata
│   ├── scripts/             # Importer data SQLite
│   ├── src/                 # API, auth, validasi, database, migrasi, repository
│   └── test/                # Unit dan integration test
└── package.json             # npm workspaces dan script root
```

## Prasyarat

- Node.js 20.19 atau lebih baru (disarankan Node.js 24)
- npm 10 atau lebih baru
- Build tools untuk `better-sqlite3` (`make` dan `g++`) bila binary prebuilt tidak tersedia; dependency ini hanya dipakai dev tool importer dan test, bukan runtime server
- Binary prebuilt `argon2` untuk platform deployment; bila tidak tersedia, sediakan build tools native

## Instalasi

```bash
npm install
```

## Menjalankan Mode Pengembangan

```bash
npm run dev
```

Perintah ini menjalankan backend dan frontend sekaligus:

- Landing page: <http://localhost:5173/>
- Workspace: <http://localhost:5173/app>
- API: <http://localhost:3001>
- Proxy Vite meneruskan `/api` ke backend.

Jalankan migration database secara eksplisit sebelum backend pertama kali dipakai (lihat [Migrasi Database](#migrasi-database)). Server tidak menjalankan migration atau DDL saat start.

## Konfigurasi Environment

Salin contoh yang sesuai, lalu isi kredensial dari dashboard Neon:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

| Variabel | Environment | Keterangan |
|---|---|---|
| `PORT` | backend | Port API/backend; default `3001` |
| `DATABASE_URL` | backend runtime | Koneksi Neon pooled untuk API |
| `DATABASE_URL_UNPOOLED` | backend migration | Koneksi langsung Neon untuk migration dan importer |
| `CORS_ORIGIN` | backend | Daftar origin frontend yang diizinkan, dipisahkan koma; wildcard tidak diizinkan |
| `SESSION_TTL_HOURS` | backend | Masa berlaku sesi dalam jam; default `168` |
| `AUTH_COOKIE_SECURE` | backend | `true` pada production (HTTPS); `false` untuk development/test |
| `AUTH_COOKIE_SAME_SITE` | backend | `Lax`/`Strict` untuk topologi first-party; `None` hanya fallback cross-site dengan `Secure=true` |
| `AUTH_COOKIE_NAME` | backend | Nama cookie sesi; default `ptm_session` |
| `TEST_DATABASE_URL` | test | Koneksi pooled ke database/branch test khusus |
| `TEST_DATABASE_URL_UNPOOLED` | test | Koneksi langsung ke database/branch test khusus |
| `VITE_API_URL` | frontend | Base URL API saat deployment; kosongkan untuk path relatif dan proxy development |
| `VITE_API_TARGET` | frontend development | Target proxy `/api`; default `http://localhost:3001` |
| `VITE_PUBLIC_DEPLOYMENT` | frontend build | Menampilkan landing publik; bukan authentication atau security boundary. `/app` tetap memerlukan sesi valid. |

Jangan menulis kredensial nyata ke file contoh atau repository. Gunakan `server/.env` untuk development, `server/.env.test` untuk test, dan environment variables platform untuk deployment. Database test harus berupa branch/database Neon terpisah dan tidak boleh menunjuk production.

Contoh development dengan port berbeda:

```bash
PORT=4000 VITE_API_TARGET=http://localhost:4000 npm run dev
```

Jika hanya backend yang dijalankan dengan port berbeda, sesuaikan juga `VITE_API_TARGET` agar frontend tetap terhubung.

### CORS dan URL API

- `CORS_ORIGIN` berisi daftar origin frontend yang diizinkan, dipisahkan koma, misalnya `http://localhost:5173,https://aplikasi.example.com`. Gunakan origin eksplisit tanpa path dan tanpa wildcard `*`; backend mengirim credentials (cookie sesi) hanya untuk origin tersebut dan menolak request mutasi tanpa `Origin` yang cocok.
- Request tanpa header `Origin`, termasuk yang melewati proxy Vite, tetap diproses sebagai request same-origin.
- `VITE_API_URL` opsional dan dibaca saat build. Jika kosong, frontend memanggil path relatif `/api/...` sehingga proxy Vite development atau backend yang menyajikan `client/dist` menangani request tersebut. Jika diisi, trailing slash dinormalisasi agar URL tidak memiliki slash ganda.
- `VITE_API_TARGET` hanya dipakai Vite development sebagai target proxy `/api`; nilai default-nya `http://localhost:3001`. Restart `npm run dev` setelah mengubahnya.
- Untuk deployment terpisah, set `CORS_ORIGIN` ke origin frontend dan gunakan topologi cookie first-party (domain same-site atau rewrite/proxy `/api` same-origin). Jangan hardcode URL platform tertentu atau memakai wildcard.

## Autentikasi dan Sesi

Aplikasi bersifat multi-user. Setiap pengguna memiliki akun, tugas, kategori, dan statistik sendiri.

- `POST /api/auth/register` membuat akun, tiga kategori bawaan, dan sesi.
- `POST /api/auth/login` memverifikasi kredensial dan membuat sesi baru.
- `POST /api/auth/logout` mencabut sesi aktif dan menghapus cookie.
- `GET /api/auth/me` mengembalikan pengguna aktif dan token CSRF.
- Password disimpan sebagai hash Argon2id dan tidak pernah dikembalikan API atau dicatat log.
- Token sesi berupa nilai acak, disimpan sebagai hash di database, dan dikirim melalui cookie `HttpOnly`.
- `SESSION_TTL_HOURS`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE`, dan `AUTH_COOKIE_NAME` mengatur masa berlaku serta atribut cookie.
- `AUTH_COOKIE_SECURE` wajib `true` pada `NODE_ENV=production`.
- Register/login mewajibkan `Origin` yang diizinkan dan `Content-Type: application/json`.
- Logout dan seluruh mutasi data terautentikasi mewajibkan header `X-CSRF-Token` yang cocok dengan sesi.
- Respons `401` berarti sesi tidak valid, `403` berarti kegagalan CSRF/Origin, dan `429` berarti percobaan autentikasi dibatasi sementara.
- Seluruh endpoint data memfilter berdasarkan pengguna yang login; data milik pengguna lain menghasilkan `404`.

### Topologi cookie

Cookie sesi wajib bersifat **first-party** pada deployment yang didukung:

- frontend dan backend memakai subdomain dari registrable domain yang sama (misalnya `app.example.com` dan `api.example.com`), atau
- frontend meneruskan `/api` ke backend melalui rewrite/proxy same-origin.

`SameSite=None; Secure` hanya dipakai sebagai fallback bila cross-site tidak dapat dihindari. Safari ITP, Firefox ETP, dan pembatasan cookie pihak ketiga di Chromium dapat memblokir cookie tersebut ketika Vercel dan Render berada pada situs berbeda. Konfigurasi cross-site tanpa domain same-site atau proxy same-origin dianggap tidak didukung.

## Migrasi Database

```bash
# Membuat file SQL migration dari server/src/schema.js.
npm run db:generate -w server

# Menerapkan migration yang belum berjalan.
npm run db:migrate -w server

# Alias dari root workspace.
npm run migrate
```

`db:migrate` dan `npm run migrate` memakai `DATABASE_URL_UNPOOLED`, yaitu koneksi langsung Neon tanpa `-pooler`, karena migration tidak boleh melewati PgBouncer. Migration bersifat idempotent, dicatat di `drizzle.schema_migrations`, dan hanya dijalankan secara eksplisit; server tidak menjalankan DDL saat start.

Untuk menerapkan migration ke Neon test branch, jalankan perintah dengan koneksi langsung test tanpa menulis kredensial ke repository:

```bash
DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL_UNPOOLED" npm run db:migrate -w server
```

Integration test migration menjalankan langkah ini secara otomatis dari `server/.env.test`.

## Impor Data SQLite (Cutover)

Importer membaca `server/data/tasks.db` secara read-only, memakai `DATABASE_URL_UNPOOLED`, dan menulis kategori lalu tugas dalam satu transaksi. Sumber SQLite tidak diubah. `better-sqlite3` dipertahankan hanya sebagai dev dependency untuk importer dan test; jalur runtime SQLite sudah dihapus, sehingga API selalu memakai Neon PostgreSQL.

Lakukan prosedur berikut dalam maintenance window:

1. Hentikan backend agar tidak ada tulisan baru ke sumber SQLite selama cutover.
2. Buat backup bertimestamp dan simpan checksum sumber:

   ```bash
   mkdir -p server/data/backups
   cp server/data/tasks.db "server/data/backups/tasks-$(date -u +%Y%m%dT%H%M%SZ).db"
   sha256sum server/data/tasks.db
   ```

3. Buat snapshot atau branch Neon sebagai titik rollback database target.
4. Jalankan migration ke database Neon yang disetujui, lalu periksa hasil tanpa menulis:

   ```bash
   npm run db:migrate -w server
   npm run db:import -w server -- --dry-run
   ```

5. Periksa laporan dry-run: jumlah kategori/tugas, relasi, status, priority, deadline, timestamp, dan status kecocokan target. Target hasil migration berisi seed kategori bawaan, sehingga dry-run akan menyarankan `--replace`.
6. Jalankan impor pengganti di dalam transaksi:

   ```bash
   npm run db:import -w server -- --replace
   ```

7. Verifikasi ulang tanpa menulis; hasil yang diharapkan adalah target sesuai sumber:

   ```bash
   npm run db:import -w server -- --dry-run
   ```

8. Jalankan smoke test API terhadap data hasil impor sebelum mengizinkan pengguna menulis kembali. Pertahankan backup SQLite dan snapshot Neon sampai rollback window ditutup.

Gunakan `--source <path>` atau argumen path untuk memilih file SQLite lain. Importer menolak target non-kosong tanpa `--replace`; kegagalan di tengah proses membatalkan seluruh perubahan target. Jangan menaruh kredensial pada argumen command line atau dokumentasi.

Rollback: hentikan backend lalu pulihkan snapshot/branch Neon. Runtime SQLite sudah dihapus dari kode saat ini; jika benar-benar perlu kembali ke versi SQLite, checkout revisi Git terakhir yang masih mendukung SQLite (`42d2d76398f4d943412ded2c4512addb1e94fd58`) dan gunakan backup SQLite. Tulisan yang dibuat setelah cutover hanya dapat dipertahankan jika ada prosedur sinkronisasi terpisah; maintenance window meminimalkan risiko ini.

Retensi backup: `server/data/tasks.db`, checksum, dan snapshot Neon dipertahankan sampai rollback window ditutup dan disetujui. File tersebut berada di `server/data/` yang di-ignore Git, jadi simpan salinannya di storage terpisah bila diperlukan untuk retensi jangka panjang.

## Test

```bash
npm test
```

Perintah lain:

```bash
npm run test:unit          # Unit test server + test client
npm run test:integration   # Integration test API dan persistensi
```

Unit test tidak membutuhkan database. Integration test membaca `server/.env.test` dan memakai `TEST_DATABASE_URL` (pooled) serta `TEST_DATABASE_URL_UNPOOLED` (langsung) ke Neon branch test khusus. Test akan menolak berjalan jika `NODE_ENV=production`, jika URL test sama dengan URL runtime/production, atau jika kedua URL test tidak berasal dari branch yang sama.

Integration test membuat schema dari nol dan mereset data dengan `TRUNCATE sessions, tasks, categories, users RESTART IDENTITY CASCADE`; karena itu jangan pernah mengarahkan environment test ke database production. File test dijalankan serial agar state database test tidak saling bertabrakan. Test mencakup validasi, CRUD tugas dan kategori, filter, pencarian, pengurutan, overdue, statistik dashboard, kontrak respons API, register/login/logout, session, CSRF, migration, isolasi antar pengguna, serta persistensi setelah koneksi ditutup dan dibuka kembali.

## Build dan Menjalankan Versi Produksi

```bash
npm run build
npm start
```

`npm run build` menghasilkan `client/dist`. `npm start` menjalankan backend pada `http://localhost:3001`; backend juga menyajikan file statis dari `client/dist`, sehingga aplikasi dapat dibuka langsung dari port tersebut tanpa server frontend terpisah. Landing tersedia di `/`, halaman autentikasi di `/login` dan `/register`, dan workspace di `/app` hanya untuk sesi valid.

Untuk menjalankan versi production-like secara lokal, isi `server/.env` dengan konfigurasi lengkap dari `server/.env.example`, jalankan migration secara eksplisit, lalu start backend. Server tidak menjalankan migration atau DDL saat start. Health check tersedia di `GET /api/health` dan hanya mengembalikan status konektivitas database.

Script database dapat dipanggil dari root workspace:

```bash
npm run db:generate   # generate migration Drizzle
npm run db:migrate    # terapkan migration memakai DATABASE_URL_UNPOOLED
npm run db:import -- --dry-run
npm run db:import -- --replace
npm run db:studio     # buka Drizzle Studio
npm run migrate       # alias db:migrate
```

## Deployment Neon, Render, dan Vercel

Deployment ini menjalankan aplikasi multi-user dengan autentikasi. Backend boleh diakses publik hanya melalui HTTPS dan seluruh endpoint data mewajibkan sesi valid; gunakan topologi cookie first-party. Vercel menyajikan landing dan workspace; `/app` diarahkan ke `/login` bila belum ada sesi.

### Neon

- Gunakan project/branch Neon production khusus untuk deployment dan branch terpisah untuk test.
- `DATABASE_URL` adalah koneksi pooled untuk runtime backend.
- `DATABASE_URL_UNPOOLED` adalah koneksi langsung untuk migration dan importer. Jangan memakai koneksi pooled untuk DDL atau importer.
- Buat snapshot/branch sebelum cutover data dan simpan sampai rollback window ditutup.
- Jangan menaruh kredensial, connection string production, atau isi `.env` di repository.
- Test dan development tidak boleh memakai database production; integration test memakai `server/.env.test` dan guard test akan menolak URL production.

### Backend Render

Konfigurasi Web Service di dashboard Render:

- Build Command: `npm ci`
- Start Command: `npm start`
- Pre-Deploy Command: `npm run db:migrate`
- Health Check Path: `/api/health`
- Root Directory: root repository monorepo
- Akses jaringan: HTTPS publik diperbolehkan karena seluruh endpoint data mewajibkan sesi valid; pastikan CORS dan topologi cookie first-party benar.

Environment backend yang wajib diisi:

- `NODE_ENV=production`
- `DATABASE_URL` dari koneksi Neon pooled
- `DATABASE_URL_UNPOOLED` dari koneksi Neon langsung
- `CORS_ORIGIN` berisi origin frontend yang diizinkan, dipisahkan koma, tanpa wildcard
- `SESSION_TTL_HOURS`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE`, dan `AUTH_COOKIE_NAME` sesuai topologi cookie
- `PORT` hanya jika platform tidak menyediakan port otomatis

Migration harus berhasil sebelum backend menerima traffic. Pre-deploy command memakai koneksi langsung; runtime hanya memakai koneksi pooled dan tidak menjalankan migration. Jalankan cutover importer sesuai bagian [Impor Data SQLite (Cutover)](#impor-data-sqlite-cutover) sebelum mengaktifkan traffic pengguna.

### Frontend Vercel

Konfigurasi project Vercel:

- Root Directory: `client`
- Install Command: `cd .. && npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment `VITE_API_URL`: isi hanya jika frontend memanggil backend pada origin lain. Untuk cookie first-party, gunakan rewrite/proxy `/api` same-origin atau domain same-site.
- Environment `VITE_PUBLIC_DEPLOYMENT=true` untuk build landing publik; `/app` tetap memerlukan sesi valid.

SPA fallback: gunakan preset Vite/SPA pada Vercel atau atur rewrite semua path non-aset ke `/index.html` melalui pengaturan hosting. Untuk autentikasi cookie, disarankan rewrite `/api/*` ke backend sehingga browser melihat origin yang sama dan cookie sesi bersifat first-party. Jangan menaruh credential di repository.

Build landing publik:

```bash
VITE_PUBLIC_DEPLOYMENT=true npm run build -w client
```

Build publik tetap menampilkan landing. `/app` hanya menampilkan workspace jika sesi valid; pengguna tanpa sesi diarahkan ke `/login`.

### CORS dan Base URL

- Set `CORS_ORIGIN` ke origin frontend deployment yang benar-benar diizinkan. Jangan gunakan wildcard `*`; credentials/cookie hanya dikirim ke origin tersebut.
- Request mutasi tanpa `Origin` yang diizinkan ditolak `403`.
- `VITE_API_URL` dibaca saat build frontend. Kosongkan untuk path relatif/proxy; isi dengan URL backend hanya bila memakai origin terpisah.
- Gunakan domain same-site atau rewrite/proxy `/api` same-origin agar cookie sesi first-party.
- Jangan hardcode URL Render/Vercel di source atau dokumentasi; gunakan environment platform.

### Health Check

`GET /api/health` memakai koneksi database runtime dan menjalankan query read-only ringan `SELECT 1` dengan batas waktu singkat.

- `200` + `{ "status": "ok" }`: backend dan database dapat berkomunikasi.
- `503` + `{ "status": "unhealthy" }`: koneksi, query, atau timeout gagal.
- Respons memakai `Cache-Control: no-store` dan hanya memuat status. Respons maupun log tidak boleh memuat URL, credential, host, nama database, pesan error, atau stack trace.
- Endpoint tidak menulis data, tidak menjalankan migration, dan tidak memakai `DATABASE_URL_UNPOOLED`.
- Pastikan migration dan cutover data selesai sebelum health check dijadikan syarat traffic Render.

### Checklist Deployment

1. Buat snapshot/branch Neon dan siapkan `DATABASE_URL` pooled serta `DATABASE_URL_UNPOOLED` langsung.
2. Set environment backend di Render, termasuk `CORS_ORIGIN` eksplisit, `NODE_ENV=production`, dan variabel sesi/cookie.
3. Jalankan `npm run db:migrate` sebagai pre-deploy dan pastikan migration selesai sebelum backend menerima traffic.
4. Jalankan cutover importer dan verifikasi data sesuai bagian impor.
5. Deploy backend dengan HTTPS dan health check `/api/health`.
6. Build frontend Vercel dengan output `dist`, SPA fallback, dan rewrite/proxy `/api` same-origin atau domain same-site untuk cookie first-party.
7. Verifikasi CORS dari origin yang diizinkan, credentials aktif, dan origin lain tidak mendapat header CORS.
8. Verifikasi `/api/health` mengembalikan `200` tanpa detail koneksi.
9. Verifikasi `/app` memerlukan sesi valid, login gagal tetap di `/login`, dan dua akun tidak saling melihat data.

## Ringkasan API

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/auth/register` | Membuat akun, kategori bawaan, dan sesi |
| `POST` | `/api/auth/login` | Login dan membuat sesi |
| `POST` | `/api/auth/logout` | Mencabut sesi aktif |
| `GET` | `/api/auth/me` | Identitas pengguna aktif dan token CSRF |
| `GET` | `/api/tasks` | Daftar tugas pengguna dengan pencarian, filter, dan sort |
| `POST` | `/api/tasks` | Membuat tugas |
| `PATCH` | `/api/tasks/:id` | Mengubah sebagian atau seluruh field tugas |
| `DELETE` | `/api/tasks/:id` | Menghapus tugas |
| `GET` | `/api/categories` | Daftar kategori terurut |
| `POST` | `/api/categories` | Membuat kategori |
| `PATCH` | `/api/categories/:id` | Mengubah nama kategori |
| `DELETE` | `/api/categories/:id` | Menghapus kategori; tugas terkait menjadi tanpa kategori |
| `GET` | `/api/dashboard/stats` | Statistik pengguna yang sedang login |
| `GET` | `/api/health` | Health check konektivitas database; `200 { "status": "ok" }` atau `503 { "status": "unhealthy" }` |

Respons sukses memakai bentuk `{ "success": true, "data": ... }`. Respons gagal memakai `{ "success": false, "message": "...", "errors": ... }` dengan status HTTP `400`, `401` (sesi tidak valid), `403` (CSRF/Origin gagal), `404`, `409`, `429` (rate limit), atau `500`. Pengecualian: `GET /api/health` memakai body status khusus dan tidak memakai envelope API.

## Data dan Reset

Aplikasi bersifat multi-user dan memerlukan login. Data disimpan di Neon PostgreSQL. Setiap tugas dan kategori memiliki `user_id`; API hanya menampilkan data milik pengguna yang login.

Untuk mereset data pada database development/test, jalankan migration lalu:

```sql
TRUNCATE sessions, tasks, categories, users RESTART IDENTITY CASCADE;
```

atau buat branch Neon baru. Jangan mereset database production tanpa backup dan persetujuan operasional. Backup SQLite dan snapshot Neon dipertahankan sampai rollback window ditutup.

### Data lama tanpa pemilik

Data hasil migrasi yang memiliki `user_id` NULL dipertahankan tetapi tidak terlihat dan tidak dapat diubah oleh pengguna mana pun. Registrasi akun baru tidak mengambil data tersebut secara otomatis. Operator dapat menetapkan pemilik secara eksplisit setelah membuat akun tujuan:

```sql
UPDATE tasks SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
UPDATE categories SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
```

Jalankan hanya setelah backup dan verifikasi; jangan menaruh UUID/kredensial nyata di repository.

## Catatan Verifikasi

Hasil uji otomatis, walkthrough acceptance criteria, verifikasi browser, dan pemeriksaan responsif dicatat di [`openspec/changes/personal-task-manager-mvp/verification.md`](openspec/changes/personal-task-manager-mvp/verification.md).
