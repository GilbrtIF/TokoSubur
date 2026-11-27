# Kontrak API – Toko Subur (SuburOnline)

Dokumen ini adalah acuan untuk tim **Front-End** (`apps/web`) dan **AI/ML** (`apps/ml-service`) saat memanggil Backend API. Contoh request lengkap beserta tes otomatisnya ada di koleksi Postman `apps/api/postman/`.

- Base URL lokal: `http://localhost:3000`
- Semua path diawali `/api`
- Format tanggal: `YYYY-MM-DD` (WIB, tanpa jam). Kolom waktu (`diimporPada`, `dilatihPada`) berformat ISO 8601.
- Angka uang/qty dikirim sebagai **number** JSON (bukan string).

## 1. Konvensi Umum

### Autentikasi

Semua endpoint **kecuali** `POST /api/authentications` wajib membawa header:

```text
Authorization: Bearer <accessToken>
```

| Role       | Akun awal | Hak khusus                                           |
| ---------- | --------- | ---------------------------------------------------- |
| `admin`    | `admin`   | Semua, termasuk kirim hasil model & dataset latih    |
| `owner`    | `fauzi`   | Semua kecuali endpoint khusus ML; boleh hapus produk |
| `co-owner` | `istri`   | Semua kecuali hapus produk & aktivasi model          |

Endpoint khusus ML service juga menerima header `X-Service-Key: <SERVICE_API_KEY>` sebagai pengganti token (lihat bagian 11).

### Format respons

```jsonc
// Sukses
{ "status": "success", "message": "opsional", "data": {}, "meta": { "limit": 50, "offset": 0, "total": 190 } }

// Gagal karena input/izin (4xx)
{ "status": "fail", "message": "Penjelasan dalam Bahasa Indonesia" }

// Error server (500)
{ "status": "error", "message": "Terjadi kesalahan pada server" }
```

| Kode    | Arti                                                                 |
| ------- | -------------------------------------------------------------------- |
| 400     | Validasi gagal / aturan bisnis dilanggar / JSON rusak                |
| 401     | Token tidak ada, tidak valid, atau kedaluwarsa → arahkan ke `/login` |
| 403     | Role tidak diizinkan                                                 |
| 404     | Data atau endpoint tidak ditemukan                                   |
| 409     | Data yang sama sudah tercatat (bentrok unik di database)             |
| 413     | Body > 2 MB                                                          |
| 502/503 | ML/AI service error / tidak dapat dihubungi                          |

### Paginasi & filter

Endpoint daftar menerima `limit` (1–200, default 50) dan `offset` (≥ 0). `meta.total` = jumlah seluruh data sesuai filter. Parameter query tidak boleh dikirim berulang (`?limit=1&limit=2` → 400). Filter teks (`search`) tidak membedakan huruf besar/kecil.

### Periode laporan (Dashboard & Analytics)

`from` & `to` opsional. Jika keduanya kosong, periode = **30 hari yang berakhir di tanggal penjualan terakhir** di database (data bersifat historis). Jika hanya salah satu diisi, rentang otomatis 30 hari.

---

## 2. Auth

| Method | Path                   | Keterangan                                                                                                                        |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/authentications` | Login. Body `{ username, password }` → `data: { accessToken, user: { id, username, name, role } }`                                |
| GET    | `/api/auth/me`         | Profil pengguna dari token                                                                                                        |
| PUT    | `/api/auth/password`   | Ganti password. Body `{ oldPassword, newPassword }`. `newPassword` 8–72 karakter, minimal 1 huruf & 1 angka, harus beda dari lama |

## 3. Master Data

| Method | Path             | Keterangan                                                                                                    |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/suppliers` | `[{ supplierCode, namaSupplier, kelompokProduk, leadTimeHari, jumlahProdukAktif }]`                           |
| GET    | `/api/channels`  | `[{ channelId, kanal, kode, jenis ('toko fisik'/'marketplace'), isOnline, dasarPendapatan, frekuensiData, dataCompleteUntil }]` |

