Tokosubu - Project Guideline (v1.0)
Dokumen ini adalah acuan utama eksekusi proyek selama 4 minggu. Segala hal di luar dokumen ini harus melalui persetujuan PM (Gilbert).

1. Aturan Emas Tim
Tidak ada push langsung ke main. Semua perubahan via Pull Request (PR).

Wajib Pull main setiap pagi sebelum mulai coding.

1 PR = 1 Fitur Kecil. PR maksimal 400 baris perubahan.

Komunikasi Blocker: Jika stuck > 30 menit, tanya di grup, jangan didiamkan.

Data Privacy: Data transaksi asli pemilik bersifat rahasia. Jangan pernah commit file .xlsx atau .csv asli ke GitHub (masukkan ke .gitignore). Gunakan dummy data yang formatnya mirip.

2. Tech Stack & Hosting
Front-End: React (Vite) + JavaScript (ES6) + TailwindCSS / shadcn/ui.

Back-End: Node.js + Express + PostgreSQL (Supabase / Neon).

ML Service: Python + FastAPI.

Hosting: Railway (Web, API, ML) & Vercel (Web fallback). Database di Supabase.

3. Struktur Monorepo Final
text
tokosubu/
├── .github/
│   ├── CODEOWNERS                     # Penjaga konflik push
│   └── pull_request_template.md
├── apps/
│   ├── web/                           # React + Vite (Owner: FE/FS)
│   │   ├── src/ (components, pages, hooks, services, utils)
│   │   ├── .env.example
│   │   └── package.json
│   ├── api/                           # Express (Owner: BE/FS)
│   │   ├── migrations/                # node-pg-migrate
│   │   ├── src/ (controllers, services, routes, middleware, integrations)
│   │   ├── .env.example
│   │   └── package.json
│   └── ml-service/                    # FastAPI (Owner: AI/DS)
│       ├── app/ (api, services, models, evaluation)
│       ├── artifacts/                 # Model tersimpan (git-ignored)
│       ├── notebooks/                 # Eksperimen DS
│       ├── requirements.txt
│       └── .env.example
├── packages/
│   └── contracts/                     # Kontrak API (Owner: FS)
│       ├── auth.md
│       ├── inventory.md
│       └── transaction.md
├── data/                              # Dataset (git-ignored)
├── docs/                              # Dokumentasi
├── .gitignore
├── .editorconfig
└── README.md
4. Pembagian Role & Ownership (CODEOWNERS)
Nama	Role	Fokus Area & Kepemilikan Folder
Gilbert	FS + PM + Testing	packages/contracts/, apps/api/src/integrations/, apps/web/src/pages/Dashboard, apps/web/src/pages/AiAgent, apps/web/src/pages/Settings, .github/
Reyana	Front-End (FE)	apps/web/ (Inventory, Transaction, Sales Analytics, Auth)
Anisa	Back-End (BE)	apps/api/ (Controllers, Services, Routes, Migrations)
Jauza	AI Engineer (AE)	apps/ml-service/app/ (LLM, AI Agent API, Integrasi)
Kukuh	AI Engineer (AE)	apps/ml-service/app/ (Model Prediksi, ML API)
Zuyyina	Data Science (DS)	apps/ml-service/notebooks/, apps/ml-service/app/evaluation/, data/
5. Daftar Halaman (Screens) & Routing
Screen	Route	Owner	Catatan Implementasi
Login	/login	Reyana	Email + Password. Seed akun: admin@tokosubu.id / Admin123!
Dashboard	/dashboard	Gilbert	4 Cards, 2 Charts, 2 Lists. Harus pakai UI library (shadcn/MUI).
Inventory	/inventory	Reyana	Stok Opname, Import File, Riwayat Stock.
Transaction	/transactions	Reyana	Input Nota, Import Sales Report.
Analytics	/analytics	Reyana	Grafik penjualan, Top 5 produk. Export CSV/Excel.
AI Agent	/ai-agents	Gilbert	Chat UI. Detail di dokumen AI.
Settings	/settings	Gilbert	Threshold minimum, Ganti Password. (Tambah User: CUT).
6. Git Workflow & Penamaan Branch
feat/nama-fitur (contoh: feat/dashboard-ui)

fix/nama-bug (contoh: fix/cart-total)

chore/setup-env

docs/api-contract

Merge: Wajib Squash & Merge. Hapus branch setelah merge.