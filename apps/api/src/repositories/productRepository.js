const db = require('../config/db');
const { escapeLikePattern } = require('../utils/format');

const PRODUCT_COLUMNS = `
  p.sku,
  p.product_id,
  p.nama,
  p.kategori,
  p.is_active,
  p.is_sellable,
  p.is_bundle,
  p.is_induk_pemecahan,
  p.satuan_stok,
  p.kelompok_induk,
  p.sku_induk,
  p.nama_induk,
  p.faktor_ke_induk,
  p.isi_per_pembelian,
  p.satuan_beli,
  p.harga_kulakan,
  p.hpp,
  p.harga_jual_online,
  p.harga_jual_offline,
  p.sumber_harga,
  p.supplier_utama,
  s.nama_supplier,
  COALESCE(st.stok, 0) AS stok_saat_ini
`;

// Kolom yang boleh diisi/diubah lewat API (camelCase -> kolom database).
const WRITABLE_COLUMNS = {
  nama: 'nama',
  kategori: 'kategori',
  isActive: 'is_active',
  isSellable: 'is_sellable',
  isBundle: 'is_bundle',
  isIndukPemecahan: 'is_induk_pemecahan',
  satuanStok: 'satuan_stok',
  kelompokInduk: 'kelompok_induk',
  skuInduk: 'sku_induk',
  namaInduk: 'nama_induk',
  faktorKeInduk: 'faktor_ke_induk',
  baseUnit: 'base_unit',
  faktor: 'faktor',
  isiPerPembelian: 'isi_per_pembelian',
  satuanBeli: 'satuan_beli',
  hargaKulakan: 'harga_kulakan',
  hpp: 'hpp',
  hargaJualOnline: 'harga_jual_online',
  hargaJualOffline: 'harga_jual_offline',
  sumberHarga: 'sumber_harga',
  supplierUtama: 'supplier_utama',
};

