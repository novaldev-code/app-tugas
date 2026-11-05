# Spec Delta

## MODIFIED Requirements

### Requirement: Kerangka aplikasi dengan sidebar

Sistem SHALL menampilkan kerangka aplikasi workspace dengan sidebar navigasi utama, area konten utama, dan header yang konsisten di seluruh view workspace.

#### Scenario: Navigasi utama

- **WHEN** workspace dibuka
- **THEN** Dashboard, Daftar Tugas, Kanban, dan Kategori tersedia dari sidebar

#### Scenario: Konten utama

- **WHEN** pengguna memilih view workspace
- **THEN** konten view tampil di area utama tanpa memuat ulang halaman

#### Scenario: Header konsisten

- **WHEN** pengguna berpindah view workspace
- **THEN** header menampilkan konteks view dan aksi utama yang konsisten

#### Scenario: Landing publik dikecualikan

- **WHEN** pengguna membuka landing page publik
- **THEN** sidebar, drawer, dan header workspace tidak ditampilkan

## ADDED Requirements

### Requirement: Pemisahan public shell dan workspace shell

Sistem SHALL memisahkan public shell landing page dari workspace shell sehingga hanya workspace yang memakai sidebar, drawer, dan header aplikasi.

#### Scenario: Public shell landing

- **WHEN** landing page ditampilkan
- **THEN** landing memakai header dan footer publik tanpa sidebar atau drawer workspace

#### Scenario: Workspace shell tetap

- **WHEN** workspace dibuka pada deployment lokal/internal
- **THEN** workspace tetap memakai `AppShell`, sidebar, header, dan drawer yang sudah ada

#### Scenario: Token dan primitif bersama

- **WHEN** komponen landing atau workspace dirender
- **THEN** keduanya menggunakan token visual dan primitif UI yang sama tanpa memuat shell satu sama lain

#### Scenario: Tema landing konsisten

- **WHEN** landing page ditampilkan
- **THEN** landing memakai tema gelap Modern Dark dan token desain yang sama dengan workspace

#### Scenario: Kepemilikan skip link

- **WHEN** landing atau workspace ditampilkan
- **THEN** setiap halaman memiliki tepat satu skip link dan satu elemen `main` dengan id tujuan yang valid
