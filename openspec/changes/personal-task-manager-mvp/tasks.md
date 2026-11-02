# Tasks

## 1. Review Keputusan Terbuka

- [x] 1.1 Integrasikan D-64 dan D-65 ke proposal, design, specs, dan tasks; verifikasi `openspec validate personal-task-manager-mvp --strict` valid.
- [x] 1.2 Terapkan pemetaan label status/prioritas D-65 di UI tanpa mengubah enum database/API; verifikasi label tampil Bahasa Indonesia dan payload API tetap bahasa Inggris.
- [x] 1.3 Gunakan `@dnd-kit/core` untuk drag-and-drop serta verifikasi browser manual di Chrome, Firefox, dan Edge; catat pilihan di `design.md`.
- [x] 1.4 Verifikasi tidak ada Open Question yang tersisa sebelum implementasi dimulai; `design.md` tidak lagi memuat pertanyaan yang memblokir.

## 2. Scaffolding Proyek

- [x] 2.1 Buat struktur `client/` (React + Vite) dan `server/` (Express); verifikasi kedua direktori memiliki entry point yang dapat dijalankan.
- [x] 2.2 Tambahkan dependencies frontend, backend, `better-sqlite3`, Vitest, dan Supertest; verifikasi instalasi berhasil tanpa error.
- [x] 2.3 Tambahkan skrip menjalankan aplikasi, migrasi, unit test, dan integration test; verifikasi setiap skrip dapat dipanggil dari root repository.
- [x] 2.4 Tambahkan konfigurasi environment lokal untuk path database dan port API; verifikasi aplikasi dapat dijalankan tanpa konfigurasi rahasia.

## 3. Database dan Migrasi

- [x] 3.1 Buat migration runner dan folder migrasi bernomor; verifikasi database baru menerapkan migrasi berurutan (AC-89).
- [x] 3.2 Buat migrasi tabel `categories` dengan `name`, `is_default`, `sort_order`, `created_at`, unique index case-insensitive, dan CHECK nama; verifikasi constraint menolak nama kosong/whitespace-only (AC-15, AC-20, AC-21).
- [x] 3.3 Buat migrasi tabel `tasks` dengan field, CHECK panjang, CHECK status/prioritas, foreign key `ON DELETE SET NULL`, dan indeks yang dibutuhkan; verifikasi constraint menolak data invalid (AC-19, AC-23, AC-24).
- [x] 3.4 Aktifkan `PRAGMA foreign_keys = ON`; verifikasi penghapusan kategori mengubah `category_id` tugas menjadi `NULL` (AC-34).
- [x] 3.5 Implementasikan seed kategori bawaan yang idempoten; verifikasi restart tidak menduplikasi kategori (AC-29, AC-30).
- [x] 3.6 Implementasikan query urutan kategori (`is_default`, `sort_order`, alfabetis tambahan, `Tanpa Kategori` terakhir); verifikasi urutan grouping dan dropdown (AC-37, AC-38, AC-39, AC-78, AC-79).

## 4. Backend Tugas

