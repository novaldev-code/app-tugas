# Verification Notes

Tanggal verifikasi: 1 November 2026

Lingkungan:

- Node.js `v24.16.0`, npm `11.13.0`
- Linux, Chromium dan Firefox melalui Playwright, Microsoft Edge portable
- Database verifikasi memakai file sementara di `/tmp/opencode/`; database aplikasi default tidak diubah

## Automated Tests

| Perintah | Hasil |
|---|---|
| `npm run test -w server` | 3 file, 41 test lulus |
| `npm run test -w client` | 2 file, 11 test lulus |
| `npm test` | Semua test server dan client lulus |
| `npm run build -w client` | Build Vite berhasil |
| `npm run migrate` (dua kali) | Idempotent; tidak ada migrasi ganda |
| `npm run test:integration` | Test API dan persistensi lulus |

Cakupan otomatis utama:

- `server/test/api.test.js`: CRUD tugas dan kategori, validasi, status/prioritas, kategori opsional, filter, pencarian, sort, overdue, dashboard, kontrak respons, dan error handling.
- `server/test/persistence.test.js`: tugas dan kategori yang diubah tetap ada setelah database dibuka ulang; rename kategori default tidak mengubah posisi; seed tidak terduplikasi.
- `server/src/validation.test.js`: trim, batas panjang, tanggal, enum, dan perhitungan overdue.
- `client/src/labels.test.js`: pemetaan label Bahasa Indonesia, format tanggal, dan class status/prioritas.
- `client/src/grouping.test.js`: pengelompokan Task List, penyembunyian grup kosong, dan `Tanpa Kategori`.

## Runtime and Browser Walkthrough

Verifikasi manual/otomatis melalui browser melakukan alur berikut:

1. Dashboard awal tampil dengan hitungan nol dan empty state.
2. Tambah tugas dengan judul, deskripsi, prioritas, tenggat, dan kategori; tugas muncul di Task List dan dashboard.
3. Edit tugas, ubah status dan field lain; perubahan tampil di Task List dan Kanban.
4. Pencarian judul/deskripsi dan filter kategori/status/prioritas bekerja; filter digabung dengan AND.
5. Sort default dan sort tenggat bekerja; backend menjadi sumber urutan.
6. Drag-and-drop Kanban memindahkan tugas dari `In Progress` ke `Done`; statistik dashboard diperbarui.
7. Filter status Kanban menyembunyikan kolom status lain, sementara statistik dashboard tetap global.
8. Tambah, edit, dan hapus kategori; dialog konfirmasi menyediakan `Batal` dan `Hapus`.
9. Tugas dari kategori yang dihapus menjadi `Tanpa Kategori`.
10. Hapus tugas melalui dialog konfirmasi; dashboard dan kedua view diperbarui.
11. Restart server mempertahankan data.
12. Aplikasi dapat diakses tanpa login.

Browser yang lulus alur lengkap: Chromium, Firefox, dan Microsoft Edge.

Pemeriksaan responsif pada `1280x900`, `1024x768`, `820x1180`, dan `768x1024`: tidak ada overflow horizontal; tab, tombol tambah, filter, kolom Kanban, dan dialog tetap dapat digunakan.

## Acceptance Criteria Evidence

Nomor AC dipetakan ke artifact melalui rentang pada `design.md`. Setiap rentang berikut memiliki bukti test otomatis dan/atau observasi browser; seluruh AC di dalam rentang tercakup.

| Acceptance Criteria | Bukti |
|---|---|
| AC-01..AC-07, AC-09..AC-13, AC-18..AC-28 | Test validasi dan API untuk create/read/update, status default, kategori opsional, prioritas, deskripsi, dan tanggal; walkthrough tambah/edit tugas di browser |
| AC-08, AC-35..AC-37, AC-40, AC-44..AC-64, AC-72, AC-73, AC-77, AC-80..AC-87 | Test API filter/pencarian/sort/overdue; `grouping.test.js`; walkthrough Task List, Kanban, drag-and-drop, filter status, empty state, dan state filter per view |
| AC-14..AC-17, AC-29..AC-34, AC-38, AC-39, AC-78, AC-79 | Test CRUD kategori, urutan, rename default, hapus kategori, dan persistensi; walkthrough tambah/edit/hapus kategori serta `Tanpa Kategori` |
| AC-41..AC-43, AC-64 | Test statistik dashboard dan pengaruh filter Kanban; walkthrough hitungan dashboard |
| AC-65..AC-69, AC-70, AC-71, AC-76, AC-88..AC-90 | Test persistensi dan label; observasi UI Bahasa Indonesia, format tanggal, tanpa login, serta verifikasi Chromium/Firefox/Edge dan responsif |
| AC-74 | Test kontrak respons sukses/gagal dan status HTTP |
| AC-75 | Walkthrough dialog konfirmasi dengan tombol `Batal` dan `Hapus` |

## Catatan

- Tidak ada acceptance criteria yang tersisa tanpa bukti uji atau observasi.
- Playwright dipakai sebagai harness verifikasi eksternal di `/tmp/opencode/`; tidak ditambahkan sebagai dependency aplikasi.
- Tidak ada coverage gate; cakupan diverifikasi melalui daftar test dan walkthrough di atas.
