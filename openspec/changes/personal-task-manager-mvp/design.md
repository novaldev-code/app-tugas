# Design

## Context

Lihat `proposal.md` untuk motivasi. Proyek masih greenfield: belum ada kode aplikasi, skema database, maupun spesifikasi utama. Seluruh perilaku berasal dari keputusan D-01..D-65 dan resolusi OPEN-01..OPEN-13 serta DET-01..DET-14 yang sudah disepakati; DET-05 diperbarui oleh D-64.

Batasan utama:

- Aplikasi web lokal, single-user, tanpa autentikasi.
- Frontend React + Vite; backend Node.js + Express; database SQLite dengan `better-sqlite3`.
- Data harus bertahan setelah restart dan tidak boleh bergantung pada state browser untuk pencarian/filter/sort.
- Seluruh teks antarmuka menggunakan Bahasa Indonesia.
- Implementasi mengikuti rencana ini; hasil verifikasi dicatat di `verification.md`.

## Goals / Non-Goals

**Goals:**

- Menetapkan model data, kontrak API, aturan urutan, dan alur validasi yang konsisten dengan spesifikasi.
- Menjaga agar Task List, Kanban, dan Dashboard memakai sumber data yang sama.
- Menetapkan resolusi DET-05..DET-14 sebagai keputusan desain yang dapat diimplementasikan.
- Memberikan traceability dari requirement dan acceptance criteria ke artifact.

**Non-Goals:**

- Implementasi kode, Build, Apply, atau deployment.
- Autentikasi, multi-user, sinkronisasi cloud, mobile native, dan keyboard drag-and-drop.
- Library drag-and-drop dan lingkungan verifikasi browser sudah dipilih pada Decisions #12; tidak ada open item yang memblokir implementasi.

## Decisions

### 1. Struktur aplikasi

- Frontend dan backend dipisahkan dalam satu repository: `client/` untuk React + Vite dan `server/` untuk Express, akses SQLite, serta migrasi.
- Frontend memanggil API backend; tidak ada akses langsung ke database dari browser.
- **Alasan:** memisahkan tanggung jawab, memudahkan pengujian integration, dan menjaga backend sebagai sumber kebenaran data serta urutan.
- **Alternatif ditolak:** satu proses monolit dengan render server; menambah kompleksitas tanpa manfaat untuk MVP lokal.

### 2. Skema database

- Tabel `categories`:
  - `id` INTEGER PRIMARY KEY
  - `name` TEXT NOT NULL
  - `is_default` INTEGER NOT NULL DEFAULT 0
  - `sort_order` INTEGER NOT NULL
  - `created_at` TEXT NOT NULL
- Tabel `tasks`:
  - `id` INTEGER PRIMARY KEY
  - `title` TEXT NOT NULL
  - `description` TEXT NULL
  - `status` TEXT NOT NULL DEFAULT `Todo`
  - `priority` TEXT NOT NULL
  - `deadline` TEXT NULL (format `YYYY-MM-DD`)
  - `category_id` INTEGER NULL REFERENCES `categories(id) ON DELETE SET NULL`
  - `created_at` TEXT NOT NULL
- `PRAGMA foreign_keys = ON` wajib aktif agar `ON DELETE SET NULL` bekerja.
- Unique index kategori menggunakan `COLLATE NOCASE` atau `lower(name)`; jaminan case-insensitive terbatas pada ASCII.
- CHECK constraint mencegah judul/nama kategori whitespace-only dan panjang di luar batas; deskripsi dibatasi 1000 karakter.
- **Alasan:** memenuhi D-29, D-30, D-35, D-49, D-50, D-60, dan D-62 dengan skema minimal.
- **Alternatif ditolak:** menyimpan kategori sebagai string pada tugas; menyulitkan rename, urutan, dan filter `Tanpa Kategori`.

### 3. Urutan dan grouping

- Urutan kategori: `Pribadi`, `Pekerjaan`, `Belajar` berdasarkan `sort_order`; kategori tambahan (`is_default = 0`) alfabetis case-insensitive dengan locale Indonesia; `Tanpa Kategori` selalu terakhir.
- Rename kategori bawaan tidak mengubah `is_default` atau `sort_order`.
- Kategori baru yang memakai nama kategori bawaan yang sudah dihapus tetap `is_default = 0`.
- Task List dikelompokkan per kategori; setiap tugas hanya masuk satu kelompok. Hanya kelompok yang memiliki tugas yang ditampilkan; kelompok kosong disembunyikan. `Tanpa Kategori` hanya ditampilkan jika ada tugas dengan `category_id = NULL`. Urutan grup mengikuti D-58/D-60.
- Kanban memiliki tiga kolom status. Tanpa filter status, ketiga kolom selalu tampil; kolom kosong menampilkan pesan kosong. Dengan filter status, hanya kolom terpilih yang tampil.
- **Alasan:** memenuhi D-47, D-58, D-60, D-61, D-64, DET-05, DET-11, dan DET-13.
- **Alternatif ditolak:** menampilkan kelompok kosong; menyembunyikan kolom Kanban tanpa filter; membuat perilaku berbeda antara Task List dan Kanban tanpa keputusan eksplisit.

