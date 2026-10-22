CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS food_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date TEXT,
  location TEXT,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bundle_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  stock_id INTEGER NOT NULL REFERENCES food_stock(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  family_size INTEGER NOT NULL DEFAULT 1,
  contact INTEGER NOT NULL DEFAULT 0,
  dietary_requirements TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bundle_id INTEGER REFERENCES bundles(id) ON DELETE SET NULL,
  assigned_date TEXT NOT NULL,
  collected INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS volunteers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  availability TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  category TEXT,
  date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_food_stock_expiry ON food_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id, visit_date);
DELETE FROM attendance;
DELETE FROM assignments;
DELETE FROM bundle_items;
DELETE FROM bundles;
DELETE FROM food_stock;
DELETE FROM users;
DELETE FROM volunteers;
DELETE FROM expenses;
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
INSERT INTO bundles (name, description, status) VALUES
  ('Family Pack (4)', 'Standard bundle for a household of 4', 'active'),
  ('Single Person Pack', 'Essentials for one person', 'active'),
  ('Breakfast Bundle', 'Cereals and spreads', 'distributed');
INSERT INTO users (name, family_size, contact, dietary_requirements) VALUES
  ('Mercy fremah sarfo', 3, 0, 'none'),
  ('Abla Anani', 3, 0, 'no dairy for Mum but she will take for the children'),
  ('Linda Cleary', 2, 0, 'none'),
  ('Karen McDremott', 2, 0, 'none'),
  ('Lisa Smith', 2, 0, 'none'),
  ('Anne Crawford', 1, 0, 'none as she is aware'),
  ('Janice Lancaster', 1, 0, 'none'),
  ('Doreen Grafton', 2, 0, 'none'),
  ('Julie Syrimis', 1, 0, 'no pork'),
  ('Olivia Durand', 2, 0, 'none'),
  ('Naomi Doye', 2, 0, 'none'),
  ('susan Fox', 3, 0, 'none'),
  ('ella dankwah', 4, 0, 'no'),
  ('John Hall', 2, 0, 'unknown'),
  ('Debra White', 3, 0, 'none'),
  ('Elizabeth Ooto', 2, 0, 'No Pork');
INSERT INTO bundle_items (bundle_id, stock_id, quantity)
SELECT b.id, s.id, v.qty FROM (VALUES
  ('Family Pack (4)', 'baked beans', 2),
  ('Family Pack (4)', 'chopped tomatoes', 1),
  ('Family Pack (4)', 'pasta 500g', 2),
  ('Family Pack (4)', 'long grain rice 1kg', 1),
  ('Single Person Pack', 'Rice pudding', 1),
  ('Single Person Pack', 'peanut butter', 1),
  ('Breakfast Bundle', 'Kellogs Tresor', 1),
  ('Breakfast Bundle', 'mighty malties', 1),
  ('Breakfast Bundle', 'peanut butter', 1)
) AS v(bundle, item, qty)
JOIN bundles b ON b.name = v.bundle
JOIN food_stock s ON s.item_name = v.item;
INSERT INTO assignments (user_id, bundle_id, assigned_date, collected)
SELECT u.id, b.id, v.d, v.c FROM (VALUES
  ('Mercy fremah sarfo', NULL, '2026-10-01', 1),
  ('Abla Anani', 'Family Pack (4)', '2026-10-22', 0),
  ('Linda Cleary', NULL, '2026-10-15', 1),
  ('Karen McDremott', NULL, '2026-10-08', 1),
  ('Lisa Smith', 'Family Pack (4)', '2026-10-22', 0),
  ('Anne Crawford', NULL, '2026-02-26', 1),
  ('Janice Lancaster', NULL, '2026-09-17', 1),
  ('Doreen Grafton', NULL, '2026-01-29', 1),
  ('Julie Syrimis', NULL, '2026-08-13', 1),
  ('Olivia Durand', NULL, '2026-07-23', 1),
  ('Naomi Doye', 'Single Person Pack', '2026-10-22', 0),
  ('susan Fox', 'Single Person Pack', '2026-10-22', 0),
  ('ella dankwah', NULL, '2026-07-30', 1),
  ('John Hall', 'Family Pack (4)', '2026-10-22', 0),
  ('Debra White', 'Family Pack (4)', '2026-10-22', 0),
  ('Elizabeth Ooto', NULL, '2026-08-20', 1)
) AS v(uname, bname, d, c)
JOIN users u ON u.name = v.uname
LEFT JOIN bundles b ON b.name = v.bname;
INSERT INTO attendance (user_id, visit_date, notes)
SELECT u.id, v.d, v.n FROM (VALUES
  ('Abla Anani', '2026-10-22', 'Collected bundle'),
  ('Lisa Smith', '2026-10-22', 'Collected bundle'),
  ('Mercy fremah sarfo', '2026-10-01', 'Collected bundle'),
  ('Naomi Doye', '2026-10-22', NULL),
  ('susan Fox', '2026-10-22', NULL)
) AS v(uname, d, n)
JOIN users u ON u.name = v.uname;
INSERT INTO volunteers (name, email, phone, role, availability, active) VALUES
  ('Emma Taylor', 'emma.taylor@example.com', '07700900101', 'Driver', 'Mon, Wed', 1),
  ('James Lee', 'james.lee@example.com', '07700900102', 'Sorter', 'Tue, Thu', 1),
  ('Priya Patel', 'priya.patel@example.com', '07700900103', 'Front Desk', 'Fri', 1),
  ('Tom Clark', NULL, '07700900104', 'Driver', 'Weekends', 0);
INSERT INTO expenses (description, amount, category, date) VALUES
  ('Van fuel', 45.80, 'Transport', '2026-09-01'),
  ('Storage shelving', 120.00, 'Equipment', '2026-08-20'),
  ('Cleaning supplies', 18.50, 'Consumables', '2026-09-10'),
  ('Printer paper & labels', 22.30, 'Office', '2026-09-15');
