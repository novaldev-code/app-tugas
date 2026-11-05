# Deployment Production

Panduan ini disiapkan untuk arsitektur:

- Frontend React + Vite → Vercel
- Backend Express 5 → Render
- Database Neon PostgreSQL
- Repository GitHub (monorepo npm workspaces)

Tidak ada secret nyata di repository. Semua nilai rahasia diisi melalui dashboard provider.

## 1. Topologi cookie yang direkomendasikan

Gunakan salah satu topologi **first-party cookie** berikut.

### Opsi A — domain same-site (direkomendasikan)

Gunakan custom domain dari registrable domain yang sama:

- Frontend: `https://app.example.com`
- Backend: `https://api.example.com`

Konfigurasi:

- Render `CORS_ORIGIN=https://app.example.com`
- Vercel `VITE_API_URL=https://api.example.com`
- Render `AUTH_COOKIE_SECURE=true`
- Render `AUTH_COOKIE_SAME_SITE=Lax`

Cookie sesi diset oleh `api.example.com` dan tetap first-party karena browser menganggap kedua host same-site.

### Opsi B — proxy /api same-origin

Frontend Vercel meneruskan `/api/*` ke Render sehingga browser hanya melihat origin Vercel.

- Vercel `VITE_API_URL=` (kosong)
- Tambahkan rewrite `/api/:path*` ke URL Render sebagai rewrite **pertama** di Vercel, sebelum SPA fallback.
- Render `CORS_ORIGIN=https://app.example.com` tetap diisi.
- Cookie tetap first-party pada domain Vercel.

`client/vercel.json` sudah berisi SPA fallback. Jika memakai proxy, tambahkan rewrite API di depannya melalui dashboard Vercel atau edit `vercel.json`.

### Opsi C — cross-site fallback

Hanya bila Opsi A/B tidak memungkinkan:

- `AUTH_COOKIE_SAME_SITE=None`
- `AUTH_COOKIE_SECURE=true`
- Frontend dan backend berada pada situs berbeda.

Safari ITP, Firefox ETP, dan pembatasan cookie pihak ketiga Chromium dapat memblokir cookie ini. Konfigurasi ini tidak dianggap didukung penuh.

## 2. Neon PostgreSQL

1. Buat project Neon production dan branch production terpisah dari branch test.
2. Ambil dua connection string:
   - **Pooled** (`-pooler`) untuk `DATABASE_URL` runtime.
   - **Direct** (tanpa `-pooler`) untuk `DATABASE_URL_UNPOOLED` migration.
3. Jangan menggunakan kredensial production di lokal atau test.
4. Simpan snapshot/branch sebelum migration production.
5. Jangan menjalankan reset, drop, truncate, importer, atau seed development pada production.

### Pemeriksaan migration (read-only)

```bash
DATABASE_URL_UNPOOLED="<direct-production-url>" npm run db:migrate:status -w server
```

Perintah ini hanya membaca `drizzle.schema_migrations` dan menampilkan migration pending. Tidak menulis data.

### Menjalankan migration production

```bash
DATABASE_URL_UNPOOLED="<direct-production-url>" npm run db:migrate -w server
```

Migration yang ada bersifat additive:

- `0000` membuat tabel awal.
- `0001` menambah unique index kategori.
- `0002` menambahkan seed kategori bawaan historis (`user_id NULL`); seed ini tidak terlihat oleh pengguna dan tidak dipakai untuk registrasi baru.
- `0003` menambahkan tabel `users`, `sessions`, foreign key, dan index autentikasi.

Tidak ada migration yang melakukan drop/reset data.

**Jangan** menjalankan:

```bash
npm run db:import
```

Importer SQLite hanya untuk development/cutover, bukan production baru.

Setelah migration:

```bash
DATABASE_URL_UNPOOLED="<direct-production-url>" npm run db:migrate:status -w server
```

Pastikan tidak ada migration pending.

## 3. Render — backend

Blueprint tersedia di `render.yaml` dengan plan **Free**. Alternatif manual di dashboard:

- Service type: **Web Service**
- Runtime: **Node**
- Root Directory: repository root
- Build Command: `npm ci --omit=dev`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Auto-Deploy: branch `main` dari GitHub
- Plan: **Free**

Initial migration production sudah diterapkan. **Jangan** menambahkan pre-deploy migration pada service ini. Jika perlu memeriksa status, jalankan `npm run db:migrate:status -w server` secara manual dengan koneksi direct.

