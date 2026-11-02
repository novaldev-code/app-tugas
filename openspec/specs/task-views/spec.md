# task-views Specification

## Purpose

Menyediakan Task List dan Kanban dengan grouping, urutan, pencarian, filter, sort, drag-and-drop, serta state tampilan yang konsisten dalam Bahasa Indonesia.

## Requirements

### Requirement: Grouping Task List

Sistem SHALL menampilkan Task List dalam kelompok kategori yang memiliki tugas, menempatkan setiap tugas tepat pada satu kelompok, dan tidak menampilkan kelompok kosong. `Tanpa Kategori` hanya ditampilkan jika ada tugas dengan `category_id = NULL`.

#### Scenario: Setiap tugas berada di satu kelompok

- **WHEN** Task List ditampilkan
- **THEN** setiap tugas muncul tepat pada satu kelompok kategori atau kelompok `Tanpa Kategori`

#### Scenario: Urutan kelompok kategori

- **WHEN** Task List ditampilkan
- **THEN** kelompok mengikuti urutan `Pribadi`, `Pekerjaan`, `Belajar`, kategori tambahan alfabetis, lalu `Tanpa Kategori`

#### Scenario: Kelompok kategori kosong

- **WHEN** sebuah kategori tidak memiliki tugas
- **THEN** kelompok kategori tersebut tidak ditampilkan

#### Scenario: Tanpa Kategori tanpa tugas

- **WHEN** tidak ada tugas dengan `category_id = NULL`
- **THEN** kelompok `Tanpa Kategori` tidak ditampilkan

#### Scenario: Tanpa Kategori memiliki tugas

- **WHEN** ada tugas dengan `category_id = NULL`
- **THEN** kelompok `Tanpa Kategori` ditampilkan di posisi terakhir

#### Scenario: Filter kategori aktif

- **WHEN** pengguna memilih satu kategori pada filter
- **THEN** Task List hanya menampilkan kelompok kategori yang dipilih

### Requirement: Kolom Kanban dan drag-and-drop

Sistem SHALL menampilkan Kanban dengan tiga kolom status, mengizinkan perubahan status melalui drag-and-drop mouse, dan tidak menyimpan urutan manual.

#### Scenario: Tiga kolom status

- **WHEN** Kanban dibuka tanpa filter status
- **THEN** kolom `Todo`, `In Progress`, dan `Done` tampil

#### Scenario: Drag-and-drop mouse

- **WHEN** pengguna menyeret tugas dari kolom `Todo` ke `In Progress` menggunakan mouse
- **THEN** status tugas berubah menjadi `In Progress` dan tersimpan

#### Scenario: Tidak ada urutan manual

- **WHEN** pengguna selesai melakukan drag-and-drop
- **THEN** tidak ada urutan manual yang disimpan; urutan kolom tetap mengikuti aturan sort

#### Scenario: Keyboard bukan MVP

- **WHEN** pengguna hanya menggunakan keyboard
- **THEN** drag-and-drop Kanban tidak disediakan pada MVP

### Requirement: Filter status Kanban

Sistem SHALL menampilkan hanya kolom status yang dipilih ketika filter status aktif, dan menyembunyikan kolom status lainnya.

#### Scenario: Filter status Todo

- **WHEN** pengguna memilih filter status `Todo` di Kanban
- **THEN** hanya kolom `Todo` yang tampil, sedangkan `In Progress` dan `Done` disembunyikan

#### Scenario: Tanpa filter status

- **WHEN** pengguna tidak memilih filter status di Kanban
- **THEN** ketiga kolom status tampil

### Requirement: Pencarian tugas

Sistem SHALL mencari teks pada judul dan deskripsi tugas secara case-insensitive untuk karakter ASCII di Task List dan Kanban, serta SHALL menangani tugas tanpa deskripsi tanpa error.

#### Scenario: Pencarian judul

- **WHEN** pengguna mencari `laporan` dan ada tugas berjudul mengandung `laporan`
- **THEN** tugas tersebut tampil

#### Scenario: Pencarian deskripsi

- **WHEN** pengguna mencari `anggaran` dan ada tugas dengan deskripsi mengandung `anggaran`
- **THEN** tugas tersebut tampil

#### Scenario: Pencarian case-insensitive

- **WHEN** pengguna mencari `LAPORAN`
- **THEN** tugas dengan judul `laporan` tetap cocok untuk karakter ASCII

#### Scenario: Tugas tanpa deskripsi

- **WHEN** pengguna mencari teks dan terdapat tugas tanpa deskripsi
- **THEN** pencarian tidak error dan tidak salah mencocokkan deskripsi kosong

#### Scenario: Pencarian di Kanban

- **WHEN** pengguna mencari teks di Kanban
- **THEN** pencarian diterapkan pada tugas di semua kolom yang tampil

### Requirement: Filter single-select dan AND

Sistem SHALL menggunakan single-select untuk filter kategori, status, dan prioritas di Task List dan Kanban, menggabungkan filter dari dimensi berbeda dengan AND, dan mengganti nilai lama pada dimensi yang sama ketika pengguna memilih nilai baru.

#### Scenario: Mengganti kategori terpilih

- **WHEN** pengguna memilih kategori A lalu memilih kategori B
- **THEN** hanya kategori B yang aktif

#### Scenario: Mengganti status terpilih

