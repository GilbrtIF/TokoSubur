const db = require('../config/db');

const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&');

const buildFilterClause = ({ isSellable, search }) => {
  const conditions = [];
  const params = [];

  if (isSellable !== null) {
    params.push(isSellable);
    conditions.push(`p.is_sellable = $${params.length}`);
  }

  if (search !== null) {
    params.push(`%${escapeLikePattern(search)}%`);
    const idx = params.length;
    conditions.push(
      `(p.sku ILIKE $${idx} ESCAPE '\\' OR p.nama ILIKE $${idx} ESCAPE '\\' OR COALESCE(p.nama_induk, '') ILIKE $${idx} ESCAPE '\\')`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

const findStocks = async ({ isSellable, search, limit, offset }) => {
  const { whereClause, params } = buildFilterClause({ isSellable, search });

  params.push(limit);
  const limitParam = `$${params.length}`;

  params.push(offset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      p.sku,
      p.product_id,
      p.nama,
      p.kategori,
      p.is_sellable,
      p.is_bundle,
      p.is_induk_pemecahan,
      p.satuan_stok,
      p.sku_induk,
      p.nama_induk,
      p.faktor_ke_induk,
      s.stok
    FROM v_stok_saat_ini s
    JOIN products p ON p.sku = s.sku
    ${whereClause}
    ORDER BY p.product_id ASC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const { rows } = await db.query(query, params);
  return rows;
};

const countStocks = async ({ isSellable, search }) => {
  const { whereClause, params } = buildFilterClause({ isSellable, search });

  const query = `
    SELECT COUNT(*)::int AS total
    FROM v_stok_saat_ini s
    JOIN products p ON p.sku = s.sku
    ${whereClause}
  `;

  const { rows } = await db.query(query, params);
  return rows[0].total;
};

module.exports = {
  findStocks,
  countStocks,
};