### 4. Sort

- Hanya dua mode:
  - `created_at DESC, id DESC`
  - `deadline ASC, created_at DESC, id DESC` dengan `deadline IS NULL` selalu setelah deadline non-`NULL`.
- Backend menentukan urutan; frontend tidak melakukan re-sort.
- Sort diterapkan di dalam setiap kelompok Task List dan setiap kolom Kanban.
- **Alasan:** memenuhi D-34, D-46, D-48, D-52, dan DET-06.
- **Alternatif ditolak:** reverse sort dan urutan manual Kanban; keduanya di luar MVP.

### 5. Pencarian, filter, dan state tampilan

- Pencarian memakai `LIKE` case-insensitive pada `title` dan `description`; jaminan hanya untuk ASCII. Deskripsi `NULL` tidak menghasilkan error.
- Filter kategori, status, dan prioritas bersifat single-select per dimensi; filter antar-dimensi digabung dengan AND; memilih nilai baru mengganti nilai lama pada dimensi yang sama.
- `Tanpa Kategori` adalah nilai filter kategori yang setara dengan `category_id IS NULL`, tersedia di Task List dan Kanban.
- State pencarian/filter/sort disimpan di state frontend per view, tidak di `localStorage`, dan direset saat berpindah view atau memuat ulang halaman.
- **Alasan:** memenuhi D-37, D-38, D-51, D-56, D-57, D-62, D-63, DET-12, dan DET-14.
- **Alternatif ditolak:** filter multi-select dan state global lintas view; keduanya tidak disepakati.

### 6. Validasi dan normalisasi

- Judul dan nama kategori di-trim sebelum validasi; kosong setelah trim ditolak.
- Deskripsi di-trim; kosong setelah trim disimpan sebagai `NULL`; jika diisi, disimpan sebagai plain text.
- Aturan panjang dan keunikan ditegakkan di frontend, backend, dan database.
- Backend adalah otoritas validasi; frontend memberi feedback lebih awal.
- **Alasan:** memenuhi D-17, D-35, D-49, D-50, D-54, dan DET-07.
- **Alternatif ditolak:** validasi hanya di frontend atau hanya di database.

### 7. Kontrak API

- Endpoint utama:
  - `GET /api/tasks` dengan query `search`, `category_id`, `status`, `priority`, `sort`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `DELETE /api/tasks/:id`
  - `GET /api/categories`
  - `POST /api/categories`
  - `PATCH /api/categories/:id`
  - `DELETE /api/categories/:id`
  - `GET /api/dashboard/stats`
- Respons sukses: `{ "success": true, "data": ... }`.
- Respons gagal: `{ "success": false, "message": "...", "errors": { "field": "..." } }`.
- HTTP status: `400` validasi, `404` tidak ditemukan, `409` duplikasi/konflik, `500` kesalahan tak terduga.
- **Alasan:** memenuhi D-59, DET-08, dan FR-22.
- **Alternatif ditolak:** respons tanpa envelope; menyulitkan penanganan error yang konsisten di frontend.

### 8. Migrasi dan pengujian

- Migrasi berupa file SQL bernomor berurutan dan dijalankan oleh migration runner backend.
- Unit test memakai Vitest; integration test memakai Supertest terhadap API dan database uji terpisah.
- Tidak ada gate minimum coverage.
- **Alasan:** memenuhi D-42 dan D-44.
- **Alternatif ditolak:** ORM dengan auto-migration; menambah dependensi dan menyulitkan kontrol urutan migrasi.

### 9. Penanganan tanggal

- Tanggal disimpan sebagai `YYYY-MM-DD`.
- Perbandingan overdue memakai tanggal lokal mesin aplikasi.
- Tanggal ditampilkan dalam format `DD/MM/YYYY` pada UI.
- **Alasan:** memenuhi D-08, D-32, A-01, A-02, dan DET-10.
- **Alternatif ditolak:** menyimpan timestamp lengkap; menambah kompleksitas zona waktu yang tidak diperlukan.

### 10. Resolusi DET-05..DET-14

