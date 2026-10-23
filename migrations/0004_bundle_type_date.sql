-- Bundles get a type (General/Halal) and a creation date, matching the
-- Food Bundles list ("15 Jul 2025 • General Bundle").
ALTER TABLE bundles ADD COLUMN bundle_type TEXT NOT NULL DEFAULT 'General Bundle';
ALTER TABLE bundles ADD COLUMN created_date TEXT;
