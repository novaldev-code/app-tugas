# Tasks

## 1. Fondasi desain dan styling

- [x] 1.1 Tambahkan token desain Modern Dark (warna, tipografi, spacing, radius, elevasi, focus ring) dan pecah stylesheet menjadi layer tokens/base/layout/components/views; verifikasi `npm run build -w client` berhasil dan tampilan lama masih terbaca.
- [x] 1.2 Terapkan base theme gelap, `color-scheme: dark`, style fokus, scrollbar, dan `prefers-reduced-motion`; verifikasi dengan keyboard dan emulasi reduced motion di browser.
- [x] 1.3 Perbarui metadata tema di `client/index.html`; verifikasi warna browser chrome dan tidak ada referensi tema terang yang tersisa.
- [x] 1.4 Audit referensi class lama sebelum rename dan pertahankan nama class yang masih dipakai; verifikasi dengan pencarian referensi dan build client.

## 2. Layout shell dan navigasi

- [x] 2.1 Buat konfigurasi navigasi bersama untuk Dashboard, Daftar Tugas, Kanban, dan Kategori; verifikasi sidebar dan drawer membaca daftar yang sama.
- [x] 2.2 Buat komponen `AppShell`, `Sidebar`, `MobileDrawer`, `PageHeader`, dan `SkipLink`; verifikasi keempat view dapat dibuka tanpa reload.
- [x] 2.3 Integrasikan `AppShell` ke `App.jsx` tanpa memindahkan logika fetching/filter; verifikasi `npm run test -w client` tetap lulus.
- [x] 2.4 Implementasikan sidebar collapsible dengan preferensi `ptm.ui.sidebarCollapsed` dan fallback aman saat storage gagal; verifikasi status bertahan setelah reload dan filter/sort tidak tersimpan.
- [x] 2.5 Implementasikan drawer off-canvas mobile dengan hamburger, backdrop, Escape, scroll lock, pengembalian fokus, dan penutupan otomatis setelah navigasi; verifikasi pada viewport 390px.
- [x] 2.6 Tambahkan header responsif dan skip link; verifikasi navigasi keyboard dapat mencapai konten utama.

## 3. Komponen primitif dan state

- [x] 3.1 Buat primitif `Button`, `Badge`, `Card`, `Panel`, dan `Field` dengan varian serta focus state; verifikasi setiap varian tampil konsisten.
- [x] 3.2 Buat komponen `Icon` berbasis inline SVG untuk navigasi dan aksi; verifikasi tidak ada runtime dependency ikon baru di `package.json`.
- [x] 3.3 Buat `Skeleton`, `EmptyState`, dan `Toast` dengan varian sukses/gagal; verifikasi state tampil dan toast hilang otomatis.
- [x] 3.4 Buat hook/utility `useFocusTrap` untuk modal dan drawer; verifikasi Tab/Shift+Tab tetap di dalam panel dan fokus kembali saat ditutup.
- [x] 3.5 Migrasikan komponen fitur ke primitif tanpa mengubah handler atau props; verifikasi `npm run test -w client` lulus dan tidak ada handler yang hilang.

## 4. Dashboard

- [x] 4.1 Ubah KPI Dashboard menjadi kartu total dan per status dari `total` dan `byStatus`; verifikasi nilainya sama dengan respons API.
- [x] 4.2 Ekstrak helper completion rate dari `byStatus.Done` dan `total`, lalu tambahkan unit test untuk total nol dan total positif; verifikasi `npm run test -w client` lulus.
- [x] 4.3 Tambahkan visualisasi distribusi status dan prioritas yang menyertakan label/teks aksesibel; verifikasi tidak ada field atau endpoint API baru.
- [x] 4.4 Tambahkan skeleton, error dengan aksi coba lagi, dan empty state Dashboard; verifikasi ketiga state secara manual.

## 5. Task List, filter, dan Kanban