- **WHEN** pengguna memilih status `Todo` lalu memilih `Done`
- **THEN** hanya status `Done` yang aktif

#### Scenario: Mengganti prioritas terpilih

- **WHEN** pengguna memilih prioritas `High` lalu memilih `Urgent`
- **THEN** hanya prioritas `Urgent` yang aktif

#### Scenario: Kombinasi beberapa dimensi

- **WHEN** pengguna memilih kategori B, status `Todo`, dan prioritas `High`
- **THEN** hanya tugas yang memenuhi ketiga filter tersebut yang tampil

#### Scenario: Filter kategori dengan grouping

- **WHEN** filter kategori aktif dan Task List menggunakan grouping
- **THEN** grouping tetap bekerja dan hanya menampilkan kelompok yang dipilih

### Requirement: Filter Tanpa Kategori

Sistem SHALL menyediakan pilihan filter `Tanpa Kategori` di Task List dan Kanban untuk menampilkan tugas dengan `category_id = NULL`.

#### Scenario: Tanpa Kategori di Task List

- **WHEN** pengguna memilih filter `Tanpa Kategori` di Task List
- **THEN** hanya tugas dengan `category_id = NULL` yang tampil

#### Scenario: Tanpa Kategori digabung filter lain

- **WHEN** pengguna memilih `Tanpa Kategori` dan status `Todo`
- **THEN** hanya tugas dengan `category_id = NULL` dan status `Todo` yang tampil

#### Scenario: Tanpa Kategori di Kanban

- **WHEN** pengguna memilih filter `Tanpa Kategori` di Kanban
- **THEN** hanya tugas dengan `category_id = NULL` yang tampil pada kolom yang terlihat

### Requirement: Mode sort tugas

Sistem SHALL menyediakan hanya dua mode sort, yaitu `created_at DESC` dan `deadline ASC` dengan deadline `NULL` di urutan terakhir, menggunakan tie-breaker `id DESC`, tanpa opsi pembalikan arah, dan backend SHALL menjadi sumber kebenaran urutan.

#### Scenario: Sort default

- **WHEN** pengguna membuka Task List atau Kanban tanpa memilih mode sort
- **THEN** urutan menggunakan `created_at DESC`

#### Scenario: Tie-breaker created_at

- **WHEN** dua tugas memiliki `created_at` identik
- **THEN** tugas dengan `id` lebih besar tampil lebih dulu

#### Scenario: Sort deadline

- **WHEN** pengguna memilih sort deadline
- **THEN** urutan menggunakan `deadline ASC` dan semua deadline `NULL` berada setelah deadline non-`NULL`

#### Scenario: Tie-breaker deadline

- **WHEN** dua tugas memiliki deadline yang sama atau sama-sama `NULL`
- **THEN** urutan menggunakan `created_at DESC` lalu `id DESC` sebagai tie-breaker

#### Scenario: Tidak ada reverse sort

- **WHEN** pengguna mencari opsi pembalik arah sort
- **THEN** opsi tersebut tidak tersedia pada MVP

#### Scenario: Urutan mengikuti backend

- **WHEN** backend mengembalikan urutan tugas tertentu
- **THEN** Task List dan Kanban menampilkan urutan yang sama tanpa re-sort di frontend

#### Scenario: Sort di dalam kelompok dan kolom

- **WHEN** mode sort diterapkan pada Task List bergrouping atau Kanban berkolom
- **THEN** sort diterapkan di dalam setiap kelompok atau kolom

### Requirement: Tugas Done tetap tampil

Sistem SHALL tetap menampilkan tugas berstatus `Done` pada Task List secara default.

#### Scenario: Task List tanpa filter status

- **WHEN** Task List dibuka tanpa filter status
- **THEN** tugas `Done` tetap tampil

### Requirement: State kosong, loading, dan error

Sistem SHALL menampilkan state loading, kosong, dan error yang jelas pada Task List dan Kanban.

#### Scenario: Belum ada tugas

- **WHEN** belum ada tugas
- **THEN** empty state dan tombol tambah tugas tampil dalam Bahasa Indonesia

#### Scenario: Data sedang dimuat

- **WHEN** data sedang dimuat
- **THEN** indikator loading tampil

#### Scenario: Gagal memuat data

- **WHEN** pemuatan data gagal
- **THEN** pesan error yang jelas tampil

### Requirement: State pencarian dan filter tidak persisten

Sistem SHALL tidak menyimpan state pencarian, filter, dan sort antar-sesi atau di `localStorage`, SHALL memulai sesi baru tanpa filter aktif, dan SHALL mereset state filter ketika berpindah view.

#### Scenario: Sesi baru

- **WHEN** pengguna membuka sesi baru
- **THEN** pencarian kosong, tidak ada filter aktif, dan sort menggunakan `created_at DESC`

#### Scenario: Tanpa localStorage

- **WHEN** pengguna mengubah pencarian, filter, atau sort
- **THEN** state tersebut tidak disimpan di `localStorage`

#### Scenario: Berpindah view

- **WHEN** pengguna berpindah antara Task List dan Kanban dalam satu sesi
- **THEN** state filter masing-masing view tidak dibagi dan direset per view

#### Scenario: Reload halaman

- **WHEN** pengguna memuat ulang halaman
- **THEN** pencarian, filter, dan sort kembali ke nilai default