- [x] 4.1 Implementasikan aturan validasi/normalisasi bersama untuk judul dan deskripsi; verifikasi unit test batas panjang, trim, whitespace-only, dan deskripsi kosong menjadi `NULL` (AC-11, AC-12, AC-13, AC-20, AC-21, AC-22).
- [x] 4.2 Implementasikan endpoint create/read/update tugas; verifikasi integration test pembuatan, perubahan field, status default, dan kategori opsional (AC-01..AC-05).
- [x] 4.3 Implementasikan transisi status termasuk `Done` ke `Todo`/`In Progress`; verifikasi perhitungan overdue dihitung ulang (AC-06, AC-07).
- [x] 4.4 Implementasikan endpoint hapus tugas permanen; verifikasi integration test penghapusan dan ketiadaan restore (AC-09, AC-10).
- [x] 4.5 Implementasikan perhitungan overdue berbasis tanggal lokal; verifikasi test deadline kemarin/hari ini/kosong dan status `Done` (AC-25..AC-28).
- [x] 4.6 Implementasikan query search judul+deskripsi ASCII case-insensitive; verifikasi test judul, deskripsi, huruf besar, dan deskripsi `NULL` (AC-44..AC-47, AC-77).
- [x] 4.7 Implementasikan filter single-select per dimensi dan AND, termasuk `Tanpa Kategori`; verifikasi test kombinasi filter pada kedua view (AC-35, AC-36, AC-48, AC-62, AC-83..AC-86).
- [x] 4.8 Implementasikan dua mode sort dengan tie-breaker `created_at DESC, id DESC` dan `deadline ASC, NULL terakhir`; verifikasi test urutan dan larangan reverse (AC-49..AC-53, AC-59, AC-60, AC-63).
- [x] 4.9 Implementasikan filter status Kanban yang menyembunyikan kolom non-terpilih; verifikasi test hanya kolom terpilih yang dikembalikan/ditampilkan (AC-80, AC-81).
- [x] 4.10 Implementasikan kontrak respons sukses/error dan pemetaan HTTP `400/404/409/500`; verifikasi integration test envelope dan status (AC-74).

## 5. Backend Kategori

- [x] 5.1 Implementasikan endpoint daftar, create, update, dan delete kategori; verifikasi integration test CRUD dan validasi nama (AC-14..AC-17, AC-31).
- [x] 5.2 Implementasikan keunikan nama case-insensitive dengan pengecualian record sendiri; verifikasi test duplikat create/update dan perubahan kapitalisasi sendiri (AC-16, AC-17).
- [x] 5.3 Implementasikan dialog/endpoint hapus kategori yang mempertahankan tugas; verifikasi test konfirmasi, pembatalan, dan `category_id = NULL` (AC-32..AC-34).
- [x] 5.4 Implementasikan pembuatan ulang nama kategori bawaan yang sudah dihapus sebagai kategori tambahan; verifikasi test `is_default = 0` dan urutan alfabetis (DET-13).

## 6. Backend Dashboard

- [x] 6.1 Implementasikan query statistik global per status dan prioritas; verifikasi test menghitung semua tugas termasuk `Done` (AC-41, BR-28).
- [x] 6.2 Pastikan statistik tidak menerima parameter search/filter dari Task List atau Kanban; verifikasi angka tidak berubah saat filter aktif (AC-42, AC-43, AC-64).

## 7. Frontend Task List

- [x] 7.1 Buat API client dan state data tugas/kategori tanpa `localStorage`; verifikasi pemuatan data dan penanganan error.
- [x] 7.2 Implementasikan grouping per kategori yang hanya menampilkan grup berisi tugas, menyembunyikan grup kosong dan `Tanpa Kategori` tanpa tugas, serta menjaga urutan grup; verifikasi setiap tugas hanya di satu kelompok dan `Tanpa Kategori` terakhir (AC-37, AC-40, D-64, DET-05).
- [x] 7.3 Implementasikan form tambah/ubah tugas dengan validasi dan pesan Bahasa Indonesia; verifikasi batas panjang, trim, kategori opsional, dan status default (AC-01..AC-05, AC-11..AC-13, AC-20..AC-22).
- [x] 7.4 Implementasikan dialog hapus tugas `Batal`/`Hapus`; verifikasi pembatalan dan penghapusan permanen (AC-09, AC-10, AC-75).
- [x] 7.5 Implementasikan search, filter single-select, `Tanpa Kategori`, dan indikator filter aktif; verifikasi hasil AND dan penggantian nilai per dimensi (AC-35, AC-36, AC-48, AC-83..AC-87).
- [x] 7.6 Implementasikan pilihan sort dan tampilkan urutan dari backend tanpa re-sort; verifikasi dua mode dan tie-breaker (AC-49..AC-53).
- [x] 7.7 Implementasikan tampilan overdue dan status `Done`; verifikasi tugas `Done` tetap tampil dan overdue dihitung ulang setelah transisi (AC-06, AC-08, AC-25..AC-28).

