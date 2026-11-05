# Design

## Context

Lihat `proposal.md` untuk motivasi dan `specs/` untuk kontrak perilaku.

Kondisi saat ini:

- `client/src/App.jsx` memegang seluruh state workspace, fetching data, view Dashboard/List/Kanban/Kategori, modal, toast, dan filter.
- Belum ada router. Navigasi workspace memakai state `view` dan `AppShell` dengan sidebar/drawer.
- `client/src/api.js` hanya mendefinisikan fungsi request; tidak ada request saat modul diimpor.
- Express saat ini menyajikan `client/dist` dan melakukan SPA fallback untuk `GET` non-`/api`.
- Target deployment berubah menjadi hosting/domain publik, sementara workspace single-user belum boleh diekspos sebelum authentication dan multi-user data isolation tersedia.
- Tidak ada authentication, isolasi data antar-pengguna, atau gate akses workspace saat ini.
- Tidak boleh ada perubahan backend, database, authentication, atau dependency pada change ini.

Batasan desain: landing page harus dapat diuji tanpa backend workspace, workspace lokal harus tetap berfungsi, dan deployment gate frontend tidak boleh disalahartikan sebagai security boundary.

## Goals / Non-Goals

**Goals:**

- Memisahkan landing page publik dari workspace pada level route dan shell.
- Memastikan landing tidak memuat workspace atau memanggil API dashboard.
- Menyediakan deployment gate frontend yang mencegah workspace di-mount pada build publik.
- Menyediakan landing marketing lengkap dengan konten yang jujur dan dapat diverifikasi.
- Mempertahankan seluruh perilaku workspace lokal yang sudah ada.
- Menjaga aksesibilitas, responsivitas, dan konsistensi visual dengan design system yang ada.

**Non-Goals:**

- Tidak mengimplementasikan authentication, otorisasi, session, multi-user data isolation, atau payment.
- Tidak mengubah backend, API, database, migration, atau deployment server workspace.
- Tidak mengekspos workspace atau API workspace pada deployment publik.
- Tidak menambahkan router, state library, UI framework, atau dependency baru.
- Tidak membuat SSR/prerender atau optimasi SEO lanjutan.
- Tidak menambahkan nested routing untuk Dashboard/List/Kanban/Kategori.
- Tidak mengubah logika fetching, filter, grouping, sort, CRUD, atau drag-and-drop workspace.
- Tidak membuat testimoni, logo klien, atau social proof fiktif.

## Decisions

### 1. Route switch tanpa dependency

- `client/src/App.jsx` dijadikan route switch tipis.
- Isi `App.jsx` saat ini dipindahkan ke `AppWorkspace.jsx` tanpa mengubah logika workspace.
- Route resolver murni memetakan `/` ke landing, `/app` ke workspace lokal, dan path tidak dikenal ke landing.
- Resolver menerima mode deployment sehingga perilaku `/app` dapat diuji tanpa bergantung pada `window`.
- Navigasi memakai History API dan listener `popstate`; `pushState` memberi sinyal perubahan route agar UI diperbarui.
- Alternatif ditolak: React Router menambah dependency dan memperluas scope; hash routing bentrok dengan anchor landing; state-only tanpa URL tidak mendukung deep link dan deployment gate yang dapat diuji.

### 2. Deployment gate frontend

- `VITE_PUBLIC_DEPLOYMENT` adalah build-time flag. Nilai aktif berarti build publik.
- Pada mode publik, `/app` dialihkan ke `/` dan `AppWorkspace` tidak di-mount.
- Pada mode lokal/default, `/app` tetap menampilkan workspace.
- Flag ini hanya deployment gate frontend. Flag ini bukan authentication, bukan otorisasi, dan bukan security boundary.
- Deployment publik pada change ini hanya menyajikan aset landing statis. Backend/API workspace tidak boleh diekspos publik.
- Dokumentasi deployment harus menyatakan batas ini secara eksplisit dan menyertakan checklist bahwa endpoint workspace tidak dapat diakses.
- Alternatif ditolak: deteksi hostname rapuh dan sulit diuji; middleware backend melanggar batasan change; password gate menyerupai authentication dan memperluas scope.

### 3. Pemisahan public shell dan workspace shell

- Landing memakai `LandingPage` dengan header dan footer publik sendiri.
- Workspace tetap memakai `AppShell`, sidebar, header, dan drawer yang ada.
- `AppShell` tidak diberi mode landing; mencampur kedua shell akan menambah percabangan dan risiko regresi.
- Brand diekstrak menjadi komponen presentasional agar header publik dan workspace konsisten.
- Token visual, `Button`, `Badge`, `Card`/`Panel`, dan `Icon` boleh dipakai bersama.
- Landing tidak mengimpor `AppWorkspace`, `api.js`, atau komponen dashboard yang membutuhkan data.
- Skip link dimiliki oleh masing-masing shell/halaman agar tidak ada skip link ganda.

### 4. Konten landing

- Struktur: header publik, hero, product preview statis, fitur, cara kerja, audiens/manfaat, pricing, FAQ, CTA, footer.
- CTA utama memakai anchor ke `#fitur` atau `#preview`, bukan `/app`.
- Product preview memakai data statis dan komponen presentasional; tidak ada fetch.
- Pricing hanya satu paket `Gratis`; tidak ada payment atau sign-up.
- Testimoni dan social proof fiktif tidak digunakan. Bagian audiens/manfaat menjelaskan untuk siapa produk ini tanpa mengarang bukti.
- Copy tidak mengklaim data lokal, privasi terjamin, cloud sync, kolaborasi, atau multi-user.
- FAQ menjelaskan bahwa akses workspace publik menunggu authentication dan multi-user data isolation.
- Navigasi mobile landing memakai disclosure yang aksesibel, bukan drawer workspace.
- Alternatif ditolak: menampilkan multi-tier pricing atau testimoni placeholder akan melanggar keputusan konten jujur.