| DET | Resolusi |
|---|---|
| DET-05 | Diperbarui D-64: Task List hanya menampilkan grup kategori yang memiliki tugas; grup kosong dan `Tanpa Kategori` tanpa tugas tidak tampil; Kanban tetap menampilkan semua kolom status kecuali filter status aktif. |
| DET-06 | Tie-breaker `created_at DESC` lalu `id DESC`, termasuk untuk deadline sama atau `NULL`. |
| DET-07 | Deskripsi di-trim; whitespace-only menjadi `NULL`. |
| DET-08 | `400` validasi, `404` tidak ditemukan, `409` konflik, `500` internal; sukses `{success:true,data}`. |
| DET-09 | Keunikan kategori case-insensitive hanya dijamin ASCII; non-ASCII dibandingkan apa adanya. |
| DET-10 | Simpan `YYYY-MM-DD`; tampilkan `DD/MM/YYYY`. |
| DET-11 | Alfabetis kategori tambahan memakai `Intl.Collator('id', { sensitivity: 'base' })`. |
| DET-12 | Sesi baru tanpa filter aktif dan tanpa pencarian. |
| DET-13 | Kategori baru dengan nama default yang pernah dihapus menjadi kategori tambahan (`is_default = 0`). |
| DET-14 | Filter direset per view; state tidak dibagi antara Task List dan Kanban. |

### 11. Keputusan D-64 dan D-65

| ID | Keputusan |
|---|---|
| D-64 | Task List hanya menampilkan grup kategori yang memiliki tugas; grup kosong dan `Tanpa Kategori` tanpa tugas tidak ditampilkan; urutan grup mengikuti D-58/D-60. |
| D-65 | Label UI status/prioritas menggunakan Bahasa Indonesia; enum database/API tetap bahasa Inggris. |

- Pemetaan label: `Todo` → `Belum Dikerjakan`, `In Progress` → `Sedang Dikerjakan`, `Done` → `Selesai`; `Low` → `Rendah`, `Medium` → `Sedang`, `High` → `Tinggi`, `Urgent` → `Mendesak`.
- Pemetaan dipusatkan di modul label frontend; backend dan database tidak menyimpan label terjemahan.
- **Alasan:** memenuhi D-53, D-64, dan D-65 tanpa mengubah kontrak data.
- **Alternatif ditolak:** menyimpan label terjemahan di database atau API; akan memecahkan filter dan kompatibilitas enum.

### 12. Pilihan implementasi tambahan

- Drag-and-drop memakai `@dnd-kit/core` karena ringan, mendukung React modern, dan tidak bergantung pada perilaku HTML5 drag-and-drop yang berbeda antar-browser.
- Verifikasi browser/responsif dilakukan manual di Chrome, Firefox, dan Edge pada ukuran desktop dan tablet; tidak ada dependency browser automation tambahan untuk MVP.

## Risks / Trade-offs

- **Case-insensitive hanya ASCII** → Dokumentasikan sebagai batasan MVP; gunakan `COLLATE NOCASE`/`lower()` dan uji dengan data ASCII.
- **Kolom Kanban kosong selalu tampil** → Dapat membuat tampilan ramai; mitigasi dengan pesan kosong yang ringkas dan konsisten.
- **Filter direset per view** → Pengguna harus memilih ulang saat berpindah view; ini keputusan DET-14 yang disepakati dan menghindari state global yang membingungkan.
- **Tanpa autentikasi** → Aplikasi tidak boleh diekspos ke jaringan publik; deployment lokal menjadi batasan MVP.
- **Drag-and-drop hanya mouse** → Pengguna keyboard tidak dapat memindahkan status lewat Kanban; status tetap dapat diubah melalui form edit.

## Migration Plan

1. Buat struktur proyek `client/` dan `server/`.
2. Buat migrasi awal untuk tabel `categories` dan `tasks`, termasuk constraint, foreign key, dan unique index.
3. Seed tiga kategori bawaan dalam migrasi atau proses inisialisasi pertama; pastikan idempoten.
4. Implementasikan backend, kontrak API, dan validasi.
5. Implementasikan frontend, lalu hubungkan ke API.
6. Tambahkan unit test dan integration test.
7. Jalankan aplikasi lokal dan verifikasi seluruh acceptance criteria.

Rollback: karena greenfield dan data lokal, rollback dilakukan dengan menghapus database lokal dan menjalankan ulang migrasi; tidak ada data produksi yang perlu dimigrasikan.

## Traceability

### Functional Requirements

| Requirement | Artifact |
|---|---|
| FR-01..FR-08 | `specs/task-management/spec.md` |
| FR-09 | `specs/dashboard/spec.md` |
| FR-10..FR-16 | `specs/task-views/spec.md` |
| FR-17 | `specs/task-management/spec.md` |
| FR-18 | `specs/platform-and-quality/spec.md` |
| FR-19 | `specs/task-views/spec.md`, `specs/category-management/spec.md` |
| FR-20 | `specs/task-views/spec.md` |
| FR-21 | `specs/task-management/spec.md`, `specs/category-management/spec.md` |
| FR-22 | `specs/api-contract/spec.md` |
| FR-23 | `specs/category-management/spec.md` |
| FR-24 | `specs/task-views/spec.md` |
| FR-25 | `specs/task-views/spec.md` |

