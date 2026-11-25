'use strict';

exports.up = (pgm) => {
  pgm.createTable('stock_movement_types', {
    type_code: { type: 'varchar(20)', primaryKey: true },
    allowed_level: { type: 'varchar(10)', notNull: true },
    direction: { type: 'varchar(5)', notNull: true },
    recorded_by_umkm: { type: 'varchar(40)', notNull: true },
    description: { type: 'varchar(200)', notNull: true },
  });

  pgm.addConstraint('stock_movement_types', 'chk_smt_allowed_level', {
    check: "allowed_level IN ('SKU','PARENT','BOTH')",
  });

  pgm.addConstraint('stock_movement_types', 'chk_smt_direction', {
    check: "direction IN ('IN','OUT','ADJ')",
  });

  pgm.sql(`
    INSERT INTO stock_movement_types (
      type_code, allowed_level, direction, recorded_by_umkm, description
    ) VALUES
      ('IN_RESTOCK', 'BOTH', 'IN', 'ya', 'Restok dari supplier. Level PARENT (kg) untuk induk yang dipecah, level SKU (unit jual) untuk induk lain'),
      ('REPACK_OUT', 'PARENT', 'OUT', 'ya (menu baru pemecahan)', 'Bahan induk dipakai untuk membuat kemasan kecil'),
      ('REPACK_IN', 'SKU', 'IN', 'ya (menu baru pemecahan)', 'Kemasan kecil hasil pecah'),
      ('OUT_SALE', 'BOTH', 'OUT', 'ya', 'Penjualan SKU atau paket; paket mengurangi komponennya (level PARENT untuk induk yang dipecah)'),
      ('IN_RETURN', 'SKU', 'IN', 'sebagian', 'Retur pembeli'),
      ('OUT_DAMAGED', 'SKU', 'OUT', 'sebagian', 'Rusak atau kedaluwarsa'),
      ('ADJ_OPNAME', 'BOTH', 'ADJ', 'dihitung sistem', 'Koreksi dari selisih opname, di tingkat yang dihitung');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('stock_movement_types');
};
