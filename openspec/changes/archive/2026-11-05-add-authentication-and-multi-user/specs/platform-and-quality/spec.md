# Spec Delta

## REMOVED Requirements

### Requirement: Platform lokal single-user

**Reason**: Aplikasi kini mendukung banyak pengguna dengan autentikasi dan isolasi data; model single-user tanpa login tidak lagi valid untuk deployment.

**Migration**: Gunakan capability `user-auth` dan `multi-user-isolation`. Workspace lokal tetap dapat dipakai setelah pengguna mendaftar dan login. Data lama tanpa pemilik tetap dipertahankan dan tidak terlihat sampai ditetapkan pemiliknya.

### Requirement: Persiapan ownership tanpa authentication

**Reason**: Kolom `user_id` sekarang dipakai untuk autentikasi, ownership filter, dan isolasi data, sehingga requirement persiapan tanpa authentication tidak lagi berlaku.

**Migration**: Gunakan requirement pada `multi-user-isolation` dan `user-auth`; data legacy ber-`user_id` NULL tetap dipertahankan dan tidak terlihat sampai ditetapkan pemiliknya.

### Requirement: Batas deployment backend tanpa autentikasi

**Reason**: Backend kini memiliki autentikasi dan isolasi data, sehingga larangan mengekspos backend tanpa authentication digantikan oleh batas keamanan multi-user.

**Migration**: Gunakan requirement `Batas keamanan deployment multi-user` dan `Topologi cookie sesi`; backend hanya diekspos dengan autentikasi aktif.

### Requirement: Batas deployment publik

**Reason**: Deployment publik kini dapat menyajikan workspace bagi pengguna terautentikasi; pembatasan bahwa deployment publik hanya landing sudah tidak berlaku.

**Migration**: Gunakan `user-auth` untuk guard `/app`, `multi-user-isolation` untuk isolasi data, dan `public-landing` untuk akses autentikasi dari landing.

## MODIFIED Requirements

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

## ADDED Requirements

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
