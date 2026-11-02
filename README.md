# Manajer Tugas Pribadi

Aplikasi web lokal untuk mengelola tugas pribadi. Mendukung Task List, Kanban, Dashboard, kategori, pencarian, filter, pengurutan, dan drag-and-drop status. Seluruh antarmuka menggunakan Bahasa Indonesia.

## Teknologi

- Frontend: React 19 + Vite 8
- Backend: Node.js + Express 5
- Database: SQLite melalui `better-sqlite3`
- Drag-and-drop: `@dnd-kit/core`
- Test: Vitest + Supertest

## Struktur Proyek

```text
.
├── client/                  # React + Vite
│   ├── src/components/      # Task List, Kanban, Dashboard, modal, filter
│   └── vite.config.js       # Proxy /api ke backend
├── server/                  # Express + SQLite
│   ├── migrations/          # Migrasi SQL berurutan
│   ├── src/                 # API, validasi, database, migrasi
│   └── test/                # Integration test
└── package.json             # npm workspaces dan script root
```

## Prasyarat

- Node.js 20.19 atau lebih baru (disarankan Node.js 24)
- npm 10 atau lebih baru
- Build tools untuk `better-sqlite3` (`make` dan `g++`) bila binary prebuilt tidak tersedia

## Instalasi

```bash
npm install
```

## Menjalankan Mode Pengembangan

```bash
npm run dev
```

Perintah ini menjalankan backend dan frontend sekaligus:

- Frontend: <http://localhost:5173>
- API: <http://localhost:3001>
- Proxy Vite meneruskan `/api` ke backend.

Database dibuat otomatis dan migrasi dijalankan saat server mulai. Lokasi default: `server/data/tasks.db`.

## Konfigurasi Environment

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port API/backend |
| `DB_PATH` | `server/data/tasks.db` | Lokasi file SQLite |
| `VITE_API_TARGET` | `http://localhost:3001` | Target proxy `/api` saat mode pengembangan |

Contoh memakai port dan database lain:

```bash
PORT=4000 DB_PATH=/tmp/tasks.db VITE_API_TARGET=http://localhost:4000 npm run dev
```

Jika hanya backend yang dijalankan dengan port berbeda, sesuaikan juga `VITE_API_TARGET` agar frontend tetap terhubung.

## Migrasi Database

```bash
npm run migrate
```

Migrasi juga dijalankan otomatis saat backend mulai. Migrasi bersifat idempotent dan dicatat di tabel `schema_migrations`.

## Test

```bash
npm test
```

Perintah lain:

```bash
npm run test:unit          # Unit test server + test client
npm run test:integration   # Integration test API dan persistensi
```

Test mencakup validasi, CRUD tugas dan kategori, filter, pencarian, pengurutan, overdue, statistik dashboard, kontrak respons API, serta persistensi setelah restart.

## Build dan Menjalankan Versi Produksi

```bash
npm run build
npm start
```

`npm run build` menghasilkan `client/dist`. `npm start` menjalankan backend pada `http://localhost:3001`; backend juga menyajikan file statis dari `client/dist`, sehingga aplikasi dapat dibuka langsung dari port tersebut tanpa server frontend terpisah.

## Ringkasan API

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/tasks` | Daftar tugas dengan pencarian, filter, dan sort |
| `POST` | `/api/tasks` | Membuat tugas |
| `PATCH` | `/api/tasks/:id` | Mengubah sebagian atau seluruh field tugas |
| `DELETE` | `/api/tasks/:id` | Menghapus tugas |
| `GET` | `/api/categories` | Daftar kategori terurut |
| `POST` | `/api/categories` | Membuat kategori |
| `PATCH` | `/api/categories/:id` | Mengubah nama kategori |
| `DELETE` | `/api/categories/:id` | Menghapus kategori; tugas terkait menjadi tanpa kategori |
| `GET` | `/api/dashboard/stats` | Statistik global |

Respons sukses memakai bentuk `{ "success": true, "data": ... }`. Respons gagal memakai `{ "success": false, "message": "...", "errors": ... }` dengan status HTTP `400`, `404`, `409`, atau `500`.

## Data dan Reset

Aplikasi bersifat single-user dan tidak memerlukan login. Untuk mereset data, hentikan server lalu hapus file database (default `server/data/tasks.db`); migrasi dan kategori awal akan dibuat kembali saat server dijalankan.

## Catatan Verifikasi

Hasil uji otomatis, walkthrough acceptance criteria, verifikasi browser, dan pemeriksaan responsif dicatat di [`openspec/changes/personal-task-manager-mvp/verification.md`](openspec/changes/personal-task-manager-mvp/verification.md).
