Tokosubur - Back-End Setup (Node.js + Express)

Panduan ini khusus untuk tim Back-End. Fokus kita adalah membangun API, mengelola database PostgreSQL, dan menerima file upload (Excel/CSV).

🛠️ Langkah 1: Inisialisasi Project

Buka terminal di dalam folder apps/api dan jalankan:

npm init -y


📦 Langkah 2: Instalasi Packages yang Dibutuhkan

Jalankan perintah berikut untuk meng-install semua library yang kita butuhkan:

# 1. Core & Environment
# - express: Framework web server
# - dotenv: Membaca file .env
# - cors: Mengizinkan Front-End mengakses API kita
npm install express dotenv cors

# 2. Database & Migrasi
# - pg: Driver untuk koneksi ke PostgreSQL
# - node-pg-migrate: Mengelola skema database (bikin tabel, alter tabel) via file migrasi
npm install pg node-pg-migrate

# 3. Keamanan (Auth)
# - jsonwebtoken: Membuat dan memverifikasi token JWT
# - bcryptjs: Meng-hash password (jangan simpan password mentah di DB!)
npm install jsonwebtoken bcryptjs

# 4. File Upload & Parsing Excel/CSV (Sesuai fitur Inventory)
# - multer: Middleware untuk menerima file upload
# - xlsx: Membaca file Excel (.xlsx/.xls)
# - csv-parser: Membaca file CSV
npm install multer xlsx csv-parser

# 5. Development Dependencies (Hanya untuk saat coding)
# - nodemon: Restart server otomatis saat ada perubahan kode
npm install -D nodemon

# 6. Dependencies Utama (Dibutuhkan saat aplikasi berjalan)
# - dotenv: Memuat variabel environment (seperti DATABASE_URL, PORT, JWT_SECRET) dari file .env ke dalam process.env agar kredensial aman dan tidak hardcode di kode.
npm install dotenv

Buka package.json, lalu ubah bagian "scripts" menjadi:

"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "migrate": "node-pg-migrate"
}


🔑 Langkah 3: Konfigurasi Environment (.env)

Buat file .env di dalam folder apps/api/:

PORT=3000
NODE_ENV=development

# Database (Dapatkan dari Supabase / Neon)
DATABASE_URL=postgres://adminu:admin123@localhost:5432/tokosubur
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_kamu
DB_NAME=tokosubur

# JWT
JWT_SECRET=rahasia_super_aman_tokosubu
JWT_EXPIRES_IN=1d

# ML Service
ML_SERVICE_URL=http://localhost:8000


🚀 Langkah 4: Jalankan Aplikasi

npm run dev


Buka http://localhost:3000 di browser. Jika berhasil, akan muncul:

{ "message": "API Tokosubu berjalan" }


📂 Struktur Folder

src/
├── config/         # Koneksi DB (db.js) dan Env (env.js)
├── controllers/    # Logika request & response
├── exceptions/     # Custom error
├── integrations/   # Koneksi ke ML Service
├── middleware/     # Auth (JWT), Error Handler
├── routes/         # Endpoint API
├── services/       # Logika bisnis & Query Database
├── utils/          # Fungsi bantuan
└── validators/     # Validasi input request