## 8. Frontend Kanban

- [x] 8.1 Implementasikan tiga kolom status, empty column, dan drag-and-drop mouse; verifikasi perubahan status tersimpan dan tidak ada urutan manual (AC-56..AC-58).
- [x] 8.2 Implementasikan filter status yang hanya menampilkan kolom terpilih; verifikasi kolom lain tersembunyi dan tanpa filter ketiga kolom tampil (AC-80, AC-81).
- [x] 8.3 Implementasikan search/filter/sort Kanban dan `Tanpa Kategori`; verifikasi hasil lintas kolom serta urutan per kolom (AC-61..AC-63, AC-82).
- [x] 8.4 Pastikan filter Kanban tidak mengubah Dashboard; verifikasi angka statistik tetap (AC-64).

## 9. Frontend Dashboard

- [x] 9.1 Implementasikan tampilan statistik per status dan prioritas; verifikasi angka sesuai data dan mencakup `Done` (AC-41).
- [x] 9.2 Implementasikan pemisahan state Dashboard dari filter Task List/Kanban; verifikasi statistik tidak berubah saat filter aktif (AC-42, AC-43).

## 10. Frontend Kategori

- [x] 10.1 Implementasikan UI daftar, tambah, ubah, dan hapus kategori dengan dialog `Batal`/`Hapus`; verifikasi kategori bawaan dapat diubah/dihapus (AC-29..AC-34, AC-75).
- [x] 10.2 Implementasikan urutan kategori pada grouping dan dropdown, termasuk rename kategori bawaan; verifikasi posisi tetap setelah restart (AC-37..AC-39, AC-78, AC-79).
- [x] 10.3 Implementasikan pembuatan ulang nama kategori default yang dihapus; verifikasi kategori baru tampil sebagai tambahan (DET-13).

## 11. UI/UX dan Bahasa

- [x] 11.1 Pusatkan seluruh string UI Bahasa Indonesia dan pemetaan label D-65 pada satu modul; verifikasi status tampil `Belum Dikerjakan`/`Sedang Dikerjakan`/`Selesai`, prioritas tampil `Rendah`/`Sedang`/`Tinggi`/`Mendesak`, dan tidak ada label utama berbahasa Inggris (AC-65..AC-67, AC-69, AC-76).
- [x] 11.2 Implementasikan state loading, empty, error, dan feedback sukses/gagal; verifikasi setiap state tampil jelas (AC-65, AC-66, AC-69).
- [x] 11.3 Implementasikan layout responsif desktop dan tablet; verifikasi seluruh fitur utama dapat digunakan pada kedua ukuran (AC-68).
- [x] 11.4 Pastikan tidak ada state pencarian/filter/sort di `localStorage` dan state direset per view serta saat reload; verifikasi perilaku sesi baru (AC-72, AC-73, DET-12, DET-14).

## 12. Integration dan Verifikasi Akhir

- [x] 12.1 Jalankan seluruh unit test Vitest dan integration test Supertest; verifikasi tidak ada kegagalan dan tidak ada gate coverage (AC-71).
- [x] 12.2 Verifikasi persistensi data setelah restart server; pastikan tugas dan kategori tetap ada (AC-70).
- [x] 12.3 Verifikasi aplikasi berjalan di Chrome, Firefox, dan Edge serta dapat diakses tanpa login (AC-88, AC-90).
- [x] 12.4 Lakukan walkthrough acceptance criteria AC-01..AC-90 dan catat hasilnya; verifikasi setiap AC memiliki bukti uji atau observasi.
- [x] 12.5 Perbarui dokumentasi menjalankan aplikasi, migrasi, dan test; verifikasi perintah pada dokumentasi berjalan sesuai tulisan.

## Workflow follow-up

- Arsipkan change setelah seluruh task selesai dan review disetujui.
- Verifikasi hasil arsip dan pastikan spesifikasi utama diperbarui.