## 4. Produk

| Method | Path                       | Keterangan                                                                                                                                                                                                       |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/products`            | Query: `search`, `kategori`, `status` (`active`*/`inactive`/`all`), `isSellable`, `isBundle`, `limit`, `offset`                                                                                                  |
| GET    | `/api/products/categories` | `[{ kategori, jumlahSku }]` (produk aktif)                                                                                                                                                                       |
| GET    | `/api/products/:sku`       | Detail + `komponen` (paket), `dipakaiDiPaket`, `kemasan` (anak dari induk), `reorderSetting`, `hargaTerbaru`                                                                                                     |
| POST   | `/api/products`            | Tambah SKU (lihat body di bawah). `productId` dibuat otomatis                                                                                                                                                    |
| PUT    | `/api/products/:sku`       | Ubah sebagian field. Field tidak dikirim = tidak berubah; `null` = dikosongkan. `sku` tidak bisa diubah. `isActive: true` untuk mengaktifkan kembali                                                             |
| DELETE | `/api/products/:sku`       | **Hybrid delete** (role `admin`/`owner`). `data.mode = "soft"` (dinonaktifkan) bila SKU sudah punya riwayat; `"hard"` (dihapus permanen) bila belum pernah dipakai. `data.dipakaiDi` menjelaskan tabel pemakaian |

Objek produk:

```json
{
  "sku": "UREA1KG",
  "productId": 2,
  "nama": "Urea 1kg",
  "kategori": "Pupuk",
  "isActive": true,
  "isSellable": true,
  "isBundle": false,
  "isIndukPemecahan": false,
  "satuanStok": "unit",
  "skuInduk": "UREA50KG",
  "namaInduk": "Urea Karung 50kg",
  "faktorKeInduk": 1,
  "isiPerPembelian": null,
  "satuanBeli": null,
  "hargaKulakan": null,
  "hpp": 6500,
  "hargaJualOnline": 12000,
  "hargaJualOffline": 10000,
  "supplierUtama": "SUP01",
  "namaSupplier": "Pupuk Jaya",
  "stokSaatIni": 7
}
```

Body `POST /api/products` (wajib: `sku`, `nama`, `satuanStok`):

```jsonc
{
  "sku": "UREA-2KG", // huruf/angka/titik/strip/underscore, otomatis UPPERCASE, maks 30
  "nama": "Urea 2 kg",
  "kategori": "Pupuk",
  "satuanStok": "unit",
  "isSellable": true, // default true
  "isBundle": false, // default false
  "isIndukPemecahan": false, // default false
  "skuInduk": "UREA50KG", // produk kemasan: wajib induk aktif + faktorKeInduk > 0
  "faktorKeInduk": 2,
  "isiPerPembelian": null,
  "satuanBeli": null,
  "hargaKulakan": null,
  "hpp": null,
  "hargaJualOnline": 22000,
  "hargaJualOffline": 20000,
  "supplierUtama": "SUP01",
  "komponen": [{ "skuKomponen": "BENIH01", "qty": 2 }], // hanya untuk isBundle = true (wajib ≥ 1)
}
```

Aturan: induk pemecahan tidak boleh punya `skuInduk`/menjadi paket; komponen paket harus aktif dan bukan paket; induk yang masih punya kemasan tidak bisa diubah menjadi non-induk. Produk baru otomatis mendapat `reorder_settings` default (stok pengaman 2, lead time dari supplier atau 7 hari).

## 5. Inventori / Stok

| Method | Path                          | Keterangan                                                                                                                                                          |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/stocks`                 | Daftar stok. Query: `isSellable`, `status` (`all`/`aman`/`waspada`/`kritis`/`selisih_opname`), `search`, `limit`, `offset`                                          |
| GET    | `/api/stocks/summary`         | 4 KPI header Inventory                                                                                                                                              |
| GET    | `/api/stocks/alerts`          | `{ repack[], assemble[], restock[] }`                                                                                                                               |
| GET    | `/api/stocks/history`         | Riwayat aktivitas stok (halaman Riwayat Stock). Query: `type` (`all`/`opname`/`import`/`manual`), `from`, `to`, `includeItems` (default true), `limit` (default 20) |
| GET    | `/api/stocks/:sku/movements`  | Kartu stok + saldo berjalan                                                                                                                                         |
| POST   | `/api/stocks/movements/batch` | Mutasi manual: `restok`, `retur`, `rusak`, `repack`, `rakit`                                                                                                        |
| GET    | `/api/stocks/opname/sheet`    | Lembar kerja opname. Query `level` (`sku`/`induk`), `search`                                                                                                        |
| GET    | `/api/stocks/opname`          | Riwayat opname. Query `sku`, `tanggal`, `limit`, `offset`                                                                                                           |
| POST   | `/api/stocks/opname`          | Simpan hasil opname + ADJUSTMENT otomatis                                                                                                                           |
| POST   | `/api/stocks/import/preview`  | `multipart/form-data`, field `file` (.csv/.xlsx/.xls, maks 10 MB). Kolom: `tanggal, sku, jenis, qty, catatan`                                                       |
| POST   | `/api/stocks/import/commit`   | Body = hasil preview `{ fileName, duplicateCount, validRows, rejectedRows }`. Server mengecek duplikat ulang                                                        |

