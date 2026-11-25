'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE transaction_items (
      item_id VARCHAR(40) PRIMARY KEY,
      transaction_id VARCHAR(60) NOT NULL,
      kanal VARCHAR(30) NOT NULL,
      tanggal DATE NOT NULL,
      sku VARCHAR(30) NOT NULL,
      qty INT NOT NULL,
      harga_satuan NUMERIC(14,2) NOT NULL,
      diskon_rp NUMERIC(14,2) NOT NULL DEFAULT 0,
      revenue NUMERIC(16,2) NOT NULL,
      berkas VARCHAR(200),
      baris_excel INT,
      batch_id INT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      FOREIGN KEY (sku) REFERENCES products(sku),
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id),
      CHECK (qty > 0)
    );
    CREATE INDEX idx_transaction_items_tanggal ON transaction_items (tanggal);
    CREATE INDEX idx_transaction_items_sku_tanggal ON transaction_items (sku, tanggal);
    CREATE INDEX idx_transaction_items_transaction_id ON transaction_items (transaction_id);
    CREATE INDEX idx_transaction_items_kanal_tanggal ON transaction_items (kanal, tanggal);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS transaction_items;
  `);
};
