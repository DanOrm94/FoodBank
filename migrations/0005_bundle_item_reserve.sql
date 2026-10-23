-- Reserve quantity per bundle item (the "Set Reserve" feature).
ALTER TABLE bundle_items ADD COLUMN reserve INTEGER NOT NULL DEFAULT 0;
