# Toko Subur – Backend API

Backend service untuk aplikasi pengelolaan persediaan, transaksi penjualan, analisis bisnis, dan integrasi AI pada Toko Subur (SuburOnline).

Dokumentasi ini ditujukan khusus untuk tim Backend Developer agar setiap anggota tim dapat menyiapkan database **Skema v4 (Dataset v7)**, memuat data hasil _wrangling_, menjalankan pengujian API, dan memelihara layanan secara mandiri.

## 1. Tech Stack

| Teknologi          | Kegunaan                      |
| ------------------ | ----------------------------- |
| Node.js            | JavaScript runtime            |
| Express.js         | Backend REST API              |
| PostgreSQL         | Relational database           |
| node-postgres (pg) | Koneksi dan query database    |
| node-pg-migrate    | Database schema migration     |
| dotenv             | Environment configuration     |
| JWT                | Authentication                |
| bcryptjs           | Password hashing              |
| Multer             | File upload middleware        |
| xlsx               | Excel file parsing            |
| csv-parser         | CSV file parsing              |
| CORS               | Cross-Origin Resource Sharing |
| Postman            | Pengujian endpoint otomatis   |

## 2. Prerequisites

Pastikan perangkat sudah memiliki:

- Node.js (v18+) dan npm.
- PostgreSQL (v14+) beserta CLI `psql`.
- Git.
- Postman (untuk pengujian koleksi endpoint).
- Code editor (disarankan Visual Studio Code).

## 3. Project Structure

Struktur direktori Backend API:

```text
apps/api/
├── migrations/                  # 23 file migrasi individual (auth, 20 tabel v4, 3 view dasar)
├── postman/                     # Koleksi dan environment pengujian Postman
│   ├── SuburOnline-API.postman_collection.json
│   └── SuburOnline-Local.postman_environment.json
├── src/
│   ├── config/                  # Database dan environment configuration
│   │   ├── db.js
│   │   └── env.js
│   ├── routes/                  # API endpoint definitions
│   ├── controllers/             # HTTP request dan response handling
│   ├── services/                # Business logic & pemetaan tipe data
│   ├── repositories/            # Database queries dan data access
│   ├── validators/              # Request validation
│   ├── middleware/              # Authentication, upload, error handler
│   ├── exceptions/              # Custom application errors (ClientError, InvariantError, NotFoundError)
│   ├── integrations/            # External service clients, termasuk ML Service
│   ├── utils/                   # Shared helper functions
│   ├── app.js                   # Express application configuration
│   └── server.js                # Application entry point
├── .env                         # Local environment variables (tidak di-commit)
├── .env.example                 # Environment template
├── .gitignore
├── package.json
├── package-lock.json
└── readme.md
```

### Architecture Responsibilities

- **Routes:** Memetakan URL dan HTTP method ke controller.
- **Controllers:** Menangani request dan response HTTP.
- **Services:** Menjalankan business logic dan konversi tipe data.
- **Repositories:** Menangani query SQL terparameterisasi dan akses database.
- **Validators:** Memvalidasi query parameter dan payload dari client.
- **Middleware:** Menangani autentikasi, authorization, upload, dan centralized error handling.
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

| Variable               | Description                                                         | Example                                                      |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| PORT                   | Backend API port                                                    | 3000                                                         |
| NODE_ENV               | Application environment                                             | development                                                  |
| DATABASE_URL           | PostgreSQL connection string untuk runtime aplikasi (role terbatas) | postgresql://tokosubur_app:password@localhost:5432/tokosubur |
| MIGRATION_DATABASE_URL | PostgreSQL connection string khusus migrasi (role pemilik `adminu`) | postgres://adminu:password@localhost:5432/tokosubur          |
| JWT_SECRET             | Secret untuk signing JWT                                            | Local secret                                                 |
| JWT_EXPIRES_IN         | Token expiration                                                    | 1d                                                           |
| ML_SERVICE_URL         | ML Service base URL                                                 | http://localhost:8000                                        |

**Security Rules:**

