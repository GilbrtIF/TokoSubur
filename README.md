# Tokosubu - Global Onboarding Guide

Selamat datang di proyek Tokosubu! Dokumen ini adalah panduan setup awal untuk **SEMUA ANGGOTA TIM**. Sebelum menyentuh kode Front-End, Back-End, atau AI, ikuti langkah di sini terlebih dahulu.

## 1. Prasyarat (Wajib Diinstal di Laptop Windows)
- **Git:** [Download Git](https://git-scm.com/download/win) (pilih "Git Bash" saat instalasi).
- **Node.js (v24 LTS):** [Download Node.js](https://nodejs.org/en).
- **Python (v3.13):** [Download Python](https://www.python.org/downloads/). *PENTING: Centang "Add Python to PATH" saat instalasi!*
- **VS Code:** [Download VS Code](https://code.visualstudio.com/).

## 2. Setup Git & Clone Repository
Buka **Git Bash** (bukan CMD/PowerShell) dan jalankan:
```bash
# Set identitas Git (ganti dengan nama dan email GitHub-mu)
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"

# Clone repository (pastikan kamu sudah diundang ke repo GitHub)
git clone https://github.com/username-kamu/tokosubu.git
cd tokosubur

Struktur Monorepo Final (Visual)
tokosubur/
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

alur pekerjaan 
FS
Front-End, cukup kerjakan app/web 
Back-End, cukup kerjakan app/Api
Ai-engginer, cukup kerjakankan app/ml-services