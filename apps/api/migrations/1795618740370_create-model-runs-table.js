'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE model_runs (
      run_id SERIAL PRIMARY KEY,
      nama_model VARCHAR(40) NOT NULL,
      versi_model VARCHAR(30),
      dilatih_pada TIMESTAMP,
      train_mulai DATE,
      train_selesai DATE,
      test_mulai DATE,
      test_selesai DATE,
      wape NUMERIC(8,4),
      mape NUMERIC(8,4),
      rmse NUMERIC(14,4),
      aktif BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS model_runs;
  `);
};
