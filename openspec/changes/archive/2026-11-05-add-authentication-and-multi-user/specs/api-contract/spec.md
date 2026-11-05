# Spec Delta

## MODIFIED Requirements

### Requirement: Pemetaan HTTP status error

Sistem SHALL memetakan kesalahan validasi ke HTTP `400`, data tidak ditemukan ke `404`, konflik seperti duplikasi nama atau email ke `409`, sesi tidak valid ke `401`, kegagalan CSRF ke `403`, percobaan autentikasi berlebih ke `429`, dan kesalahan tak terduga ke `500`.

#### Scenario: Kesalahan validasi

- **WHEN** request berisi data yang tidak valid
- **THEN** API mengembalikan HTTP `400`

#### Scenario: Data tidak ditemukan

- **WHEN** request merujuk pada tugas atau kategori yang tidak ada atau bukan milik pengguna
- **THEN** API mengembalikan HTTP `404`

#### Scenario: Konflik duplikasi

- **WHEN** request membuat atau mengubah kategori menjadi nama yang sudah ada, atau mendaftar dengan email yang sudah terdaftar
- **THEN** API mengembalikan HTTP `409`

#### Scenario: Sesi tidak valid

- **WHEN** request ke endpoint data tidak membawa sesi yang valid
- **THEN** API mengembalikan HTTP `401`

#### Scenario: Kegagalan CSRF

- **WHEN** request mutasi terautentikasi tidak membawa token CSRF yang cocok
- **THEN** API mengembalikan HTTP `403` tanpa mengubah data

#### Scenario: Percobaan autentikasi berlebih

- **WHEN** percobaan login atau register melebihi batas yang diizinkan
- **THEN** API mengembalikan HTTP `429` dengan envelope error dan pesan generik

#### Scenario: Kesalahan tak terduga

- **WHEN** terjadi kesalahan internal yang tidak terduga
- **THEN** API mengembalikan HTTP `500`

## ADDED Requirements

### Requirement: Respons endpoint autentikasi

Endpoint autentikasi SHALL memakai envelope sukses dan gagal yang sama dengan API lain serta SHALL NOT memuat password, hash password, atau token sesi pada body respons.

#### Scenario: Registrasi berhasil

- **WHEN** registrasi valid diselesaikan
- **THEN** API mengembalikan `201` dengan `{ success: true, data }` dan cookie sesi

#### Scenario: Login dan sesi aktif berhasil

- **WHEN** login atau permintaan sesi aktif berhasil
- **THEN** API mengembalikan `200` dengan `{ success: true, data }` berisi identitas pengguna dan token CSRF

#### Scenario: Logout berhasil

- **WHEN** logout diselesaikan
- **THEN** API mengembalikan `200` dengan `{ success: true, data }` dan cookie sesi dihapus

#### Scenario: Autentikasi gagal

- **WHEN** kredensial salah, email duplikat, atau input tidak valid
- **THEN** API memakai envelope `{ success: false, message, errors }` dengan status yang sesuai

#### Scenario: Tanpa data sensitif

- **WHEN** respons autentikasi dihasilkan
- **THEN** body tidak memuat password, hash password, atau nilai token sesi
