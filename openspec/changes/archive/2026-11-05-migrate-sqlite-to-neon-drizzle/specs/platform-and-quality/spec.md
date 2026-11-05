# Spec Delta

## MODIFIED Requirements

### Requirement: Platform lokal single-user

Sistem SHALL berjalan sebagai aplikasi web single-user tanpa autentikasi yang dapat digunakan secara lokal atau pada deployment internal/privat. Sistem SHALL NOT mengimplementasikan login, kepemilikan akun, atau isolasi data antar-pengguna dalam perubahan ini.

#### Scenario: Akses aplikasi lokal

- **WHEN** aplikasi dijalankan secara lokal
- **THEN** pengguna dapat membuka workspace dan menggunakan fitur tanpa login

#### Scenario: Tidak ada isolasi akun

- **WHEN** pengguna menggunakan aplikasi
- **THEN** tidak ada konsep kepemilikan akun atau isolasi data antar-pengguna yang diterapkan oleh API atau UI

#### Scenario: Deployment internal atau privat

- **WHEN** aplikasi dijalankan pada deployment internal atau privat
- **THEN** workspace tetap bersifat single-user dan tidak memerlukan autentikasi

### Requirement: Persistensi data

Sistem SHALL menyimpan tugas dan kategori pada database PostgreSQL secara persisten sehingga data tetap tersedia setelah server restart atau koneksi database dibuat ulang.

#### Scenario: Restart server

- **WHEN** server dijalankan ulang setelah data dibuat
- **THEN** tugas dan kategori yang sudah ada tetap tersedia

#### Scenario: Koneksi database dibuat ulang

- **WHEN** koneksi database ditutup lalu dibuat ulang
- **THEN** data yang sudah tersimpan tetap dapat dibaca dan diubah

### Requirement: Migrasi database bernomor

Sistem SHALL menerapkan migrasi database menggunakan Drizzle Kit dengan file migration bernomor yang tercatat, dan SHALL menerapkan migrasi pada database baru secara berurutan.

#### Scenario: Database baru

- **WHEN** database baru dibuat
- **THEN** migrasi diterapkan secara berurutan sesuai nomor dan schema siap digunakan

#### Scenario: Migration tercatat

- **WHEN** migrasi dijalankan ulang pada database yang sudah dimigrasikan
- **THEN** migration yang sudah diterapkan tidak dijalankan ulang

#### Scenario: Koneksi migration terpisah

- **WHEN** migrasi dijalankan pada deployment
- **THEN** migrasi menggunakan konfigurasi koneksi database khusus migration, bukan konfigurasi runtime aplikasi

### Requirement: Teknologi aplikasi

Sistem SHALL menggunakan React + Vite untuk frontend, Node.js + Express untuk backend, serta Neon PostgreSQL melalui Drizzle ORM dan driver `pg` untuk penyimpanan data. SQLite dan `better-sqlite3` hanya boleh dipertahankan sementara untuk migrasi dan verifikasi.

#### Scenario: Menjalankan stack aplikasi

- **WHEN** aplikasi dijalankan secara lokal
- **THEN** frontend React + Vite dan backend Express dapat digunakan bersama

#### Scenario: Penyimpanan data

- **WHEN** tugas atau kategori disimpan
- **THEN** data tersimpan pada database Neon PostgreSQL

#### Scenario: SQLite hanya sementara

- **WHEN** migrasi data dan seluruh verifikasi belum berhasil
- **THEN** SQLite dan `better-sqlite3` tetap tersedia untuk rollback dan perbandingan data

#### Scenario: SQLite dihapus setelah verifikasi

- **WHEN** migrasi data dan seluruh verifikasi berhasil
- **THEN** runtime SQLite, `better-sqlite3`, dan jalur migration lama dapat dihapus

### Requirement: Preservasi perilaku dan kontrak

Sistem SHALL mempertahankan seluruh perilaku fitur dan kontrak API yang sudah ada selama migrasi database. Perubahan storage, schema, dan dependency database diperbolehkan sepanjang perilaku eksternal tetap sama.

#### Scenario: Kontrak API

- **WHEN** frontend memanggil API setelah migrasi
- **THEN** endpoint, payload, bentuk respons, format data, dan status HTTP tetap sama

#### Scenario: Perilaku fitur

