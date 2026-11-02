# NusaTales — Panduan Arsitektur & Setup Supabase MVP

> **Status:** MVP Implemented & Connected  
> **Branch:** `feature/supabase-mvp-rebuild`  
> **Stack:** React 19, Vite 8, Tailwind CSS v4, Supabase (Auth, PostgreSQL DB, Storage)

---

## 1. Menjalankan Proyek Secara Lokal

Aplikasi sekarang sudah sepenuhnya menjadi **Standalone Vite SPA** (tidak memerlukan runtime PHP atau Laravel Herd).

1. Pastikan dependensi terpasang:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka peramban di:
   ```
   http://localhost:5173
   ```

---

## 2. Variabel Lingkungan (`.env.local`)

Buat file `.env.local` di root folder proyek (file ini otomatis diabaikan oleh Git):

```dotenv
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUz...[YOUR_ANON_KEY]
VITE_APP_ENV=development
```

> **Catatan Keamanan:** Hanya gunakan kunci **`anon` `public`**. DILARANG KERAS memasukkan `service_role` (secret key) ke dalam kode frontend atau file environment client.

---

## 3. Urutan Script Migrasi Database (PostgreSQL)

Seluruh skema database, aturan Row Level Security (RLS), dan fungsi RPC tersimpan di direktori `supabase/migrations/`:

| No | File Migrasi | Deskripsi & Isi |
|---|---|---|
| **1** | `20261102000001_create_profiles_table.sql` | Tabel `public.profiles`, trigger auto-create profil dari `auth.users`, dan RLS profil. |
| **2** | `20261102000002_create_videos_table.sql` | Tabel `public.videos`, batas durasi (1–180s), status draf/published, indeks feed, dan RLS kepemilikan. |
| **3** | `20261102000003_storage_buckets_setup.sql` | Bucket `thumbnails` (publik 5 MB) dan bucket `videos` (privat 100 MB) beserta storage RLS. |
| **4** | `20261102000004_create_video_publishing_functions.sql` | Fungsi RPC atomik `publish_video` dan `unpublish_video` (`SECURITY DEFINER`). |
| **5** | `20261102000005_create_interactions_tables.sql` | Tabel `public.video_likes` dan `public.video_comments` (P1) dengan RLS penuh tanpa sistem koin/poin. |

---

## 4. Konfigurasi Dashboard Supabase

1. **Authentication $\rightarrow$ URL Configuration**:
   * **Site URL**: `http://localhost:5173`
   * **Redirect URLs**: Tambahkan `http://localhost:5173/**`
2. **Authentication $\rightarrow$ Providers $\rightarrow$ Email**:
   * Untuk kemudahan pengujian lokal, matikan opsi *"Confirm email"* agar user yang mendaftar dapat langsung masuk otomatis.

---

## 5. Fitur yang Aktif di MVP

* **Autentikasi**:
  * Pendaftaran akun (`/register`)
  * Masuk akun (`/login`)
  * Lupa kata sandi (`/forgot-password`) & Reset sandi (`/reset-password`)
  * Proteksi rute otomatis (`RequireAuth`)
* **Profil & Onboarding**:
  * Pengaturan profil (`/settings/profile`)
  * Onboarding pemilihan `@username` unik (regex: `^[a-z0-9_]{3,24}$`)
  * Unggah foto profil avatar ke storage
  * Halaman profil publik kreator (`/u/:username`)
* **Studio Kreator & Upload**:
  * Formulir upload (`/studio/upload`) dengan deteksi durasi otomatis & snapshot cover
  * Tab filter draf dan karya publik (`/studio`)
  * Edit judul/deskripsi (`/studio/videos/:id/edit`)
  * Aksi publikasikan dan tarik ke draf secara atomik
  * Hapus video (*soft delete*) dengan konfirmasi
* **Pemutar Reels Vertikal (`/reels`)**:
  * Pemutaran video vertikal satu per satu dengan loop mulus
  * Navigasi swipe mobile, scroll wheel, tombol panah keyboard
  * Resolusi otomatis signed URL media privat
  * Dukungan deep link (`/reels/:videoId`)
* **Interaksi Sosial (P1)**:
  * Tombol Like dengan pencatatan status suka pengguna & hitungan nyata
  * Drawer pop-up komentar interaktif dengan daftar komentar penonton & form pengiriman
  * Tombol bagikan via Web Share API atau salin tautan