Environment backend:

| Key | Nilai |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | connection string Neon **pooled** |
| `DATABASE_URL_UNPOOLED` | connection string Neon **direct** |
| `CORS_ORIGIN` | origin frontend production, mis. `https://app.example.com` |
| `SESSION_TTL_HOURS` | `168` |
| `AUTH_COOKIE_SECURE` | `true` |
| `AUTH_COOKIE_SAME_SITE` | `Lax` untuk same-site; `None` hanya fallback cross-site |
| `AUTH_COOKIE_NAME` | `ptm_session` |

Catatan:

- Render menyediakan `PORT` otomatis.
- Free web service dapat tidur saat tidak ada traffic; cold start pertama bisa lebih lambat.
- Migration production sudah selesai; jalankan hanya status read-only bila diperlukan.
- Jangan mengisi `CORS_ORIGIN` dengan `*`.
- Tambahkan custom domain `api.example.com` jika memakai Opsi A.
- `AUTH_COOKIE_SECURE=true` wajib untuk production (HTTPS).

## 4. Vercel — frontend

Konfigurasi project:

- Root Directory: `client`
- Install Command: `cd .. && npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

Environment frontend:

| Key | Nilai |
|---|---|
| `VITE_API_URL` | `https://api.example.com` untuk Opsi A; kosong untuk proxy Opsi B |
| `VITE_PUBLIC_DEPLOYMENT` | `true` |

`client/vercel.json` sudah menambahkan:

- SPA fallback ke `index.html`
- Header keamanan dasar (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)

Jika memakai proxy Opsi B, tambahkan rewrite API sebelum catch-all SPA. Contoh urutan rewrite:

```json
[
  { "source": "/api/:path*", "destination": "https://NAMA-SERVICE.onrender.com/api/:path*" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Jangan menaruh URL backend nyata di source jika tidak diperlukan; gunakan dashboard Vercel bila memungkinkan.

Tambahkan custom domain `app.example.com` agar same-site dengan `api.example.com`.

## 5. GitHub

- Hubungkan repository ke Render dan Vercel.
- Gunakan branch production yang sama.
- Jangan commit `.env`, `.env.test`, `.env.production`, atau kredensial Neon.
- Contoh environment production hanya tersedia sebagai:
  - `server/.env.production.example`
  - `client/.env.production.example`
- Pastikan secret hanya berada di dashboard Render/Vercel.

## 6. Build dan start lokal production-like

```bash
npm ci
npm run build
npm run db:migrate:status -w server
npm start
```

Untuk build frontend dengan konfigurasi deployment:

```bash
VITE_API_URL="https://api.example.com" VITE_PUBLIC_DEPLOYMENT=true npm run build -w client
```

Untuk backend production-like, isi environment production dengan database test/development terlebih dahulu:

```bash
NODE_ENV=production \
AUTH_COOKIE_SECURE=true \
AUTH_COOKIE_SAME_SITE=Lax \
CORS_ORIGIN="https://app.example.com" \
DATABASE_URL="<test-pooled>" \
DATABASE_URL_UNPOOLED="<test-direct>" \
npm start
```

Jangan arahkan command ini ke production sebelum migration dan backup diverifikasi.

## 7. Checklist verifikasi setelah deploy

1. `GET https://api.example.com/api/health` → `200 {"status":"ok"}`.
2. CORS preflight dari `https://app.example.com` mengembalikan origin tersebut dan `Access-Control-Allow-Credentials: true`.
3. Register dari frontend berhasil dan `Set-Cookie` berisi `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
4. Login berhasil dan diarahkan ke `/app`.
5. Login gagal tetap di `/login`.
6. `/app` tanpa sesi diarahkan ke `/login`.
7. Logout menghapus sesi dan `/app` kembali meminta login.
8. CRUD tugas dan kategori berfungsi.
9. Dua akun tidak dapat melihat data satu sama lain.
10. `npm run db:migrate:status -w server` tidak menampilkan migration pending.

## 8. Rollback

- Jangan drop database production.
- Simpan snapshot/branch Neon sebelum migration.
- Migration bersifat additive; rollback aplikasi dapat dilakukan dengan mengembalikan deployment ke revisi sebelumnya.
- Jika rollback database diperlukan, pulihkan snapshot/branch Neon, bukan menjalankan reset manual.
