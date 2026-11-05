# category-management Specification

## Purpose

Mengelola kategori tugas, termasuk kategori bawaan, identitas dan urutan yang stabil, keunikan nama, serta penghapusan kategori tanpa menghapus tugas.

## Requirements

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

### Requirement: Pembuatan kategori

Sistem SHALL memungkinkan pengguna membuat kategori dengan nama wajib 1-50 karakter setelah trim dan menolak nama kosong atau whitespace-only.

#### Scenario: Nama kategori pada batas panjang

- **WHEN** pengguna menyimpan nama kategori sepanjang 1 atau 50 karakter setelah trim
- **THEN** kategori diterima

#### Scenario: Nama kategori di luar batas panjang

- **WHEN** pengguna menyimpan nama kategori kosong atau lebih dari 50 karakter
- **THEN** kategori ditolak

#### Scenario: Nama kategori hanya whitespace

- **WHEN** pengguna menyimpan nama kategori yang hanya berisi spasi
- **THEN** frontend dan backend menolak, serta database mencegah penyimpanan

#### Scenario: Nama kategori dengan spasi di tepi

- **WHEN** pengguna menyimpan nama kategori `"  Belajar  "`
- **THEN** nama tersimpan sebagai `"Belajar"`

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

### Requirement: Identitas kategori bawaan

Sistem SHALL menyimpan identitas permanen untuk kategori bawaan melalui penanda bawaan dan urutan tetap, sehingga perubahan nama tidak mengubah identitas maupun posisinya.

#### Scenario: Rename kategori bawaan

- **WHEN** pengguna mengganti nama `Pribadi` menjadi `Keluarga` lalu melakukan restart
- **THEN** kategori tersebut tetap berada pada posisi pertama dan tetap dianggap kategori bawaan

#### Scenario: Kategori tambahan

- **WHEN** pengguna menambahkan kategori `Arsip`
- **THEN** kategori tersebut dianggap kategori tambahan dan tidak mengambil identitas kategori bawaan

### Requirement: Urutan kategori

Sistem SHALL menampilkan kategori dengan urutan `Pribadi`, `Pekerjaan`, `Belajar`, kategori tambahan secara alfabetis, lalu `Tanpa Kategori` di posisi terakhir, baik pada dropdown maupun grup Task List yang ditampilkan.

#### Scenario: Urutan lengkap kategori

- **WHEN** terdapat tiga kategori bawaan dan beberapa kategori tambahan
- **THEN** urutan tampilan adalah tiga kategori bawaan, kategori tambahan alfabetis, lalu `Tanpa Kategori`

#### Scenario: Urutan dropdown kategori

- **WHEN** pengguna membuka dropdown kategori
- **THEN** urutan pilihan mengikuti urutan kategori yang sama dengan grouping Task List

#### Scenario: Kategori tambahan di antara bawaan dan Tanpa Kategori

- **WHEN** pengguna menambahkan kategori `Arsip`
- **THEN** pada dropdown, `Arsip` tampil setelah tiga kategori bawaan dan sebelum `Tanpa Kategori`

### Requirement: Pembaruan kategori

Sistem SHALL memungkinkan pengguna mengubah nama kategori, termasuk kategori bawaan, tanpa penolakan khusus.

#### Scenario: Mengubah kategori bawaan

- **WHEN** pengguna mengubah nama kategori bawaan menjadi nama valid yang unik
- **THEN** perubahan tersimpan dan identitas kategori tetap dipertahankan

### Requirement: Penghapusan kategori

Sistem SHALL menghapus kategori hanya setelah pengguna mengonfirmasi dialog, dan SHALL mempertahankan tugas terkait dengan mengubah `category_id` menjadi `NULL`.

#### Scenario: Dialog konfirmasi hapus kategori

- **WHEN** pengguna memilih hapus pada kategori
- **THEN** dialog dengan pilihan `Batal` dan `Hapus` tampil

#### Scenario: Membatalkan hapus kategori

- **WHEN** dialog hapus kategori terbuka dan pengguna memilih `Batal`
- **THEN** kategori dan tugas terkait tidak berubah

#### Scenario: Mengonfirmasi hapus kategori

- **WHEN** dialog hapus kategori terbuka dan pengguna memilih `Hapus`
- **THEN** kategori terhapus dan semua tugas terkait memiliki `category_id = NULL`

#### Scenario: Menghapus kategori bawaan

- **WHEN** pengguna menghapus kategori bawaan setelah konfirmasi
- **THEN** kategori terhapus dan tugas terkait tetap ada dengan `category_id = NULL`

### Requirement: Kategori pengganti setelah penghapusan

Sistem SHALL memperlakukan kategori baru sebagai kategori tambahan ketika pengguna membuat ulang nama yang sama dengan kategori yang sudah dihapus.

#### Scenario: Membuat ulang nama kategori bawaan yang dihapus

- **WHEN** kategori bawaan `Pribadi` dihapus lalu pengguna membuat kategori baru bernama `Pribadi`
- **THEN** kategori baru dianggap kategori tambahan, bukan kategori bawaan, dan diurutkan secara alfabetis

### Requirement: Presentasi manajemen kategori

Sistem SHALL menampilkan kategori dalam daftar yang konsisten dengan badge bawaan, aksi ubah dan hapus, form inline, serta dialog konfirmasi.

#### Scenario: Baris kategori

- **WHEN** daftar kategori ditampilkan
- **THEN** setiap baris menampilkan nama kategori dan aksi Ubah serta Hapus yang konsisten dengan komponen primitif

#### Scenario: Badge bawaan

- **WHEN** kategori memiliki `is_default` bernilai benar
- **THEN** baris menampilkan badge Bawaan

#### Scenario: Inline edit

- **WHEN** pengguna memilih Ubah pada kategori
- **THEN** form inline tampil dengan aksi Simpan dan Batal yang konsisten

#### Scenario: Dialog hapus konsisten

- **WHEN** pengguna memilih Hapus pada kategori
- **THEN** dialog konfirmasi memakai primitif dan pengelolaan fokus yang sama dengan dialog tugas

#### Scenario: Layout sempit

- **WHEN** halaman kategori dibuka pada viewport sempit
- **THEN** baris dan form tersusun tanpa overflow horizontal

### Requirement: Presentasi validasi dan feedback kategori

Sistem SHALL menampilkan error validasi kategori secara inline serta feedback keberhasilan atau kegagalan operasi secara konsisten dengan design system.

#### Scenario: Error inline

- **WHEN** nama kategori tidak valid
- **THEN** pesan error tampil dekat field terkait tanpa menghilangkan input pengguna

#### Scenario: Operasi berhasil

- **WHEN** kategori berhasil dibuat, diubah, atau dihapus
- **THEN** toast sukses tampil dengan pesan Bahasa Indonesia

#### Scenario: Operasi gagal

- **WHEN** operasi kategori gagal
- **THEN** pesan error yang dapat dibaca tampil dan state sibuk berhenti

#### Scenario: Perilaku CRUD tidak berubah

- **WHEN** pengguna membuat, mengubah, atau menghapus kategori
- **THEN** aturan validasi, keunikan nama, urutan, dan perilaku hapus tetap sama seperti sebelumnya
