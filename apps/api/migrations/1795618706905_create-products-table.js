'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE products (
      sku VARCHAR(30) PRIMARY KEY,
      product_id INT NOT NULL UNIQUE,
      nama VARCHAR(150) NOT NULL,
      kategori VARCHAR(60),
      is_sellable BOOLEAN NOT NULL,
      is_bundle BOOLEAN NOT NULL,
      satuan_stok VARCHAR(10) NOT NULL,
      kelompok_induk INT,
      nama_induk VARCHAR(150),
      sku_induk VARCHAR(30),
      faktor_ke_induk NUMERIC(10,4),
      is_induk_pemecahan BOOLEAN NOT NULL,
      base_unit VARCHAR(5),
      faktor NUMERIC(10,4),
      isi_per_pembelian NUMERIC(10,2),
      satuan_beli VARCHAR(60),
      harga_kulakan NUMERIC(14,2),
      hpp NUMERIC(14,2),
      harga_jual_online NUMERIC(14,2),
      harga_jual_offline NUMERIC(14,2),
      sumber_harga VARCHAR(20),
      supplier_utama VARCHAR(10),
      FOREIGN KEY (sku_induk) REFERENCES products(sku) ON DELETE RESTRICT,
      FOREIGN KEY (supplier_utama) REFERENCES suppliers(supplier_code) ON DELETE RESTRICT
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS products;
  `);
};
