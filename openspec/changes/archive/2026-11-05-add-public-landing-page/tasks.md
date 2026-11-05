# Tasks

## 1. Fondasi routing dan deployment gate

- [x] 1.1 Tambahkan helper route murni untuk `/`, `/app`, trailing slash, path tidak dikenal, mode lokal, dan mode publik; verifikasi unit test baru lulus dengan `npm run test -w client`.
- [x] 1.2 Tambahkan hook pathname dan helper navigasi berbasis History API yang menangani `pushState`, `popstate`, dan back/forward; verifikasi helper dengan unit test atau pengecekan manual bahwa pathname dan event navigasi diperbarui, lalu verifikasi integrasi direct load di task 3.2.
- [x] 1.3 Tambahkan pembacaan `VITE_PUBLIC_DEPLOYMENT` dengan default mode lokal; verifikasi unit test memastikan mode publik mengarahkan `/app` ke `/` dan mode lokal mempertahankan `/app`.
- [x] 1.4 Dokumentasikan build publik, flag `VITE_PUBLIC_DEPLOYMENT`, sifat gate sebagai frontend-only, dan kewajiban tidak mengekspos backend/API workspace pada deployment publik; verifikasi perintah build dan checklist deployment di README dapat dijalankan sesuai dokumentasi.

## 2. Public shell dan struktur landing

- [x] 2.1 Ekstrak komponen `Brand` dari sidebar/drawer dan tambahkan primitif `Link`; verifikasi workspace tetap menampilkan brand yang sama dan `npm run test -w client` tetap lulus.
- [x] 2.2 Buat `PublicHeader`, `PublicMobileNav`, dan `PublicFooter` tanpa sidebar/drawer workspace; verifikasi navigasi mobile dapat dibuka/ditutup dengan keyboard, Escape, dan anchor.
- [x] 2.3 Buat `LandingPage` dengan kerangka section dan `ProductPreview` statis; verifikasi landing tidak mengimpor `api.js` atau `AppWorkspace` dan tidak memiliki tautan `/app`.
- [x] 2.4 Tetapkan skip link dan `main` milik landing; verifikasi setiap halaman landing/workspace memiliki tepat satu skip link dan satu `main` dengan id tujuan valid.

## 3. Integrasi workspace dan route switch

- [x] 3.1 Pindahkan isi `App.jsx` saat ini ke `AppWorkspace.jsx` tanpa mengubah logika fetching, filter, modal, toast, atau DnD; verifikasi test client/server yang ada tetap lulus.
- [x] 3.2 Jadikan `App.jsx` route switch yang menampilkan landing di `/` dan workspace di `/app`; verifikasi direct load, back/forward, dan path tidak dikenal berperilaku sesuai spec.
- [x] 3.3 Terapkan deployment gate publik sehingga `/app` dialihkan ke `/` dan `AppWorkspace` tidak di-mount; verifikasi build publik tidak memanggil API dashboard dan build lokal tetap membuka workspace.
- [x] 3.4 Pastikan landing berada di public shell dan workspace tetap memakai `AppShell`; verifikasi tidak ada sidebar/drawer workspace pada landing dan tidak ada regresi shell pada workspace lokal.

## 4. Konten marketing landing

- [x] 4.1 Isi hero dan CTA utama dengan anchor ke `#preview` atau `#fitur`; verifikasi tidak ada CTA yang mengarah ke `/app`.
- [x] 4.2 Isi section fitur, cara kerja, dan product preview statis; verifikasi preview tidak melakukan request API dan tidak memakai data dashboard.
- [x] 4.3 Ganti testimoni/social proof dengan section audiens/manfaat yang faktual; verifikasi tidak ada testimoni, logo klien, angka pengguna, atau bukti sosial fiktif.
- [x] 4.4 Isi pricing dengan satu paket `Gratis`; verifikasi tidak ada payment, multi-tier pricing, sign-up, atau waitlist.
- [x] 4.5 Isi FAQ dengan status akses workspace yang jujur dan gunakan kontrol native yang aksesibel; verifikasi FAQ dapat dioperasikan keyboard dan tidak mengasumsikan authentication sudah tersedia.
- [x] 4.6 Isi footer tanpa tautan palsu ke halaman legal atau workspace; verifikasi seluruh copy bebas dari klaim data lokal, privasi terjamin, cloud sync, kolaborasi, dan multi-user, serta tidak ada form login, sign-up, atau waitlist.

## 5. Styling, responsif, dan aksesibilitas

- [x] 5.1 Tambahkan `landing.css` dengan token yang ada dan prefix `.landing-*`; verifikasi build client berhasil dan style workspace tidak berubah.
- [x] 5.2 Sesuaikan layout landing untuk 360px, 390px, tablet, dan desktop; verifikasi tidak ada overflow horizontal dan section tetap dapat dibaca.
- [x] 5.3 Tambahkan `scroll-margin-top` untuk anchor sticky header, urutan heading yang logis, focus visible, kontras WCAG AA, dan dukungan `prefers-reduced-motion`; verifikasi dengan keyboard dan emulasi browser.
- [x] 5.4 Perbarui metadata `index.html` dan judul landing; verifikasi judul/deskripsi menggambarkan landing publik dan tidak membocorkan data workspace.
- [x] 5.5 Verifikasi navigasi mobile landing memakai state ARIA yang sesuai, menutup saat anchor/Escape, dan mengembalikan fokus ke tombol menu.

## 6. Verifikasi integrasi

- [x] 6.1 Jalankan `npm test` dan `npm run test:integration`; verifikasi seluruh test server/client/integration yang ada lulus.
- [x] 6.2 Jalankan `npm run build` dan build publik dengan `VITE_PUBLIC_DEPLOYMENT=true`; verifikasi kedua build berhasil tanpa error baru.
- [x] 6.3 Verifikasi build publik melalui preview/static hosting dengan SPA fallback ke `index.html`: `/` menampilkan landing, `/app` dialihkan ke `/`, workspace tidak di-mount, dan network tidak memanggil API dashboard.
- [x] 6.4 Verifikasi workspace lokal di `/app`: Dashboard, Task List, Kanban, Kategori, modal, dialog hapus, filter, dan DnD tetap berperilaku seperti sebelumnya.
- [x] 6.5 Verifikasi landing di Chrome, Firefox, dan Edge pada viewport 360px, 390px, 768px, 1024px, dan 1440px; periksa keyboard, FAQ, navigasi mobile, anchor, skip link, dan reduced motion.
- [x] 6.6 Periksa source dan diff untuk memastikan tidak ada tautan `/app` di landing, tidak ada import API/workspace pada landing, dan tidak ada perubahan backend, database, authentication, payment, atau dependency; verifikasi dengan pencarian referensi dan `git diff`.
- [x] 6.7 Jalankan `openspec validate add-public-landing-page --strict`; verifikasi perubahan valid dan seluruh artefak konsisten.

## Workflow follow-up

- Review proposal, design, spec deltas, dan tasks sebelum Apply.
- Setelah implementasi dan review selesai, jalankan workflow Apply, lalu arsipkan change dan verifikasi hasil arsip.
