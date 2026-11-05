# Proposal

## Why

Aplikasi Personal Task Manager sudah memiliki workspace yang lengkap, tetapi belum memiliki pintu masuk publik yang sesuai untuk deployment pada hosting/domain yang dapat diakses banyak orang. Workspace single-user saat ini tidak boleh diekspos kepada pengunjung publik sebelum authentication dan multi-user data isolation tersedia.

Perubahan ini menghadirkan landing page publik di `/` dan memisahkannya dari workspace di `/app`, tanpa mengimplementasikan authentication, backend, database, atau payment.

## What Changes

- Menambahkan public landing page di `/` dengan public shell yang terpisah dari app shell workspace.
- Memindahkan akses workspace ke `/app`; **BREAKING** untuk akses langsung workspace melalui `/`.
- Menambahkan landing marketing lengkap: hero, product preview, fitur, cara kerja, audiens/manfaat, pricing, FAQ, CTA, dan footer.
- Mengarahkan CTA utama landing ke section fitur/preview, bukan ke workspace.
- Memastikan landing tidak melakukan request API dashboard dan tidak me-mount workspace.
- Menambahkan `VITE_PUBLIC_DEPLOYMENT` sebagai deployment gate frontend. Pada build publik, `/app` dialihkan ke `/` dan workspace tidak di-mount.
- Mempertahankan workspace lokal/internal di `/app` dengan seluruh perilaku Dashboard, Task List, Kanban, dan Kategori yang sudah ada.
- Menambahkan pricing satu paket `Gratis` tanpa payment, serta mengganti testimoni/social proof fiktif dengan bagian audiens/manfaat yang faktual.
- Menambahkan metadata landing, navigasi publik mobile, aksesibilitas, dan layout responsif.
- Tidak menambahkan authentication, backend, database, payment, atau dependency baru.

## Capabilities

### New Capabilities

- `public-landing`: Landing page publik di `/`, konten marketing, public shell, CTA ke section fitur/preview, isolasi dari API dashboard, dan perilaku responsif/aksesibel.

### Modified Capabilities

- `ui-foundation`: Membedakan public shell untuk landing dari workspace shell yang memakai sidebar, header, dan drawer.
- `platform-and-quality`: Membatasi workspace single-user pada deployment lokal/internal dan menetapkan batas deployment publik.

## Impact

- **Frontend:** `client/src/App.jsx`, route helper/hook baru, ekstraksi workspace, komponen landing, komponen brand/link, ikon, styling landing, dan metadata `client/index.html`.
- **Deployment:** Build publik memakai `VITE_PUBLIC_DEPLOYMENT=true`. Flag ini hanya deployment gate frontend, bukan security boundary.
- **Backend/API:** Tidak ada perubahan endpoint, payload, kontrak respons, atau kode backend. Backend/API workspace tidak boleh diekspos pada deployment publik dalam change ini.
- **Database:** Tidak ada perubahan skema, migrasi, atau data.
- **Authentication:** Tidak ada implementasi authentication atau multi-user data isolation. Workspace publik tetap memerlukan change terpisah.
- **Dependencies:** Tidak menambah runtime dependency baru. Routing memakai History API; ikon memakai inline SVG.
- **Tes:** Test yang ada harus tetap lulus. Diperlukan unit test untuk route resolver dan verifikasi manual untuk build publik/lokal, aksesibilitas, responsivitas, serta regresi workspace.

## Asumsi dan Batasan

- Deployment publik pada change ini hanya menyajikan aset landing statis. Backend/API workspace tidak boleh diekspos publik.
- `VITE_PUBLIC_DEPLOYMENT` hanya mengatur perilaku frontend; flag ini bukan authentication, bukan otorisasi, dan bukan security boundary.
- Build lokal/default mempertahankan akses `/app` dan perilaku workspace single-user yang ada.
- Landing tidak menampilkan klaim data lokal, privasi terjamin, cloud sync, kolaborasi, atau multi-user.
- Landing tidak menampilkan testimoni, logo klien, atau social proof fiktif.
- Pricing hanya satu paket `Gratis`; tidak ada payment atau alur sign-up.
- Landing tetap client-rendered; SSR/prerender dan optimasi SEO lanjutan di luar scope.
- Workspace tetap berbasis state internal untuk Dashboard, List, Kanban, dan Kategori; nested routing workspace tidak termasuk perubahan ini.
- API contract, database schema, migration, authentication, dan backend tidak berubah.
