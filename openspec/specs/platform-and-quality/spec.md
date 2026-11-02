# platform-and-quality Specification

## Purpose

Menetapkan batasan platform, kualitas, pengujian, persistensi, dan pengalaman pengguna untuk aplikasi Personal Task Manager MVP.

## Requirements

### Requirement: Platform lokal single-user

Sistem SHALL berjalan sebagai aplikasi web lokal untuk satu pengguna tanpa autentikasi dan dapat diakses tanpa login.

#### Scenario: Akses aplikasi lokal

- **WHEN** aplikasi dijalankan secara lokal
- **THEN** pengguna dapat membuka aplikasi dan menggunakan fitur tanpa login

#### Scenario: Tidak ada isolasi akun

- **WHEN** pengguna menggunakan aplikasi
- **THEN** tidak ada konsep kepemilikan akun atau isolasi data antar-pengguna

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

Sistem SHALL menyimpan tugas dan kategori secara persisten sehingga data tetap tersedia setelah server restart.

#### Scenario: Restart server

- **WHEN** server dijalankan ulang setelah data dibuat
- **THEN** tugas dan kategori yang sudah ada tetap tersedia

### Requirement: Pengujian otomatis

Sistem SHALL memiliki unit test dan integration test yang dapat dijalankan, tanpa gate minimum coverage.

#### Scenario: Menjalankan test suite

- **WHEN** test suite dijalankan
- **THEN** unit test dan integration test berjalan, dan tidak ada kegagalan karena gate coverage

### Requirement: Migrasi database bernomor

Sistem SHALL menerapkan migrasi database menggunakan file SQL bernomor berurutan.

#### Scenario: Database baru

- **WHEN** database baru dibuat
- **THEN** migrasi diterapkan secara berurutan sesuai nomor

### Requirement: Teknologi aplikasi

Sistem SHALL menggunakan React + Vite untuk frontend, Node.js + Express untuk backend, dan SQLite dengan driver `better-sqlite3` untuk penyimpanan data.

#### Scenario: Menjalankan stack aplikasi

- **WHEN** aplikasi dijalankan secara lokal
- **THEN** frontend React + Vite dan backend Express dapat digunakan bersama

#### Scenario: Penyimpanan data

- **WHEN** tugas atau kategori disimpan
- **THEN** data tersimpan pada database SQLite
