import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Auth accounts (people who log in to the manager)
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // staff | admin
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Food stock items
export const foodStock = sqliteTable("food_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: text("expiry_date"), // ISO yyyy-mm-dd
  location: text("location"),
  category: text("category"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Food bundles
export const bundles = sqliteTable("bundles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active | distributed
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Items contained in a bundle (link table)
export const bundleItems = sqliteTable("bundle_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bundleId: integer("bundle_id")
    .notNull()
    .references(() => bundles.id, { onDelete: "cascade" }),
  stockId: integer("stock_id")
    .notNull()
    .references(() => foodStock.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
});

// Registered foodbank users (recipients)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  householdSize: integer("household_size").default(1),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Volunteers
export const volunteers = sqliteTable("volunteers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  availability: text("availability"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Expenses
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  amount: real("amount").notNull().default(0),
  category: text("category"),
  date: text("date"), // ISO yyyy-mm-dd
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Account = typeof accounts.$inferSelect;
export type FoodStock = typeof foodStock.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Volunteer = typeof volunteers.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
