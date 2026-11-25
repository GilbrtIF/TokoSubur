'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_parent_id_fkey,
      ADD CONSTRAINT products_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES product_parents(parent_id) ON DELETE RESTRICT;

    ALTER TABLE product_price_history
      DROP CONSTRAINT IF EXISTS product_price_history_product_id_fkey,
      ADD CONSTRAINT product_price_history_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT;

    ALTER TABLE forecasts
      DROP CONSTRAINT IF EXISTS forecasts_product_id_fkey,
      ADD CONSTRAINT forecasts_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT;

    ALTER TABLE reorder_settings
      DROP CONSTRAINT IF EXISTS reorder_settings_product_id_fkey,
      ADD CONSTRAINT reorder_settings_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      DROP CONSTRAINT IF EXISTS reorder_settings_parent_id_fkey,
      ADD CONSTRAINT reorder_settings_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES product_parents(parent_id) ON DELETE CASCADE;

    ALTER TABLE product_mapping
      DROP CONSTRAINT IF EXISTS product_mapping_product_id_fkey,
      ADD CONSTRAINT product_mapping_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

    ALTER TABLE bundle_components
      DROP CONSTRAINT IF EXISTS bundle_components_bundle_product_id_fkey,
      ADD CONSTRAINT bundle_components_bundle_product_id_fkey
        FOREIGN KEY (bundle_product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      DROP CONSTRAINT IF EXISTS bundle_components_component_product_id_fkey,
      ADD CONSTRAINT bundle_components_component_product_id_fkey
        FOREIGN KEY (component_product_id) REFERENCES products(product_id) ON DELETE CASCADE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_parent_id_fkey,
      ADD CONSTRAINT products_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES product_parents(parent_id);

    ALTER TABLE product_price_history
      DROP CONSTRAINT IF EXISTS product_price_history_product_id_fkey,
      ADD CONSTRAINT product_price_history_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id);

    ALTER TABLE forecasts
      DROP CONSTRAINT IF EXISTS forecasts_product_id_fkey,
      ADD CONSTRAINT forecasts_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id);

    ALTER TABLE reorder_settings
      DROP CONSTRAINT IF EXISTS reorder_settings_product_id_fkey,
      ADD CONSTRAINT reorder_settings_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id),
      DROP CONSTRAINT IF EXISTS reorder_settings_parent_id_fkey,
      ADD CONSTRAINT reorder_settings_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES product_parents(parent_id);

    ALTER TABLE product_mapping
      DROP CONSTRAINT IF EXISTS product_mapping_product_id_fkey,
      ADD CONSTRAINT product_mapping_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(product_id);

    ALTER TABLE bundle_components
      DROP CONSTRAINT IF EXISTS bundle_components_bundle_product_id_fkey,
      ADD CONSTRAINT bundle_components_bundle_product_id_fkey
        FOREIGN KEY (bundle_product_id) REFERENCES products(product_id),
      DROP CONSTRAINT IF EXISTS bundle_components_component_product_id_fkey,
      ADD CONSTRAINT bundle_components_component_product_id_fkey
        FOREIGN KEY (component_product_id) REFERENCES products(product_id);
  `);
};