- Jangan pernah commit file `.env`.
- Jangan membagikan credential database melalui Git.
- Jangan menggunakan JWT secret contoh untuk production.
- Gunakan `.env.example` sebagai template tanpa credential asli.

## 6. Database Setup & Role Separation (Skema v4 / Dataset v7)

Pastikan PostgreSQL sudah berjalan, lalu buat role pemilik migrasi (`adminu`), role runtime aplikasi (`tokosubur_app`), dan database `tokosubur` sebagai superuser (`psql -U postgres`):

```sql
-- 1. Buat role migrasi dan role aplikasi
CREATE ROLE adminu WITH LOGIN PASSWORD 'GANTI_PASSWORD_ADMINU' CREATEDB;
CREATE ROLE tokosubur_app WITH LOGIN PASSWORD 'GANTI_PASSWORD_APP';

-- 2. Buat database dengan pemilik adminu
CREATE DATABASE tokosubur OWNER adminu;

-- 3. Masuk ke database tokosubur dan atur kepemilikan schema public
\c tokosubur
ALTER SCHEMA public OWNER TO adminu;
GRANT ALL ON SCHEMA public TO adminu;
```

### Asumsi & Aturan Desain Database (Skema v4)

- **Tiga User Tetap:** Sistem menggunakan 3 akun awal yang di-seed otomatis oleh migrasi dengan password ter-hash (`bcrypt`): `admin` (`admin`), `fauzi` (`owner`), dan `istri` (`co-owner`).
- **Struktur 20 Tabel & 3 View Dasar:** Seluruh nama tabel dan kolom memakai bahasa Indonesia `snake_case` yang identik dengan CSV hasil _wrangling_ dan menggunakan kunci teks alami (`sku`, `kanal`, `supplier_code`, `transaction_id`, `item_id`).
- **Satu Tingkat Stok (190 SKU):** Tabel terpisah `product_parents` dan `repack_events` sudah dihapus. Empat induk karung 50 kg (`UREA50KG`, `KCL50KG`, `DLMT50KG`, `FRTPHS50KG`) disimpan langsung di `products` dengan `is_sellable = false` dan `satuan_stok = 'kg'`, bersama 186 SKU produk jual.
- **Tabel Stok & Harga Bersifat Append-Only:** `stock_movements`, `stock_opname`, dan `product_price_history` hanya menerima penambahan baris baru tanpa mengubah atau menghapus histori (`REVOKE UPDATE, DELETE` untuk `tokosubur_app`). Saldo stok terkini dihitung dari `COALESCE(SUM(qty), 0)` pada view `v_stok_saat_ini`.
- **11 Jenis Pergerakan Stok (`stock_movement_types`):** `OPENING`, `RESTOCK_IN`, `RETURN_IN`, `DAMAGED_OUT`, `SPLIT_OUT`, `SPLIT_IN`, `ASSEMBLE_OUT`, `ASSEMBLE_IN`, `SALE_OFFLINE`, `SALE_ONLINE`, dan `ADJUSTMENT`. Pemecahan barang (`SPLIT_OUT` + `SPLIT_IN`) dan perakitan paket (`ASSEMBLE_OUT` + `ASSEMBLE_IN`) dicatat berpasangan dalam satu transaksi atomik.
- **Penanganan Stok Negatif:** Pergerakan stok yang menghasilkan saldo negatif tidak ditolak oleh database, melainkan ditandai sebagai anomali untuk ditindaklanjuti melalui pencatatan `stock_opname` (`ADJUSTMENT`).
- **Integritas Referensial (`ON DELETE`):** `products.sku_induk`, `products.supplier_utama`, `product_price_history.sku`, `forecasts.sku`, dan `forecasts.run_id` menggunakan `RESTRICT`, sedangkan konfigurasi turunan (`bundle_components`, `reorder_settings`) menggunakan `CASCADE`.

### Urutan Muat Data Hasil Wrangling (`data/processed/` – 15 CSV)