- [x] 5.1 Perbarui presentasi Task List dengan header grup dan kartu hierarkis; verifikasi desktop dan mobile tanpa overflow horizontal.
- [x] 5.2 Ekstrak `TaskBadges`, `TaskMeta`, dan `TaskActions` untuk dipakai Task List dan Kanban; verifikasi prioritas, kategori, deadline, serta aksi tampil konsisten.
- [x] 5.3 Perbarui toolbar filter agar responsif tanpa mengubah state/query; verifikasi pencarian, filter AND, sort, dan reset berperilaku sama.
- [x] 5.4 Perbarui kolom, kartu, handle drag, dan drop zone Kanban tanpa mengubah `DndContext` atau `handleDragEnd`; verifikasi drag antar kolom tetap mengubah status.
- [x] 5.5 Atur Kanban mobile mempertahankan tiga kolom dengan scroll horizontal hanya pada area Kanban; verifikasi viewport 360px/390px tidak membuat halaman overflow dan scroll internal berfungsi.
- [x] 5.6 Verifikasi drag-and-drop tetap berfungsi pada Kanban desktop dan mobile setelah container scroll ditambahkan.
- [x] 5.7 Perbarui penanda overdue dan state loading/empty pada Task List serta Kanban; verifikasi tampil sesuai data dan tetap dapat diakses.

## 6. Kategori dan modal

- [x] 6.1 Perbarui baris kategori, badge Bawaan, aksi Ubah/Hapus, dan form inline dengan primitif; verifikasi CRUD kategori berjalan sama.
- [x] 6.2 Tampilkan error validasi inline serta toast sukses/gagal kategori; verifikasi input tidak hilang saat validasi gagal.
- [x] 6.3 Terapkan primitif dan focus trap pada `TaskModal` serta `ConfirmDialog`; verifikasi Escape, backdrop, dan pengembalian fokus.
- [x] 6.4 Verifikasi dialog hapus kategori tetap meminta konfirmasi dan membatalkan tanpa perubahan data.

## 7. Aksesibilitas dan responsif

- [x] 7.1 Audit kontras teks, badge, tombol, dan focus ring terhadap WCAG AA pada permukaan gelap; verifikasi dengan tool kontras dan perbaiki nilai token yang gagal.
- [x] 7.2 Tambahkan label ARIA, `aria-expanded`, `aria-controls`, `aria-modal`, dan `aria-live` yang belum ada; verifikasi dengan keyboard dan accessibility inspector.
- [x] 7.3 Uji layout pada 360px, 390px, 768px, 1024px, dan 1440px; verifikasi halaman tidak overflow horizontal, area Kanban dapat di-scroll horizontal secara internal, dan semua aksi utama dapat dijangkau.
- [x] 7.4 Uji `prefers-reduced-motion` dan pastikan tidak ada informasi yang hanya disampaikan melalui animasi; verifikasi dengan emulasi browser.

## 8. Regression dan verifikasi akhir

- [x] 8.1 Jalankan `npm run test -w server` dan `npm run test -w client`; verifikasi seluruh 52 test yang ada tetap lulus.
- [x] 8.2 Jalankan `npm run build -w client`; verifikasi build selesai tanpa error baru.
- [x] 8.3 Verifikasi alur lama di Chrome, Firefox, dan Edge: grouping, pencarian, filter AND, sort, overdue, CRUD tugas/kategori, dialog hapus, modal, DnD, dan Dashboard.
- [x] 8.4 Verifikasi state loading, empty, error, success, dan busy pada Dashboard, Task List, Kanban, dan Kategori.
- [x] 8.5 Periksa diff untuk memastikan implementasi incremental, tidak ada rewrite aplikasi, serta tidak ada perubahan kontrak API, skema database, migrasi, backend, atau runtime dependency baru; verifikasi dengan `git diff` dan `git diff --stat`.

## Workflow follow-up

- Setelah implementasi dan review selesai, arsipkan perubahan dengan workflow OpenSpec.
- Verifikasi hasil arsip dan pastikan spec utama diperbarui.
