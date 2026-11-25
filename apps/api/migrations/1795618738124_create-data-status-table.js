'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE data_status (
      kanal VARCHAR(60) PRIMARY KEY,
      periode_mulai DATE NOT NULL,
      data_complete_until DATE NOT NULL,
      catatan VARCHAR(500)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS data_status;
  `);
};
