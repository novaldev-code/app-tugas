# platform-and-quality Specification

## Purpose

Menetapkan batasan platform, kualitas, pengujian, persistensi, dan pengalaman pengguna untuk aplikasi Personal Task Manager MVP.

## Requirements

### Requirement: Dukungan browser

Sistem SHALL berfungsi pada browser modern Chrome, Firefox, dan Edge.

#### Scenario: Menjalankan di browser yang didukung

- **WHEN** aplikasi dibuka di Chrome, Firefox, atau Edge
- **THEN** fitur utama aplikasi dapat digunakan

### Requirement: Layout desktop dan tablet

Sistem SHALL menyediakan layout yang konsisten dan dapat digunakan pada perangkat desktop dan tablet.

#### Scenario: Membuka di desktop dan tablet

- **WHEN** aplikasi dibuka pada ukuran layar desktop dan tablet
- **THEN** layout tetap konsisten dan seluruh fitur utama dapat digunakan

### Requirement: Antarmuka Bahasa Indonesia

Sistem SHALL menampilkan seluruh label, pesan, dialog, dan state antarmuka dalam Bahasa Indonesia.

#### Scenario: Pesan operasi

- **WHEN** operasi berhasil atau gagal
- **THEN** pengguna menerima feedback dalam Bahasa Indonesia

#### Scenario: State tampilan

- **WHEN** data sedang dimuat, kosong, atau gagal dimuat
- **THEN** pesan loading, empty, atau error tampil dalam Bahasa Indonesia

#### Scenario: Validasi form

- **WHEN** input tidak valid
- **THEN** pesan validasi yang jelas tampil dalam Bahasa Indonesia

#### Scenario: Dialog penghapusan

- **WHEN** dialog penghapusan tugas atau kategori tampil
- **THEN** pilihan `Batal` dan `Hapus` tampil dalam Bahasa Indonesia

### Requirement: Label status dan prioritas

Sistem SHALL menampilkan label status dan prioritas dalam Bahasa Indonesia, sementara nilai internal database dan API tetap menggunakan enum bahasa Inggris.

#### Scenario: Label status Todo

- **WHEN** status tugas adalah `Todo`
- **THEN** antarmuka menampilkan `Belum Dikerjakan`

#### Scenario: Label status In Progress

- **WHEN** status tugas adalah `In Progress`
- **THEN** antarmuka menampilkan `Sedang Dikerjakan`

#### Scenario: Label status Done

- **WHEN** status tugas adalah `Done`
- **THEN** antarmuka menampilkan `Selesai`

#### Scenario: Label prioritas

- **WHEN** prioritas tugas adalah `Low`, `Medium`, `High`, atau `Urgent`
- **THEN** antarmuka menampilkan `Rendah`, `Sedang`, `Tinggi`, atau `Mendesak` secara berurutan

#### Scenario: Nilai internal tetap bahasa Inggris

- **WHEN** data tugas dikirim atau diterima melalui API
- **THEN** status dan prioritas tetap menggunakan enum bahasa Inggris

### Requirement: Konsistensi UI/UX

Sistem SHALL menjaga konsistensi tampilan dan perilaku di Dashboard, Task List, dan Kanban serta memberikan feedback yang jelas untuk setiap operasi.

#### Scenario: Konsistensi antar tampilan

- **WHEN** pengguna berpindah antara Dashboard, Task List, dan Kanban
- **THEN** data dan perilaku yang sama ditampilkan secara konsisten

#### Scenario: Feedback operasi

- **WHEN** pengguna melakukan operasi berhasil atau gagal
- **THEN** aplikasi menampilkan feedback yang sesuai

### Requirement: Persistensi data

Sistem SHALL menyimpan tugas dan kategori pada database PostgreSQL secara persisten sehingga data tetap tersedia setelah server restart atau koneksi database dibuat ulang.

#### Scenario: Restart server

- **WHEN** server dijalankan ulang setelah data dibuat
- **THEN** tugas dan kategori yang sudah ada tetap tersedia

#### Scenario: Koneksi database dibuat ulang

- **WHEN** koneksi database ditutup lalu dibuat ulang
- **THEN** data yang sudah tersimpan tetap dapat dibaca dan diubah

