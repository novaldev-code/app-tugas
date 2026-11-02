# Spec Delta

## ADDED Requirements

### Requirement: Dukungan viewport mobile

Sistem SHALL menyediakan layout yang dapat digunakan pada viewport mobile tanpa overflow horizontal pada halaman serta tetap mempertahankan seluruh fitur utama.

#### Scenario: Viewport kecil

- **WHEN** aplikasi dibuka pada lebar 360px atau 390px
- **THEN** konten utama, filter, modal, dan aksi tetap dapat digunakan tanpa overflow horizontal pada halaman, dengan area Kanban sebagai satu-satunya container scroll horizontal internal

#### Scenario: Navigasi mobile

- **WHEN** aplikasi dibuka pada viewport mobile
- **THEN** navigasi utama tersedia melalui drawer off-canvas

#### Scenario: Konten satu kolom

- **WHEN** Dashboard, Task List, atau Kategori dibuka pada viewport mobile
- **THEN** panel dan kartu tersusun dalam satu kolom yang dapat dibaca

#### Scenario: Kanban mobile

- **WHEN** Kanban dibuka pada viewport mobile
- **THEN** tiga kolom status tetap tampil dalam area yang dapat digeser horizontal, halaman tidak overflow, dan drag-and-drop tetap berfungsi

### Requirement: Preservasi perilaku dan kontrak

Sistem SHALL mempertahankan seluruh perilaku fitur, kontrak API, skema database, migrasi, dan teknologi yang sudah ada selama modernisasi UI, tanpa melakukan rewrite aplikasi.

#### Scenario: Kontrak API

- **WHEN** frontend memanggil API setelah modernisasi
- **THEN** endpoint, payload, bentuk respons, dan status HTTP tetap sama

#### Scenario: Database

- **WHEN** aplikasi dijalankan setelah modernisasi
- **THEN** skema, migrasi, dan data tidak berubah

#### Scenario: Perilaku fitur

- **WHEN** pengguna menggunakan pencarian, filter, sort, grouping, overdue, kategori, dialog hapus, atau drag-and-drop
- **THEN** perilakunya sama seperti sebelum modernisasi

#### Scenario: Test yang ada

- **WHEN** seluruh test suite dijalankan
- **THEN** test yang sudah ada tetap lulus

#### Scenario: Teknologi dan dependency

- **WHEN** perubahan diimplementasikan
- **THEN** React, Vite, Express, dan SQLite tetap digunakan tanpa runtime dependency baru

### Requirement: Verifikasi regresi visual dan interaksi

Sistem SHALL diverifikasi pada browser dan viewport yang didukung untuk memastikan modernisasi tidak menimbulkan regresi visual atau interaksi.

#### Scenario: Matriks regresi browser

- **WHEN** verifikasi regresi dilakukan
- **THEN** alur utama diuji di setiap browser yang didukung tanpa regresi

#### Scenario: Matriks regresi viewport

- **WHEN** verifikasi regresi dilakukan
- **THEN** desktop, tablet, dan mobile diuji tanpa overflow horizontal pada halaman, sementara area Kanban boleh memiliki scroll horizontal internal

#### Scenario: Cakupan state

- **WHEN** verifikasi dilakukan
- **THEN** state loading, empty, error, success, dan busy diperiksa pada tampilan utama

#### Scenario: Interaksi kunci

- **WHEN** verifikasi dilakukan
- **THEN** drag-and-drop, filter, modal, drawer, dan navigasi keyboard diperiksa
