# Spec Delta

## Purpose

Mengelola siklus hidup tugas pribadi, termasuk field wajib dan opsional, status, prioritas, deadline, overdue, validasi, serta penghapusan permanen.

## ADDED Requirements

### Requirement: Pembuatan tugas

Sistem SHALL memungkinkan pengguna membuat tugas dengan judul wajib serta deskripsi, kategori, prioritas, deadline, dan status opsional.

#### Scenario: Membuat tugas valid

- **WHEN** pengguna menyimpan tugas dengan judul valid
- **THEN** tugas tersimpan dan muncul di Task List

#### Scenario: Deskripsi kosong

- **WHEN** pengguna menyimpan tugas dengan deskripsi kosong
- **THEN** tugas tersimpan dengan deskripsi `NULL`

#### Scenario: Tanpa kategori

- **WHEN** pengguna menyimpan tugas tanpa memilih kategori
- **THEN** tugas tersimpan dengan `category_id = NULL`

#### Scenario: Tanpa status

- **WHEN** pengguna menyimpan tugas tanpa memilih status
- **THEN** status tugas tersimpan sebagai `Todo`

#### Scenario: Memilih kategori

- **WHEN** pengguna memilih satu kategori saat membuat atau mengubah tugas
- **THEN** tugas tersebut hanya terhubung ke satu kategori

### Requirement: Pembaruan tugas

Sistem SHALL memungkinkan pengguna mengubah judul, deskripsi, kategori, prioritas, deadline, dan status tugas yang sudah ada.

#### Scenario: Mengubah field tugas

- **WHEN** pengguna mengubah satu atau lebih field tugas lalu menyimpan
- **THEN** seluruh perubahan tersimpan dan ditampilkan kembali

### Requirement: Transisi status tugas

Sistem SHALL membatasi status tugas pada `Todo`, `In Progress`, dan `Done`, serta mengizinkan tugas `Done` kembali ke `Todo` atau `In Progress`.

#### Scenario: Mengembalikan tugas Done ke Todo

- **WHEN** pengguna mengubah tugas berstatus `Done` menjadi `Todo`
- **THEN** status tersimpan sebagai `Todo` dan perhitungan overdue diterapkan kembali

#### Scenario: Mengembalikan tugas Done ke In Progress

- **WHEN** pengguna mengubah tugas berstatus `Done` menjadi `In Progress`
- **THEN** status tersimpan sebagai `In Progress`

#### Scenario: Menolak status di luar daftar

- **WHEN** pengguna atau klien mengirim status selain ketiga nilai yang diizinkan
- **THEN** sistem menolak perubahan tersebut

### Requirement: Nilai prioritas tugas

Sistem SHALL membatasi prioritas tugas pada `Low`, `Medium`, `High`, dan `Urgent`.

#### Scenario: Menolak prioritas tidak valid

- **WHEN** pengguna atau klien mengirim prioritas di luar empat nilai yang diizinkan
- **THEN** sistem menolak perubahan tersebut

### Requirement: Deadline dan overdue

Sistem SHALL menyimpan deadline sebagai tanggal opsional tanpa jam dan menandai tugas overdue hanya jika deadline sebelum tanggal lokal hari ini dan status bukan `Done`.

#### Scenario: Deadline tersimpan sebagai tanggal

- **WHEN** pengguna mengisi deadline
- **THEN** deadline tersimpan sebagai tanggal murni tanpa komponen jam

#### Scenario: Deadline dikosongkan

- **WHEN** pengguna tidak mengisi atau mengosongkan deadline
- **THEN** tugas tersimpan tanpa deadline

#### Scenario: Deadline kemarin dan belum Done

- **WHEN** deadline tugas adalah kemarin dan status bukan `Done`
- **THEN** indikator overdue tampil

#### Scenario: Deadline hari ini

- **WHEN** deadline tugas adalah hari ini dan status apa pun
- **THEN** tugas tidak ditandai overdue

#### Scenario: Deadline kemarin dan sudah Done

- **WHEN** deadline tugas adalah kemarin dan status `Done`
- **THEN** tugas tidak ditandai overdue

#### Scenario: Tanpa deadline

- **WHEN** tugas tidak memiliki deadline
- **THEN** tugas tidak pernah ditandai overdue

### Requirement: Penghapusan tugas

Sistem SHALL menghapus tugas secara permanen hanya setelah pengguna mengonfirmasi dialog penghapusan.

#### Scenario: Membatalkan penghapusan

- **WHEN** dialog penghapusan tugas terbuka dan pengguna memilih `Batal`
- **THEN** tugas tetap ada dan tidak berubah

#### Scenario: Mengonfirmasi penghapusan

- **WHEN** dialog penghapusan tugas terbuka dan pengguna memilih `Hapus`
- **THEN** tugas hilang permanen dan tidak dapat dipulihkan

### Requirement: Validasi dan normalisasi judul

Sistem SHALL mewajibkan judul tugas 1-120 karakter setelah trim, menolak judul kosong atau whitespace-only, dan menyimpan judul dalam bentuk ter-trim.

#### Scenario: Judul pada batas panjang

- **WHEN** pengguna menyimpan judul sepanjang 1 atau 120 karakter setelah trim
- **THEN** judul diterima

#### Scenario: Judul di luar batas panjang

- **WHEN** pengguna menyimpan judul kosong atau lebih dari 120 karakter
- **THEN** judul ditolak

#### Scenario: Judul hanya whitespace

- **WHEN** pengguna menyimpan judul yang hanya berisi spasi
- **THEN** frontend dan backend menolak, serta database mencegah penyimpanan

#### Scenario: Judul dengan spasi di tepi

- **WHEN** pengguna menyimpan judul `"  Laporan  "`
- **THEN** judul tersimpan sebagai `"Laporan"`

### Requirement: Validasi dan penyimpanan deskripsi

Sistem SHALL membatasi deskripsi maksimum 1000 karakter, menyimpan deskripsi kosong sebagai `NULL`, dan memperlakukan deskripsi sebagai plain text.

#### Scenario: Deskripsi pada batas panjang

- **WHEN** pengguna menyimpan deskripsi kosong atau sepanjang 1000 karakter
- **THEN** deskripsi diterima

#### Scenario: Deskripsi melebihi batas

- **WHEN** pengguna menyimpan deskripsi lebih dari 1000 karakter
- **THEN** deskripsi ditolak

#### Scenario: Deskripsi berisi markup

- **WHEN** pengguna menyimpan deskripsi yang mengandung markup
- **THEN** markup disimpan dan ditampilkan sebagai plain text, bukan dirender sebagai HTML

### Requirement: Validasi berlapis

Sistem SHALL menegakkan aturan validasi tugas di frontend, backend, dan database.

#### Scenario: Frontend dilewati

- **WHEN** request berisi payload tugas yang tidak valid dikirim langsung ke backend
- **THEN** backend menolak request tersebut

#### Scenario: Backend dilewati

- **WHEN** data tugas yang tidak valid dimasukkan langsung ke database
- **THEN** constraint database menolak data tersebut
