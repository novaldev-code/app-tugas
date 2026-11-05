# ui-foundation Specification

## Purpose
Menyediakan fondasi visual Modern Dark dan kerangka aplikasi yang konsisten untuk seluruh tampilan tanpa mengubah perilaku fitur.

## Requirements

### Requirement: Tema gelap Modern Dark

Sistem SHALL menggunakan tema gelap sebagai tema default dan memusatkan warna, tipografi, spacing, radius, elevasi, serta fokus pada token desain yang dapat digunakan ulang.

#### Scenario: Tema default

- **WHEN** aplikasi dibuka
- **THEN** shell dan seluruh tampilan utama memakai tema gelap

#### Scenario: Token terpusat

- **WHEN** komponen visual dirender
- **THEN** warna, spacing, radius, dan elevasi berasal dari token desain, bukan nilai tema terang yang tersebar

#### Scenario: Tanpa toggle tema

- **WHEN** pengguna membuka aplikasi
- **THEN** tidak ada kontrol pergantian tema pada perubahan ini

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

### Requirement: Sidebar collapsible di desktop

Sistem SHALL memungkinkan pengguna memperluas atau menciutkan sidebar pada layar desktop serta menyimpan preferensi collapsed/expanded di `localStorage` sebagai preferensi tampilan.

#### Scenario: Collapse sidebar

- **WHEN** pengguna menekan kontrol collapse
- **THEN** sidebar menyempit dan area konten menyesuaikan

#### Scenario: Expand sidebar

- **WHEN** sidebar dalam keadaan menyempit dan pengguna menekan kontrol expand
- **THEN** label navigasi tampil kembali

#### Scenario: Preferensi tersimpan

- **WHEN** pengguna memuat ulang halaman
- **THEN** status collapse terakhir diterapkan

#### Scenario: Hanya preferensi UI

- **WHEN** preferensi sidebar disimpan
- **THEN** state pencarian, filter, dan sort tidak ikut disimpan

### Requirement: Drawer navigasi mobile

Sistem SHALL menampilkan navigasi sebagai drawer off-canvas pada viewport mobile, dibuka melalui tombol hamburger, dengan backdrop, dukungan Escape, penguncian scroll halaman, dan penutupan otomatis setelah navigasi.

#### Scenario: Buka drawer

- **WHEN** pengguna menekan tombol hamburger pada viewport mobile
- **THEN** drawer off-canvas tampil dengan backdrop

#### Scenario: Tutup drawer

- **WHEN** pengguna memilih navigasi, menekan backdrop, atau menekan Escape
- **THEN** drawer tertutup, dan memilih navigasi juga menutup drawer secara otomatis

#### Scenario: Fokus kembali

- **WHEN** drawer ditutup
- **THEN** fokus kembali ke tombol menu

#### Scenario: Tanpa scroll ganda

- **WHEN** drawer terbuka
- **THEN** halaman di belakangnya tidak ikut ter-scroll

### Requirement: Komponen UI primitif

Sistem SHALL menyediakan komponen visual primitif yang konsisten untuk tombol, badge, kartu, panel, field, empty state, skeleton, toast, dan ikon.

#### Scenario: Varian tombol

- **WHEN** tombol primer, sekunder, ghost, atau danger dirender
- **THEN** gaya dan state fokusnya konsisten

#### Scenario: Badge status dan prioritas

- **WHEN** badge dirender
- **THEN** warna dan teks mengikuti token semantik yang sama di semua view

#### Scenario: Ikon tanpa dependency

- **WHEN** ikon ditampilkan
- **THEN** ikon memakai aset inline yang tidak menambah runtime dependency

### Requirement: State visual antarmuka

Sistem SHALL menampilkan state loading, empty, error, dan success yang jelas serta konsisten di seluruh tampilan.

#### Scenario: Loading

- **WHEN** data sedang dimuat
- **THEN** skeleton atau indikator loading tampil sesuai konteks

#### Scenario: Empty

- **WHEN** tidak ada data
- **THEN** empty state menampilkan penjelasan dan aksi yang relevan

#### Scenario: Error

- **WHEN** pemuatan data gagal
- **THEN** pesan error dan aksi coba lagi tampil

#### Scenario: Success

- **WHEN** operasi berhasil
- **THEN** toast sukses tampil dan dapat hilang otomatis

#### Scenario: Busy

- **WHEN** operasi sedang diproses
- **THEN** tombol terkait menampilkan state sibuk dan tidak dapat ditekan berulang

### Requirement: Aksesibilitas dasar

Sistem SHALL menyediakan fokus yang terlihat, label aksesibel, pengelolaan fokus pada drawer dan modal, serta pengumuman status dinamis.

#### Scenario: Focus visible

- **WHEN** pengguna bernavigasi dengan keyboard
- **THEN** elemen aktif memiliki indikator fokus yang jelas

#### Scenario: Focus trap

- **WHEN** modal atau drawer terbuka
- **THEN** fokus tetap berada di dalam panel sampai ditutup

#### Scenario: ARIA state

- **WHEN** sidebar atau drawer dibuka
- **THEN** kontrol terkait mengekspos state yang sesuai

#### Scenario: Pengumuman dinamis

- **WHEN** toast atau state loading berubah
- **THEN** perubahan diumumkan ke teknologi bantu

### Requirement: Kontras dan gerak yang aman

Sistem SHALL memastikan teks dan kontrol utama memenuhi kontras WCAG AA serta menghormati preferensi pengurangan animasi.

#### Scenario: Kontras teks

- **WHEN** teks atau kontrol ditampilkan pada permukaan tema gelap
- **THEN** kontras memenuhi WCAG AA untuk teks normal, teks besar, serta komponen antarmuka

#### Scenario: Reduced motion

- **WHEN** pengguna mengaktifkan preferensi pengurangan gerak
- **THEN** animasi non-esensial diminimalkan

#### Scenario: Informasi tanpa animasi

- **WHEN** animasi dinonaktifkan
- **THEN** tidak ada informasi penting yang hilang

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