Jalankan `npm run migrate -- up` terlebih dahulu sebelum memuat data. Setelah migrasi selesai, masuk ke `psql -U postgres -d tokosubur` dan muat 15 berkas CSV dari folder `data/processed/` sesuai urutan ketergantungan _foreign key_ (sesuaikan jalur folder `'D:/programs/tokosubur/data/processed/...'` dengan lokasi repositori lokalmu; berkas `duplikat_per_berkas.csv` memang tidak dimasukkan ke database):

```sql
-- 1. Kelompok Master Mandiri
\copy channels (channel_id, kanal, kode, jenis, dasar_pendapatan, frekuensi_data) FROM 'D:/programs/tokosubur/data/processed/channels.csv' CSV HEADER;
\copy suppliers (supplier_code, nama_supplier, kelompok_produk, lead_time_hari) FROM 'D:/programs/tokosubur/data/processed/suppliers.csv' CSV HEADER;

-- 2. Products (190 SKU) & Relasi Master (menggunakan staging untuk konversi kolom float -> int)
CREATE TEMP TABLE tmp_products (LIKE products);
ALTER TABLE tmp_products ALTER COLUMN kelompok_induk TYPE NUMERIC;
\copy tmp_products (sku, product_id, nama, kategori, is_sellable, is_bundle, satuan_stok, kelompok_induk, nama_induk, sku_induk, faktor_ke_induk, is_induk_pemecahan, base_unit, faktor, isi_per_pembelian, satuan_beli, harga_kulakan, hpp, harga_jual_online, harga_jual_offline, sumber_harga, supplier_utama) FROM 'D:/programs/tokosubur/data/processed/products.csv' CSV HEADER;

INSERT INTO products
SELECT
  sku, product_id, nama, kategori, is_sellable, is_bundle, satuan_stok,
  kelompok_induk::INT, nama_induk, sku_induk, faktor_ke_induk, is_induk_pemecahan,
  base_unit, faktor, isi_per_pembelian, satuan_beli, harga_kulakan, hpp,
  harga_jual_online, harga_jual_offline, sumber_harga, supplier_utama
FROM tmp_products
ORDER BY sku_induk NULLS FIRST;
DROP TABLE tmp_products;

\copy bundle_components (sku_paket, sku_komponen, qty_komponen_per_paket) FROM 'D:/programs/tokosubur/data/processed/bundle_components.csv' CSV HEADER;
\copy product_price_history (jenis_harga, sku, bulan, harga, jumlah_transaksi) FROM 'D:/programs/tokosubur/data/processed/product_price_history.csv' CSV HEADER;

-- 3. Kelompok Transaksi & Rincian Keuangan Online (kolom batch_id dikosongkan untuk data wrangling awal)
\copy transactions (transaction_id, kanal, tanggal, jumlah_item, total_qty, total_revenue, order_no_generated) FROM 'D:/programs/tokosubur/data/processed/transactions.csv' CSV HEADER;

CREATE TEMP TABLE tmp_transaction_items (LIKE transaction_items);
ALTER TABLE tmp_transaction_items ALTER COLUMN baris_excel TYPE NUMERIC;
\copy tmp_transaction_items (item_id, transaction_id, kanal, tanggal, sku, qty, harga_satuan, diskon_rp, revenue, berkas, baris_excel) FROM 'D:/programs/tokosubur/data/processed/transaction_items.csv' CSV HEADER;

INSERT INTO transaction_items (item_id, transaction_id, kanal, tanggal, sku, qty, harga_satuan, diskon_rp, revenue, berkas, baris_excel)
SELECT
  item_id, transaction_id, kanal, tanggal, sku, qty, harga_satuan, diskon_rp, revenue,
  berkas, baris_excel::INT
FROM tmp_transaction_items;
DROP TABLE tmp_transaction_items;

\copy online_item_financials (item_id, transaction_id, kanal, bulan_laporan, order_date, sku, qty, bruto, rp_diskon, rp_diskon_platform, netto, ongkir, promo_ongkir, biaya_program_ongkir, sisa_ongkir_pembeli, komisi_platform, komisi_dihitung_balik, komisi_affiliator, laba_kotor, hpp_total, biaya_packing, laba_bersih) FROM 'D:/programs/tokosubur/data/processed/online_item_financials.csv' CSV HEADER;

-- 4. Kelompok Stok & Opname
\copy stock_movements (movement_id, tanggal, sku, jenis, qty, ref, sumber, order_date) FROM 'D:/programs/tokosubur/data/processed/stock_movements.csv' CSV HEADER;

CREATE TEMP TABLE tmp_stock_opname (LIKE stock_opname);
ALTER TABLE tmp_stock_opname ALTER COLUMN baris_excel TYPE NUMERIC;
\copy tmp_stock_opname (tanggal, sku, stok_fisik, stok_sistem, selisih, satuan_stok, catatan, aturan_sku, berkas, baris_excel) FROM 'D:/programs/tokosubur/data/processed/stock_opname.csv' CSV HEADER;

INSERT INTO stock_opname (tanggal, sku, stok_fisik, stok_sistem, selisih, satuan_stok, catatan, aturan_sku, berkas, baris_excel)
SELECT
  tanggal, sku, stok_fisik, stok_sistem, selisih, satuan_stok, catatan, aturan_sku,
  berkas, baris_excel::INT
FROM tmp_stock_opname;
DROP TABLE tmp_stock_opname;

-- 5. Kelompok Pemasaran & Kualitas Data
CREATE TEMP TABLE tmp_marketplace_metrics (LIKE marketplace_metrics);
ALTER TABLE tmp_marketplace_metrics
  ALTER COLUMN impresi TYPE NUMERIC,
  ALTER COLUMN klik TYPE NUMERIC,
  ALTER COLUMN pesanan TYPE NUMERIC,
  ALTER COLUMN jumlah_ulasan TYPE NUMERIC,
  ALTER COLUMN baris_excel TYPE NUMERIC;
\copy tmp_marketplace_metrics (periode, periode_mulai, periode_akhir, kanal, sku, impresi, klik, pesanan, rating, jumlah_ulasan, harga_tayang, aturan_sku, sku_inferred, berkas, baris_excel) FROM 'D:/programs/tokosubur/data/processed/marketplace_metrics.csv' CSV HEADER;

INSERT INTO marketplace_metrics (periode, periode_mulai, periode_akhir, kanal, sku, impresi, klik, pesanan, rating, jumlah_ulasan, harga_tayang, aturan_sku, sku_inferred, berkas, baris_excel)
SELECT
  periode, periode_mulai, periode_akhir, kanal, sku,
  impresi::INT, klik::INT, pesanan::INT, rating, jumlah_ulasan::INT,
  harga_tayang, aturan_sku, sku_inferred, berkas, baris_excel::INT
FROM tmp_marketplace_metrics;
DROP TABLE tmp_marketplace_metrics;

\copy product_mapping (sumber, teks, contoh_teks_asli, jumlah_baris, baris_masuk, aturan, sku_hasil, status) FROM 'D:/programs/tokosubur/data/processed/product_mapping.csv' CSV HEADER;

CREATE TEMP TABLE tmp_laporan_ditolak (LIKE laporan_ditolak);
ALTER TABLE tmp_laporan_ditolak ALTER COLUMN baris_excel TYPE NUMERIC;
\copy tmp_laporan_ditolak (tahap, berkas, baris_excel, teks, alasan, rincian_harga, jenis_alasan) FROM 'D:/programs/tokosubur/data/processed/laporan_ditolak.csv' CSV HEADER;

INSERT INTO laporan_ditolak (tahap, berkas, baris_excel, teks, alasan, rincian_harga, jenis_alasan)
SELECT
  tahap, berkas, baris_excel::INT, teks, alasan, rincian_harga, jenis_alasan
FROM tmp_laporan_ditolak;
DROP TABLE tmp_laporan_ditolak;

CREATE TEMP TABLE tmp_penjualan_ambigu (LIKE penjualan_ambigu);
ALTER TABLE tmp_penjualan_ambigu ALTER COLUMN baris_excel TYPE NUMERIC;
\copy tmp_penjualan_ambigu (tanggal, bulan, kanal, teks_asli, qty, subtotal, sku_kandidat, alasan, berkas, baris_excel) FROM 'D:/programs/tokosubur/data/processed/penjualan_ambigu.csv' CSV HEADER;

INSERT INTO penjualan_ambigu (tanggal, bulan, kanal, teks_asli, qty, subtotal, sku_kandidat, alasan, berkas, baris_excel)
SELECT
  tanggal, bulan, kanal, teks_asli, qty, subtotal, sku_kandidat, alasan, berkas, baris_excel::INT
FROM tmp_penjualan_ambigu;
DROP TABLE tmp_penjualan_ambigu;

\copy data_status (kanal, periode_mulai, data_complete_until, catatan) FROM 'D:/programs/tokosubur/data/processed/data_status.csv' CSV HEADER;

-- 6. Sinkronisasi Sequence Auto-Increment
SELECT setval(pg_get_serial_sequence('channels', 'channel_id'), COALESCE((SELECT MAX(channel_id) FROM channels), 1), (SELECT COUNT(*) > 0 FROM channels));
SELECT setval(pg_get_serial_sequence('import_batches', 'batch_id'), COALESCE((SELECT MAX(batch_id) FROM import_batches), 1), (SELECT COUNT(*) > 0 FROM import_batches));
SELECT setval(pg_get_serial_sequence('stock_movements', 'movement_id'), COALESCE((SELECT MAX(movement_id) FROM stock_movements), 1), (SELECT COUNT(*) > 0 FROM stock_movements));
SELECT setval(pg_get_serial_sequence('model_runs', 'run_id'), COALESCE((SELECT MAX(run_id) FROM model_runs), 1), (SELECT COUNT(*) > 0 FROM model_runs));
SELECT setval(pg_get_serial_sequence('forecasts', 'forecast_id'), COALESCE((SELECT MAX(forecast_id) FROM forecasts), 1), (SELECT COUNT(*) > 0 FROM forecasts));

-- 7. Pengaturan Hak Akses Role Aplikasi (tokosubur_app)
GRANT CONNECT ON DATABASE tokosubur TO tokosubur_app;
GRANT USAGE ON SCHEMA public TO tokosubur_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tokosubur_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tokosubur_app;
REVOKE UPDATE, DELETE ON TABLE stock_movements, stock_opname, product_price_history FROM tokosubur_app;
REVOKE INSERT, UPDATE, DELETE ON TABLE pgmigrations FROM tokosubur_app;

ALTER DEFAULT PRIVILEGES FOR ROLE adminu IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tokosubur_app;
ALTER DEFAULT PRIVILEGES FOR ROLE adminu IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO tokosubur_app;

-- 8. Verifikasi Jumlah Baris Dataset v7
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM products) AS total_products,
  (SELECT COUNT(*) FROM products WHERE is_sellable = FALSE) AS induk_karung,
  (SELECT COUNT(*) FROM transaction_items) AS total_items,
  (SELECT COUNT(*) FROM stock_movements) AS total_movements,
  (SELECT COUNT(*) FROM product_mapping) AS total_mapping;
```