### Requirement: Pengujian otomatis

Sistem SHALL memiliki unit test dan integration test yang dapat dijalankan, tanpa gate minimum coverage.

#### Scenario: Menjalankan test suite

- **WHEN** test suite dijalankan
- **THEN** unit test dan integration test berjalan, dan tidak ada kegagalan karena gate coverage

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

### Requirement: Dukungan viewport mobile

Sistem SHALL menyediakan layout yang dapat digunakan pada viewport mobile tanpa overflow horizontal pada halaman serta tetap mempertahankan seluruh fitur utama.

#### Scenario: Viewport kecil

- **WHEN** aplikasi dibuka pada lebar 360px atau 390px
- **THEN** konten utama, filter, modal, dan aksi tetap dapat digunakan tanpa overflow horizontal pada halaman, dengan area Kanban sebagai satu-satunya container scroll horizontal internal

#### Scenario: Navigasi mobile

- **WHEN** aplikasi dibuka pada viewport mobile
- **THEN** navigasi utama tersedia melalui drawer off-canvas

#### Scenario: Konten satu kolom

- **WHEN** Dashboard, Task List, atau Kategori dibuka pada viewport mobile
- **THEN** panel dan kartu tersusun dalam satu kolom yang dapat dibaca

#### Scenario: Kanban mobile

- **WHEN** Kanban dibuka pada viewport mobile
- **THEN** tiga kolom status tetap tampil dalam area yang dapat digeser horizontal, halaman tidak overflow, dan drag-and-drop tetap berfungsi

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

### Requirement: Verifikasi regresi visual dan interaksi

Sistem SHALL diverifikasi pada browser dan viewport yang didukung untuk memastikan modernisasi tidak menimbulkan regresi visual atau interaksi.

#### Scenario: Matriks regresi browser

- **WHEN** verifikasi regresi dilakukan
- **THEN** alur utama diuji di setiap browser yang didukung tanpa regresi

#### Scenario: Matriks regresi viewport

- **WHEN** verifikasi regresi dilakukan
- **THEN** desktop, tablet, dan mobile diuji tanpa overflow horizontal pada halaman, sementara area Kanban boleh memiliki scroll horizontal internal

#### Scenario: Cakupan state

- **WHEN** verifikasi dilakukan
- **THEN** state loading, empty, error, success, dan busy diperiksa pada tampilan utama

#### Scenario: Interaksi kunci

- **WHEN** verifikasi dilakukan
- **THEN** drag-and-drop, filter, modal, drawer, dan navigasi keyboard diperiksa

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

### Requirement: Sifat gate deployment frontend

`VITE_PUBLIC_DEPLOYMENT` SHALL hanya mengatur penyajian landing page dan SHALL NOT diperlakukan sebagai authentication, otorisasi, atau security boundary; akses workspace ditentukan oleh sesi backend.

#### Scenario: Gate hanya mengatur frontend

- **WHEN** `VITE_PUBLIC_DEPLOYMENT` bernilai aktif
- **THEN** landing tetap ditampilkan dan workspace hanya dimuat jika sesi valid

#### Scenario: Gate bukan authentication

- **WHEN** dokumentasi, landing page, atau konfigurasi deployment diperiksa
- **THEN** gate tidak digambarkan sebagai login, otorisasi, atau jaminan keamanan

#### Scenario: Workspace publik memerlukan change terpisah

- **WHEN** workspace dibuka untuk pengunjung publik
- **THEN** authentication dan multi-user data isolation tersedia melalui change ini dan akses ditentukan oleh sesi valid

### Requirement: Platform multi-user terautentikasi

Sistem SHALL mendukung banyak akun pengguna, mewajibkan login untuk mengakses workspace, dan memastikan setiap pengguna hanya dapat mengakses data miliknya sendiri.

#### Scenario: Beberapa pengguna

- **WHEN** beberapa pengguna mendaftar dan menggunakan aplikasi
- **THEN** setiap pengguna memiliki tugas, kategori, dan statistik yang terpisah

#### Scenario: Akses tanpa login

- **WHEN** pengguna membuka workspace tanpa sesi valid
- **THEN** workspace tidak menampilkan data dan pengguna diarahkan ke login

