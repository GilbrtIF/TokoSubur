// apps/api/src/config/db.js

const { Pool, types } = require('pg');
const { databaseUrl } = require('./env');

// Kolom bertipe DATE (OID 1082) dikembalikan apa adanya sebagai teks 'YYYY-MM-DD'.
// Tanpa ini, node-postgres mengubahnya menjadi objek Date pada jam 00:00 waktu lokal
// server, sehingga di zona WIB (UTC+7) tanggal tampil mundur satu hari dalam JSON
// (contoh: 2026-10-05 menjadi "2026-10-04T17:00:00.000Z").
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: databaseUrl,
});

// Menangani error pada koneksi idle di dalam pool.
pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
