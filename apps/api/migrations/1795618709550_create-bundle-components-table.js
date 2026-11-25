'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE bundle_components (
      sku_paket VARCHAR(30) NOT NULL,
      sku_komponen VARCHAR(30) NOT NULL,
      qty_komponen_per_paket NUMERIC(10,2) NOT NULL,
      PRIMARY KEY (sku_paket, sku_komponen),
      FOREIGN KEY (sku_paket) REFERENCES products(sku) ON DELETE CASCADE,
      FOREIGN KEY (sku_komponen) REFERENCES products(sku) ON DELETE CASCADE
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS bundle_components;
  `);
};
