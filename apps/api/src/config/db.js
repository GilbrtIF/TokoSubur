// apps/api/src/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tes koneksi saat server dinyalakan (Opsional)
pool.connect()
  .then(() => console.log('✅ Terhubung ke database PostgreSQL'))
  .catch((err) => console.error('❌ Gagal terhubung ke database', err.stack));

module.exports = pool;  