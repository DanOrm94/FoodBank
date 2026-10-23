import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { accounts } from "../db/schema";
import { hashPassword } from "../lib/auth";
import type { Env, Variables } from "../lib/types";

// One-time setup: creates (or resets) the admin account with a properly hashed
// password. PBKDF2 hashing must happen at runtime, so it cannot live in seed.sql.
//
// SECURITY: this route can create/reset the admin login, so it MUST be gated.
//   - Set a SETUP_TOKEN secret, then visit /setup?token=<SETUP_TOKEN>.
//   - If SETUP_TOKEN is not configured, the route is DISABLED (returns 404),
//     so it can never be used anonymously in production.
//   - Admin credentials come from ADMIN_USERNAME / ADMIN_PASSWORD secrets.
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Constant-time string comparison to avoid token timing leaks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

app.get("/", async (c) => {
  const setupToken = c.env.SETUP_TOKEN;

  // Disabled unless a setup token is configured.
  if (!setupToken) {
    return c.notFound();
  }

  const provided = c.req.query("token") || "";
  if (!safeEqual(provided, setupToken)) {
    return c.text("Forbidden: invalid or missing setup token.", 403);
  }

  const username = (c.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = c.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    return c.text(
      "ADMIN_PASSWORD is not configured (must be at least 8 characters). " +
        "Set it as a secret, then retry /setup.",
      400
    );
  }

  const db = getDb(c.env.DB);
  const passwordHash = await hashPassword(password);

  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, username))
    .limit(1);

  if (existing[0]) {
    await db
      .update(accounts)
      .set({ passwordHash, role: "admin" })
      .where(eq(accounts.email, username));
    return c.text(
      `Admin account updated. Log in at /login with username "${username}" and the configured password.`
    );
  }

  await db.insert(accounts).values({
    email: username,
    passwordHash,
    name: "Administrator",
    role: "admin",
  });

  return c.text(
    `Setup complete. Log in at /login with username "${username}" and the configured password.`
  );
});

export default app;
