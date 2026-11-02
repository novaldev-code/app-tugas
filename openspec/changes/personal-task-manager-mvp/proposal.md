# Proposal

## Why

Proyek ini membutuhkan aplikasi Personal Task Manager MVP yang dapat dipakai sendiri untuk mengelola tugas harian, sekaligus menjadi sarana belajar Spec-Driven Development. Saat ini belum ada implementasi maupun spesifikasi utama, sehingga seluruh perilaku produk perlu ditetapkan lebih dulu agar desain, implementasi, dan pengujian tidak menyimpang dari keputusan yang sudah disepakati.

## What Changes

- Menambahkan aplikasi web single-user tanpa autentikasi untuk mengelola tugas, kategori, prioritas, dan deadline.
- Menambahkan CRUD tugas dengan status `Todo`, `In Progress`, dan `Done`; status `Done` dapat dikembalikan ke status sebelumnya.
- Menambahkan kategori opsional dengan tiga kategori bawaan (`Pribadi`, `Pekerjaan`, `Belajar`), identitas bawaan permanen, dan urutan kategori deterministik.
- Menambahkan indikator overdue berbasis tanggal lokal.
- Menambahkan Dashboard statistik global per status dan prioritas.
- Menambahkan Task List yang dikelompokkan per kategori serta Kanban tiga kolom dengan drag-and-drop mouse.
- Menambahkan search, filter single-select per dimensi, dan dua mode sort dengan backend sebagai sumber kebenaran urutan.
- Menambahkan validasi berlapis frontend/backend/database, normalisasi input, serta kontrak respons API yang konsisten.
- Menambahkan pemetaan label status dan prioritas ke Bahasa Indonesia tanpa mengubah enum internal database/API.
- Menetapkan batasan platform: React + Vite, Node.js + Express, SQLite + `better-sqlite3`, migrasi SQL bernomor, Vitest, dan Supertest.

Tidak ada perubahan breaking karena proyek masih greenfield dan belum memiliki implementasi.

## Capabilities

### New Capabilities

- `task-management`: Siklus hidup tugas, field tugas, transisi status, deadline/overdue, validasi dan normalisasi input, penghapusan permanen, serta persistensi data.
- `category-management`: Kategori bawaan, CRUD kategori, identitas `is_default`, urutan `sort_order`, keunikan nama, dan perilaku penghapusan kategori.
- `task-views`: Task List dan Kanban, grouping, urutan, drag-and-drop, search, filter, sort, serta state loading/empty/error dalam Bahasa Indonesia.
- `dashboard`: Statistik global jumlah tugas per status dan prioritas yang tidak terpengaruh filter tampilan.
- `api-contract`: Bentuk respons sukses/error dan pemetaan HTTP status untuk seluruh operasi API.
- `platform-and-quality`: Platform lokal single-user, dukungan browser dan layout, pengujian otomatis, migrasi database, serta batasan kualitas MVP.

### Modified Capabilities

Tidak ada. Proyek belum memiliki capability pada `openspec/specs/`.

## Impact

- **Kode:** seluruh frontend React + Vite, backend Express, akses SQLite, dan test suite merupakan kode baru.
- **API:** endpoint CRUD tugas dan kategori, statistik Dashboard, serta kontrak error/sukses baru.
- **Database:** skema `tasks` dan `categories`, foreign key `ON DELETE SET NULL`, unique index case-insensitive, dan migrasi bernomor.
- **Dependencies:** React, Vite, Express, `better-sqlite3`, Vitest, Supertest, serta library drag-and-drop yang belum dipilih.
- **Operasional:** aplikasi dijalankan lokal tanpa autentikasi; deployment online dan auth berada di luar MVP.

## Catatan Review

- Seluruh artifact dibangun dari keputusan **D-01..D-65**. D-64 dan D-65 diintegrasikan sebelum implementasi.
- **D-64**: Task List hanya menampilkan grup kategori yang memiliki tugas; grup kosong dan `Tanpa Kategori` tanpa tugas tidak ditampilkan.
- **D-65**: Label UI status/prioritas menggunakan Bahasa Indonesia, sedangkan enum database/API tetap `Todo`, `In Progress`, `Done`, `Low`, `Medium`, `High`, dan `Urgent`.
- Resolusi **DET-05..DET-14** yang disetujui saat penguncian keputusan dipakai sebagai keputusan desain dan dicatat pada `design.md`; DET-05 diperbarui oleh D-64.
- OPEN-01..OPEN-13 dan DET-01..DET-04 sudah resolved.