### 5. Styling dan responsif

- Tambahkan layer `client/src/styles/landing.css` yang diimpor setelah layer yang ada.
- Gunakan prefix `.landing-*` untuk menghindari tabrakan dengan style workspace.
- Reuse token warna, spacing, radius, shadow, focus ring, dan `prefers-reduced-motion`.
- Header landing boleh sticky; section anchor memakai `scroll-margin-top`.
- Layout landing memakai grid yang menumpuk satu kolom pada mobile.
- Tidak menambahkan font eksternal, aset gambar wajib, atau dependency styling.

### 6. Aksesibilitas dan metadata

- Landing memiliki satu `h1`, landmark `header`/`main`/`footer`, serta skip link.
- Navigasi mobile mengekspos `aria-expanded`/`aria-controls`, mendukung Escape, dan mengembalikan fokus ke tombol.
- FAQ memakai kontrol native `<details>`/`<summary>` agar dapat dioperasikan keyboard tanpa state library.
- Perpindahan route memindahkan scroll ke atas dan fokus ke heading utama.
- Metadata landing didefinisikan pada `index.html`; judul halaman workspace tidak ditampilkan pada landing.
- Tidak ada alur login, sign-up, atau waitlist pada landing.

### 7. Verifikasi

- Tambahkan unit test murni untuk route resolver: `/`, `/app`, trailing slash, path tidak dikenal, mode lokal, dan mode publik.
- Verifikasi build lokal dan build publik secara terpisah.
- Verifikasi network landing tidak memanggil API dashboard.
- Verifikasi `/app` pada build publik dialihkan dan workspace tidak di-mount.
- Verifikasi workspace lokal tetap berperilaku sama dan seluruh test yang ada lulus.
- Verifikasi manual browser, viewport 360px/390px, keyboard, FAQ, navigasi mobile, reduced motion, dan anchor sticky header.
- Tidak menambahkan React Testing Library, jsdom, Playwright, atau dependency test baru.

## Risks / Trade-offs

- **Flag deployment salah konfigurasi** → Tambahkan unit test resolver untuk mode publik/lokal, build publik eksplisit, dan checklist deployment.
- **Gate disalahartikan sebagai security boundary** → Dokumentasikan berulang bahwa `VITE_PUBLIC_DEPLOYMENT` hanya gate frontend; deployment publik hanya menyajikan landing dan tidak mengekspos API workspace.
- **Backend/API tetap terekspos secara operasional** → Checklist deployment wajib memverifikasi endpoint workspace tidak dapat diakses; bukan tanggung jawab kode frontend.
- **Hosting statis mengembalikan 404 untuk `/app` sebelum route guard berjalan** → Konfigurasikan SPA fallback ke `index.html` pada hosting publik agar `/app` mencapai gate dan dialihkan; jika hosting mengembalikan 404, workspace tetap tidak tersedia, tetapi perilaku redirect harus diverifikasi sesuai spec.
- **SEO client-rendered terbatas** → Dicatat sebagai limitasi; SSR/prerender di luar scope.
- **Konten marketing melebih-lebihkan produk** → Review konten terhadap acceptance criteria: tanpa testimoni, tanpa klaim data lokal, pricing gratis tunggal, FAQ jujur.
- **CSS landing bertabrakan dengan workspace** → Gunakan prefix `.landing-*` dan import layer terpisah; audit selector sebelum implementasi.
- **Skip link ganda** → Satu skip link per shell/halaman dan satu `main` id yang valid.
- **Regresi workspace saat ekstraksi `AppWorkspace`** → Pindahkan kode tanpa perubahan logika, jalankan test client/server, dan verifikasi manual alur utama.
- **Navigasi mobile landing tidak aksesibel** → Gunakan disclosure sederhana, uji keyboard/Escape/focus, dan jangan reuse drawer workspace.
- **Bundle publik masih memuat modul workspace** → Bukan security boundary; workspace tetap tidak di-mount dan API tidak diekspos. Code splitting dapat dipertimbangkan pada change terpisah.

## Migration Plan

1. Tambahkan route resolver, hook pathname, dan unit test; verifikasi mode lokal/publik tanpa mengubah workspace.
2. Tambahkan public shell, landing sections, brand/link, skip link, dan pastikan landing tidak mengimpor API/workspace.
3. Ekstrak isi `App.jsx` menjadi `AppWorkspace.jsx`, lalu jadikan `App.jsx` route switch dan terapkan deployment gate; verifikasi workspace lokal tetap berjalan.
4. Isi konten marketing lengkap dan verifikasi tidak ada klaim atau bukti sosial fiktif.
5. Tambahkan styling, metadata, navigasi mobile, dan perbaikan aksesibilitas/responsif.
6. Jalankan test, build lokal, build publik, dan verifikasi network/direct URL.
7. Deploy hanya aset landing publik; pastikan backend/API workspace tidak diekspos.
8. Rollback: revert perubahan frontend per langkah. Tidak ada migration database atau data. Jika gate publik bermasalah, blokir `/app` dan API pada konfigurasi hosting sebelum deploy ulang.

## Open Questions

Tidak ada. Limitasi SEO/SSR dan kemungkinan code splitting dicatat sebagai non-goal atau change lanjutan, bukan pertanyaan yang mengubah spec, pendekatan, atau task breakdown.
