'use strict';

exports.up = (pgm) => {
  pgm.createTable('online_item_financials', {
    item_id: {
      type: 'integer',
      primaryKey: true,
      references: '"transaction_items"(item_id)',
    },
    gross_amount: { type: 'numeric(14,2)', notNull: true },
    discount_pct: { type: 'numeric(5,4)' },
    seller_discount_amount: {
      type: 'numeric(14,2)',
      notNull: true,
      default: 0,
    },
    platform_discount_amount: {
      type: 'numeric(14,2)',
      notNull: true,
      default: 0,
    },
    net_amount: { type: 'numeric(14,2)', notNull: true },
    shipping_fee: { type: 'numeric(14,2)', notNull: true, default: 0 },
    shipping_promo: { type: 'numeric(14,2)', notNull: true, default: 0 },
    shipping_program_fee: { type: 'numeric(14,2)', notNull: true, default: 0 },
    shipping_buyer_remaining: {
      type: 'numeric(14,2)',
      notNull: true,
      default: 0,
    },
    platform_commission: { type: 'numeric(14,2)', notNull: true, default: 0 },
    affiliate_commission: { type: 'numeric(14,2)', notNull: true, default: 0 },
    gross_profit: { type: 'numeric(14,2)' },
    cogs_amount: { type: 'numeric(14,2)' },
    packing_cost: { type: 'numeric(14,2)', notNull: true, default: 0 },
    net_profit: { type: 'numeric(14,2)' },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('online_item_financials');
};
