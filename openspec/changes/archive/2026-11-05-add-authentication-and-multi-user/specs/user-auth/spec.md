# Spec Delta

## Purpose

Menyediakan identitas akun dan siklus sesi yang aman sehingga pengguna dapat mendaftar, login, mempertahankan sesi, dan logout sebelum mengakses data workspace.

## ADDED Requirements

### Requirement: Registrasi akun

Sistem SHALL mengizinkan pendaftaran akun dengan email unik dan password yang memenuhi kebijakan, serta membuat sesi login dan kategori bawaan milik pengguna baru dalam satu operasi.

#### Scenario: Registrasi valid

- **WHEN** pengguna mendaftar dengan email yang belum terdaftar dan password valid
- **THEN** akun, kategori bawaan, dan sesi dibuat, respons `201` tidak memuat password, dan cookie sesi dikirim

#### Scenario: Email sudah terdaftar

- **WHEN** pengguna mendaftar dengan email yang sudah terdaftar tanpa memandang kapitalisasi
- **THEN** API mengembalikan `409` dan tidak membuat akun baru

#### Scenario: Input registrasi tidak valid

- **WHEN** email atau password tidak memenuhi aturan validasi
- **THEN** API mengembalikan `400` dengan pesan error per field dalam Bahasa Indonesia

### Requirement: Login

Sistem SHALL mengautentikasi pengguna dengan email dan password yang benar, dan SHALL menolak kredensial salah dengan pesan generik yang tidak membocorkan keberadaan email.

#### Scenario: Login berhasil

- **WHEN** pengguna login dengan email dan password yang cocok
- **THEN** API mengembalikan `200`, data pengguna, token CSRF, dan cookie sesi baru

#### Scenario: Password salah

- **WHEN** pengguna login dengan password yang salah
- **THEN** API mengembalikan `401` dengan pesan generik yang sama seperti email tidak terdaftar

#### Scenario: Email tidak terdaftar

- **WHEN** pengguna login dengan email yang tidak terdaftar
- **THEN** API mengembalikan `401` dengan pesan generik yang sama seperti password salah

#### Scenario: Email tidak peka kapitalisasi

- **WHEN** pengguna login memakai kapitalisasi email yang berbeda dari saat registrasi
- **THEN** autentikasi tetap berhasil

### Requirement: Logout

Sistem SHALL mengakhiri sesi aktif, menghapus catatan sesi dari penyimpanan, dan menghapus cookie sesi dari browser.

#### Scenario: Logout dengan sesi valid

- **WHEN** pengguna terautentikasi memanggil logout
- **THEN** sesi dihapus, cookie sesi dikedaluwarsakan, dan token sesi tersebut tidak dapat dipakai lagi

#### Scenario: Logout tanpa sesi valid

- **WHEN** logout dipanggil tanpa sesi valid atau dengan sesi yang sudah berakhir
- **THEN** API tetap mengembalikan sukses idempoten dan menghapus cookie sesi

### Requirement: Sesi aktif

Sistem SHALL menyediakan endpoint yang mengembalikan identitas pengguna dan token CSRF untuk sesi valid, dan SHALL mengembalikan `401` bila sesi tidak ada atau kedaluwarsa.

#### Scenario: Sesi valid

- **WHEN** pengguna meminta data sesi aktif dengan cookie yang valid
- **THEN** API mengembalikan `200` berisi ID, email, dan token CSRF pengguna

#### Scenario: Sesi tidak valid

- **WHEN** permintaan data sesi aktif tidak membawa cookie atau cookie sudah kedaluwarsa
- **THEN** API mengembalikan `401`

### Requirement: Sesi opaque dan cookie

Token sesi SHALL berupa nilai acak berentropi tinggi, disimpan hanya sebagai hash, dikirim melalui cookie `HttpOnly`, dan memiliki masa berlaku terbatas yang dapat dicabut.

#### Scenario: Atribut cookie

- **WHEN** sesi dibuat pada deployment HTTPS
- **THEN** cookie sesi memakai `HttpOnly`, `Secure`, `SameSite` sesuai topologi first-party (`Lax`/`Strict`), `Path=/`, dan `Max-Age` sesuai konfigurasi; `SameSite=None` hanya dipakai sebagai fallback cross-site

#### Scenario: Token tidak terekspos

- **WHEN** sesi dibuat atau dibaca
- **THEN** token sesi tidak muncul pada body respons, penyimpanan browser non-HttpOnly, atau log

#### Scenario: Sesi kedaluwarsa

- **WHEN** pengguna memakai sesi yang sudah melewati masa berlaku
- **THEN** API mengembalikan `401` dan sesi tidak dapat dipakai lagi

#### Scenario: Rotasi saat login

- **WHEN** pengguna login
- **THEN** token sesi baru dibuat dan token sebelumnya tidak dipakai ulang

### Requirement: Keamanan password

Password SHALL di-hash dengan algoritma password-hashing bersalt yang lambat, SHALL tidak pernah dikembalikan API atau dicatat log, dan SHALL memiliki panjang 8-128 karakter.

#### Scenario: Password disimpan sebagai hash

- **WHEN** akun dibuat atau password diubah
- **THEN** penyimpanan hanya berisi hash password, bukan password plaintext

#### Scenario: Verifikasi password

- **WHEN** pengguna login
- **THEN** sistem memverifikasi password terhadap hash memakai perbandingan yang aman

#### Scenario: Panjang password tidak valid

- **WHEN** password kurang dari 8 atau lebih dari 128 karakter
- **THEN** API menolak dengan `400` dan pesan validasi password

