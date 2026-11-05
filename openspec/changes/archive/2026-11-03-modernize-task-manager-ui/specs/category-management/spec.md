# Spec Delta

## ADDED Requirements

### Requirement: Presentasi manajemen kategori

Sistem SHALL menampilkan kategori dalam daftar yang konsisten dengan badge bawaan, aksi ubah dan hapus, form inline, serta dialog konfirmasi.

#### Scenario: Baris kategori

- **WHEN** daftar kategori ditampilkan
- **THEN** setiap baris menampilkan nama kategori dan aksi Ubah serta Hapus yang konsisten dengan komponen primitif

#### Scenario: Badge bawaan

- **WHEN** kategori memiliki `is_default` bernilai benar
- **THEN** baris menampilkan badge Bawaan

#### Scenario: Inline edit

- **WHEN** pengguna memilih Ubah pada kategori
- **THEN** form inline tampil dengan aksi Simpan dan Batal yang konsisten

#### Scenario: Dialog hapus konsisten

- **WHEN** pengguna memilih Hapus pada kategori
- **THEN** dialog konfirmasi memakai primitif dan pengelolaan fokus yang sama dengan dialog tugas

#### Scenario: Layout sempit

- **WHEN** halaman kategori dibuka pada viewport sempit
- **THEN** baris dan form tersusun tanpa overflow horizontal

### Requirement: Presentasi validasi dan feedback kategori

Sistem SHALL menampilkan error validasi kategori secara inline serta feedback keberhasilan atau kegagalan operasi secara konsisten dengan design system.

#### Scenario: Error inline

- **WHEN** nama kategori tidak valid
- **THEN** pesan error tampil dekat field terkait tanpa menghilangkan input pengguna

#### Scenario: Operasi berhasil

- **WHEN** kategori berhasil dibuat, diubah, atau dihapus
- **THEN** toast sukses tampil dengan pesan Bahasa Indonesia

#### Scenario: Operasi gagal

- **WHEN** operasi kategori gagal
- **THEN** pesan error yang dapat dibaca tampil dan state sibuk berhenti

#### Scenario: Perilaku CRUD tidak berubah

- **WHEN** pengguna membuat, mengubah, atau menghapus kategori
- **THEN** aturan validasi, keunikan nama, urutan, dan perilaku hapus tetap sama seperti sebelumnya
