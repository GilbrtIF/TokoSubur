'use strict';

exports.up = (pgm) => {
  pgm.createTable('channels', {
    channel_id: { type: 'serial', primaryKey: true },
    channel_name: { type: 'varchar(30)', notNull: true, unique: true },
    channel_type: { type: 'varchar(10)', notNull: true },
    platform_commission_pct: { type: 'numeric(5,4)' },
    commission_source: { type: 'varchar(40)' },
    active_from: { type: 'date' },
    is_active: { type: 'boolean', notNull: true, default: true },
  });

  pgm.addConstraint('channels', 'chk_channels_type', {
    check: "channel_type IN ('ONLINE','OFFLINE')",
  });

  pgm.sql(`
    INSERT INTO channels (
      channel_id, channel_name, channel_type, platform_commission_pct, commission_source, active_from, is_active
    ) VALUES
      (1, 'Offline', 'OFFLINE', NULL, NULL, '2023-11-01', TRUE),
      (2, 'Shopee', 'ONLINE', 0.08, 'ASUMSI', '2025-02-01', TRUE),
      (3, 'Tokopedia', 'ONLINE', 0.06, 'ASUMSI', '2025-02-01', TRUE),
      (4, 'TikTok Shop', 'ONLINE', 0.1, 'SAMPEL UMKM', '2025-06-01', TRUE);

    SELECT setval(pg_get_serial_sequence('channels', 'channel_id'), 4, TRUE);
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('channels');
};
