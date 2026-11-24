# Toko Subur – Backend API

Backend service untuk aplikasi pengelolaan persediaan, transaksi penjualan, analisis bisnis, dan integrasi AI pada Toko Subur.

Dokumentasi ini ditujukan khusus untuk tim Backend Developer agar setiap anggota tim dapat menjalankan, mengembangkan, dan memelihara API secara mandiri.

## 1. Tech Stack

| Teknologi | Kegunaan |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend REST API |
| PostgreSQL | Relational database |
| node-postgres (pg) | Koneksi dan query database |
| node-pg-migrate | Database schema migration |
| dotenv | Environment configuration |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File upload middleware |
| xlsx | Excel file parsing |
| csv-parser | CSV file parsing |
| CORS | Cross-Origin Resource Sharing |

## 2. Prerequisites

Pastikan perangkat sudah memiliki:

- Node.js dan npm.
- PostgreSQL.
- Git.
- Code editor (disarankan Visual Studio Code).

## 3. Project Structure

Struktur direktori Backend API:

```text
apps/api/
├── migrations/                 # Database schema migrations
├── src/
│   ├── config/                 # Database dan environment configuration
│   │   └── db.js
│   ├── routes/                  # API endpoint definitions
│   ├── controllers/             # HTTP request dan response handling
│   ├── services/                # Business logic
│   ├── repositories/            # Database queries dan data access
│   ├── validators/              # Request validation
│   ├── middleware/              # Authentication, upload, error handler
│   ├── exceptions/              # Custom application errors
│   ├── integrations/            # External service clients, termasuk ML Service
│   ├── utils/                   # Shared helper functions
│   ├── app.js                   # Express application configuration
│   └── server.js                # Application entry point
├── .env                         # Local environment variables
├── .env.example                 # Environment template
├── .gitignore
├── package.json
├── package-lock.json
└── readme.md
```

### Architecture Responsibilities

- **Routes:** Memetakan URL dan HTTP method ke controller.
- **Controllers:** Menangani request dan response HTTP.
- **Services:** Menjalankan business logic.
- **Repositories:** Menangani query SQL dan akses database.
- **Validators:** Memvalidasi input dari client.
- **Middleware:** Menangani autentikasi, authorization, upload, dan error handling.
- **Integrations:** Menghubungkan backend dengan ML Service atau layanan eksternal.
- **App.js:** Merakit konfigurasi Express tanpa menjalankan server.
- **Server.js:** Menjalankan HTTP server dan melakukan listen pada port.

## 4. Installation

Buka terminal dari root repository:

```bash
cd apps/api
```

Install seluruh dependencies:

```bash
npm install
```

Tidak perlu menjalankan `npm init -y` karena konfigurasi `package.json` sudah tersedia di repository.

## 5. Environment Configuration

Buat file `.env` berdasarkan template `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan konfigurasi dengan lingkungan lokal masing-masing developer.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| PORT | Backend API port | 3000 |
| NODE_ENV | Application environment | development |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:password@localhost:5432/tokosubur |
| JWT_SECRET | Secret untuk signing JWT | Local secret |
| JWT_EXPIRES_IN | Token expiration | 1d |
| ML_SERVICE_URL | ML Service base URL | http://localhost:8000 |

**Security Rules:**

- Jangan pernah commit file `.env`.
- Jangan membagikan credential database melalui Git.
- Jangan menggunakan JWT secret contoh untuk production.
- Gunakan `.env.example` sebagai template tanpa credential asli.

## 6. Database Setup

Pastikan PostgreSQL sudah berjalan.

Buat database untuk development:

```sql
CREATE DATABASE tokosubur;
```

Pastikan `DATABASE_URL` dalam `.env` mengarah ke database yang benar.

Contoh format connection string:

```text
postgresql://DB_USER:DB_PASSWORD@localhost:5432/tokosubur
```

Gunakan username dan password PostgreSQL masing-masing developer.

## 7. Database Migration

Backend menggunakan `node-pg-migrate` untuk mengelola perubahan struktur database.

### Menjalankan seluruh pending migrations

```bash
npm run migrate -- up
```

### Rollback satu migration terakhir

```bash
npm run migrate -- down
```

### Rollback beberapa migrations

```bash
npm run migrate -- down 3
```

Angka `3` merupakan jumlah migration yang ingin dibatalkan.

**Important:** Rollback dapat menghapus tabel dan data aplikasi. Lakukan pengujian rollback hanya pada database development atau testing dan pastikan backup tersedia jika datanya masih diperlukan.

### Memeriksa Migration History

Jalankan query berikut melalui PostgreSQL:

```sql
SELECT id, name, run_on
FROM public.pgmigrations
ORDER BY id;
```

## 8. Running the Application

### Development Mode

```bash
npm run dev
```

Server akan dijalankan menggunakan Nodemon agar otomatis restart saat source code berubah.

### Production Mode

```bash
npm start
```

### Health Check

Apabila endpoint health check sudah dikonfigurasi di Express, akses:

```text
http://localhost:3000/
```

Contoh response yang diharapkan:

```json
{
  "message": "API Tokosubu berjalan"
}
```

## 9. Code Quality

### Run ESLint

```bash
npm run lint
```

### Fix ESLint Issues

```bash
npm run lint:fix
```

### Format Code

```bash
npm run format
```

Gunakan aturan linting dan formatting yang tersedia sebelum mengirimkan perubahan ke repository.

## 10. Backend Integration

Backend API menjadi penghubung antara Frontend, PostgreSQL, dan ML Service.

Gambaran komunikasi:

```text
Frontend (Web)
      |
      v
Backend API (Express)
      |
      +------> PostgreSQL
      |
      +------> ML Service
```

Frontend tidak perlu berkomunikasi langsung dengan database.

Seluruh operasi data dan integrasi layanan eksternal dikelola melalui Backend API.

## 11. Development Guidelines

1. Gunakan repository pattern untuk memisahkan query database dari business logic.
2. Jangan menulis query SQL langsung di controller.
3. Setiap perubahan struktur database harus dibuat melalui migration file.
4. Jangan menyimpan credential atau secret di source code.
5. Gunakan validator untuk memvalidasi request.
6. Gunakan middleware untuk authentication dan error handling.
7. Pisahkan konfigurasi aplikasi dari business logic.
8. Dokumentasikan endpoint dan perubahan API.
9. Jangan commit file `.env`, `node_modules`, atau file build.
10. Pastikan perubahan sudah diuji sebelum membuat Pull Request.

## 12. Useful Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm start` | Start application |
| `npm run migrate -- up` | Run pending migrations |
| `npm run migrate -- down` | Rollback latest migration |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Automatically fix lint issues |
| `npm run format` | Format source code |

---

**Toko Subur – Backend Development Team**