# Spec Delta

## MODIFIED Requirements

### Requirement: Statistik global per status dan prioritas

Sistem SHALL menampilkan jumlah tugas milik pengguna yang sedang login per status dan per prioritas pada Dashboard.

#### Scenario: Menghitung tugas per status dan prioritas

- **WHEN** pengguna yang login memiliki tugas dengan berbagai status dan prioritas
- **THEN** Dashboard menampilkan jumlah tugas miliknya untuk setiap status dan setiap prioritas

#### Scenario: Statistik mencakup tugas Done

- **WHEN** pengguna memiliki tugas berstatus `Done`
- **THEN** tugas tersebut ikut dihitung pada statistik Dashboard miliknya

#### Scenario: Tugas pengguna lain tidak dihitung

- **WHEN** pengguna lain memiliki tugas dengan status atau prioritas tertentu
- **THEN** tugas tersebut tidak muncul pada statistik Dashboard pengguna yang login

### Requirement: Statistik tidak terpengaruh filter Task List

Sistem SHALL menjaga statistik Dashboard tetap mencakup seluruh tugas milik pengguna yang login ketika pengguna menggunakan pencarian atau filter pada Task List.

#### Scenario: Filter Task List aktif

- **WHEN** pengguna menerapkan pencarian atau filter pada Task List
- **THEN** angka statistik Dashboard miliknya tidak berubah

### Requirement: Statistik tidak terpengaruh filter Kanban

Sistem SHALL menjaga statistik Dashboard tetap mencakup seluruh tugas milik pengguna yang login ketika pengguna menggunakan pencarian atau filter pada Kanban.

#### Scenario: Filter Kanban aktif

- **WHEN** pengguna menerapkan pencarian atau filter pada Kanban
- **THEN** angka statistik Dashboard miliknya tidak berubah

### Requirement: Presentasi KPI Dashboard

Sistem SHALL menampilkan KPI total tugas dan jumlah per status yang berasal dari statistik pengguna yang sedang login.

#### Scenario: Nilai KPI

- **WHEN** Dashboard ditampilkan
- **THEN** KPI total dan jumlah per status sama dengan nilai `total` dan `byStatus` dari API statistik untuk pengguna tersebut

#### Scenario: Dashboard kosong

- **WHEN** pengguna belum memiliki tugas
- **THEN** KPI menampilkan nilai nol dengan empty state yang jelas
