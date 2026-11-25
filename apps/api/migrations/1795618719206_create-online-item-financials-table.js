'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE online_item_financials (
      item_id VARCHAR(40) PRIMARY KEY,
      transaction_id VARCHAR(60) NOT NULL,
      kanal VARCHAR(30) NOT NULL,
      bulan_laporan VARCHAR(7) NOT NULL,
      order_date DATE NOT NULL,
      sku VARCHAR(30) NOT NULL,
      qty INT NOT NULL,
      bruto NUMERIC(16,2) NOT NULL,
      rp_diskon NUMERIC(16,2) NOT NULL,
      rp_diskon_platform NUMERIC(16,2) NOT NULL,
      netto NUMERIC(16,2) NOT NULL,
      ongkir NUMERIC(14,2),
      promo_ongkir NUMERIC(14,2),
      biaya_program_ongkir NUMERIC(14,2),
      sisa_ongkir_pembeli NUMERIC(14,2),
      komisi_platform NUMERIC(14,2) NOT NULL,
      komisi_dihitung_balik BOOLEAN NOT NULL DEFAULT FALSE,
      komisi_affiliator NUMERIC(14,2) NOT NULL,
      laba_kotor NUMERIC(16,2) NOT NULL,
      hpp_total NUMERIC(16,2) NOT NULL,
      biaya_packing NUMERIC(14,2) NOT NULL,
      laba_bersih NUMERIC(16,2) NOT NULL,
      FOREIGN KEY (item_id) REFERENCES transaction_items(item_id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      FOREIGN KEY (sku) REFERENCES products(sku)
    );
    CREATE INDEX idx_online_item_financials_order_date ON online_item_financials (order_date);
    CREATE INDEX idx_online_item_financials_kanal_order_date ON online_item_financials (kanal, order_date);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS online_item_financials;
  `);
};
