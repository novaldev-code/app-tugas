# Design

## Context

Lihat `proposal.md` untuk motivasi dan `specs/` untuk kontrak perilaku. Kondisi saat ini:

- `client/src/App.jsx` memegang view state, data fetching, modal, toast, dan filter per view.
- `client/src/styles.css` adalah satu file global 1.018 baris dengan token tema terang dan style seluruh komponen.
- Tidak ada router, UI framework, icon library, atau TypeScript.
- `client/src/api.js`, `labels.js`, `constants.js`, dan `grouping.js` adalah modul murni yang sudah diuji.
- Backend, kontrak API, skema database, dan migrasi tidak boleh berubah.
- Test yang ada: 41 test server dan 11 test client; tidak ada test render komponen.

Batasan desain: modernisasi harus incremental, mempertahankan class/behavior yang sudah bekerja, dan tidak menambah runtime dependency.

## Goals / Non-Goals

**Goals:**

- Menetapkan token dan arsitektur CSS yang dapat dipakai ulang tanpa mengubah struktur data.
- Menetapkan komposisi app shell, sidebar, drawer, header, dan komponen primitif.
- Menjaga logika fetching, filter, grouping, sort, dan drag-and-drop tetap di tempatnya.
- Menetapkan strategi responsif, aksesibilitas, dan verifikasi regresi.
- Menjaga perubahan dapat di-rollback per langkah tanpa migrasi data.

**Non-Goals:**

- Tidak menambah router, state library, UI framework, icon library, atau font eksternal.
- Tidak mengubah `api.js` atau kontrak API.
- Tidak menambah metrik Dashboard baru.
- Tidak menambahkan keyboard drag-and-drop.
- Tidak membuat theme toggle atau light mode.
- Tidak menambahkan test framework/komponen baru.
- Tidak melakukan rewrite aplikasi; perubahan dilakukan incremental pada komponen dan styling yang ada.
- Tidak mengubah backend, skema database, atau migration.

## Decisions

### 1. Token dan arsitektur styling

- Gunakan CSS custom properties di `:root` untuk warna, tipografi, spacing, radius, elevation, dan focus ring.
- Targetkan kontras WCAG AA untuk teks normal, teks besar, kontrol, dan focus ring pada permukaan tema gelap.
- Pecah `styles.css` menjadi layer yang diimpor berurutan: `tokens`, `base`, `layout`, `components`, `views`. Entry point tetap satu agar urutan cascade deterministik.
- Pertahankan nama class yang sudah ada selama refactor; class baru ditambahkan hanya untuk komponen baru. Rename class dilakukan terpisah dan diverifikasi dengan pencarian referensi.
- **Alasan:** CSS murni sudah dipakai, tidak menambah dependency, dan memungkinkan migrasi bertahap.
- **Alternatif ditolak:** Tailwind/CSS-in-JS/UI kit; mengubah teknologi dan menambah risiko regresi besar.

### 2. Struktur komponen

- Tambahkan komponen layout: `AppShell`, `Sidebar`, `MobileDrawer`, `PageHeader`, dan `SkipLink`.
- Tambahkan primitif UI: `Button`, `Badge`, `Card`, `Panel`, `Field`, `EmptyState`, `Skeleton`, `Toast`, `Icon`.
- Pertahankan `TaskList`, `KanbanBoard`, `Dashboard`, `CategoriesView`, `Filters`, `TaskModal`, dan `ConfirmDialog` sebagai komponen fitur.
- Ekstrak bagian presentasional yang dipakai bersama, misalnya `TaskBadges`, `TaskMeta`, dan `TaskActions`, tanpa memindahkan logika data atau DnD.
- **Alasan:** memisahkan shell, primitif, dan fitur membuat perubahan visual terisolasi dari perilaku.
- **Alternatif ditolak:** rewrite seluruh komponen; risiko regresi terlalu tinggi untuk perubahan UI.

### 3. Navigasi dan state

- Navigasi tetap berbasis state `view` di `App.jsx`; daftar view dipindahkan ke konfigurasi kecil (`navigation.js`) agar sidebar dan drawer berbagi sumber yang sama.
- `AppShell` mengelola state drawer mobile dan sidebar collapse.
- Preferensi collapse hanya menyimpan UI state di `localStorage` dengan key `ptm.ui.sidebarCollapsed`, dengan fallback ke expanded jika storage tidak tersedia; pencarian, filter, dan sort tidak ikut disimpan.
- State pencarian, filter, dan sort tetap di memori dan tetap direset per view.
- Drawer off-canvas ditutup otomatis saat view berubah, saat backdrop diklik, atau saat Escape ditekan.
- **Alasan:** memenuhi sidebar/drawer tanpa menambah router atau mengubah kontrak state filter yang sudah disepakati.
- **Alternatif ditolak:** menambah React Router; mengubah arsitektur dan menambah dependency yang tidak diperlukan.

### 4. Layout responsif

- ≥1200px: sidebar expanded, konten maksimal, padding lega.
- 1024–1199px: sidebar collapsed sebagai default visual; label tetap tersedia melalui tooltip/aria-label.
- <900px: sidebar diganti drawer; header menampilkan tombol menu.
- <640px: konten satu kolom, filter bertumpuk atau panel, modal full-width dengan padding aman, toast memenuhi lebar layar.
- Kanban mobile mempertahankan tiga kolom dan memakai scroll horizontal pada container Kanban saja; halaman utama tidak boleh mengalami overflow horizontal.
- Drag-and-drop tetap berjalan pada Kanban mobile selama pointer digunakan, dengan area scroll yang tidak memblokir sensor drag.
- **Alasan:** menjaga seluruh fitur dapat dipakai tanpa overflow halaman dan tanpa mengubah mental model Kanban.
- **Alternatif ditolak:** menumpuk kolom vertikal atau horizontal scroll halaman penuh; keduanya mengubah cara Kanban dipindai dan berpotensi menimbulkan overflow.

