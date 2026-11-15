4. Alur Kerja Git (Aturan Emas)
Jangan pernah git push langsung ke main!

Selalu buat branch baru sebelum ngoding:

bash
git checkout main
git pull origin main
git checkout -b feat/nama-fitur-kamu
Setelah selesai ngoding, push branch-mu:

bash
git add .
git commit -m "feat(web): menambahkan halaman login"
git push origin feat/nama-fitur-kamu
Buka Pull Request (PR) di GitHub. Tunggu reviewer (sesuai CODEOWNERS) menyetujui.

Merge menggunakan fitur "Squash and Merge" di GitHub.

5. Protokol Jika Terjadi Konflik Git
Jika saat git pull atau PR muncul tulisan "Merge Conflict":

JANGAN PANIC. Kode tidak hilang.

Buka file yang konflik di VS Code.

Cari tanda <<<<<<< HEAD, =======, dan >>>>>>>.

Pilih kode yang ingin dipertahankan (hapus tanda-tandanya).

Simpan file, lalu jalankan: git add . -> git commit -m "fix: resolve conflict".

Jika bingung > 15 menit, hubungi Gilbert (FS).

text

---

### 💡 Catatan Mentor:
Setelah file `README.md`, `.gitignore`, dan `.editorconfig` terisi dan disimpan, kamu sudah menyelesaikan **Langkah 1 (Setup Struktur Folder)**.

Sekarang kamu siap untuk masuk ke **Langkah 2: Inisialisasi Git & Push ke GitHub**. Silakan buka terminal (sangat disarankan Git Bash), pastikan posisinya di dalam folder `tokosubur`, dan jalankan:
```bash
git init
git add .
git commit -m "chore: initial commit - setup monorepo structure"