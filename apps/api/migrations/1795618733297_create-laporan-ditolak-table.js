'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE laporan_ditolak (
      tahap VARCHAR(30) NOT NULL,
      berkas VARCHAR(200) NOT NULL,
      baris_excel INT,
      teks VARCHAR(300),
      alasan VARCHAR(300) NOT NULL,
      rincian_harga VARCHAR(500),
      jenis_alasan VARCHAR(80) NOT NULL,
      batch_id INT,
      FOREIGN KEY (batch_id) REFERENCES import_batches(batch_id)
    );
    CREATE INDEX idx_laporan_ditolak_berkas ON laporan_ditolak (berkas);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS laporan_ditolak;
  `);
};