Nilai verifikasi yang diharapkan: `total_users = 3`, `total_products = 190`, `induk_karung = 4`, `total_items = 59946`, `total_movements = 66542`, dan `total_mapping = 1010`.

## 7. Database Migration

Backend menggunakan `node-pg-migrate` dengan pola **1 file migrasi per objek** (23 migrasi: 2 autentikasi `users`, 20 tabel skema v4, dan 1 file 3 view dasar) untuk memudahkan _rollback_ parsial bila ada revisi skema.

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

## 8. Running the Application & Available Endpoints

### Development Mode

```bash
npm run dev
```

Server akan dijalankan menggunakan Nodemon pada `http://localhost:3000` agar otomatis restart saat source code berubah.

### Production Mode

```bash
npm start
```

### Health Check

Akses `GET http://localhost:3000/` untuk memastikan server aktif:

```json
{
  "message": "API Toko Subur berjalan"
}
```

### Daftar Endpoint Aktif

| Method | Endpoint               | Keterangan & Query / Body Parameter                                                            |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `GET`  | `/`                    | Health check status server                                                                     |
| `POST` | `/api/authentications` | Login pengguna (`username`, `password`) menghasilkan `accessToken` JWT                         |
| `GET`  | `/api/stocks`          | Daftar stok terkini per SKU dari `v_stok_saat_ini` (`isSellable`, `search`, `limit`, `offset`) |

