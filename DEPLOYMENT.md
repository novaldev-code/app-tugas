# Deployment Production — Vercel Full-Stack

Arsitektur production:

- Frontend React + Vite → Vercel
- Backend Express 5 → Vercel Functions (`api/[...path].js`)
- Database → Neon PostgreSQL
- Repository → GitHub
- Monorepo npm workspaces

Frontend dan backend berada pada **satu project Vercel** dan satu origin:

```text
https://app-tugas.vercel.app
```

Semua request frontend ke `/api/*` ditangani Vercel Function pada origin yang sama.

## 1. Struktur deployment

```text
/
├── api/[...path].js       # adapter Express untuk Vercel Function
├── client/                 # React + Vite
├── server/                 # Express app, auth, repository
├── vercel.json             # konfigurasi project Vercel
└── package.json            # npm workspaces
```

Vercel project menggunakan **root repository**, bukan `client/`.

- Install Command: `npm ci`
- Build Command: `npm run build -w client`
- Output Directory: `client/dist`
- Framework Preset: Vite
- Function Region: pilih region terdekat dengan Neon production (Singapore jika tersedia)

`client/vercel.json` adalah konfigurasi frontend-only lama dan tidak dipakai pada project full-stack. File konfigurasi lama dipertahankan sampai konfigurasi root terbukti bekerja.

## 2. Neon PostgreSQL

Production database sudah dimigrasikan (4 applied, 0 pending). Jangan menjalankan migration dari Vercel Function.

Gunakan dua connection string:

- `DATABASE_URL` — pooled, untuk runtime Function.
- `DATABASE_URL_UNPOOLED` — direct, hanya untuk migration/status manual.

Jangan menjalankan reset, drop, truncate, importer, seed, atau migration tanpa alasan. Snapshot/branch backup tetap disimpan sampai rollback window ditutup.

Jika perlu memeriksa status migration secara read-only:

```bash
read -rsp 'Direct Neon production URL: ' DATABASE_URL_UNPOOLED; echo
export DATABASE_URL_UNPOOLED
npm run db:migrate:status -w server
unset DATABASE_URL_UNPOOLED
```

Jangan menjalankan `npm run db:migrate` kecuali ada migration baru yang sudah diaudit.

## 3. Environment Variables Vercel

Tambahkan melalui Vercel Project Settings → Environment Variables. Jangan menaruh secret di repository.

### Backend Function

| Key | Nilai |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled production |
| `DATABASE_URL_UNPOOLED` | Neon direct production |
| `CORS_ORIGIN` | `https://app-tugas.vercel.app` |
| `SESSION_TTL_HOURS` | `168` |
| `AUTH_COOKIE_SECURE` | `true` |
| `AUTH_COOKIE_SAME_SITE` | `Lax` |
| `AUTH_COOKIE_NAME` | `ptm_session` |

`DATABASE_URL_UNPOOLED` saat ini masih diperlukan karena `loadServerConfig` memvalidasinya. Variabel ini tidak dipakai oleh Function untuk koneksi runtime, tetapi harus tersedia agar konfigurasi valid.

### Frontend build

| Key | Nilai |
|---|---|
| `VITE_PUBLIC_DEPLOYMENT` | `true` |
| `VITE_API_URL` | kosong |

`VITE_API_URL` harus kosong agar frontend memakai same-origin `/api`.

## 4. Routing Vercel

- `api/[...path].js` menangani seluruh `/api/*`.
- `vercel.json` mengarahkan SPA fallback ke `index.html`, tetapi tidak menangkap `/api`.
- Frontend memakai route client-side `/`, `/login`, `/register`, dan `/app`.
- Function memakai Express app yang sudah ada; tidak ada perubahan kontrak endpoint.

Setelah deploy, verifikasi di Vercel Preview bahwa:

1. `GET /api/health` masuk ke Function dan mengembalikan `200`.
2. `GET /api/tasks` tanpa sesi mengembalikan `401`, bukan HTML `index.html`.
3. `/login`, `/register`, dan `/app` dimuat sebagai SPA.
4. `/api/*` tidak pernah diarahkan ke `index.html`.

## 5. Session, CORS, dan CSRF

Karena frontend dan backend satu origin:

- Cookie sesi memakai `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- Tidak memakai `SameSite=None` dan tidak memakai localStorage.
- CORS credentials diaktifkan oleh backend.
- `CORS_ORIGIN` harus persis `https://app-tugas.vercel.app` tanpa trailing slash.
- Request mutasi tetap memerlukan `Origin` yang sesuai dan token CSRF.
- Preview deployment Vercel memiliki origin berbeda. Jika menguji auth di Preview, tambahkan origin preview tersebut secara eksplisit ke `CORS_ORIGIN`; wildcard tidak didukung.

## 6. Database pool di runtime

`api/[...path].js` membuat `pg.Pool` pada module scope dengan `max: 1`, sehingga koneksi tidak dibuka ulang pada setiap request dan tetap dapat dipakai ulang selama Function instance hangat.

Migration tidak dijalankan oleh Function.

## 7. Build dan verifikasi lokal

```bash
npm ci
npm test
npm run build
openspec validate --all --strict
```

Build frontend production dengan konfigurasi Vercel:

```bash
VITE_PUBLIC_DEPLOYMENT=true npm run build -w client
```

## 8. Checklist deployment Vercel

1. Import repository `novaldev-code/app-tugas` ke Vercel.
2. Pilih branch `main`.
3. Set Root Directory ke root repository (bukan `client`).
4. Framework Preset: Vite.
5. Install Command: `npm ci`.
6. Build Command: `npm run build -w client`.
7. Output Directory: `client/dist`.
8. Tambahkan environment variables di atas.
9. Deploy dan tunggu status **Ready**.
10. Buka `https://app-tugas.vercel.app`.
11. Uji health, register, login, logout, `/app`, CRUD, dan isolasi dua akun.

## 9. Rollback

- Jangan drop/reset database production.
- Simpan snapshot/branch Neon sebelum perubahan berisiko.
- Rollback aplikasi dengan mengembalikan deployment Vercel ke revisi sebelumnya.
- Jika rollback database diperlukan, pulihkan snapshot/branch Neon.