- **WHEN** pengguna menggunakan pencarian, filter, sort, grouping, overdue, kategori, dialog hapus, atau drag-and-drop
- **THEN** perilakunya sama seperti sebelum migrasi

#### Scenario: Test yang ada

- **WHEN** seluruh test suite dijalankan
- **THEN** test yang sudah ada tetap lulus atau diperbarui hanya untuk perubahan mekanisme database

#### Scenario: Database

- **WHEN** aplikasi dijalankan setelah migrasi database
- **THEN** data tersedia melalui schema PostgreSQL dan perilaku API tetap sama, meskipun mekanisme penyimpanan berubah

#### Scenario: Teknologi dan dependency

- **WHEN** perubahan diimplementasikan
- **THEN** React, Vite, dan Express tetap digunakan untuk frontend/backend, sementara penyimpanan memakai PostgreSQL dengan Drizzle dan `pg`; SQLite hanya tersisa selama masa verifikasi

## ADDED Requirements

### Requirement: Persiapan ownership tanpa authentication

Sistem SHALL menyediakan kolom `user_id` nullable pada `categories` dan `tasks` sebagai persiapan schema, dan SHALL NOT menggunakan kolom tersebut untuk authentication, ownership filter, atau isolasi data dalam perubahan ini.

#### Scenario: Schema nullable

- **WHEN** data baru atau data hasil migrasi disimpan
- **THEN** `user_id` boleh bernilai `NULL` dan tidak menjadi syarat validasi API

#### Scenario: Tanpa authentication

- **WHEN** pengguna membuka aplikasi
- **THEN** tidak ada login, session, atau konsep pemilik data yang diterapkan

#### Scenario: Tanpa filter ownership

- **WHEN** API membaca atau mengubah tugas dan kategori
- **THEN** query tidak memfilter berdasarkan `user_id` dan perilaku data tetap single-user seperti sebelumnya

### Requirement: Pemisahan konfigurasi database

Konfigurasi koneksi database SHALL dipisahkan untuk development, testing, dan deployment. Integration test SHALL menggunakan database test khusus dan SHALL NOT menggunakan database production.

#### Scenario: Konfigurasi development

- **WHEN** aplikasi dijalankan untuk development
- **THEN** aplikasi menggunakan konfigurasi database development yang terpisah dari testing dan production

#### Scenario: Isolasi database testing

- **WHEN** integration test dijalankan
- **THEN** test menggunakan database test khusus dan tidak membaca atau mengubah data production

#### Scenario: Konfigurasi deployment

- **WHEN** aplikasi dijalankan pada deployment
- **THEN** koneksi runtime dan koneksi migration menggunakan konfigurasi environment deployment yang terpisah

### Requirement: Kesiapan deployment Vercel dan Render

Sistem SHALL menyediakan konfigurasi aplikasi dan dokumentasi yang memungkinkan frontend Vercel terhubung ke backend Render dan database Neon tanpa mengubah kontrak API.

#### Scenario: CORS frontend deployment

- **WHEN** frontend Vercel memanggil API backend Render
- **THEN** origin frontend yang dikonfigurasi diizinkan oleh CORS dan request preflight berhasil

#### Scenario: Base URL API frontend

- **WHEN** frontend dibangun untuk deployment
- **THEN** frontend menggunakan base URL API yang dikonfigurasi melalui environment, bukan URL lokal hardcoded

#### Scenario: Perintah migration deployment

- **WHEN** deployment dijalankan
- **THEN** perintah migration database tersedia dan menggunakan konfigurasi koneksi migration yang benar

#### Scenario: Tanpa secret di repository

- **WHEN** konfigurasi deployment diperiksa
- **THEN** kredensial database dan secret tidak tersimpan di repository

### Requirement: Health check deployment

Sistem SHALL menyediakan `GET /api/health` yang memeriksa konektivitas database runtime dan hanya mengembalikan status sehat jika backend dan database dapat berkomunikasi. Respons SHALL NOT memuat credential, URL koneksi, host, nama database, pesan error koneksi, stack trace, atau detail konfigurasi database.

#### Scenario: Database tersedia

- **WHEN** `GET /api/health` dipanggil dan database dapat merespons pemeriksaan
- **THEN** endpoint mengembalikan HTTP `200` dengan status `ok`

#### Scenario: Database tidak tersedia

