# Spec Delta

## REMOVED Requirements

### Requirement: Pemblokiran workspace pada deployment publik

**Reason**: Workspace publik kini tersedia bagi pengguna terautentikasi; pemblokiran `/app` pada build publik digantikan oleh guard sesi.

**Migration**: Gunakan requirement guard pada `user-auth` dan isolasi pada `multi-user-isolation`; pengguna tanpa sesi diarahkan ke `/login`, pengguna dengan sesi diarahkan ke workspace.

## MODIFIED Requirements

### Requirement: Rute landing dan workspace

Sistem SHALL menyajikan landing page publik di `/` dan workspace di `/app`; akses workspace SHALL memerlukan sesi valid pada deployment lokal maupun publik.

#### Scenario: Landing di root

- **WHEN** pengguna membuka `/`
- **THEN** sistem menampilkan landing page publik

#### Scenario: Workspace lokal di `/app`

- **WHEN** deployment lokal/internal membuka `/app` dengan sesi valid
- **THEN** sistem menampilkan workspace dengan perilaku Dashboard, Task List, Kanban, dan Kategori yang sudah ada

#### Scenario: Path tidak dikenal

- **WHEN** pengguna membuka path frontend yang tidak dikenal
- **THEN** sistem mengarahkan pengguna ke landing page

#### Scenario: Workspace publik dengan sesi valid

- **WHEN** pengguna terautentikasi membuka `/app` pada build publik
- **THEN** sistem menampilkan workspace milik pengguna tersebut

#### Scenario: Workspace publik tanpa sesi

- **WHEN** pengguna tanpa sesi valid membuka `/app` pada build publik
- **THEN** sistem mengarahkan pengguna ke `/login` tanpa me-mount workspace

### Requirement: Konten pricing dan klaim marketing yang jujur

Landing page SHALL menampilkan satu paket `Gratis` tanpa payment, menyatakan ketersediaan akun dan multi-user secara faktual, dan SHALL NOT menampilkan testimoni, logo klien, social proof fiktif, atau klaim data lokal, privasi terjamin, cloud sync, maupun kolaborasi.

#### Scenario: Pricing satu paket

- **WHEN** section pricing ditampilkan
- **THEN** hanya ada satu paket `Gratis` tanpa alur pembayaran dan pendaftaran akun tersedia tanpa payment

#### Scenario: Tanpa bukti sosial fiktif

- **WHEN** konten landing diperiksa
- **THEN** tidak ada testimoni, nama pengguna, logo perusahaan, atau angka pengguna yang tidak memiliki sumber nyata

#### Scenario: Tanpa klaim data lokal

- **WHEN** konten landing diperiksa
- **THEN** tidak ada klaim bahwa data disimpan secara lokal, privat, atau aman

#### Scenario: FAQ status workspace

- **WHEN** FAQ menjelaskan akses workspace
- **THEN** jawabannya menyatakan bahwa workspace memerlukan login dan authentication serta multi-user isolation tersedia

## ADDED Requirements

### Requirement: Akses autentikasi dari landing

Landing page SHALL menyediakan tautan masuk dan daftar menuju `/login` dan `/register`, serta SHALL NOT memuat workspace atau data pengguna.

#### Scenario: Tautan autentikasi tersedia

- **WHEN** pengguna membuka landing page
- **THEN** tautan masuk dan daftar tampil pada shell publik

#### Scenario: Pengguna terautentikasi memilih tautan autentikasi

- **WHEN** pengguna dengan sesi valid memilih tautan masuk atau daftar
- **THEN** guard mengarahkan pengguna ke `/app` tanpa meminta login ulang

#### Scenario: Landing tidak memuat workspace

- **WHEN** landing page ditampilkan
- **THEN** workspace tidak di-mount dan tidak ada request API data pengguna

#### Scenario: Tanpa tautan langsung ke workspace

- **WHEN** seluruh konten landing diperiksa
- **THEN** tidak ada tautan atau tombol langsung ke `/app`; akses workspace hanya melalui guard autentikasi
