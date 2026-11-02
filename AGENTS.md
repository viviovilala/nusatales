# AGENTS.md - Development Rules & Guidelines

Dokumen ini berisi aturan baku, alur kerja (SOP), dan standar teknis yang WAJIB ditaati oleh setiap AI Agent yang bekerja di repositori **ELIB**.

---

## 1. Ground Rules & Workflow (Wajib & Mutlak)

### A. Alur Kerja: AUDIT -> GAS -> KERJAKAN
1. **AUDIT**: Setiap kali ada permintaan fitur, refaktor, atau perubahan kode, Agent WAJIB melakukan audit terlebih dahulu (analisa kebutuhan, file yang terdampak, dan rancangan teknis).
2. **MENUNGGU**: Agent DILARANG menyentuh, membuat, atau mengedit kode sebelum user memberikan instruksi tegas berupa kata **"GAS"**.
3. **KERJAKAN**: Eksekusi kodingan baru boleh dimulai HANYA setelah ada perintah **"GAS"** dari user.

### B. Aturan Git Commit
- Agent **DILARANG KERAS** menjalankan `git commit` secara mandiri tanpa instruksi eksplisit dari user.
- Jika diinstruksikan untuk commit, commit harus menggunakan nama user sebagai author / co-author yang sah.

---

## 2. Git Branching Strategy

- **`main`**: Branch Produksi (Live). Versi stabil untuk deployment server.
- **`staging`**: Branch Pra-Produksi. Tempat testing integrasi sebelum merge ke `main`.
- **`dev-elib`**: Branch Aktif Pengembangan saat ini (fokus pengerjaan fitur CMS & Admin Dashboard).

---

---

## 4. Standar Kode
- Type-safe (TypeScript strictly typed).
- Tidak merusak struktur komponen dan styling yang sudah ada.
- Menjaga integritas komentar dan dokumentasi kode.

## 5. MUTLAK DARI GW
- STAGING/STAG = GIT ADD
- GA BOLEH COMMIT GA BOLEH PUSH
- JANGAN IMPRUV APAPUN KECUALI GW SURUH DAN SCOPE HARUS JELAS.
- GA BOLEH NPM RUN BUILD DAN NPM RUN BUILD GA USAH TARUH STAGING