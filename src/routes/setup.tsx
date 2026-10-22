import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { accounts } from "../db/schema";
import { hashPassword } from "../lib/auth";
import type { Env, Variables } from "../lib/types";

// One-time setup: creates (or resets) the admin account with a properly hashed
// password. PBKDF2 hashing must happen at runtime (needs Web Crypto + a random
// salt), so it cannot live in static seed.sql.
//
// Visit /setup once after deploying & seeding.
// If the admin already exists, its password is reset to ADMIN_PASSWORD.
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Login identifier is stored in the `email` column but can be a plain username.
const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "Openshaw1";
const ADMIN_NAME = "Administrator";

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, ADMIN_LOGIN))
    .limit(1);

  if (existing[0]) {
    await db
      .update(accounts)
      .set({ passwordHash, name: ADMIN_NAME, role: "admin" })
      .where(eq(accounts.email, ADMIN_LOGIN));
    return c.text(
      `Admin account updated. Log in at /login with:\n` +
        `  username: ${ADMIN_LOGIN}\n  password: ${ADMIN_PASSWORD}`
    );
  }

  await db.insert(accounts).values({
    email: ADMIN_LOGIN,
    passwordHash,
    name: ADMIN_NAME,
    role: "admin",
  });

  return c.text(
    `Setup complete. Log in at /login with:\n` +
      `  username: ${ADMIN_LOGIN}\n  password: ${ADMIN_PASSWORD}`
  );
});

export default app;
