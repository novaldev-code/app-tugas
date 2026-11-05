# Spec Delta

## MODIFIED Requirements

### Requirement: Seed kategori bawaan

Sistem SHALL membuat kategori bawaan `Pribadi`, `Pekerjaan`, dan `Belajar` untuk setiap pengguna baru saat registrasi, dan SHALL NOT membuat seed global yang terlihat oleh semua pengguna.

#### Scenario: Inisialisasi pertama

- **WHEN** pengguna baru berhasil mendaftar
- **THEN** pengguna tersebut memiliki kategori `Pribadi`, `Pekerjaan`, dan `Belajar` sebagai kategori bawaan

#### Scenario: Restart setelah inisialisasi

- **WHEN** pengguna login atau aplikasi dijalankan ulang
- **THEN** kategori bawaan miliknya tidak diduplikasi dan tidak di-seed ulang

#### Scenario: Pengguna kedua

- **WHEN** pengguna lain mendaftar
- **THEN** pengguna tersebut memperoleh kategori bawaannya sendiri dan tidak melihat kategori bawaan pengguna pertama

#### Scenario: Seed global lama

- **WHEN** database masih memiliki kategori seed lama dengan `user_id` NULL
- **THEN** kategori tersebut tidak terlihat oleh pengguna mana pun

### Requirement: Keunikan nama kategori

Sistem SHALL mewajibkan nama kategori unik secara case-insensitive dalam lingkup kategori milik pengguna yang sama dan mengecualikan record kategori itu sendiri saat pembaruan.

#### Scenario: Membuat nama duplikat

- **WHEN** pengguna memiliki kategori `Belajar` lalu membuat kategori `belajar`
- **THEN** pembuatan ditolak sebagai duplikat

#### Scenario: Mengubah kategori lain menjadi duplikat

- **WHEN** pengguna memiliki kategori `Belajar` lalu mengubah kategori lain miliknya menjadi `BELAJAR`
- **THEN** pembaruan ditolak

#### Scenario: Mengubah kapitalisasi kategori sendiri

- **WHEN** pengguna mengubah kapitalisasi nama kategori miliknya tanpa mengubah identitasnya
- **THEN** pembaruan diterima

#### Scenario: Nama sama pada pengguna berbeda

- **WHEN** dua pengguna berbeda sama-sama membuat kategori bernama `Belajar`
- **THEN** kedua kategori diterima karena keunikan dihitung per pengguna
