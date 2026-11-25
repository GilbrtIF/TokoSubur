'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE import_batches (
      batch_id SERIAL PRIMARY KEY,
      jenis_impor VARCHAR(20) NOT NULL,
      kanal VARCHAR(30),
      nama_berkas VARCHAR(200) NOT NULL,
      periode_mulai DATE,
      periode_akhir DATE,
      data_complete_until DATE,
      baris_total INT NOT NULL DEFAULT 0,
      baris_baru INT NOT NULL DEFAULT 0,
      baris_duplikat INT NOT NULL DEFAULT 0,
      baris_ditolak INT NOT NULL DEFAULT 0,
      status VARCHAR(15) NOT NULL,
      diimpor_oleh VARCHAR(60),
      diimpor_pada TIMESTAMP,
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      CHECK (status IN ('berhasil','sebagian','gagal'))
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS import_batches;
  `);
};
