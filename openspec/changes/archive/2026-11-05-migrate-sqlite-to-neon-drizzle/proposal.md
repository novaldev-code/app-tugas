# Proposal

## Why

Aplikasi saat ini menyimpan seluruh data pada SQLite lokal melalui `better-sqlite3`, sehingga backend tidak siap dijalankan pada deployment Render dengan database Neon PostgreSQL. Migrasi diperlukan agar data yang sudah ada tetap aman, kontrak API tidak berubah, dan konfigurasi development, testing, serta deployment dapat dipisahkan dengan jelas.

Perubahan ini juga menyiapkan schema untuk kebutuhan multi-user di masa depan tanpa mengimplementasikan authentication atau multi-user sekarang.

## What Changes

- Mengganti runtime database dari SQLite/`better-sqlite3` menjadi Neon PostgreSQL dengan Drizzle ORM dan driver `pg`.
- **BREAKING** untuk konfigurasi runtime: `DATABASE_URL` menggantikan `DB_PATH` sebagai sumber koneksi utama setelah cutover diverifikasi.
- Menambahkan schema PostgreSQL untuk `categories` dan `tasks` dengan integer identity IDs, constraint yang setara, foreign key `ON DELETE SET NULL`, timestamp, date-only deadline, dan nullable `user_id`.
- Menambahkan `user_id` nullable pada `categories` dan `tasks` hanya sebagai persiapan schema; tidak ada authentication, ownership filter, atau isolasi data multi-user.
- Mengevaluasi keunikan nama kategori case-insensitive di PostgreSQL. Jika Drizzle DSL tidak dapat mengekspresikannya dengan tepat, migration SQL eksplisit akan digunakan.
- Menambahkan Drizzle schema, Drizzle Kit migration workflow, migration runner, dan seed kategori bawaan yang tetap hanya diterapkan sekali.
- Merefactor akses database server dari synchronous `better-sqlite3` menjadi async Drizzle tanpa mengubah endpoint, payload, bentuk respons, status HTTP, atau perilaku fitur.
- Menambahkan importer SQLite ke PostgreSQL yang membaca sumber secara read-only, aman terhadap duplikasi, mempertahankan ID dan relasi, serta tidak mengubah file SQLite sumber.
- Memisahkan konfigurasi database development, testing, dan deployment. Integration test memakai database test terpisah dan tidak boleh memakai database production.
- Menambahkan deployment readiness untuk Vercel + Render: CORS allowlist, base URL API frontend, environment variable terdokumentasi, dan perintah migration yang aman.
- Menambahkan `GET /api/health` untuk health check Render yang memeriksa konektivitas database tanpa membocorkan credential atau detail koneksi.
- Mempertahankan SQLite dan `better-sqlite3` sampai migrasi data serta seluruh verifikasi berhasil; penghapusan runtime SQLite dilakukan paling akhir.
- Mendokumentasikan batas deployment: backend tanpa authentication tidak boleh diekspos kepada publik.
- Tidak mengubah atau mengarsipkan change `add-public-landing-page`.

## Capabilities

### New Capabilities

Tidak ada.

### Modified Capabilities

- `platform-and-quality`: Mengubah requirement platform, persistensi, migrasi database, teknologi aplikasi, dan preservasi kontrak agar menggunakan Neon PostgreSQL/Drizzle; menambahkan requirement isolasi database pengujian, pemisahan konfigurasi environment, keamanan migrasi data, kesiapan deployment, health check deployment, serta batas backend tanpa authentication.

## Impact

- **Backend:** `server/src/app.js`, `server/src/db.js`, `server/src/migrate.js`, `server/src/migrate-cli.js`, `server/src/index.js`, route `GET /api/health`, schema Drizzle baru, repository/query layer, dan konfigurasi environment.
- **Database:** schema PostgreSQL baru, Drizzle migrations, seed kategori, importer data SQLite, backup/cutover, dan rollback. Data lokal `server/data/tasks.db` harus dipertahankan sampai verifikasi selesai.
- **Deployment:** environment variable `DATABASE_URL` (runtime) dan `DATABASE_URL_UNPOOLED` (migration), CORS untuk Vercel, `VITE_API_URL` untuk frontend, health check Render melalui `GET /api/health`, serta dokumentasi Render/Vercel. Tidak ada deployment aktual dalam change ini.
- **Frontend:** hanya penyesuaian base URL API melalui `VITE_API_URL`; perilaku UI, route, dan kontrak data tidak berubah.
- **Dependencies:** menambahkan `drizzle-orm`, `pg`, `cors`, dan `dotenv`; menambahkan `drizzle-kit` sebagai dev dependency; `better-sqlite3` dipertahankan sementara sampai migrasi terverifikasi.
- **Testing:** integration test API/persistensi dipindahkan ke database PostgreSQL test terpisah; ditambahkan pengujian migration, importer, dan health check untuk kondisi database tersedia/tidak tersedia.
- **Out of scope:** authentication, login, multi-user data isolation, UUID migration, perubahan endpoint/payload, deployment publik workspace tanpa auth, serta perubahan atau arsip `add-public-landing-page`.

## Assumptions and Boundaries

- Database testing memakai Neon branch/database khusus test melalui environment terpisah dan tidak boleh menunjuk database production.
- `user_id` bertipe nullable dan belum digunakan oleh API, query, atau UI.
- Kontrak API dipertahankan, termasuk integer IDs, `created_at` format lama, deadline `YYYY-MM-DD`, `is_default` boolean, dan envelope sukses/error.
- Backend Render diperlakukan sebagai deployment privat/internal sampai authentication tersedia; Vercel publik tetap hanya boleh menyajikan landing.
- Migrasi data menggunakan maintenance window singkat dengan backup SQLite dan snapshot/branch Neon.
- Penghapusan SQLite, `better-sqlite3`, dan migration lama hanya dilakukan setelah importer, test, smoke test, dan review data berhasil.
