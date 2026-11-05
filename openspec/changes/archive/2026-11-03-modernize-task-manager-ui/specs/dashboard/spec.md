# Spec Delta

## ADDED Requirements

### Requirement: Presentasi KPI Dashboard

Sistem SHALL menampilkan KPI total tugas dan jumlah per status yang berasal dari statistik global yang sudah ada.

#### Scenario: Nilai KPI

- **WHEN** Dashboard ditampilkan
- **THEN** KPI total dan jumlah per status sama dengan nilai `total` dan `byStatus` dari API statistik

#### Scenario: Dashboard kosong

- **WHEN** belum ada tugas
- **THEN** KPI menampilkan nilai nol dengan empty state yang jelas

### Requirement: Completion rate dan visualisasi distribusi

Sistem SHALL menampilkan completion rate dan distribusi status serta prioritas yang dihitung dari data statistik yang tersedia tanpa menambah metrik atau endpoint baru.

#### Scenario: Completion rate

- **WHEN** terdapat tugas dengan status Done dan total lebih dari nol
- **THEN** completion rate ditampilkan sebagai perbandingan Done terhadap total

#### Scenario: Distribusi status dan prioritas

- **WHEN** Dashboard ditampilkan
- **THEN** distribusi status dan prioritas divisualisasikan dengan label yang dapat dibaca

#### Scenario: Tanpa metrik baru

- **WHEN** Dashboard ditampilkan
- **THEN** tidak ada metrik yang membutuhkan field atau endpoint API baru, termasuk overdue count

#### Scenario: Aksesibilitas visualisasi

- **WHEN** visualisasi progres ditampilkan
- **THEN** nilai utama tetap tersedia sebagai teks atau label aksesibel

### Requirement: Presentasi state Dashboard

Sistem SHALL menampilkan state loading, error, dan data kosong pada Dashboard secara jelas dan konsisten dengan design system.

#### Scenario: Loading Dashboard

- **WHEN** statistik sedang dimuat
- **THEN** skeleton atau indikator loading tampil pada area KPI dan visualisasi

#### Scenario: Error Dashboard

- **WHEN** pemuatan statistik gagal
- **THEN** pesan error dan aksi coba lagi tampil

#### Scenario: Retry berhasil

- **WHEN** pengguna menekan coba lagi setelah error dan permintaan berhasil
- **THEN** Dashboard menampilkan statistik terbaru
