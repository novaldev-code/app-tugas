# Spec Delta

## MODIFIED Requirements

### Requirement: Platform lokal single-user

Workspace aplikasi SHALL berjalan sebagai aplikasi web lokal untuk satu pengguna tanpa autentikasi dan dapat diakses tanpa login pada deployment lokal/internal. Landing page publik bukan bagian dari workspace single-user.

#### Scenario: Akses aplikasi lokal

- **WHEN** workspace dijalankan secara lokal
- **THEN** pengguna dapat membuka `/app` dan menggunakan fitur tanpa login

#### Scenario: Tidak ada isolasi akun

- **WHEN** pengguna menggunakan workspace
- **THEN** tidak ada konsep kepemilikan akun atau isolasi data antar-pengguna

#### Scenario: Deployment internal atau privat

- **WHEN** workspace dijalankan pada deployment internal atau privat
- **THEN** workspace tetap bersifat single-user dan tidak memerlukan autentikasi

#### Scenario: Landing publik terpisah

- **WHEN** landing page publik ditampilkan
- **THEN** landing bukan workspace single-user dan tidak menampilkan data atau navigasi workspace

## ADDED Requirements

### Requirement: Batas deployment publik

Pada deployment publik, sistem SHALL hanya menyajikan landing page, SHALL mengalihkan `/app` ke `/`, dan SHALL NOT mengekspos backend/API workspace.

#### Scenario: Build publik hanya landing

- **WHEN** build publik dibuka
- **THEN** `/` menampilkan landing dan `/app` dialihkan ke `/` tanpa me-mount workspace

#### Scenario: Backend/API workspace tidak tersedia

- **WHEN** deployment publik diverifikasi
- **THEN** endpoint API workspace tidak dapat diakses publik

#### Scenario: Build lokal tetap berfungsi

- **WHEN** build lokal/internal dijalankan
- **THEN** workspace `/app` tetap dapat digunakan seperti sebelumnya

#### Scenario: Tanpa implementasi authentication

- **WHEN** hasil change ini diverifikasi
- **THEN** tidak ada authentication, multi-user data isolation, backend, database, atau payment yang ditambahkan

### Requirement: Sifat gate deployment frontend

`VITE_PUBLIC_DEPLOYMENT` SHALL hanya mengatur perilaku frontend dan SHALL NOT diperlakukan sebagai authentication, otorisasi, atau security boundary.

#### Scenario: Gate hanya mengatur frontend

- **WHEN** `VITE_PUBLIC_DEPLOYMENT` bernilai aktif
- **THEN** frontend menyembunyikan workspace tanpa mengklaim keamanan tambahan

#### Scenario: Gate bukan authentication

- **WHEN** dokumentasi, landing page, atau konfigurasi deployment diperiksa
- **THEN** gate tidak digambarkan sebagai login, otorisasi, atau jaminan keamanan

#### Scenario: Workspace publik memerlukan change terpisah

- **WHEN** workspace akan dibuka untuk pengunjung publik
- **THEN** authentication dan multi-user data isolation harus tersedia melalui change terpisah