#### Scenario: Data sensitif tidak bocor

- **WHEN** respons atau log autentikasi dihasilkan
- **THEN** password, hash password, dan token sesi tidak tercantum

### Requirement: Proteksi CSRF

Semua request yang mengubah state SHALL dilindungi CSRF: register/login memerlukan Origin allowlist dan `Content-Type: application/json`, sedangkan logout dan seluruh mutasi data terautentikasi memerlukan token CSRF yang cocok dengan sesi.

#### Scenario: Register atau login dari origin valid

- **WHEN** register atau login dikirim dari origin yang diizinkan dengan `Content-Type: application/json`
- **THEN** request diproses sesuai kontrak

#### Scenario: Register atau login dari origin tidak valid

- **WHEN** register atau login tidak membawa header `Origin` atau origin tidak ada pada allowlist
- **THEN** API mengembalikan `403` dan tidak membuat sesi

#### Scenario: Token CSRF valid pada mutasi

- **WHEN** mutasi tugas atau kategori membawa cookie sesi dan header token CSRF yang cocok
- **THEN** request diproses sesuai kontrak endpoint

#### Scenario: Token CSRF tidak ada atau salah

- **WHEN** mutasi terautentikasi tidak membawa token CSRF atau token tidak cocok
- **THEN** API mengembalikan `403` dan tidak mengubah data

#### Scenario: Logout dengan CSRF valid

- **WHEN** logout dengan sesi valid membawa token CSRF yang cocok
- **THEN** sesi dihapus dan cookie sesi dikedaluwarsakan

#### Scenario: Logout tanpa CSRF valid

- **WHEN** logout dengan sesi valid tidak membawa token CSRF atau token tidak cocok
- **THEN** API mengembalikan `403` dan sesi tetap aktif

#### Scenario: Origin tidak diizinkan pada mutasi

- **WHEN** request mutasi berasal dari origin yang tidak ada pada allowlist
- **THEN** CORS dan pemeriksaan origin menolak request

### Requirement: Pembatasan percobaan autentikasi

Sistem SHALL membatasi percobaan login dan register secara best-effort dan SHALL menolak percobaan berlebih dengan `429` generik tanpa mengungkap status akun.

#### Scenario: Dalam batas percobaan

- **WHEN** jumlah percobaan login atau register berada dalam batas
- **THEN** request diproses secara normal

#### Scenario: Melebihi batas percobaan

- **WHEN** jumlah percobaan dari kombinasi IP dan email melebihi batas pada jendela waktu
- **THEN** API mengembalikan `429` dengan pesan generik

#### Scenario: Tanpa kebocoran status akun

- **WHEN** respons pembatasan dikembalikan
- **THEN** respons tidak mengungkap apakah email terdaftar atau password benar

### Requirement: Presentasi autentikasi

Antarmuka SHALL menyediakan halaman register dan login berbahasa Indonesia dengan validasi inline, state loading dan error, serta gaya visual yang konsisten dengan workspace.

#### Scenario: Form register dan login

- **WHEN** pengguna membuka halaman register atau login
- **THEN** form menampilkan field yang diperlukan, aksi kirim, dan tautan ke halaman autentikasi lainnya

#### Scenario: Validasi inline

- **WHEN** input autentikasi tidak valid
- **THEN** pesan validasi tampil dekat field terkait tanpa menghapus input pengguna

#### Scenario: Login berhasil

- **WHEN** login atau register berhasil
- **THEN** pengguna diarahkan ke `/app` dan state loading berhenti

#### Scenario: Login gagal

- **WHEN** login gagal karena kredensial salah atau error validasi
- **THEN** pengguna tetap berada di `/login`, pesan error tampil, dan tidak ada pengarahan ke `/app`

#### Scenario: Register gagal

- **WHEN** registrasi gagal karena email duplikat atau error validasi
- **THEN** pengguna tetap berada di `/register`, pesan error tampil, dan tidak ada pengarahan ke `/app`

#### Scenario: Aksi logout

- **WHEN** pengguna terautentikasi membuka shell workspace
- **THEN** tersedia kontrol logout yang konsisten dengan design system

### Requirement: Guard rute workspace

Workspace SHALL hanya dapat diakses dengan sesi valid; guard client dan penolakan `401` backend SHALL sama-sama menegakkan aturan ini.

#### Scenario: Akses tanpa sesi

- **WHEN** pengguna membuka `/app` tanpa sesi valid
- **THEN** pengguna diarahkan ke halaman login dan workspace tidak di-mount

#### Scenario: Sesi berakhir saat digunakan

- **WHEN** API mengembalikan `401` karena sesi berakhir
- **THEN** aplikasi membersihkan state sesi dan mengarahkan pengguna ke login

#### Scenario: Pengguna terautentikasi membuka halaman login atau register

- **WHEN** pengguna dengan sesi valid membuka `/login` atau `/register`
- **THEN** pengguna diarahkan ke `/app` tanpa perlu login ulang

#### Scenario: Pemuatan sesi awal

- **WHEN** aplikasi memuat `/app` dan status sesi masih diperiksa
- **THEN** workspace menampilkan state loading dan tidak mengarahkan ke login sebelum pemeriksaan selesai

#### Scenario: Akses setelah logout

- **WHEN** pengguna logout lalu membuka `/app`
- **THEN** sesi tidak valid dan pengguna diarahkan ke `/login`

#### Scenario: Backend tetap menolak tanpa sesi

- **WHEN** client memanggil endpoint data meskipun guard client dilewati
- **THEN** backend mengembalikan `401` dan tidak mengembalikan data
