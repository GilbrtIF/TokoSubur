'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    CREATE VIEW v_current_price AS
    SELECT product_id, purchase_cost, packing_cost, cogs, online_price, offline_price
    FROM product_price_history WHERE valid_to IS NULL;

    CREATE VIEW v_sales_lines AS
    SELECT t.transaction_date, c.channel_name, t.order_no, i.item_id, i.product_id, i.qty, i.unit_price,
           i.discount_amount,
           COALESCE(f.net_amount, i.subtotal) AS revenue,
           f.net_profit
    FROM transaction_items i
    JOIN transactions t ON t.transaction_id = i.transaction_id
    JOIN channels c ON c.channel_id = t.channel_id
    LEFT JOIN online_item_financials f ON f.item_id = i.item_id;

    CREATE VIEW v_current_stock AS
    SELECT 'SKU' AS level, product_id AS ref_id, SUM(qty_change) AS stock
    FROM stock_movements WHERE level = 'SKU' GROUP BY product_id
    UNION ALL
    SELECT 'PARENT', parent_id, SUM(qty_change)
    FROM stock_movements WHERE level = 'PARENT' GROUP BY parent_id;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_current_stock;
    DROP VIEW IF EXISTS v_sales_lines;
    DROP VIEW IF EXISTS v_current_price;
  `);
};
