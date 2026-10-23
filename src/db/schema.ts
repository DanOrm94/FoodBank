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
  checkInDate: text("check_in_date"), // ISO yyyy-mm-dd
  expiryDate: text("expiry_date"), // ISO yyyy-mm-dd
  location: text("location"),
  category: text("category"), // shown as "Type"
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
  familySize: integer("family_size").notNull().default(1),
  contact: integer("contact").notNull().default(0),
  dietaryRequirements: text("dietary_requirements"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Bundle assignments to users (green action). "Bundle Status" is derived
// from the user's most recent assignment.
export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bundleId: integer("bundle_id").references(() => bundles.id, {
    onDelete: "set null",
  }),
  assignedDate: text("assigned_date").notNull(), // ISO yyyy-mm-dd
  collected: integer("collected", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Attendance / visit records for a user (blue action).
export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  visitDate: text("visit_date").notNull(), // ISO yyyy-mm-dd
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

// Expenses (grouped by supplier on the list page)
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplier: text("supplier"), // vendor/group, e.g. "Fareshare"
  description: text("description").notNull(),
  amount: real("amount").notNull().default(0),
  paymentMethod: text("payment_method"), // Card / Cash / etc.
  date: text("date"), // payment date, ISO yyyy-mm-dd
  category: text("category"),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }), // optional "Food Bank User" this expense relates to
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Account = typeof accounts.$inferSelect;
export type FoodStock = typeof foodStock.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Volunteer = typeof volunteers.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