Body mutasi batch:

```json
{
  "tanggal": "2026-11-26",
  "items": [
    {
      "sku": "UREA50KG",
      "jenis": "restok",
      "qty": 100,
      "catatan": "Kiriman supplier"
    },
    { "sku": "UREA1KG", "jenis": "repack", "qty": 10 },
    {
      "sku": "UREA50KG",
      "jenis": "repack",
      "repackItems": [{ "skuKemasan": "UREA5KG", "qtyKemasan": 2 }]
    },
    { "sku": "PAKET01", "jenis": "rakit", "qty": 1 }
  ]
}
```

`repack` mode kemasan (`sku` = kemasan + `qty`) atau mode induk (`sku` = induk + `repackItems`). Mutasi keluar ditolak bila stok tidak cukup.

Item riwayat stok: `{ id, tipe, label, tanggal, waktu, jumlahItem, jumlahSelisih, berkas, batchId, diimporOleh, items: [{ sku, nama, jenis, qty, stokSistem, stokFisik, selisih, alasan, catatan }] }`.

## 6. Transaksi Penjualan

| Method | Path                               | Keterangan                                                                                                                               |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/transactions`                | Query: `from`, `to`, `kanal`, `search` (ID transaksi), `sku`, `limit`, `offset`. `meta` berisi `totalRevenue` & `totalQty` sesuai filter |
| GET    | `/api/transactions/:id`            | Header + `items[]` (+ `keuanganOnline` bila ada)                                                                                         |
| POST   | `/api/transactions`                | Input nota (lihat body)                                                                                                                  |
| POST   | `/api/transactions/import/preview` | `multipart/form-data` field `file`. Kolom wajib: `tanggal, kanal, sku, qty, harga_satuan`; opsional `no_pesanan`, `diskon`               |
| POST   | `/api/transactions/import/commit`  | Body = hasil preview `{ fileName, duplicateCount, validRows, rejectedRows }`                                                             |

Body input nota:

```jsonc
{
  "tanggal": "2026-11-26", // default: hari ini (WIB)
  "kanal": "Offline", // default: kanal offline pertama
  "noNota": "NOTA-0012", // opsional; kosong = dibuat otomatis (KODE-YYYYMMDD-XXXXXX)
  "items": [
    { "sku": "UREA1KG", "qty": 2 }, // harga default = harga jual kanal
    { "sku": "BENIH01", "qty": 1, "hargaSatuan": 7500, "diskonRp": 500 },
  ],
}
```

Respons: `data: { transaction: { ...detail }, warnings: [{ sku, stokSaatIni, pesan }] }`.

Aturan:

- Hanya produk **aktif & jual**; `qty` bilangan bulat > 0; diskon ≤ subtotal.
- Setiap item otomatis membuat mutasi stok `SALE_OFFLINE` (tanggal nota) atau `SALE_ONLINE` (tanggal = akhir bulan, `orderDate` = tanggal pesanan).
- Penjualan **tidak ditolak** walau stok kurang (sesuai aturan skema v4); stok negatif dikembalikan di `warnings` agar segera di-opname.
- Import: baris dengan `no_pesanan` yang sama digabung menjadi satu transaksi; baris tanpa nomor digabung per (kanal, tanggal). Kolom `sku` juga boleh berisi teks produk yang sudah dipetakan di **mapping produk**. Duplikat dideteksi dari nomor pesanan yang sudah ada atau baris identik.

## 7. Dashboard & Analytics

| Method | Path                          | Query                                                                                    | Keterangan                           |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/api/dashboard/summary`      | `from`, `to`, `kanal`                                                                    | 4 kartu, 2 grafik, 2+ list           |
| GET    | `/api/analytics/sales`        | `from`, `to`, `kanal`, `kategori`, `granularity` (`harian`*/`mingguan`/`bulanan`)        | Deret waktu (periode kosong diisi 0) |
| GET    | `/api/analytics/top-products` | `from`, `to`, `kanal`, `kategori`, `limit` (1–50, default 5), `sortBy` (`revenue`/`qty`) |                                      |
| GET    | `/api/analytics/export`       | `from`, `to`, `kanal`, `kategori`, `format` (`xlsx`*/`csv`)                              | Unduhan berkas (bukan JSON)          |
| GET    | `/api/marketplace-metrics`    | `periode` (YYYY-MM), `kanal`, `sku`, `limit`, `offset`                                   | + `ctrPercent`, `konversiPercent`    |

