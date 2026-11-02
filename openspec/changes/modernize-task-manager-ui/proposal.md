# Proposal

## Why

Fitur Personal Task Manager sudah lengkap dan teruji, tetapi antarmukanya masih memakai layout tab bertema terang yang belum mencerminkan produk productivity modern. Perubahan ini meningkatkan kualitas visual, konsistensi, responsivitas, dan aksesibilitas tanpa mengubah perilaku fitur yang sudah berjalan.

## What Changes

- Menambahkan design system **Modern Dark** berbasis CSS custom properties: warna, tipografi, spacing, radius, elevasi, fokus, dan state visual.
- Mengganti header + tab horizontal menjadi **app shell** dengan sidebar navigasi yang dapat di-collapse di desktop dan menjadi **drawer** di perangkat mobile.
- Memodernisasi **Dashboard** dengan KPI, completion rate turunan dari statistik yang ada, serta visualisasi distribusi status dan prioritas.
- Memodernisasi **Task List** dengan hierarki informasi yang lebih jelas, header grup yang konsisten, dan kartu tugas yang lebih mudah dipindai.
- Memodernisasi **Kanban** dengan kolom dan kartu yang lebih rapi, aksen status, drop zone yang jelas, serta scroll horizontal internal pada area Kanban di mobile.
- Menyamakan pola **Category Management**, toolbar filter, modal, dialog konfirmasi, dan toast dengan design system baru.
- Menambahkan state loading, empty, error, dan success yang lebih jelas, termasuk skeleton dan feedback operasi.
- Menambahkan fondasi aksesibilitas: focus visible, focus trap drawer/modal, restore focus, `aria-expanded`, `aria-live`, kontras WCAG AA, dan dukungan `prefers-reduced-motion`.
- Menjaga seluruh perilaku yang sudah ada: grouping, search, filter, sort, overdue, drag-and-drop, kategori bawaan, validasi, dialog hapus, dan label Bahasa Indonesia.

Tidak ada perubahan breaking.

## Capabilities

### New Capabilities

- `ui-foundation`: Design system Modern Dark, token visual, app shell, sidebar collapsible, drawer mobile, header, komponen primitif, state antarmuka, preferensi tampilan sidebar, dan fondasi aksesibilitas.

### Modified Capabilities

- `task-views`: Presentasi Task List, Kanban, toolbar filter, dan state tampilan berubah; perilaku grouping, filter, sort, dan drag-and-drop tetap sama.
- `dashboard`: Presentasi KPI, completion rate, dan visualisasi distribusi berubah; sumber data dan angka tetap memakai statistik global yang ada.
- `category-management`: Presentasi daftar, inline edit, badge bawaan, validasi, dan konfirmasi hapus disamakan dengan design system; perilaku CRUD tetap sama.
- `platform-and-quality`: Menambahkan dukungan layout mobile, kontras tema gelap, pengurangan animasi, dan jaminan preservasi perilaku/API/database/teknologi.

## Impact

- **Kode frontend:** `client/src/App.jsx`, seluruh komponen di `client/src/components/`, `client/src/styles.css`, dan `client/index.html`. Modul murni seperti `api.js`, `labels.js`, `constants.js`, dan `grouping.js` dipertahankan; helper baru hanya boleh bersifat presentasional.
- **API:** Tidak ada perubahan endpoint, payload, atau kontrak respons. Dashboard tetap memakai `GET /api/dashboard/stats` dengan field `total`, `byStatus`, dan `byPriority`.
- **Database:** Tidak ada perubahan skema, migrasi, atau data.
- **Dependencies:** Tidak menambah runtime dependency. Ikon memakai inline SVG; styling tetap CSS; font memakai stack sistem yang sudah ada.
- **Teknologi:** React 19 + Vite 8, Express 5, SQLite, dan `better-sqlite3` tidak berubah.
- **Tes:** Seluruh test yang ada harus tetap lulus. Verifikasi UI dilakukan manual di desktop, tablet, dan mobile; tidak ada gate coverage baru.

## Asumsi dan Batasan

- Tema gelap menjadi satu-satunya tema pada perubahan ini; toggle light/dark di luar scope.
- Sidebar desktop dapat di-collapse dan preferensi collapsed/expanded disimpan di `localStorage` dengan key `ptm.ui.sidebarCollapsed`; state pencarian, filter, dan sort tetap tidak persisten.
- Pada mobile, sidebar menjadi drawer off-canvas dengan tombol hamburger, backdrop, dukungan Escape, dan otomatis tertutup setelah navigasi.
- Navigasi tetap berbasis state di `App.jsx`; tidak menambahkan router atau dependency navigasi.
- Ikon memakai inline SVG; tidak menambahkan icon library atau dependency baru.
- Kanban di mobile memakai scroll horizontal hanya pada area Kanban; halaman tidak boleh mengalami overflow horizontal dan drag-and-drop tetap dipertahankan.
- Implementasi bersifat incremental dan tidak melakukan rewrite aplikasi; React, Vite, Express, SQLite, dan `better-sqlite3` tetap digunakan.
- API contract, database schema, migration, dan backend tidak berubah. Tidak ada dependency baru yang tidak diperlukan.
- Tidak ada metrik Dashboard baru seperti overdue count karena API statistik tidak menyediakannya.
- Verifikasi visual dilakukan manual; tidak menambahkan React Testing Library, jsdom, Playwright, atau dependency test baru.