const buildListFilter = ({
  search,
  kategori,
  status,
  isSellable,
  isBundle,
}) => {
  const conditions = [];
  const params = [];

  if (status === 'active') {
    conditions.push('p.is_active = TRUE');
  } else if (status === 'inactive') {
    conditions.push('p.is_active = FALSE');
  }

  if (kategori) {
    params.push(kategori);
    conditions.push(`LOWER(p.kategori) = LOWER($${params.length})`);
  }

  if (isSellable !== null) {
    params.push(isSellable);
    conditions.push(`p.is_sellable = $${params.length}`);
  }

  if (isBundle !== null) {
    params.push(isBundle);
    conditions.push(`p.is_bundle = $${params.length}`);
  }

  if (search) {
    params.push(`%${escapeLikePattern(search)}%`);
    const idx = params.length;
    conditions.push(
      `(p.sku ILIKE $${idx} ESCAPE '\\' OR p.nama ILIKE $${idx} ESCAPE '\\')`
    );
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const findProducts = async (filter) => {
  const { whereClause, params } = buildListFilter(filter);
  params.push(filter.limit, filter.offset);

  const { rows } = await db.query(
    `
      SELECT ${PRODUCT_COLUMNS}
      FROM products p
      LEFT JOIN suppliers s ON s.supplier_code = p.supplier_utama
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      ${whereClause}
      ORDER BY p.product_id ASC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );
  return rows;
};

const countProducts = async (filter) => {
  const { whereClause, params } = buildListFilter(filter);
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM products p ${whereClause}`,
    params
  );
  return rows[0].total;
};

const findCategories = async () => {
  const { rows } = await db.query(`
    SELECT kategori, COUNT(*)::int AS jumlah_sku
    FROM products
    WHERE is_active = TRUE AND kategori IS NOT NULL
    GROUP BY kategori
    ORDER BY kategori ASC
  `);
  return rows;
};

const findBySku = async (sku, executor = db) => {
  const { rows } = await executor.query(
    `
      SELECT ${PRODUCT_COLUMNS}
      FROM products p
      LEFT JOIN suppliers s ON s.supplier_code = p.supplier_utama
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      WHERE p.sku = $1
    `,
    [sku]
  );
  return rows[0] || null;
};

const findBySkus = async (skus, executor = db) => {
  const { rows } = await executor.query(
    `
      SELECT sku, nama, is_active, is_bundle, is_induk_pemecahan, kelompok_induk, satuan_stok
      FROM products
      WHERE sku = ANY($1::varchar[])
    `,
    [skus]
  );
  return rows;
};

const findBundleComponents = async (skuPaket) => {
  const { rows } = await db.query(
    `
      SELECT
        bc.sku_komponen,
        p.nama AS nama_komponen,
        p.satuan_stok,
        p.is_active,
        bc.qty_komponen_per_paket,
        COALESCE(st.stok, 0) AS stok_saat_ini
      FROM bundle_components bc
      JOIN products p ON p.sku = bc.sku_komponen
      LEFT JOIN v_stok_saat_ini st ON st.sku = bc.sku_komponen
      WHERE bc.sku_paket = $1
      ORDER BY bc.sku_komponen ASC
    `,
    [skuPaket]
  );
  return rows;
};

const findBundlesUsingComponent = async (skuKomponen) => {
  const { rows } = await db.query(
    `
      SELECT bc.sku_paket, p.nama AS nama_paket, p.is_active
      FROM bundle_components bc
      JOIN products p ON p.sku = bc.sku_paket
      WHERE bc.sku_komponen = $1
      ORDER BY bc.sku_paket ASC
    `,
    [skuKomponen]
  );
  return rows;
};

const findChildren = async (skuInduk) => {
  const { rows } = await db.query(
    `
      SELECT
        p.sku,
        p.nama,
        p.satuan_stok,
        p.faktor_ke_induk,
        p.is_active,
        COALESCE(st.stok, 0) AS stok_saat_ini
      FROM products p
      LEFT JOIN v_stok_saat_ini st ON st.sku = p.sku
      WHERE p.sku_induk = $1
      ORDER BY p.faktor_ke_induk ASC, p.sku ASC
    `,
    [skuInduk]
  );
  return rows;
};

const findReorderSetting = async (sku) => {
  const { rows } = await db.query(
    'SELECT * FROM reorder_settings WHERE sku = $1',
    [sku]
  );
  return rows[0] || null;
};

const findLatestPrices = async (sku) => {
  const { rows } = await db.query(
    `
      SELECT h.jenis_harga, h.harga, h.bulan
      FROM product_price_history h
      WHERE h.sku = $1
        AND h.bulan = (
          SELECT MAX(h2.bulan)
          FROM product_price_history h2
          WHERE h2.sku = h.sku AND h2.jenis_harga = h.jenis_harga
        )
    `,
    [sku]
  );
  return rows;
};

const supplierExists = async (supplierCode, executor = db) => {
  const { rowCount } = await executor.query(
    'SELECT 1 FROM suppliers WHERE supplier_code = $1',
    [supplierCode]
  );
  return rowCount > 0;
};

const getSupplierLeadTime = async (supplierCode, executor = db) => {
  if (!supplierCode) {
    return null;
  }
  const { rows } = await executor.query(
    'SELECT lead_time_hari FROM suppliers WHERE supplier_code = $1',
    [supplierCode]
  );
  return rows[0] ? rows[0].lead_time_hari : null;
};

const insertBundleComponents = async (client, skuPaket, components) => {
  if (components.length === 0) {
    return;
  }
  const values = [];
  const placeholders = components.map((comp, index) => {
    const base = index * 3;
    values.push(skuPaket, comp.skuKomponen, comp.qty);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });
  await client.query(
    `
      INSERT INTO bundle_components (sku_paket, sku_komponen, qty_komponen_per_paket)
      VALUES ${placeholders.join(', ')}
    `,
    values
  );
};

/**
 * Membuat produk baru + komponen paket + reorder_settings default dalam satu transaksi.
 */
const createProduct = async ({ sku, fields, components }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const columns = ['sku'];
    const values = [sku];
    Object.entries(fields).forEach(([key, value]) => {
      if (WRITABLE_COLUMNS[key] && value !== undefined) {
        columns.push(WRITABLE_COLUMNS[key]);
        values.push(value);
      }
    });
    const placeholders = values.map((_, idx) => `$${idx + 1}`);

    await client.query(
      `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
    );

    await insertBundleComponents(client, sku, components || []);

    const leadTime =
      (await getSupplierLeadTime(fields.supplierUtama, client)) || 7;
    await client.query(
      `
        INSERT INTO reorder_settings (
          sku, stok_minimum_manual, titik_pesan_ulang, stok_pengaman,
          lead_time_hari, sumber_lead_time, level_layanan, diperbarui_pada
        )
        VALUES ($1, NULL, 2, 2, $2, 'ASUMSI', 0.950, CURRENT_TIMESTAMP)
        ON CONFLICT (sku) DO NOTHING
      `,
      [sku, leadTime]
    );

    const created = await findBySku(sku, client);
    await client.query('COMMIT');
    return created;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Memperbarui kolom produk; jika `components` berupa array, komponen paket diganti total.
 */
const updateProduct = async ({ sku, fields, components }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const sets = [];
    const values = [];
    Object.entries(fields).forEach(([key, value]) => {
      if (WRITABLE_COLUMNS[key] && value !== undefined) {
        values.push(value);
        sets.push(`${WRITABLE_COLUMNS[key]} = $${values.length}`);
      }
    });

    if (sets.length > 0) {
      values.push(sku);
      await client.query(
        `UPDATE products SET ${sets.join(', ')} WHERE sku = $${values.length}`,
        values
      );
    }

    if (Array.isArray(components)) {
      await client.query('DELETE FROM bundle_components WHERE sku_paket = $1', [
        sku,
      ]);
      await insertBundleComponents(client, sku, components);
    }

    const updated = await findBySku(sku, client);
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Menghitung pemakaian SKU di tabel lain untuk menentukan soft/hard delete.
 */
const getProductUsage = async (sku, executor = db) => {
  const { rows } = await executor.query(
    `
      SELECT
        (SELECT COUNT(*) FROM stock_movements WHERE sku = $1)::int AS stock_movements,
        (SELECT COUNT(*) FROM stock_opname WHERE sku = $1)::int AS stock_opname,
        (SELECT COUNT(*) FROM transaction_items WHERE sku = $1)::int AS transaction_items,
        (SELECT COUNT(*) FROM online_item_financials WHERE sku = $1)::int AS online_item_financials,
        (SELECT COUNT(*) FROM product_price_history WHERE sku = $1)::int AS product_price_history,
        (SELECT COUNT(*) FROM forecasts WHERE sku = $1)::int AS forecasts,
        (SELECT COUNT(*) FROM marketplace_metrics WHERE sku = $1)::int AS marketplace_metrics,
        (SELECT COUNT(*) FROM bundle_components WHERE sku_komponen = $1)::int AS komponen_paket,
        (SELECT COUNT(*) FROM products WHERE sku_induk = $1)::int AS produk_turunan
    `,
    [sku]
  );
  return rows[0];
};

/**
 * Hybrid delete di dalam satu transaksi (dengan lock baris produk).
 * @returns {Promise<{mode: 'soft'|'hard', usage: object}>}
 */
const deleteProduct = async (sku) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT sku FROM products WHERE sku = $1 FOR UPDATE', [
      sku,
    ]);

    const usage = await getProductUsage(sku, client);
    const isUsed = Object.values(usage).some((count) => count > 0);

    if (isUsed) {
      await client.query(
        'UPDATE products SET is_active = FALSE WHERE sku = $1',
        [sku]
      );
    } else {
      // reorder_settings & bundle_components (sebagai paket) ikut terhapus via ON DELETE CASCADE.
      await client.query('DELETE FROM products WHERE sku = $1', [sku]);
    }

    await client.query('COMMIT');
    return { mode: isUsed ? 'soft' : 'hard', usage };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findProducts,
  countProducts,
  findCategories,
  findBySku,
  findBySkus,
  findBundleComponents,
  findBundlesUsingComponent,
  findChildren,
  findReorderSetting,
  findLatestPrices,
  supplierExists,
  createProduct,
  updateProduct,
  deleteProduct,
};