### Non-Functional Requirements

| Requirement | Artifact |
|---|---|
| NFR-01, NFR-02 | `specs/platform-and-quality/spec.md` |
| NFR-03..NFR-05 | `specs/platform-and-quality/spec.md`; keputusan teknis di `design.md` bagian 1 dan 2 |
| NFR-06 | `specs/task-management/spec.md` |
| NFR-07, NFR-08 | `specs/platform-and-quality/spec.md` |
| NFR-09, NFR-10 | `specs/platform-and-quality/spec.md` |
| NFR-11, NFR-12 | `design.md` (batasan dan traceability) |
| NFR-13..NFR-16 | `specs/platform-and-quality/spec.md`, `specs/task-views/spec.md` |
| NFR-17 | `specs/platform-and-quality/spec.md` |
| NFR-18, NFR-19 | `specs/task-views/spec.md` |
| NFR-20 | `specs/category-management/spec.md` |
| NFR-21 | `specs/task-views/spec.md` |

### Business Rules

| Requirement | Artifact |
|---|---|
| BR-01..BR-08 | `specs/task-management/spec.md` |
| BR-09 | `specs/category-management/spec.md` |
| BR-10 | `specs/dashboard/spec.md` |
| BR-11, BR-12 | `specs/platform-and-quality/spec.md` |
| BR-13 | `specs/task-management/spec.md` |
| BR-14 | `specs/category-management/spec.md` |
| BR-15 | `specs/task-views/spec.md` |
| BR-16 | `specs/category-management/spec.md` |
| BR-17..BR-19 | `specs/task-views/spec.md` |
| BR-20..BR-22 | `specs/category-management/spec.md`, `specs/task-management/spec.md` |
| BR-23..BR-26 | `specs/task-views/spec.md` |
| BR-27 | `specs/task-management/spec.md` |
| BR-28 | `specs/dashboard/spec.md` |
| BR-29, BR-30 | `specs/task-views/spec.md`, `specs/category-management/spec.md` |
| BR-31..BR-34 | `specs/task-views/spec.md`, `specs/platform-and-quality/spec.md` |
| BR-35 | `specs/api-contract/spec.md` |
| BR-36 | `specs/task-views/spec.md` |
| BR-37 | `specs/category-management/spec.md` |
| BR-38..BR-40 | `specs/task-views/spec.md` |

### Acceptance Criteria

| Requirement | Artifact |
|---|---|
| AC-01..AC-07, AC-09..AC-13, AC-18..AC-28 | `specs/task-management/spec.md` |
| AC-08, AC-35..AC-37, AC-40, AC-44..AC-64, AC-72, AC-73, AC-77, AC-80..AC-87 | `specs/task-views/spec.md` |
| AC-14..AC-17, AC-29..AC-34, AC-38, AC-39, AC-78, AC-79 | `specs/category-management/spec.md` |
| AC-41..AC-43, AC-64 | `specs/dashboard/spec.md` |
| AC-65..AC-69, AC-70, AC-71, AC-76, AC-88..AC-90 | `specs/platform-and-quality/spec.md` |
| AC-74 | `specs/api-contract/spec.md` |
| AC-75 | `specs/category-management/spec.md`, `specs/platform-and-quality/spec.md` |

Catatan: AC-64 dipakai bersama oleh Kanban dan Dashboard karena menguji pengaruh filter Kanban terhadap statistik global.

### Constraints, Dependencies, Assumptions

- **C-01..C-27** dipetakan ke `design.md` (stack, arsitektur, batasan), `specs/platform-and-quality/spec.md`, `specs/api-contract/spec.md`, `specs/task-management/spec.md`, `specs/category-management/spec.md`, dan `specs/task-views/spec.md` sesuai tabel FR/NFR/BR di atas.
- **DEP-01..DEP-10, DEP-13..DEP-23** tercakup pada keputusan teknis di `design.md` dan akan menjadi langkah pada `tasks.md`.
- **DEP-11 (library DnD)** diselesaikan dengan `@dnd-kit/core`; **DEP-12 (lingkungan uji browser)** diselesaikan dengan verifikasi Chrome, Firefox, dan Edge pada desktop/tablet. Tidak ada open question yang memblokir implementasi.
- **A-01..A-26** dipertahankan sebagai asumsi yang mendasari desain; asumsi yang memengaruhi perilaku sudah dikonversi menjadi requirement atau resolusi DET.
- **D-64** dipetakan ke `specs/task-views/spec.md` (grouping Task List) dan `tasks.md` 7.2.
- **D-65** dipetakan ke `specs/platform-and-quality/spec.md` (label status/prioritas) dan `tasks.md` 11.1.
