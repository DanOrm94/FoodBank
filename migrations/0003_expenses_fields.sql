-- Expand expenses to match the real Expense List: supplier grouping,
-- payment method, and an optional linked food bank user.
ALTER TABLE expenses ADD COLUMN supplier TEXT;
ALTER TABLE expenses ADD COLUMN payment_method TEXT;
ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
