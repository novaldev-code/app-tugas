# Tasks

## 1. Dependencies dan konfigurasi environment

- [x] 1.1 Tambahkan dependency server `drizzle-orm`, `pg`, `cors`, `dotenv`, dan dev dependency `drizzle-kit`; pertahankan `better-sqlite3` sementara, lalu verifikasi `npm install` dan `npm ls -w server` menampilkan dependency yang diharapkan tanpa error.
- [x] 1.2 Tambahkan `server/.env.example`, `server/.env.test.example`, dan `client/.env.example`; perbarui `.gitignore` agar file environment lokal/test tidak ter-commit, lalu verifikasi `git check-ignore` untuk contoh file rahasia dan `git status` tidak memuat secret.
- [x] 1.3 Tambahkan modul konfigurasi server yang memvalidasi `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `CORS_ORIGIN`, dan mode environment; tambahkan unit test untuk konfigurasi valid, konfigurasi hilang, dan penolakan mode production pada test, lalu verifikasi test unit server lulus.
- [x] 1.4 Dokumentasikan matriks environment development, testing, dan deployment di README; verifikasi setiap variabel, contoh koneksi, dan perbedaan runtime/migration dijelaskan tanpa menyalin kredensial.

## 2. Schema PostgreSQL dan migration

- [x] 2.1 Tambahkan `server/src/schema.js` dengan tabel `categories` dan `tasks`, integer identity IDs, nullable `user_id`, constraint, foreign key `ON DELETE SET NULL`, timestamp, deadline date, dan index yang setara; verifikasi `npm run db:generate -w server` menghasilkan baseline SQL yang memuat seluruh constraint/index.
- [x] 2.2 Tambahkan migration SQL eksplisit untuk unique index `(user_id, lower(name)) NULLS NOT DISTINCT`; verifikasi SQL migration dapat diterapkan pada Neon test branch dan duplikasi nama kategori beda kapitalisasi ditolak oleh database.
- [x] 2.3 Tambahkan migration seed kategori `Pribadi`, `Pekerjaan`, dan `Belajar` yang aman terhadap konflik dan hanya diterapkan sekali; verifikasi database baru memiliki tepat tiga kategori default dan migration ulang tidak menggandakan seed.
- [x] 2.4 Tambahkan `server/src/migrate.js` dan `server/src/migrate-cli.js` berbasis Drizzle migrator dengan `DATABASE_URL_UNPOOLED`, lalu hapus pemanggilan migration otomatis dari startup; verifikasi migration dua kali idempotent dan server tidak menjalankan DDL saat start.
- [x] 2.5 Tambahkan integration test migration yang membuat schema dari nol di database test, memeriksa seed, constraint, unique index, dan foreign key; verifikasi test lulus dan seluruh tabel test dibersihkan setelahnya.
- [x] 2.6 Dokumentasikan perintah `db:generate`, `db:migrate`, dan penggunaan koneksi migration di README; verifikasi perintah yang didokumentasikan berhasil dijalankan terhadap Neon test branch.

## 3. Database client dan repository

- [x] 3.1 Refactor `server/src/db.js` menjadi factory pool/Drizzle dengan konfigurasi koneksi, timeout, dan fungsi close; tambahkan test yang membuat koneksi ke database test, menjalankan `SELECT 1`, lalu menutup pool tanpa koneksi menggantung.
- [x] 3.2 Implementasikan `server/src/repositories/tasks.js` dengan list/filter/search/sort, get, create, update, delete, dan join kategori; verifikasi repository test terhadap PostgreSQL test branch untuk pencarian `ILIKE ... ESCAPE`, filter AND, sort deadline nulls-last, dan CRUD.
- [x] 3.3 Implementasikan `server/src/repositories/categories.js` dengan list terurut, create, rename, delete, pengecekan duplikat case-insensitive, dan pemetaan unique violation `23505`; verifikasi test duplikasi, rename, delete, serta `category_id` tugas menjadi `NULL`.
- [x] 3.4 Implementasikan `server/src/repositories/stats.js` untuk total dan group count status/priority; verifikasi count PostgreSQL dinormalisasi menjadi number dan test statistik lulus.
- [x] 3.5 Tambahkan pemetaan record database ke bentuk API yang mempertahankan integer ID, boolean `is_default`, `created_at` UTC `YYYY-MM-DD HH:MM:SS`, dan deadline `YYYY-MM-DD`; verifikasi unit test mapper untuk timestamp, date, boolean, dan nilai null.

## 4. Refactor API async dan regression test

- [x] 4.1 Refactor seluruh handler `server/src/app.js` menjadi async dan memakai repository, termasuk create/update dengan `.returning()`, partial update, delete, kategori, statistik, dan error mapping; verifikasi tidak ada pemanggilan API `better-sqlite3` tersisa dengan pencarian source.
- [x] 4.2 Pindahkan integration test API ke Neon test branch dengan setup migration sekali, reset `TRUNCATE tasks, categories RESTART IDENTITY CASCADE`, seed kategori, eksekusi serial, dan guard yang menolak URL production; verifikasi seluruh test API lulus.
- [x] 4.3 Perbarui test persistence untuk membuat data, menutup pool, membuat pool/app baru, lalu membaca data kembali; verifikasi test persistence lulus pada database test.
- [x] 4.4 Tambahkan regression test kontrak API untuk integer ID, `is_default` boolean, format `created_at`, deadline date-only, envelope error, pencarian case-insensitive, wildcard escaping, sorting, statistik, dan status HTTP; verifikasi seluruh test kontrak lulus.
- [x] 4.5 Dokumentasikan cara menjalankan unit/integration test dengan environment test dan guard production di README; verifikasi perintah test yang didokumentasikan berjalan sesuai instruksi.

## 5. CORS dan base URL frontend

- [x] 5.1 Tambahkan middleware CORS server berbasis allowlist `CORS_ORIGIN` tanpa wildcard deployment dan tanpa credentials; tambahkan integration test preflight dari origin yang diizinkan serta penolakan origin yang tidak diizinkan, lalu verifikasi test lulus.
- [x] 5.2 Perbarui `client/src/api.js` agar memakai `VITE_API_URL` opsional dengan normalisasi trailing slash dan tetap memakai path relatif saat kosong; tambahkan unit test pembentukan URL dan verifikasi `npm run build -w client` berhasil dengan serta tanpa `VITE_API_URL`.
- [x] 5.3 Dokumentasikan `CORS_ORIGIN`, `VITE_API_URL`, `VITE_API_TARGET`, dan perilaku Vite proxy di README; verifikasi instruksi development dan deployment menggunakan nilai yang sesuai tanpa hardcoded URL Render.

## 6. Importer SQLite ke PostgreSQL

- [x] 6.1 Implementasikan `server/scripts/import-sqlite.js` dengan mode read-only, `--dry-run`, `--replace`, transaksi tunggal, impor kategori lalu tugas, konversi timestamp UTC, reset sequence, dan verifikasi count/relasi; verifikasi importer gagal dengan pesan jelas jika source atau URL tidak tersedia.
- [x] 6.2 Tambahkan integration test importer dengan fixture SQLite sementara yang memuat ID tidak berurutan, kategori default, tugas dengan/tanpa kategori, dan timestamp; verifikasi ID, relasi, timestamp, sequence, source file hash tidak berubah, serta menjalankan ulang `--replace` tidak menggandakan data.
- [x] 6.3 Tambahkan test bahwa importer menolak target non-kosong tanpa `--replace` dan membatalkan seluruh perubahan jika terjadi kegagalan di tengah transaksi; verifikasi target kembali ke kondisi awal setelah kegagalan.
- [x] 6.4 Dokumentasikan backup, dry-run, `--replace`, maintenance window, verifikasi pasca-impor, dan rollback di README; verifikasi urutan perintah sesuai prosedur cutover yang disetujui.

## 7. Deployment readiness Vercel dan Render

- [x] 7.1 Tambahkan script root/server untuk `db:generate`, `db:migrate`, `db:import`, dan `db:studio`, serta pertahankan alias `migrate`; verifikasi setiap script dapat dipanggil dari root dan mengarah ke workspace server.
- [x] 7.2 Implementasikan `GET /api/health` sebelum static/SPA fallback yang memakai koneksi database runtime untuk query read-only ringan `SELECT 1` dengan batas waktu singkat; kembalikan `200` + `{ "status": "ok" }` hanya saat database merespons, atau `503` + `{ "status": "unhealthy" }` saat gagal/timeout, dengan `Cache-Control: no-store`, log generik, dan tanpa credential/detail koneksi; verifikasi endpoint tidak memakai `DATABASE_URL_UNPOOLED`, tidak menulis data, dan tidak menjalankan migration.
- [x] 7.3 Tambahkan integration test health check yang memverifikasi `200` dan body `{ "status": "ok" }` terhadap database test, serta test jalur gagal dengan dependency database yang di-inject untuk memverifikasi `503` dan body `{ "status": "unhealthy" }`; pastikan kedua respons tidak memuat URL, credential, host, nama database, pesan error, atau stack trace, dan health check tidak mengubah jumlah data.
- [x] 7.4 Dokumentasikan health check Render pada path `/api/health`, arti `200`/`503`, syarat database siap setelah migration, dan larangan menaruh credential pada dokumentasi; verifikasi checklist Render dapat diikuti tanpa config file platform baru atau secret di repository.
- [x] 7.5 Dokumentasikan konfigurasi Neon, Render build/start, migration pre-deploy, Vercel build/output, SPA fallback, CORS, dan pemisahan runtime/migration; verifikasi checklist deployment dapat diikuti tanpa membuat config file platform baru.
- [x] 7.6 Dokumentasikan secara eksplisit bahwa backend tanpa authentication harus privat/internal dan workspace publik memerlukan authentication/multi-user isolation melalui change terpisah; verifikasi tidak ada instruksi yang menyarankan mengekspos backend publik.
- [x] 7.7 Periksa repository untuk memastikan tidak ada kredensial Neon, URL database production, atau secret yang ter-commit; verifikasi dengan pencarian pola koneksi dan `git diff`.

## 8. Cutover data dan smoke test

 - [x] 8.1 Buat backup bertimestamp `server/data/tasks.db`, hitung checksum sumber, dan buat snapshot/branch Neon sebelum impor; verifikasi checksum sumber tetap sama dan backup dapat dibuka read-only.
 - [x] 8.2 Hentikan backend, jalankan migration ke database Neon yang disetujui, lalu jalankan importer `--dry-run`; verifikasi laporan jumlah kategori/tugas, relasi, status/priority, deadline, dan timestamp sesuai sumber.
 - [x] 8.3 Jalankan importer `--replace` dalam maintenance window; verifikasi count per tabel, count status/priority, orphan check, ID preservation, sequence setelah impor, dan source SQLite tetap tidak berubah.
 - [x] 8.4 Jalankan API smoke test terhadap data hasil impor dan verifikasi `GET /api/health` mengembalikan `200` tanpa detail koneksi, serta kategori, daftar tugas, detail tugas, statistik, dan error envelope sesuai kontrak.
 - [x] 8.5 Jalankan workspace di Firefox terhadap backend Neon dan verifikasi Dashboard, Task List, Kanban, Kategori, filter, pencarian, sort, modal, delete dialog, dan DnD tidak mengalami regresi.
 - [x] 8.6 Uji rollback pada database test/branch terpisah dengan menghentikan backend, memulihkan snapshot, dan menjalankan versi SQLite; verifikasi prosedur rollback terdokumentasi dan sumber SQLite tetap dapat digunakan.

## 9. Verifikasi integrasi akhir

 - [x] 9.1 Jalankan `npm test`, `npm run test:integration`, dan `npm run build`; verifikasi seluruh test unit/integration client/server serta build lulus tanpa error baru.
 - [x] 9.2 Jalankan `openspec validate migrate-sqlite-to-neon-drizzle --strict`; verifikasi change valid dan tidak ada warning strict.
 - [x] 9.3 Periksa konsistensi proposal, spec delta, design, dan tasks terhadap seluruh keputusan scope; verifikasi tidak ada requirement atau task yang menyiratkan authentication, multi-user, UUID, atau deployment backend publik.
 - [x] 9.4 Periksa `git status` dan diff untuk memastikan `openspec/changes/add-public-landing-page/` tidak berubah atau terarsipkan; verifikasi hanya file change ini dan file implementasi terkait yang berubah.

## 10. Cleanup SQLite setelah verifikasi

 - [x] 10.1 Setelah seluruh verifikasi dan rollback window disetujui, hapus jalur runtime SQLite dan migration SQL lama; pertahankan importer/`better-sqlite3` sebagai dev tool bila masih diperlukan, lalu verifikasi `npm test` dan `npm run build` tetap lulus.
 - [x] 10.2 Hapus instruksi runtime SQLite yang sudah tidak berlaku dari README dan dokumentasikan retensi backup data; verifikasi tidak ada referensi aktif ke `DB_PATH` sebagai konfigurasi runtime utama.
 - [x] 10.3 Verifikasi `better-sqlite3` tidak lagi berada di dependency runtime server setelah cleanup; jika dipertahankan untuk importer, pastikan hanya berada di dev dependency dan dokumentasikan alasannya.

## Workflow follow-up

- Review proposal, design, spec delta, dan tasks sebelum Apply.
- Setelah implementasi dan verifikasi selesai, jalankan workflow Apply, lalu arsipkan change dan verifikasi hasil arsip.