Kredensial akun tetap untuk pengujian:

| Role       | Username | Password      |
| ---------- | -------- | ------------- |
| `admin`    | `admin`  | `password123` |
| `owner`    | `fauzi`  | `fauzi123`    |
| `co-owner` | `istri`  | `istri123`    |

## 9. API Testing (Postman)

Koleksi pengujian otomatis tersedia di folder `apps/api/postman/`:

1. Buka **Postman**, klik **Import**, lalu masukkan dua berkas berikut:
   - `apps/api/postman/SuburOnline-Local.postman_environment.json`
   - `apps/api/postman/SuburOnline-API.postman_collection.json`
2. Pilih environment **SuburOnline - Local** di pojok kanan atas (`baseUrl` = `http://localhost:3000`).
3. Jalankan **Collection Runner** pada **SuburOnline API** untuk mengeksekusi **18 skenario pengujian** (8 skenario **Authentication** termasuk penyimpanan otomatis `{{token}}`, serta 10 skenario **Stocks v4** untuk 190 SKU).

## 10. Code Quality

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

Selalu jalankan formatting dan linter sebelum melakukan commit perubahan ke repository.

## 11. Backend Integration

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

Frontend tidak berkomunikasi langsung dengan database; seluruh operasi data dan integrasi layanan eksternal dikelola melalui Backend API.

