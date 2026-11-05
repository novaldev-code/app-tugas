# api-contract Specification

## Purpose

Menetapkan kontrak respons API yang konsisten untuk operasi sukses dan gagal, termasuk bentuk payload dan pemetaan HTTP status.

## Requirements

### Requirement: Respons sukses API

Sistem SHALL mengembalikan respons sukses dengan bentuk `{ "success": true, "data": ... }`.

#### Scenario: Operasi berhasil

- **WHEN** operasi API berhasil diselesaikan
- **THEN** respons berisi `success: true` dan data hasil operasi pada field `data`

### Requirement: Respons error API

Sistem SHALL mengembalikan respons gagal dengan bentuk `{ "success": false, "message": "...", "errors": { ... } }`.

#### Scenario: Operasi gagal

- **WHEN** operasi API gagal
- **THEN** respons berisi `success: false`, pesan yang dapat dibaca, dan detail error per field jika ada

#### Scenario: Error validasi form

- **WHEN** request gagal karena validasi input
- **THEN** respons berisi `{success: false, message, errors}` dengan detail field yang tidak valid

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

### Requirement: Error validasi per field

Sistem SHALL menyertakan nama field dan pesan kesalahan pada objek `errors` untuk setiap input yang tidak valid.

#### Scenario: Beberapa field tidak valid

- **WHEN** request berisi lebih dari satu field yang tidak valid
- **THEN** objek `errors` memuat pesan untuk setiap field tersebut

#### Scenario: Pesan error dapat dibaca

- **WHEN** API mengembalikan error validasi
- **THEN** `message` dan pesan per field dapat ditampilkan kepada pengguna dalam Bahasa Indonesia

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