Dashboard:

```json
{
  "periode": {
    "from": "2026-10-04",
    "to": "2026-11-02",
    "isDefault": true,
    "kanal": null
  },
  "periodeSebelumnya": { "from": "2026-09-04", "to": "2026-10-03" },
  "cards": {
    "omzet": { "value": 100000, "previous": 80000, "growthPercent": 25 },
    "jumlahTransaksi": { "value": 3, "previous": 2, "growthPercent": 50 },
    "qtyTerjual": { "value": 7, "previous": 5, "growthPercent": 40 },
    "skuKritis": { "value": 2, "prediksiRestock": 1 }
  },
  "charts": {
    "penjualanHarian": [
      { "tanggal": "2026-10-04", "revenue": 0, "qty": 0, "transaksi": 0 }
    ],
    "penjualanPerKanal": [
      {
        "kanal": "TikTok",
        "jenis": "online",
        "revenue": 52000,
        "qty": 2,
        "transaksi": 1,
        "persentaseRevenue": 52
      }
    ]
  },
  "lists": {
    "produkTerlaris": [
      {
        "sku": "UREA5KG",
        "nama": "Urea 5kg",
        "revenue": 42000,
        "qty": 1,
        "transaksi": 1
      }
    ],
    "stokKritis": [
      {
        "sku": "BARU01",
        "nama": "...",
        "stokSaatIni": 0,
        "reorderPoint": 2,
        "status": "kritis"
      }
    ],
    "rekomendasiRestok": [
      {
        "sku": "...",
        "nama": "...",
        "namaSupplier": "...",
        "stokSaatIni": 0,
        "saranJumlahBeli": 10,
        "satuanBeli": "pak"
      }
    ]
  }
}
```

`growthPercent` = `null` jika periode sebelumnya bernilai 0. Analytics `series[]`: `{ periode, revenue, qty, transaksi, perKanal: { "Shopee": { revenue, qty } } }`, plus `ringkasan`, `perKanal`, `perKategori`.