#### Scenario: Persistensi lintas restart

- **WHEN** server dijalankan ulang setelah data dibuat
- **THEN** akun, sesi yang belum kedaluwarsa, tugas, dan kategori tetap tersedia sesuai pemiliknya

### Requirement: Konsistensi UI lintas pengguna

Sistem SHALL memakai satu desain antarmuka yang sama untuk seluruh pengguna tanpa kustomisasi tema atau tata letak per akun, dan halaman autentikasi SHALL mengikuti design system yang sama.

#### Scenario: Desain sama untuk semua pengguna

- **WHEN** pengguna yang berbeda membuka workspace
- **THEN** struktur, navigasi, komponen, dan gaya visual identik

#### Scenario: Halaman autentikasi konsisten

- **WHEN** pengguna membuka halaman register atau login
- **THEN** halaman memakai komponen, tipografi, warna, dan pola feedback yang sama dengan workspace

### Requirement: Batas keamanan deployment multi-user

Backend multi-user SHALL hanya diekspos dengan autentikasi dan isolasi data aktif, dan flag deployment frontend SHALL NOT diperlakukan sebagai batas keamanan.

#### Scenario: Deployment publik

- **WHEN** backend dapat diakses dari internet
- **THEN** seluruh endpoint data mewajibkan sesi valid dan menerapkan filter kepemilikan

#### Scenario: Flag frontend bukan otorisasi

- **WHEN** konfigurasi build frontend diubah
- **THEN** akses data tetap ditentukan oleh sesi dan otorisasi backend, bukan oleh flag build

#### Scenario: CORS dengan kredensial

- **WHEN** frontend pada origin yang diizinkan memanggil API dengan cookie sesi
- **THEN** CORS mengizinkan origin eksplisit dengan credentials dan tidak memakai wildcard

### Requirement: Topologi cookie sesi

Cookie sesi SHALL bersifat first-party pada deployment yang didukung, dan deployment cross-site yang memblokir cookie pihak ketiga SHALL NOT dianggap sebagai konfigurasi yang didukung.

#### Scenario: Domain same-site

- **WHEN** frontend dan backend memakai subdomain dari registrable domain yang sama
- **THEN** cookie sesi dikirim sebagai cookie first-party dengan `SameSite=Lax` atau `Strict` sesuai konfigurasi

#### Scenario: Proxy same-origin

- **WHEN** frontend meneruskan request `/api` ke backend melalui rewrite/proxy pada origin yang sama
- **THEN** cookie sesi tetap first-party dan autentikasi berfungsi tanpa bergantung pada cookie pihak ketiga

#### Scenario: Cookie pihak ketiga diblokir

- **WHEN** deployment memisahkan frontend dan backend pada situs berbeda dan browser memblokir cookie pihak ketiga
- **THEN** konfigurasi tersebut dinyatakan tidak didukung dan prosedur deployment memakai domain same-site atau proxy same-origin

#### Scenario: SameSite=None sebagai fallback

- **WHEN** deployment cross-site tidak dapat dihindari
- **THEN** `SameSite=None; Secure` hanya dipakai sebagai fallback yang didokumentasikan beserta batas dukungan browsernya

### Requirement: Pengujian autentikasi dan isolasi

Sistem SHALL memiliki unit test dan integration test yang mencakup autentikasi, sesi, proteksi CSRF, dan penolakan akses lintas pengguna.

#### Scenario: Test autentikasi

- **WHEN** test suite dijalankan
- **THEN** register, login, logout, sesi aktif, dan validasi kredensial diuji tanpa kegagalan

#### Scenario: Test isolasi data

- **WHEN** test suite dijalankan
- **THEN** pembacaan, pembaruan, penghapusan, dan statistik lintas pengguna diuji dan ditolak sesuai aturan

#### Scenario: Test keamanan

- **WHEN** test suite dijalankan
- **THEN** password dan token tidak muncul pada respons atau log, serta request tanpa CSRF ditolak

#### Scenario: Test guard rute

- **WHEN** test suite dijalankan
- **THEN** kondisi route `/app`, `/login`, dan `/register` diuji untuk sesi tidak ada, sesi valid, login gagal, login berhasil, pengguna sudah login, sesi berakhir, dan logout
