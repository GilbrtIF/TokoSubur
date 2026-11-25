'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_current_stock;

    CREATE VIEW v_current_stock AS
    SELECT
      'SKU'::varchar AS stock_level,
      p.product_id,
      p.sku_code AS sku,
      p.product_name,
      p.parent_id,
      pp.parent_name,
      pp.base_unit,
      pp.is_repacked,
      p.is_bundle,
      p.base_qty_per_unit,
      COALESCE(SUM(sm.qty_change), 0) AS current_stock
    FROM products p
    LEFT JOIN product_parents pp
      ON pp.parent_id = p.parent_id
    LEFT JOIN stock_movements sm
      ON sm.product_id = p.product_id
      AND sm.level = 'SKU'
    WHERE p.track_stock = TRUE
      AND p.is_bundle = FALSE
    GROUP BY
      p.product_id,
      p.sku_code,
      p.product_name,
      p.parent_id,
      pp.parent_name,
      pp.base_unit,
      pp.is_repacked,
      p.is_bundle,
      p.base_qty_per_unit

    UNION ALL

    SELECT
      'PARENT'::varchar AS stock_level,
      NULL::integer AS product_id,
      NULL::varchar AS sku,
      NULL::varchar AS product_name,
      pp.parent_id,
      pp.parent_name,
      pp.base_unit,
      pp.is_repacked,
      NULL::boolean AS is_bundle,
      NULL::numeric AS base_qty_per_unit,
      COALESCE(SUM(sm.qty_change), 0) AS current_stock
    FROM product_parents pp
    LEFT JOIN stock_movements sm
      ON sm.parent_id = pp.parent_id
      AND sm.level = 'PARENT'
    WHERE pp.is_repacked = TRUE
    GROUP BY
      pp.parent_id,
      pp.parent_name,
      pp.base_unit,
      pp.is_repacked;
  `);
};

exports.down = (pgm) => {
  pgm.dropView('v_current_stock', { ifExists: true });
};
