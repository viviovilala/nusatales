# NusaTales — Panduan Arsitektur & Setup Supabase MVP

> **Status:** MVP Implemented, Hardened & Connected  
> **Branch:** `Supa-Nusa`  
> **Stack:** React 19, Vite 8, Tailwind CSS v4, Supabase (Auth, PostgreSQL DB with RLS, Storage with TUS Resumable)

---

## 1. Menjalankan Proyek Secara Lokal

Aplikasi adalah **Standalone Vite SPA** (tidak membutuhkan runtime PHP / Laravel).

1. Pastikan dependensi terpasang:
   ```bash
   npm install
   ```
2. Jalankan unit & security test suite:
   ```bash
   npm test
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka peramban di `http://localhost:5173`.

---

## 2. Variabel Lingkungan (`.env.local`)

Buat file `.env.local` di root folder proyek:

```dotenv
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUz...[YOUR_ANON_KEY]
VITE_APP_ENV=development
```

> **Catatan Keamanan:** Hanya gunakan kunci **`anon` `public`**. DILARANG KERAS memasukkan `service_role` (secret key) ke dalam kode frontend atau file environment client.

---

## 3. Kebijakan Batas Ukuran Berkas (Supabase Free Tier: 50 MB)

Sesuai spesifikasi resmi Supabase Free Plan:
- **Video Media (`videos`)**: Maksimal **50 MB (50.000.000 bytes)** per file.
  - Berlaku untuk kedua format: **Film Animasi (Full Video)** dan **Reels (Short Video)**.
  - Untuk animasi panjang, kompres video dengan codec H.264 / AAC resolusi 720p/1080p bitrate 1.5–2.5 Mbps agar muat dalam batas 50 MB.
- **Thumbnail & Sampul (`thumbnails`)**: Maksimal **5 MB**.
- **Foto Profil Avatar**: Maksimal **2 MB**.

---

## 4. Urutan Script Migrasi Database (PostgreSQL)

Seluruh skema database, aturan Row Level Security (RLS), trigger pengaman, dan fungsi RPC tersimpan di direktori `supabase/migrations/`.

Jalankan script migrasi ini secara berurutan di **Supabase Dashboard $\rightarrow$ SQL Editor**:

| No | File Migrasi | Deskripsi & Isi |
|---|---|---|
| **1** | `20261102000001_create_profiles_table.sql` | Tabel `public.profiles`, trigger auto-create profil dari `auth.users`, dan RLS profil. |
| **2** | `20261102000002_create_videos_table.sql` | Tabel `public.videos`, indeks feed, dan RLS kepemilikan awal. |
| **3** | `20261102000003_storage_buckets_setup.sql` | Bucket `thumbnails` dan `videos` beserta storage policy awal. |
| **4** | `20261102000004_create_video_publishing_functions.sql` | Fungsi RPC atomik `publish_video` dan `unpublish_video` (`SECURITY DEFINER`). |
| **5** | `20261102000005_create_interactions_tables.sql` | Tabel `public.video_likes` dan `public.video_comments` dengan RLS penuh tanpa sistem koin/poin. |
| **6** | `20261102000006_security_hardening_rls_and_storage.sql` | Trigger proteksi kolom sensitif, storage select policy untuk penonton publik/anonim, dan pembatasan interaksi hanya untuk video published. |
| **7** | `20261102000007_add_content_type_and_dual_format_support.sql` | Kolom `content_type` (`animation`/`reel`), pencabutan limit 180s pada animasi, backfill 5 video lama, dan indeks katalog. |
| **8** | `20261102000008_correct_storage_size_limits.sql` | Penyesuaian batas bucket `videos` ke konservatif 50 MB sesuai batas paket Supabase Free Tier. |
| **9** | `20261102000009_multi_layered_video_security_and_locking.sql` | Row-level locking (`FOR UPDATE`) pada `publish_video` untuk mencegah race condition, immutable `content_type`, dan trusted RPC `soft_delete_video`. |
| **10** | `20261102000010_private_video_thumbnails.sql` | Pengetatan bucket `thumbnails` menjadi privat dengan RLS selektif (owner untuk draf, publik untuk avatar dan thumbnail video yang telah dipublikasikan). |
| **11** | `20261102000011_thumbnail_ownership_and_video_grants.sql` | Validasi kepemilikan path pada INSERT/UPDATE, Storage RLS, grants per kolom, dan penguncian durasi video published. Terapkan bersama client signed-image. |

> Follow-up V3: lihat [security dan remake beranda](audits/SECURITY_AND_HOME_REMAKE.md)
> untuk preflight legacy paths, hasil tes lokal, dan batas validasi remote.

---

## 5. Fitur yang Aktif di MVP

* **Autentikasi & Profil**:
  * Pendaftaran akun (`/register`), masuk (`/login`), lupa sandi (`/forgot-password`).
  * Pemilihan `@username` unik (regex: `^[a-z0-9_]{3,24}$`), pengaturan profil, avatar upload.
  * Halaman profil publik kreator (`/u/:username`).
* **Format Konten Ganda (Dual-Format)**:
  * **Film Animasi (Full Video)**:
    - Ditayangkan di Katalog Animasi (`/animations`) dengan pencarian dan pagination "Muat Lebih Banyak".
    - Diputar di Cinema Player (`/watch/:videoId`) horizontal 16:9 lengkap dengan kontrol scrub bar, volume, fullscreen, dan **resume playback**.
  * **Reels (Short Video)**:
    - Ditayangkan di pemutar vertikal 9:16 (`/reels`) dengan swipe mobile, arrow keys, batch prefetch pagination, dan caching signed URL.
* **Studio Kreator & Upload Resumable (TUS)**:
  * Unggah karya (`/studio/upload`) menggunakan protokol **TUS Resumable** murni dengan progress riil (`bytesUploaded / bytesTotal`), tombol batalkan unggahan, dan pembersihan berkas terputus.
  * Pemilihan format eksplisit: Film Animasi (16:9) vs Reels (9:16).
  * Dashboard Studio (`/studio`) dengan filter format, aksi tarik ke draf, edit metadata, dan soft delete.