## 12. Development Guidelines & Git Workflow

### Development Guidelines

1. Gunakan repository pattern untuk memisahkan query database dari business logic.
2. Jangan menulis query SQL langsung di controller.
3. Setiap perubahan struktur database harus dibuat melalui file migrasi baru (jangan mengubah file migrasi lama yang sudah di-push ke Git).
4. Jangan menyimpan credential atau secret di source code.
5. Gunakan validator untuk memvalidasi setiap request.
6. Gunakan middleware untuk authentication, authorization, dan error handling.
7. Pisahkan konfigurasi aplikasi dari business logic.
8. Dokumentasikan endpoint dan perubahan kontrak API.
9. Jangan commit file `.env`, `node_modules`, atau file build.
10. Pastikan pengujian Postman lulus sebelum membuat Pull Request atau push ke branch utama.

### Alur Git Harian Tim Backend

```bash
# 1. Tarik pembaruan terbaru sebelum mulai bekerja
git pull --rebase origin main

# 2. Pastikan file .env tidak ikut ter-track
git status

# 3. Stage & commit terstruktur per modul
git add apps/api/migrations/
git commit -m "feat(db): add schema v4 migrations"

git add apps/api/src/
git commit -m "feat(api): implement endpoint and service logic"

git add apps/api/postman/ apps/api/readme.md
git commit -m "docs(api): update Postman collection and backend readme"

# 4. Sinkronisasi dan push ke remote repository
git pull --rebase origin main
git push origin main
```

## 13. Useful Commands

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `npm install`             | Install dependencies          |
| `npm run dev`             | Start development server      |
| `npm start`               | Start application             |
| `npm run migrate -- up`   | Run pending migrations        |
| `npm run migrate -- down` | Rollback latest migration     |
| `npm run lint`            | Check code quality            |
| `npm run lint:fix`        | Automatically fix lint issues |
| `npm run format`          | Format source code            |

---

**Toko Subur – Backend Development Team**
