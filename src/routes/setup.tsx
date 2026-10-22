import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { accounts } from "../db/schema";
import { hashPassword } from "../lib/auth";
import type { Env, Variables } from "../lib/types";

// One-time setup: creates the seed admin account with a properly hashed
// password. PBKDF2 hashing must happen at runtime (needs Web Crypto + a
// random salt), so it cannot live in static seed.sql.
//
// Visit /setup once after deploying & seeding. Idempotent: if the admin
// already exists, it does nothing.
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const ADMIN_EMAIL = "admin@manchestersettlement.org.uk";
const ADMIN_PASSWORD = "password123";
const ADMIN_NAME = "Aileen Bayley";

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, ADMIN_EMAIL))
    .limit(1);

  if (existing[0]) {
    return c.text(
      `Admin account already exists (${ADMIN_EMAIL}). You can log in at /login.`
    );
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await db.insert(accounts).values({
    email: ADMIN_EMAIL,
    passwordHash,
    name: ADMIN_NAME,
    role: "admin",
  });

  return c.text(
    `Setup complete. Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n` +
      `Log in at /login and change this password.`
  );
});

export default app;
