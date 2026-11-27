const db = require('../config/db');

const findSuppliers = async () => {
  const { rows } = await db.query(`
    SELECT
      s.supplier_code,
      s.nama_supplier,
      s.kelompok_produk,
      s.lead_time_hari,
      COUNT(p.sku) FILTER (WHERE p.is_active = TRUE)::int AS jumlah_produk_aktif
    FROM suppliers s
    LEFT JOIN products p ON p.supplier_utama = s.supplier_code
    GROUP BY s.supplier_code
    ORDER BY s.nama_supplier ASC
  `);
  return rows;
};

const findChannels = async () => {
  const { rows } = await db.query(`
    SELECT
      c.channel_id,
      c.kanal,
      c.kode,
      c.jenis,
      c.dasar_pendapatan,
      c.frekuensi_data,
      ds.data_complete_until
    FROM channels c
    LEFT JOIN data_status ds ON ds.kanal = c.kanal
    ORDER BY c.channel_id ASC
  `);
  return rows;
};

const findChannelByKanal = async (kanal, executor = db) => {
  const { rows } = await executor.query(
    'SELECT channel_id, kanal, kode, jenis FROM channels WHERE LOWER(kanal) = LOWER($1)',
    [kanal]
  );
  return rows[0] || null;
};

module.exports = {
  findSuppliers,
  findChannels,
  findChannelByKanal,
};
