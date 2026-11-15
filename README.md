Tokosubur - Global Onboarding Guide

Selamat datang di proyek Tokosubu! Dokumen ini adalah panduan setup awal untuk SEMUA ANGGOTA TIM. Sebelum menyentuh kode Front-End, Back-End, atau AI, ikuti langkah di sini terlebih dahulu.

🛠️ 1. Prasyarat (Wajib Diinstal di Laptop Windows)

Git: Download Git (pilih "Git Bash" saat instalasi).

Node.js (v24 LTS): Download Node.js.

Python (v3.13): Download Python.

PENTING: Centang "Add Python to PATH" saat instalasi!

VS Code: Download VS Code.

💻 2. Setup Git & Clone Repository

Buka Git Bash (bukan CMD/PowerShell) dan jalankan perintah berikut:

# Set identitas Git (ganti dengan nama dan email GitHub-mu)
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"

# Clone repository (pastikan kamu sudah diundang ke repo GitHub)
git clone https://github.com/username-kamu/tokosubu.git
cd tokosubu


📂 3. Struktur Monorepo Final (Visual)

tokosubu/
│
├── .github/
│   └── CODEOWNERS
│
├── apps/
│   ├── web/                 # React + Vite (Front-End)
│   ├── api/                 # Express + Node.js (Back-End)
│   └── ml-service/          # Python + FastAPI (AI/DS)
│       ├── app/
│       ├── artifacts/       # Tempat model .pkl (di-ignore)
│       └── notebooks/       # Tempat file .ipynb DS (di-ignore)
│
├── packages/
│   └── contracts/           # File Markdown kontrak API
│
├── data/                    # Dataset pemilik (di-ignore)
│
├── docs/                    # Dokumen panduan & diskusi
│
├── .editorconfig
├── .gitignore
└── README.md


👥 4. Alur Pekerjaan Berdasarkan Role

Full-Stack (FS): Mengelola keseluruhan arsitektur, integrasi, dan review lintas layanan.

Front-End: Cukup fokus mengerjakan direktori apps/web/.

Back-End: Cukup fokus mengerjakan direktori apps/api/.

AI Engineer / Data Scientist: Cukup fokus mengerjakan direktori apps/ml-service/.