Export: `Content-Disposition: attachment; filename="penjualan_<from>_<to>.xlsx"` dan header `X-Row-Count`. Excel berisi sheet **Penjualan**, **Top Produk**, **Per Kanal**. CSV ber-BOM UTF-8 agar rapi di Excel. Di frontend unduh dengan `axios.get(url, { responseType: 'blob' })`.

## 8. Settings

| Method | Path                         | Keterangan                                                                                                                                                                       |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/settings/reorder`      | Query `search`, `kategori`, `limit`, `offset`. Item: `{ sku, nama, stokSaatIni, stokMinimumManual, titikPesanUlang, stokPengaman, leadTimeHari, sumberLeadTime, ambangEfektif }` |
| PUT    | `/api/settings/reorder/:sku` | Body minimal salah satu: `stokMinimumManual` (boleh `null` = kembali otomatis), `titikPesanUlang`, `stokPengaman`, `leadTimeHari` (bulat 0–365)                                  |
| PUT    | `/api/settings/reorder`      | Bulk: `{ items: [{ sku, ...field }] }` maks 200                                                                                                                                  |
| PUT    | `/api/auth/password`         | Ganti password (lihat bagian 2)                                                                                                                                                  |

`ambangEfektif` = `stokMinimumManual` ?? `titikPesanUlang` ?? `stokPengaman` ?? 2. Nilai ini dipakai status stok (`kritis`/`waspada`) dan saran pemecahan.

## 9. Kualitas Data & Mapping Produk

| Method | Path                          | Keterangan                                                                                                                                |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/data-quality/status`    | `{ kanal[] (dataCompleteUntil, transaksiTerakhir, importTerakhir), ringkasan, ditolakPerAlasan[], mappingPerStatus[], importTerakhir[] }` |
| GET    | `/api/data-quality/rejected`  | Baris ditolak. Query `tahap`, `berkas`, `jenisAlasan`, `batchId`, `limit`, `offset`                                                       |
| GET    | `/api/data-quality/ambiguous` | Penjualan ambigu (`skuKandidat` berupa array). Query `kanal`, `from`, `to`                                                                |
| GET    | `/api/import-batches`         | Riwayat import. Query `jenisImpor` (`stok`/`penjualan`/...), `status`                                                                     |
| GET    | `/api/product-mappings`       | Query `status` (`masuk`/`ditolak`/`sebagian ditolak`), `sumber`, `search`                                                                 |
| POST   | `/api/product-mappings`       | `{ sumber, teks, skuHasil, aturan? }` → status `masuk`. 201 bila baru, 200 bila memperbarui teks yang sama (tanpa beda huruf besar/kecil) |

Mapping yang disimpan langsung dipakai oleh import stok dan import penjualan.

## 10. Forecast

