'use strict';

exports.up = (pgm) => {
  pgm.createTable('product_mapping', {
    mapping_id: { type: 'serial', primaryKey: true },
    channel_id: {
      type: 'integer',
      references: '"channels"(channel_id)',
    },
    source_name_norm: { type: 'varchar(200)', notNull: true },
    source_sku: { type: 'varchar(40)' },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"(product_id)',
    },
    match_method: { type: 'varchar(10)', notNull: true },
    confidence_score: { type: 'numeric(4,3)' },
    confirmed_by: { type: 'varchar(60)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint('product_mapping', 'chk_product_mapping_match_method', {
    check: "match_method IN ('EXACT','FUZZY','MANUAL')",
  });

  pgm.sql(
    'CREATE UNIQUE INDEX ux_product_mapping_channel_id_source_name_norm ON product_mapping (COALESCE(channel_id, 0), source_name_norm);'
  );
};

exports.down = (pgm) => {
  pgm.dropTable('product_mapping');
};
