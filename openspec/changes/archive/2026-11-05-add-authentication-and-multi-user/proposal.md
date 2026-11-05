# Proposal

## Why

Aplikasi Personal Task Manager saat ini berjalan sebagai aplikasi single-user tanpa autentikasi. Semua pengunjung yang dapat menjangkau backend berbagi satu kumpulan data, sehingga siapa pun dapat membaca, mengubah, atau menghapus tugas dan kategori milik orang lain. Sebelum workspace dapat diekspos pada deployment publik, dibutuhkan identitas akun, sesi yang aman, dan isolasi data per pengguna.

Perubahan ini menambahkan register, login, logout, dan multi-user authentication di atas stack yang sudah ada (React + Vite, Express 5, Neon PostgreSQL, Drizzle ORM), tanpa mengganti stack, mengulang migrasi PostgreSQL yang sudah ada, atau melakukan deployment.

## What Changes

- Menambahkan register, login, logout, dan endpoint sesi aktif (`GET /api/auth/me`).
- Menambahkan tabel `users` dan `sessions`, serta menghubungkan `tasks.user_id` dan `categories.user_id` ke `users.id` melalui migration baru.
- Mewajibkan sesi login untuk seluruh endpoint data `/api/*`, kecuali `GET /api/health`, register, dan login.
- Menerapkan ownership filtering pada seluruh operasi tugas, kategori, dan statistik, termasuk create/read/update/delete; akses ke data pengguna lain menghasilkan `404` agar keberadaan data tidak bocor.
- Membuat kategori bawaan `Pribadi`, `Pekerjaan`, dan `Belajar` per pengguna saat registrasi; data lama dengan `user_id` NULL tidak terlihat oleh pengguna mana pun.
- Menambahkan halaman `/register` dan `/login`, guard route `/app`, serta aksi logout pada shell workspace yang sama untuk semua pengguna.
- Menambahkan tautan masuk/daftar pada landing page dan memperbarui copy/FAQ landing agar menyatakan ketersediaan akun tanpa mengklaim fitur yang belum ada.
- Menetapkan perilaku navigasi autentikasi: `/app` tanpa sesi diarahkan ke `/login`; login/register gagal tetap di form; login/register berhasil menuju `/app`; pengguna terautentikasi yang membuka `/login`/`/register` diarahkan ke `/app`; logout memblokir `/app` berikutnya.
- **BREAKING** untuk akses API: seluruh endpoint data kini memerlukan sesi login; request tanpa sesi valid mendapat `401`, dan request mutasi tanpa token CSRF yang valid mendapat `403`.
- Mewajibkan topologi cookie sesi first-party (domain same-site atau proxy/rewrite `/api` same-origin); `SameSite=None` hanya fallback untuk cross-site dan tidak dianggap didukung bila browser memblokir cookie pihak ketiga.
- Memperbarui spesifikasi platform, kontrak API, kategori, dan dashboard agar mencerminkan perilaku multi-user.
- Mengasumsikan change `migrate-sqlite-to-neon-drizzle` sudah diterapkan; perubahan ini hanya menambah migration baru dan tidak mengubah migration `0000`–`0002`.

## Capabilities

### New Capabilities

- `user-auth`: Registrasi, login, logout, siklus sesi berbasis cookie HttpOnly, hashing password, proteksi CSRF, validasi kredensial, dan presentasi form autentikasi.
- `multi-user-isolation`: Aturan kepemilikan data dan otorisasi untuk tugas, kategori, serta statistik; isolasi antar pengguna dan penanganan data lama tanpa pemilik.

### Modified Capabilities

- `platform-and-quality`: Mengubah platform dari aplikasi lokal single-user menjadi aplikasi multi-user terautentikasi; menyesuaikan persistensi/teknologi dengan Neon PostgreSQL + Drizzle; menambahkan batas keamanan deployment, topologi cookie first-party, konsistensi UI lintas pengguna, dan ketentuan pengujian autentikasi.
- `api-contract`: Menambahkan status `401` untuk sesi tidak valid, `403` untuk kegagalan CSRF, `429` untuk pembatasan percobaan autentikasi, dan bentuk respons endpoint autentikasi tanpa mengubah envelope sukses/gagal yang ada.
- `category-management`: Memindahkan seed kategori bawaan dari global menjadi per pengguna saat registrasi, menetapkan keunikan nama per pengguna, dan menegaskan kepemilikan kategori.
- `dashboard`: Mengubah statistik dari global menjadi hanya data milik pengguna yang sedang login.
- `public-landing`: Mengubah gate `/app` pada deployment publik menjadi guard sesi, memperbarui copy/FAQ agar sesuai ketersediaan authentication, dan menambahkan tautan masuk/daftar tanpa memuat workspace di landing.

## Impact

- **Backend:** `server/src/schema.js`, migration Drizzle baru, modul autentikasi/sesi/CSRF, middleware otorisasi, seluruh repository tugas/kategori/statistik, `server/src/app.js`, `server/src/config.js`, dan test server.
- **Frontend:** `client/src/api.js`, routing dan `App.jsx`, halaman register/login, guard workspace, aksi logout pada `AppWorkspace`/`AppShell`, tautan autentikasi dan copy landing, serta test client.
- **Database:** Hanya menambah migration baru untuk `users`, `sessions`, dan foreign key `user_id`. Migration `0000`–`0002` tidak diubah. Data lama ber-`user_id` NULL tidak dihapus dan tidak terlihat oleh pengguna.
- **Dependencies:** Menambah library hashing password (`argon2`) dan utilitas cookie; menambah dev dependency test client (`jsdom`, Testing Library) untuk menguji guard route dan form. Tidak mengganti React, Vite, Express, Neon, atau Drizzle.
- **Konfigurasi/deployment:** CORS memerlukan credentials dan header CSRF; menambah konfigurasi masa berlaku sesi dan atribut cookie. Deployment wajib memakai topologi cookie first-party (domain same-site atau proxy/rewrite same-origin); `SameSite=None` hanya fallback. Semantik `VITE_PUBLIC_DEPLOYMENT` berubah sehingga workspace dapat diakses pengguna terautentikasi pada build publik.
- **Prasyarat koordinasi:** `migrate-sqlite-to-neon-drizzle` harus sudah diterapkan/disinkronkan, dan `add-public-landing-page` (masih in-progress) perlu diselesaikan/diarsipkan sebelum perubahan gate routing ini diterapkan agar delta spesifikasi tidak bertabrakan.
- **Di luar scope:** verifikasi email, reset password, OAuth/SSO, 2FA, penghapusan akun, role/admin, audit log, rate limiting terdistribusi, dan kustomisasi UI per pengguna.
