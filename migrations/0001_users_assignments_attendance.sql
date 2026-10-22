-- Expand users table and add assignments + attendance.
-- Rebuilds `users` to match the Food Bank Users screen (family_size, contact,
-- dietary_requirements). Safe on a freshly-seeded DB; drops old users data.

DROP TABLE IF EXISTS users;

CREATE TABLE users (
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

CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id, visit_date);
