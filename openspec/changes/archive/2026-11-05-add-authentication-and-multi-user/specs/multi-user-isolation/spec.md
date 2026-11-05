# Spec Delta

## Purpose

Menjamin setiap pengguna hanya dapat mengakses, mengubah, dan melihat statistik atas data miliknya sendiri, serta memastikan data tanpa pemilik tidak bocor ke pengguna mana pun.

## ADDED Requirements

### Requirement: Autentikasi wajib untuk endpoint data

Seluruh endpoint `/api/*` kecuali health, register, dan login SHALL memerlukan sesi valid, dan request tanpa sesi SHALL ditolak sebelum menyentuh data.

#### Scenario: Request tanpa sesi

- **WHEN** endpoint data dipanggil tanpa cookie sesi valid
- **THEN** API mengembalikan `401` dan tidak membaca atau mengubah data

#### Scenario: Endpoint publik tetap tersedia

- **WHEN** `GET /api/health`, register, atau login dipanggil tanpa sesi
- **THEN** endpoint tersebut tetap dapat diakses sesuai kontraknya

### Requirement: Kepemilikan saat pembuatan data

Setiap tugas dan kategori baru SHALL disimpan dengan `user_id` pengguna yang sedang login, dan kategori yang dirujuk oleh tugas SHALL dimiliki oleh pengguna yang sama.

#### Scenario: Membuat tugas

- **WHEN** pengguna terautentikasi membuat tugas
- **THEN** tugas tersimpan dengan `user_id` pengguna tersebut

#### Scenario: Membuat kategori

- **WHEN** pengguna terautentikasi membuat kategori
- **THEN** kategori tersimpan dengan `user_id` pengguna tersebut

#### Scenario: Kategori milik pengguna lain

- **WHEN** pengguna membuat atau mengubah tugas dengan `category_id` milik pengguna lain
- **THEN** API menolak sebagai kategori tidak ditemukan dan tidak menyimpan perubahan

### Requirement: Filter kepemilikan pada pembacaan

Query daftar tugas, daftar kategori, dan statistik SHALL dibatasi pada `user_id` pengguna yang sedang login.

#### Scenario: Daftar tugas terisolasi

- **WHEN** pengguna meminta daftar tugas
- **THEN** respons hanya memuat tugas milik pengguna tersebut

#### Scenario: Daftar kategori terisolasi

- **WHEN** pengguna meminta daftar kategori
- **THEN** respons hanya memuat kategori milik pengguna tersebut

#### Scenario: Statistik terisolasi

- **WHEN** pengguna meminta statistik dashboard
- **THEN** total dan hitungan status/prioritas hanya berasal dari tugas milik pengguna tersebut

### Requirement: Otorisasi mutasi data

Pembaruan dan penghapusan SHALL hanya berhasil untuk tugas atau kategori milik pengguna yang login; data milik pengguna lain SHALL tidak berubah dan SHALL menghasilkan `404`.

#### Scenario: Mengubah data sendiri

- **WHEN** pengguna mengubah tugas atau kategori miliknya
- **THEN** perubahan tersimpan dan respons sukses dikembalikan

#### Scenario: Mengubah data pengguna lain

- **WHEN** pengguna mengubah tugas atau kategori milik pengguna lain
- **THEN** API mengembalikan `404` dan data pengguna lain tidak berubah

#### Scenario: Menghapus data pengguna lain

- **WHEN** pengguna menghapus tugas atau kategori milik pengguna lain
- **THEN** API mengembalikan `404` dan data pengguna lain tidak terhapus

### Requirement: Penanganan akses lintas pengguna

API SHALL membedakan `401` untuk request tanpa sesi valid dan `404` untuk data yang tidak ada atau bukan milik pengguna, serta SHALL NOT mengembalikan respons yang mengungkap keberadaan data pengguna lain.

#### Scenario: Tanpa sesi

- **WHEN** request data tidak memiliki sesi valid
- **THEN** API mengembalikan `401`

#### Scenario: Data bukan milik pengguna

- **WHEN** pengguna terautentikasi meminta data milik pengguna lain berdasarkan ID
- **THEN** API mengembalikan `404`

#### Scenario: Tanpa kebocoran kepemilikan

- **WHEN** API mengembalikan error akses lintas pengguna
- **THEN** body error tidak memuat pemilik, email, atau detail data pengguna lain

### Requirement: Data lama tanpa pemilik

Data yang sudah ada dengan `user_id` NULL SHALL dipertahankan tetapi SHALL NOT terlihat atau dapat diubah oleh pengguna mana pun sampai pemiliknya ditetapkan secara eksplisit oleh operator.

#### Scenario: Data lama tidak terlihat

- **WHEN** pengguna terautentikasi meminta daftar tugas, kategori, atau statistik
- **THEN** data ber-`user_id` NULL tidak disertakan

#### Scenario: Data lama tidak dapat diakses

- **WHEN** pengguna mengakses ID tugas atau kategori ber-`user_id` NULL
- **THEN** API mengembalikan `404`

#### Scenario: Tidak ada penugasan otomatis

- **WHEN** pengguna baru mendaftar
- **THEN** data lama ber-`user_id` NULL tidak otomatis diberikan kepada pengguna tersebut

#### Scenario: Penetapan pemilik eksplisit

- **WHEN** operator menetapkan `user_id` pada data lama melalui prosedur operasional
- **THEN** data tersebut hanya terlihat oleh pemilik baru dan tetap tidak terlihat oleh pengguna lain
