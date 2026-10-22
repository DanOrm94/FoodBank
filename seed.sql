-- Sample data for Food Bank Manager.
-- NOTE: the admin login account is NOT created here. Visit /setup once after
-- deploying to create it (password hashing must run at runtime).

DELETE FROM bundle_items;
DELETE FROM bundles;
DELETE FROM food_stock;
DELETE FROM users;
DELETE FROM volunteers;
DELETE FROM expenses;

-- Food stock (expiry dates stored as ISO yyyy-mm-dd; displayed as dd/mm/yyyy)
INSERT INTO food_stock (item_name, quantity, expiry_date, location, category) VALUES
  ('Kellogs Tresor', 8, '2027-07-15', 'Cupboard_7', 'Cereal'),
  ('wheat a bisks', 1, '2026-02-24', 'Cupboard_6', 'Cereal'),
  ('mighty malties', 5, '2026-05-24', 'Cupboard_7', 'Cereal'),
  ('doritos', 18, '2026-06-10', 'Shelf', 'Snacks'),
  ('cheezits', 12, '2026-07-22', 'Cupboard_4', 'Snacks'),
  ('savoury crackers box', 17, '2026-07-30', 'Cupboard_6', 'Snacks'),
  ('Cheezit crisps Ind Bags', 40, '2026-07-30', 'Shelf', 'Snacks'),
  ('Rice pudding', 9, '2026-07-31', 'Cupboard_5', 'Tinned'),
  ('peanut butter', 4, '2026-07-31', 'Cupboard_6', 'Spreads'),
  ('nature valley salted caramel nut bars (4) 3 month ext', 16, '2026-08-05', 'Undercounter_1', 'Snacks'),
  ('soreen malt loaf 7/5 3 month ext', 10, '2026-08-05', 'Undercounter_1', 'Bakery'),
  ('Strawberry lunchbox loaves 12/5 ext 3 months', 5, '2026-08-12', 'Undercounter_2', 'Bakery'),
  ('frosted wheat', 4, '2026-08-18', 'Cupboard_6', 'Cereal'),
  ('misc', 12, '2026-08-21', 'Cupboard_2', 'Other'),
  ('baked beans', 30, '2026-09-10', 'Cupboard_1', 'Tinned'),
  ('chopped tomatoes', 24, '2026-09-15', 'Cupboard_1', 'Tinned'),
  ('pasta 500g', 22, '2026-11-01', 'Cupboard_3', 'Dry Goods'),
  ('long grain rice 1kg', 15, '2026-12-01', 'Cupboard_3', 'Dry Goods'),
  ('UHT milk 1L', 20, '2026-10-30', 'Shelf', 'Dairy'),
  ('teabags 80pk', 14, '2027-01-15', 'Cupboard_5', 'Drinks');

-- Registered users (recipients)
INSERT INTO users (name, email, phone, address, household_size, notes) VALUES
  ('John Smith', 'john.smith@example.com', '07700900001', '12 Oak Street, Manchester', 4, 'Referred by social services'),
  ('Mary Jones', 'mary.jones@example.com', '07700900002', '5 Elm Road, Manchester', 2, NULL),
  ('David Wilson', NULL, '07700900003', '88 Birch Lane, Manchester', 1, 'Prefers no nuts'),
  ('Sarah Brown', 'sarah.brown@example.com', '07700900004', '3 Maple Court, Manchester', 5, NULL);

-- Volunteers
INSERT INTO volunteers (name, email, phone, role, availability, active) VALUES
  ('Emma Taylor', 'emma.taylor@example.com', '07700900101', 'Driver', 'Mon, Wed', 1),
  ('James Lee', 'james.lee@example.com', '07700900102', 'Sorter', 'Tue, Thu', 1),
  ('Priya Patel', 'priya.patel@example.com', '07700900103', 'Front Desk', 'Fri', 1),
  ('Tom Clark', NULL, '07700900104', 'Driver', 'Weekends', 0);

-- Expenses
INSERT INTO expenses (description, amount, category, date) VALUES
  ('Van fuel', 45.80, 'Transport', '2026-09-01'),
  ('Storage shelving', 120.00, 'Equipment', '2026-08-20'),
  ('Cleaning supplies', 18.50, 'Consumables', '2026-09-10'),
  ('Printer paper & labels', 22.30, 'Office', '2026-09-15');

-- Bundles
INSERT INTO bundles (name, description, status) VALUES
  ('Family Pack (4)', 'Standard bundle for a household of 4', 'active'),
  ('Single Person Pack', 'Essentials for one person', 'active'),
  ('Breakfast Bundle', 'Cereals and spreads', 'distributed');

-- Bundle items (reference stock by id in insertion order above)
INSERT INTO bundle_items (bundle_id, stock_id, quantity) VALUES
  (1, 15, 2),  -- baked beans
  (1, 16, 1),  -- chopped tomatoes
  (1, 17, 2),  -- pasta
  (1, 18, 1),  -- rice
  (2, 8, 1),   -- rice pudding
  (2, 9, 1),   -- peanut butter
  (3, 1, 1),   -- kellogs tresor
  (3, 3, 1),   -- mighty malties
  (3, 9, 1);   -- peanut butter
