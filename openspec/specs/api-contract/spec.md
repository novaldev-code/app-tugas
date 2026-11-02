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

Sistem SHALL memetakan kesalahan validasi ke HTTP `400`, data tidak ditemukan ke `404`, konflik seperti duplikasi nama ke `409`, dan kesalahan tak terduga ke `500`.

#### Scenario: Kesalahan validasi

- **WHEN** request berisi data yang tidak valid
- **THEN** API mengembalikan HTTP `400`

#### Scenario: Data tidak ditemukan

- **WHEN** request merujuk pada tugas atau kategori yang tidak ada
- **THEN** API mengembalikan HTTP `404`

#### Scenario: Konflik duplikasi

- **WHEN** request membuat atau mengubah kategori menjadi nama yang sudah ada
- **THEN** API mengembalikan HTTP `409`

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
