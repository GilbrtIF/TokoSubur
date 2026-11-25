'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

    CREATE SEQUENCE IF NOT EXISTS products_product_id_seq OWNED BY products.product_id;
    SELECT setval('products_product_id_seq', COALESCE((SELECT MAX(product_id) FROM products), 190));
    ALTER TABLE products
      ALTER COLUMN product_id SET DEFAULT nextval('products_product_id_seq');

    ALTER TABLE stock_opname
      ADD COLUMN IF NOT EXISTS alasan_selisih VARCHAR(50);

    GRANT USAGE, SELECT ON SEQUENCE products_product_id_seq TO tokosubur_app;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE stock_opname DROP COLUMN IF EXISTS alasan_selisih;
    ALTER TABLE products ALTER COLUMN product_id DROP DEFAULT;
    DROP SEQUENCE IF EXISTS products_product_id_seq;
    ALTER TABLE products DROP COLUMN IF EXISTS is_active;
  `);
};