### 5. Dashboard

- Gunakan hanya `total`, `byStatus`, dan `byPriority` dari `GET /api/dashboard/stats`.
- Completion rate dihitung di frontend sebagai `byStatus.Done / total`; jika total nol, tampilkan 0%.
- KPI dan visualisasi tetap menampilkan angka sebagai teks/label agar dapat diakses tanpa mengandalkan warna atau animasi.
- **Alasan:** memenuhi visualisasi baru tanpa mengubah API atau menambah metrik yang tidak tersedia.
- **Alternatif ditolak:** menambah endpoint statistik overdue; melanggar batasan kontrak API.

### 6. Task List, Kanban, dan filter

- Task List tetap memakai `groupTasks` dan urutan dari backend; perubahan hanya pada markup, class, dan komposisi visual.
- Kanban tetap memakai `@dnd-kit/core` dan `handleDragEnd` yang ada; perubahan hanya pada wrapper visual, card, dan drop zone.
- Toolbar filter tetap memanggil `onChange` yang sama; layout responsif tidak mengubah query atau state shape.
- **Alasan:** meminimalkan area perubahan dan menjaga test/perilaku yang sudah ada.
- **Alternatif ditolak:** refactor logika filter/grouping; tidak diperlukan untuk perubahan visual.

### 7. State dan feedback

- Tambahkan skeleton untuk Dashboard, Task List, dan Kanban; empty state tetap memakai CTA yang ada.
- Error state tetap menyediakan tombol “Coba lagi”.
- Toast diberi varian sukses/gagal tanpa mengubah durasi atau sumber pesan.
- Tombol yang sedang memproses tetap memakai label sibuk yang sudah ada.
- **Alasan:** state yang lebih jelas tanpa menambah state machine atau library baru.

### 8. Aksesibilitas

- Tambahkan `useFocusTrap` untuk modal dan drawer: simpan elemen fokus sebelumnya, fokuskan panel, tangani Tab/Shift+Tab, dan kembalikan fokus saat ditutup.
- Gunakan `aria-expanded` dan `aria-controls` pada kontrol sidebar/drawer; `aria-modal` pada panel; `aria-live="polite"` pada toast/loading.
- Tambahkan skip link ke konten utama dan pastikan focus ring memakai token kontras.
- Hormati `prefers-reduced-motion` dengan mengurangi transisi/animasi non-esensial.
- **Alasan:** memenuhi requirement aksesibilitas tanpa mengubah alur bisnis.
- **Alternatif ditolak:** menambah library aksesibilitas; tidak perlu untuk kebutuhan ini.

### 9. Verifikasi

- Jalankan seluruh test yang ada (`npm test`) dan build Vite.
- Verifikasi manual di Chrome, Firefox, dan Edge pada desktop, tablet, dan mobile.
- Periksa kontras WCAG AA, state loading, empty, error, success, dan busy; periksa DnD, filter, modal, drawer, serta navigasi keyboard.
- Pastikan halaman tidak overflow horizontal pada mobile dan hanya container Kanban yang memiliki scroll horizontal internal.
- Jika helper presentasional baru diekstrak (misalnya completion rate atau konfigurasi navigasi), tambahkan unit test murni tanpa dependency baru.
- **Alasan:** tidak ada test render komponen; verifikasi manual adalah kontrol utama untuk regresi visual.

## Risks / Trade-offs

- **DnD rusak karena perubahan wrapper/scroll** → Pertahankan `DndContext`, sensor, dan ID; uji drag pada sidebar expanded/collapsed dan Kanban mobile.
- **Class CSS lama bertabrakan dengan style baru** → Pertahankan nama class lama selama migrasi, audit referensi sebelum rename, dan uji per view.
- **Kontras badge/status rendah di tema gelap** → Uji kontras teks dan badge terhadap permukaan; gunakan token semantik, bukan warna acak.
- **Preferensi sidebar dianggap melanggar larangan localStorage** → Batasi key hanya untuk preferensi UI dan dokumentasikan bahwa filter/sort tetap tidak persisten.
- **Overflow horizontal di mobile** → Uji 360px/390px; gunakan `min-width: 0`, `max-width: 100%`, dan container scroll hanya untuk Kanban.
- **Focus trap bentrok dengan modal dan drawer** → Gunakan satu hook/utility, uji Escape dan restore focus pada kedua panel.
- **Tidak ada test komponen** → Tambahkan test fungsi murni bila ada helper baru; andalkan checklist verifikasi manual.
- **Font Inter tidak benar-benar dimuat** → Pertahankan stack sistem yang ada; jangan menambah font eksternal atau dependency font.

## Migration Plan

1. Tambahkan token dan layer CSS; pastikan tampilan lama masih berfungsi.
2. Tambahkan komponen layout dan primitif tanpa mengganti fitur.
3. Pindahkan `App.jsx` ke `AppShell`; tambahkan sidebar, drawer, dan header.
4. Modernisasi Dashboard, lalu Task List, Kanban, Kategori, filter, dan modal.
5. Tambahkan state skeleton, aksesibilitas, dan penyesuaian responsif.
6. Jalankan test, build, dan verifikasi browser/viewport.
7. Rollback: revert commit per langkah; tidak ada migrasi database atau perubahan data.

## Open Questions

Tidak ada. Keputusan yang tersisa bersifat visual dan dapat diselesaikan saat implementasi tanpa mengubah spec, pendekatan, atau task breakdown.
