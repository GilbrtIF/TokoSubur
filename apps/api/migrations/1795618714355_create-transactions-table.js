'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE transactions (
      transaction_id VARCHAR(60) PRIMARY KEY,
      kanal VARCHAR(30) NOT NULL,
      tanggal DATE NOT NULL,
      jumlah_item INT NOT NULL,
      total_qty INT NOT NULL,
      total_revenue NUMERIC(16,2) NOT NULL,
      order_no_generated BOOLEAN NOT NULL DEFAULT FALSE,
      batch_id INT,
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id)
    );
    CREATE INDEX idx_transactions_tanggal ON transactions (tanggal);
    CREATE INDEX idx_transactions_kanal_tanggal ON transactions (kanal, tanggal);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS transactions;
  `);
};
