'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE stock_movements (
      movement_id SERIAL PRIMARY KEY,
      tanggal DATE NOT NULL,
      sku VARCHAR(30) NOT NULL,
      jenis VARCHAR(20) NOT NULL,
      qty NUMERIC(12,2) NOT NULL,
      ref VARCHAR(80),
      sumber VARCHAR(200),
      order_date DATE,
      batch_id INT,
      FOREIGN KEY (sku) REFERENCES products(sku),
      FOREIGN KEY (jenis) REFERENCES stock_movement_types(jenis),
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id)
    );
    CREATE INDEX idx_stock_movements_sku_tanggal ON stock_movements (sku, tanggal);
    CREATE INDEX idx_stock_movements_tanggal ON stock_movements (tanggal);
    CREATE INDEX idx_stock_movements_jenis ON stock_movements (jenis);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS stock_movements;
  `);
};
