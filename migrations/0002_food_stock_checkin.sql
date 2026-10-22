-- Add check-in date to food stock (the "Check In" column on the Food Items page).
ALTER TABLE food_stock ADD COLUMN check_in_date TEXT;
