'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE stock_movement_types (
      jenis VARCHAR(20) PRIMARY KEY,
      arah VARCHAR(10) NOT NULL,
      keterangan VARCHAR(200) NOT NULL,
      CHECK (arah IN ('MASUK','KELUAR','ADJ'))
    );

    INSERT INTO stock_movement_types (jenis, arah, keterangan) VALUES
      ('OPENING', 'MASUK', 'Stok awal dari opname pertama'),
      ('RESTOCK_IN', 'MASUK', 'Barang masuk dari supplier. Induk 50 kg dalam kg'),
      ('RETURN_IN', 'MASUK', 'Retur pembeli. Tidak mengoreksi omzet'),
      ('DAMAGED_OUT', 'KELUAR', 'Rusak atau kedaluwarsa'),
      ('SPLIT_OUT', 'KELUAR', 'Bahan induk dipakai untuk pemecahan'),
      ('SPLIT_IN', 'MASUK', 'Kemasan hasil pemecahan masuk'),
      ('ASSEMBLE_OUT', 'KELUAR', 'Komponen dipakai merakit paket'),
      ('ASSEMBLE_IN', 'MASUK', 'Paket jadi masuk'),
      ('SALE_OFFLINE', 'KELUAR', 'Penjualan offline, bertanggal nota'),
      ('SALE_ONLINE', 'KELUAR', 'Penjualan online, bertanggal akhir bulan laporan'),
      ('ADJUSTMENT', 'ADJ', 'Koreksi stok sistem ke stok fisik setelah setiap opname berikutnya');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS stock_movement_types;
  `);
};