| Method | Path                                    | Akses                      | Keterangan                                                                                                     |
| ------ | --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/forecasts`                        | login                      | Prediksi model aktif (atau `runId`). Query `sku`, `kanal`, `from`, `to`, `granularitas`, `limit` (default 100) |
| GET    | `/api/forecasts/models`                 | login                      | `{ modelAktif, riwayat[] }` dengan `wape`, `mape`, `rmse`, `estimasiAkurasiPersen`                             |
| GET    | `/api/forecasts/sku/:sku`               | login                      | Grafik: `{ produk, aktual[] (historyDays, default 90), prediksi[] }`                                           |
| GET    | `/api/forecasts/demand-changes`         | login                      | Prediksi 30 hari vs aktual 30 hari. Query `direction` (`semua`/`naik`/`turun`), `search`                       |
| GET    | `/api/forecasts/stock-projection`       | login                      | `estimasiHariHabis`, `perkiraanTanggalHabis`. Query `maxHari`, `search`                                        |
| GET    | `/api/forecasts/training-dataset`       | admin / service key        | CSV `v_dataset_latih` (tanpa BOM). Query `from`, `to`                                                          |
| POST   | `/api/forecasts/runs`                   | admin / service key        | Simpan hasil training (lihat bagian 11)                                                                        |
| POST   | `/api/forecasts/runs/:runId/items`      | admin / service key        | Tambah prediksi bertahap, maks 5.000 baris per request                                                         |
| PUT    | `/api/forecasts/models/:runId/activate` | admin, owner / service key | Jadikan model aktif (model lain otomatis nonaktif)                                                             |

Prediksi hanya terlihat di UI (inventory `stokCukupHari`, rekomendasi restok, dashboard) setelah model **diaktifkan**.

## 11. Integrasi ML / AI Service (untuk tim AI-DS)

### 11.a Chat AI (Backend → ML service)

Frontend memanggil `POST /api/ai/chat` di Backend:

```json
{
  "message": "Produk apa yang perlu restok?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "includeContext": true
}
```

- `message` 1–2.000 karakter; `history` maks 20 pesan terakhir, `role` hanya `user`/`assistant`.
- Respons: `data: { reply, sources[], model, contextIncluded }`.
- `GET /api/ai/health` → `{ configured, available }` untuk menampilkan status AI di UI.

Backend meneruskan ke ML service:

```text
POST {ML_SERVICE_URL}/api/ai/chat
Content-Type: application/json
```

```json
{
  "message": "Produk apa yang perlu restok?",
  "history": [{ "role": "user", "content": "..." }],
  "user": { "username": "fauzi", "role": "owner" },
  "context": {
    "periode": { "from": "2026-10-04", "to": "2026-11-02" },
    "kpi": {
      "omzet": {},
      "jumlahTransaksi": {},
      "qtyTerjual": {},
      "skuKritis": {}
    },
    "penjualanPerKanal": [],
    "produkTerlaris": [],
    "stokKritis": [],
    "rekomendasiRestok": []
  }
}
```

ML service **wajib** membalas HTTP 200 dengan JSON:

```json
{ "reply": "Teks jawaban untuk pengguna", "sources": [], "model": "gemini-x" }
```

`context` berisi ringkasan data bisnis terkini (format sama dengan `GET /api/dashboard/summary`) sehingga LLM bisa menjawab tanpa akses database. Batas waktu respons `ML_SERVICE_TIMEOUT_MS` (default 30 detik). Bila ML service mati → Backend membalas 503; bila ML membalas error/non-JSON → 502.

### 11.b Hasil forecast (ML service → Backend)

Header: `X-Service-Key: <SERVICE_API_KEY>` (nilai sama di `.env` Backend dan ML service), atau token admin.

1. Ambil dataset latih: `GET /api/forecasts/training-dataset?from=&to=` → CSV kolom `tanggal,kanal,sku,qty,revenue,is_stockout` (sudah dibatasi `data_complete_until`).
2. Simpan run + prediksi (≤ 5.000 baris per request):

```json
POST /api/forecasts/runs
{
  "namaModel": "RandomForest", "versiModel": "v1", "dilatihPada": "2026-11-26T10:00:00+07:00",
  "trainMulai": "2026-01-01", "trainSelesai": "2026-10-31", "testMulai": "2026-11-01", "testSelesai": "2026-11-20",
  "wape": 18.5, "mape": 22.1, "rmse": 1.2,
  "aktifkan": false,
  "forecasts": [
    { "sku": "UREA1KG", "kanal": null, "periode": "2026-11-27", "granularitas": "harian", "qtyPrediksi": 3.2, "qtyBawah": 2, "qtyAtas": 4.5 }
  ]
}
```

Respons `201`: `data: { model: { runId, ... }, insertedForecasts }`. 3. Sisa prediksi: `POST /api/forecasts/runs/{runId}/items` body `{ "forecasts": [ ... ] }`. 4. Aktifkan: `PUT /api/forecasts/models/{runId}/activate` (atau kirim `"aktifkan": true` di langkah 2 bila semua prediksi muat dalam satu request).

Aturan: `sku` & `kanal` harus terdaftar; `granularitas` `harian`/`mingguan`/`bulanan` (default `harian`); `qtyBawah` ≤ `qtyAtas`. `estimasiAkurasiPersen` = 100 − WAPE.
