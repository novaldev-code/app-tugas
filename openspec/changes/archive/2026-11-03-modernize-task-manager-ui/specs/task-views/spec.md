# Spec Delta

## ADDED Requirements

### Requirement: Presentasi Task List

Sistem SHALL menampilkan Task List dengan header grup yang menunjukkan nama dan jumlah tugas serta kartu yang menyusun judul, status, prioritas, kategori, deadline, dan deskripsi secara hierarkis.

#### Scenario: Hierarki informasi kartu

- **WHEN** kartu tugas ditampilkan
- **THEN** judul menjadi fokus utama, diikuti status, prioritas, kategori, deadline, dan deskripsi

#### Scenario: Header grup

- **WHEN** grup kategori ditampilkan
- **THEN** header menampilkan nama grup dan jumlah tugas di dalamnya

#### Scenario: Penanda overdue

- **WHEN** tugas memiliki deadline yang sudah lewat dan belum selesai
- **THEN** deadline ditampilkan dengan penekanan visual yang jelas

#### Scenario: Aksi kartu

- **WHEN** pengguna melihat kartu tugas
- **THEN** aksi Ubah dan Hapus tersedia tanpa mengubah perilaku dialog yang sudah ada

#### Scenario: Layout sempit

- **WHEN** Task List dibuka pada viewport sempit
- **THEN** kartu dan aksinya tersusun tanpa overflow horizontal

### Requirement: Presentasi Kanban

Sistem SHALL menampilkan Kanban dengan kolom beraksen status dan kartu yang memuat prioritas, kategori, deadline, serta aksi, tanpa mengubah aturan sort, urutan manual, atau drag-and-drop.

#### Scenario: Kolom status

- **WHEN** Kanban dibuka tanpa filter status
- **THEN** kolom Todo, In Progress, dan Done tampil dengan aksen dan jumlah tugas masing-masing

#### Scenario: Drop zone

- **WHEN** kolom tidak memiliki tugas atau sedang menjadi target drag
- **THEN** kolom menampilkan area drop yang jelas

#### Scenario: Kartu Kanban

- **WHEN** kartu tugas ditampilkan
- **THEN** prioritas, kategori, deadline, dan aksi tampil dengan hierarki yang mudah dipindai

#### Scenario: Handle drag

- **WHEN** pengguna akan menyeret kartu
- **THEN** handle drag ditampilkan sebagai kontrol yang dapat dikenali

#### Scenario: Layout mobile

- **WHEN** Kanban dibuka pada viewport mobile
- **THEN** tiga kolom tetap tampil dan dapat digeser horizontal hanya di dalam area Kanban, tanpa membuat halaman mengalami overflow horizontal

#### Scenario: Drag pada Kanban mobile

- **WHEN** pengguna menyeret kartu menggunakan pointer saat Kanban berada pada viewport mobile
- **THEN** perubahan status tetap berjalan seperti sebelum modernisasi

### Requirement: Presentasi toolbar filter

Sistem SHALL menampilkan pencarian, filter, sort, dan reset dalam toolbar yang konsisten serta menyesuaikan layout pada viewport sempit tanpa mengubah perilaku filter.

#### Scenario: Toolbar desktop

- **WHEN** Task List atau Kanban dibuka pada desktop
- **THEN** pencarian, filter, sort, dan reset tampil dalam satu toolbar yang konsisten

#### Scenario: Toolbar mobile

- **WHEN** toolbar ditampilkan pada viewport sempit
- **THEN** kontrol tersusun ulang atau dapat dibuka dalam panel tanpa overflow horizontal

#### Scenario: Reset filter

- **WHEN** pengguna menekan reset
- **THEN** seluruh filter kembali ke nilai default seperti perilaku yang sudah ada

#### Scenario: Perilaku filter tidak berubah

- **WHEN** pengguna mengubah pencarian, filter, atau sort
- **THEN** query, penggabungan AND, dan urutan dari backend tetap sama seperti sebelumnya
