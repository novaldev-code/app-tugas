# Spec Delta

## Purpose

Menyediakan landing page publik yang memperkenalkan produk dan memisahkan akses landing dari workspace aplikasi.

## ADDED Requirements

### Requirement: Rute landing dan workspace

Sistem SHALL menyajikan landing page publik di `/` dan workspace aplikasi di `/app` pada deployment lokal/internal.

#### Scenario: Landing di root

- **WHEN** pengguna membuka `/`
- **THEN** sistem menampilkan landing page publik

#### Scenario: Workspace lokal di `/app`

- **WHEN** deployment lokal/internal membuka `/app`
- **THEN** sistem menampilkan workspace dengan perilaku Dashboard, Task List, Kanban, dan Kategori yang sudah ada

#### Scenario: Path tidak dikenal

- **WHEN** pengguna membuka path frontend yang tidak dikenal
- **THEN** sistem mengarahkan pengguna ke landing page

### Requirement: Pemblokiran workspace pada deployment publik

Pada deployment publik, sistem SHALL mengalihkan `/app` ke `/` dan SHALL NOT memuat workspace. Gate frontend ini bukan authentication atau security boundary; backend/API workspace tidak boleh diekspos pada deployment publik.

#### Scenario: Akses langsung workspace publik

- **WHEN** pengguna membuka `/app` pada build publik
- **THEN** sistem mengalihkan pengguna ke `/` tanpa me-mount workspace atau memanggil API dashboard

#### Scenario: Build lokal tetap tersedia

- **WHEN** build lokal/internal dibuka tanpa mode deployment publik
- **THEN** `/app` tetap menampilkan workspace

#### Scenario: Backend/API tidak diekspos

- **WHEN** deployment publik diverifikasi
- **THEN** hanya aset landing yang tersedia dan endpoint API workspace tidak dapat diakses publik

#### Scenario: Tanpa asumsi authentication

- **WHEN** landing page ditampilkan
- **THEN** tidak ada alur login, sign-up, waitlist, atau klaim bahwa authentication sudah tersedia

### Requirement: Isolasi landing dari data dashboard

Landing page SHALL NOT melakukan request API dashboard dan SHALL NOT menautkan pengguna ke workspace.

#### Scenario: Tanpa request API dashboard

- **WHEN** pengguna membuka landing page
- **THEN** browser tidak mengirim request ke endpoint API dashboard

#### Scenario: CTA tidak membuka workspace

- **WHEN** pengguna mengaktifkan CTA utama landing
- **THEN** pengguna diarahkan ke product preview atau section fitur, bukan ke `/app`

#### Scenario: Tanpa tautan workspace

- **WHEN** seluruh konten landing diperiksa
- **THEN** tidak ada tautan atau tombol yang mengarah ke `/app`

### Requirement: Struktur konten landing marketing

Landing page SHALL menampilkan header publik, hero, product preview, fitur, cara kerja, audiens/manfaat, pricing, FAQ, CTA, dan footer.

#### Scenario: Section utama tersedia

- **WHEN** pengguna membuka landing page
- **THEN** seluruh section utama tampil dalam urutan yang dapat dipindai

#### Scenario: Navigasi anchor

- **WHEN** pengguna memilih tautan navigasi landing
- **THEN** halaman bergulir ke section yang sesuai tanpa membuka workspace

#### Scenario: Product preview statis

- **WHEN** product preview ditampilkan
- **THEN** preview menggunakan data statis dan tidak mengambil data dashboard

### Requirement: Konten pricing dan klaim marketing yang jujur

Landing page SHALL menampilkan satu paket pricing `Gratis` tanpa payment dan SHALL NOT menampilkan testimoni, logo klien, social proof fiktif, atau klaim data lokal, privasi terjamin, cloud sync, kolaborasi, maupun multi-user.

#### Scenario: Pricing satu paket

- **WHEN** section pricing ditampilkan
- **THEN** hanya ada satu paket `Gratis` tanpa alur pembayaran atau sign-up

#### Scenario: Tanpa bukti sosial fiktif

- **WHEN** konten landing diperiksa
- **THEN** tidak ada testimoni, nama pengguna, logo perusahaan, atau angka pengguna yang tidak memiliki sumber nyata

#### Scenario: Tanpa klaim data lokal

- **WHEN** konten landing diperiksa
- **THEN** tidak ada klaim bahwa data disimpan secara lokal, privat, atau aman

#### Scenario: FAQ status workspace

- **WHEN** FAQ menjelaskan akses workspace
- **THEN** jawabannya menyatakan bahwa akses publik menunggu authentication dan multi-user data isolation tanpa mengasumsikan fitur tersebut sudah tersedia

### Requirement: Public shell dan navigasi landing

Landing page SHALL memakai public shell berisi header dan footer sendiri, SHALL NOT memakai sidebar atau drawer workspace, dan SHALL menyediakan navigasi mobile yang aksesibel.

#### Scenario: Shell publik tanpa sidebar workspace

- **WHEN** landing page ditampilkan
- **THEN** tidak ada sidebar, drawer workspace, atau navigasi Dashboard/List/Kanban/Kategori

#### Scenario: Navigasi mobile

- **WHEN** pengguna membuka navigasi landing pada viewport mobile
- **THEN** panel navigasi tampil dengan state ARIA yang sesuai dan dapat ditutup melalui anchor, Escape, atau kontrol tutup

#### Scenario: Brand dan token konsisten

- **WHEN** header dan footer landing ditampilkan
- **THEN** brand serta token visual konsisten dengan workspace tanpa memuat shell workspace

#### Scenario: Anchor dengan header sticky

- **WHEN** pengguna memilih anchor saat header sticky terlihat
- **THEN** judul section tujuan tidak tertutup header

### Requirement: Aksesibilitas dan responsif landing

Landing page SHALL menyediakan heading hierarchy, landmark, skip link, fokus yang terlihat, dukungan keyboard, reduced motion, dan layout tanpa overflow horizontal pada viewport mobile.

#### Scenario: Struktur heading dan landmark

- **WHEN** landing page dirender
- **THEN** halaman memiliki satu `h1`, urutan heading yang logis, serta landmark header, main, dan footer

#### Scenario: Skip link

- **WHEN** pengguna menekan Tab pertama kali
- **THEN** skip link menuju konten utama landing dapat difokuskan dan berfungsi

#### Scenario: Keyboard dan fokus

- **WHEN** pengguna menavigasi landing dengan keyboard
- **THEN** seluruh kontrol utama dapat difokuskan dengan indikator fokus yang jelas

#### Scenario: Reduced motion

- **WHEN** pengguna mengaktifkan prefers-reduced-motion
- **THEN** animasi non-esensial diminimalkan tanpa menghilangkan informasi

#### Scenario: Viewport mobile

- **WHEN** landing page dibuka pada lebar 360px atau 390px
- **THEN** halaman tidak mengalami overflow horizontal dan seluruh section dapat dibaca

### Requirement: Metadata landing

Landing page SHALL memiliki judul dan deskripsi halaman yang menggambarkan landing page publik serta tidak menampilkan metadata workspace kepada pengunjung.

#### Scenario: Metadata landing

- **WHEN** landing page dimuat
- **THEN** judul dan deskripsi halaman sesuai dengan landing page publik

#### Scenario: Metadata workspace tidak bocor

- **WHEN** metadata landing diperiksa
- **THEN** tidak ada informasi data tugas, kategori, atau statistik workspace
