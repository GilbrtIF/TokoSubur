Panduan Alur Kerja Git & Kolaborasi Tim

Dokumen ini adalah aturan main (Rule of Engagement) untuk seluruh anggota tim Tokosubu. Tujuannya agar kita bisa bekerja secara paralel tanpa saling menimpa pekerjaan satu sama lain.

🚀 1. Alur Kerja Git Harian (Aturan Emas)

Aturan Nomor 1: JANGAN PERNAH git push LANGSUNG KE BRANCH main!

Branch main dilindungi (protected). Semua perubahan wajib melalui Pull Request (PR).

A. Langkah-langkah Memulai Pekerjaan Baru

Setiap pagi, atau sebelum mulai mengerjakan tugas baru, pastikan kodemu selalu up-to-date dengan branch utama.

# 1. Pindah ke branch main
git checkout main

# 2. Tarik update terbaru dari GitHub
git pull origin main

# 3. Buat branch baru untuk fitur yang akan kamu kerjakan
# Format: feat/nama-fitur atau fix/nama-bug
git checkout -b feat/nama-fitur-kamu


B. Langkah-langkah Menyimpan & Mengirim Pekerjaan

Setelah kamu selesai coding di laptop, simpan perubahan ke GitHub.

# 1. Tambahkan semua file yang berubah
git add .

# 2. Simpan dengan pesan commit yang jelas (lihat panduan di bawah)
# Contoh: git commit -m "feat(web): menambahkan halaman login"
git commit -m "feat(area): deskripsi singkat pekerjaanmu"

# 3. Push branch-mu ke GitHub
git push origin feat/nama-fitur-kamu


C. Langkah-langkah Membuat Pull Request (PR)

Buka halaman repository di GitHub.

Akan muncul tombol kuning "Compare & pull request" untuk branch yang baru saja kamu push. Klik tombol tersebut.

Isi judul PR dan deskripsi (jelaskan apa yang kamu ubah).

Di sebelah kanan, pastikan Reviewer sudah otomatis terisi (berkat fitur CODEOWNERS).

Klik Create pull request.

Tunggu reviewer (PM atau anggota lain) menyetujui.

Jika sudah disetujui (hijau), klik Squash and Merge lalu Confirm merge. Hapus branch setelah di-merge.

⚠️ 2. Protokol Jika Terjadi Konflik Git (Merge Conflict)

Konflik terjadi ketika dua orang mengubah baris kode yang sama di file yang sama. Ini sangat normal dalam kerja tim.

JANGAN PANIK. Kode kamu tidak akan hilang.

Buka file yang ditandai konflik di VS Code. VS Code akan memberikan warna (biasanya hijau dan biru) untuk membantumu.

Cari tanda-tanda berikut di dalam kode:

<<<<<<< HEAD
(Kode milikmu)
=======
(Kode dari orang lain)
>>>>>>> nama-branch-lain


Pilih kode mana yang ingin dipertahankan. Kamu bisa memilih kodemu saja, kode orang lain saja, atau menggabungkan keduanya. Hapus tanda <<<<<<<, =======, dan >>>>>>>.

Simpan file (Ctrl+S).

Jalankan perintah ini di terminal:

git add .
git commit -m "fix: resolve merge conflict"


Butuh Bantuan? Jika kamu bingung dan tidak yakin harus memilih kode yang mana (lebih dari 15 menit), segera hubungi Gilbert (FS/PM) untuk bantuan.

📝 3. Standar Penulisan Pesan Commit (Commit Message)

Agar sejarah (history) GitHub kita mudah dibaca, gunakan format berikut:

tipe(area): deskripsi


Tipe yang sering dipakai:

feat : Menambah fitur baru.

fix : Memperbaiki bug/error.

docs : Mengubah dokumentasi (README, dll).

style : Mengubah tampilan/CSS (tidak mengubah logika).

refactor : Mengubah struktur kode tanpa mengubah fungsinya.

Area yang sering dipakai:

web, api, ml, db, docs

Contoh Penggunaan:

feat(web): menambahkan halaman dashboard

fix(api): memperbaiki error koneksi database

docs(readme): update cara install package