- **WHEN** `GET /api/health` dipanggil tetapi database tidak dapat dihubungi, query gagal, atau timeout
- **THEN** endpoint mengembalikan HTTP `503` dengan status `unhealthy`

#### Scenario: Tanpa kebocoran detail koneksi

- **WHEN** health check berhasil maupun gagal
- **THEN** body respons hanya memuat status dan tidak memuat credential, URL, host, nama database, pesan error, atau stack trace

#### Scenario: Pemeriksaan read-only

- **WHEN** health check dijalankan
- **THEN** endpoint memakai koneksi database runtime dan query read-only ringan tanpa mengubah data atau menjalankan migration

### Requirement: Batas deployment backend tanpa autentikasi

Backend tanpa authentication SHALL NOT diekspos kepada publik. Deployment readiness SHALL hanya mencakup konfigurasi CORS, base URL API, environment, health check, dan dokumentasi; SHALL NOT menambahkan authentication atau multi-user isolation.

#### Scenario: Backend tetap privat

- **WHEN** backend tanpa authentication dijalankan pada Render
- **THEN** akses publik ke backend dibatasi atau tidak diaktifkan

#### Scenario: Batas deployment terdokumentasi

- **WHEN** dokumentasi deployment dibaca
- **THEN** batas bahwa backend tanpa authentication tidak boleh diekspos kepada publik dinyatakan secara eksplisit

#### Scenario: Workspace publik memerlukan change terpisah

- **WHEN** workspace akan dibuka untuk pengunjung publik
- **THEN** authentication dan multi-user data isolation harus tersedia melalui change terpisah

### Requirement: Preservasi data saat migrasi

Migrasi dari SQLite ke PostgreSQL SHALL mempertahankan seluruh kategori, tugas, ID, relasi kategori-tugas, nilai status dan prioritas, deadline, serta timestamp yang ada.

#### Scenario: Kategori dipertahankan

- **WHEN** migrasi data selesai
- **THEN** seluruh kategori sumber tersedia dengan ID, nama, status bawaan, urutan, dan timestamp yang sesuai

#### Scenario: Tugas dipertahankan

- **WHEN** migrasi data selesai
- **THEN** seluruh tugas sumber tersedia dengan ID, field, status, prioritas, deadline, dan timestamp yang sesuai

#### Scenario: Relasi dipertahankan

- **WHEN** tugas memiliki kategori pada sumber SQLite
- **THEN** tugas tersebut tetap merujuk kategori yang sama setelah migrasi

#### Scenario: Data tidak hilang

- **WHEN** migrasi data dinyatakan selesai
- **THEN** jumlah dan isi data sumber telah dibandingkan dan sesuai dengan data target

### Requirement: Keamanan importer data

Importer migrasi SHALL membaca sumber SQLite secara read-only, SHALL aman dijalankan ulang tanpa menggandakan data, dan SHALL menolak impor ke target non-kosong tanpa mode penggantian eksplisit.

#### Scenario: Sumber tidak berubah

- **WHEN** importer dijalankan
- **THEN** file dan isi database SQLite sumber tidak berubah

#### Scenario: Aman terhadap duplikasi

- **WHEN** importer dijalankan ulang terhadap data yang sama
- **THEN** data target tidak berisi duplikat dan hasil akhir tetap konsisten

#### Scenario: Target non-kosong ditolak

- **WHEN** importer dijalankan terhadap target yang sudah berisi data tanpa mode penggantian eksplisit
- **THEN** importer berhenti tanpa mengubah data target

#### Scenario: Kegagalan impor tidak parsial

- **WHEN** importer gagal di tengah proses
- **THEN** perubahan pada target dibatalkan dan sumber SQLite tetap utuh

### Requirement: Retensi SQLite sampai verifikasi

Sistem SHALL mempertahankan SQLite, `better-sqlite3`, dan data sumber sampai migrasi data, test, smoke test, serta review data berhasil. Penghapusan hanya boleh dilakukan setelah verifikasi selesai.

#### Scenario: Verifikasi belum selesai

- **WHEN** migrasi data atau verifikasi belum berhasil
- **THEN** SQLite, `better-sqlite3`, dan file data sumber tetap tersedia untuk rollback

#### Scenario: Verifikasi berhasil

- **WHEN** migrasi data dan seluruh verifikasi berhasil
- **THEN** runtime SQLite dapat dihapus setelah backup dan rollback window disetujui
