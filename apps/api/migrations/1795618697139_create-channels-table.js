'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE channels (
      channel_id SERIAL PRIMARY KEY,
      kanal VARCHAR(30) NOT NULL UNIQUE,
      kode VARCHAR(5) NOT NULL UNIQUE,
      jenis VARCHAR(20) NOT NULL,
      dasar_pendapatan VARCHAR(20) NOT NULL,
      frekuensi_data VARCHAR(30) NOT NULL
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS channels;
  `);
};
