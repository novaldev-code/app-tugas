# dashboard Specification

## Purpose

Menampilkan statistik global jumlah tugas per status dan prioritas yang tidak terpengaruh oleh pencarian atau filter pada tampilan lain.

## Requirements

### Requirement: Statistik global per status dan prioritas

Sistem SHALL menampilkan jumlah seluruh tugas per status dan per prioritas pada Dashboard.

#### Scenario: Menghitung tugas per status dan prioritas

- **WHEN** terdapat tugas dengan berbagai status dan prioritas
- **THEN** Dashboard menampilkan jumlah tugas untuk setiap status dan setiap prioritas

#### Scenario: Statistik mencakup tugas Done

- **WHEN** terdapat tugas berstatus `Done`
- **THEN** tugas tersebut ikut dihitung pada statistik Dashboard

### Requirement: Statistik tidak terpengaruh filter Task List

Sistem SHALL menjaga statistik Dashboard tetap global ketika pengguna menggunakan pencarian atau filter pada Task List.

#### Scenario: Filter Task List aktif

- **WHEN** pengguna menerapkan pencarian atau filter pada Task List
- **THEN** angka statistik Dashboard tidak berubah

### Requirement: Statistik tidak terpengaruh filter Kanban

Sistem SHALL menjaga statistik Dashboard tetap global ketika pengguna menggunakan pencarian atau filter pada Kanban.

#### Scenario: Filter Kanban aktif

- **WHEN** pengguna menerapkan pencarian atau filter pada Kanban
- **THEN** angka statistik Dashboard tidak berubah
