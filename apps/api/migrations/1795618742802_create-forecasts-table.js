'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE forecasts (
      forecast_id SERIAL PRIMARY KEY,
      run_id INT NOT NULL,
      sku VARCHAR(30) NOT NULL,
      kanal VARCHAR(30),
      periode DATE NOT NULL,
      granularitas VARCHAR(10) NOT NULL,
      qty_prediksi NUMERIC(12,2) NOT NULL,
      qty_bawah NUMERIC(12,2),
      qty_atas NUMERIC(12,2),
      dibuat_pada TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES model_runs(run_id) ON DELETE RESTRICT,
      FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE RESTRICT,
      FOREIGN KEY (kanal) REFERENCES channels(kanal),
      CHECK (granularitas IN ('harian','mingguan','bulanan'))
    );
    CREATE INDEX idx_forecasts_run_id_sku_periode ON forecasts (run_id, sku, periode);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS forecasts;
  `);
};
