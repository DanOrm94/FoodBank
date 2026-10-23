import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { accounts } from "../db/schema";
import { verifyPassword, signSession, requireSecret } from "../lib/auth";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { LoginPage } from "../views/login";
import { SESSION_COOKIE } from "../middleware/auth";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Lightweight per-isolate login throttle. Not a distributed limiter (that would
// need KV/Durable Objects), but it meaningfully slows brute-force attempts
// hitting a given edge isolate. Keyed by client IP.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

auth.get("/login", (c) => {
  if (c.get("user")) return c.redirect("/");
  return c.html(
    <Layout title="Log in">
      <LoginPage />
    </Layout>
  );
});

auth.post("/login", async (c) => {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for") ||
    "unknown";

  if (rateLimited(ip)) {
    return c.html(
      <Layout title="Log in">
        <LoginPage error="Too many login attempts. Please wait a few minutes and try again." />
      </Layout>,
      429
    );
  }

  const body = await c.req.parseBody();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const db = getDb(c.env.DB);
  const found = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);

  const account = found[0];
  const ok = account
    ? await verifyPassword(password, account.passwordHash)
    : false;

  if (!account || !ok) {
    recordFailure(ip);
    return c.html(
      <Layout title="Log in">
        <LoginPage error="Invalid username or password." />
      </Layout>,
      401
    );
  }

  clearAttempts(ip);

  const secret = requireSecret(c.env.SESSION_SECRET);
  const token = await signSession(
    {
      uid: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    },
    secret
  );

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.redirect("/");
});

auth.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.redirect("/login");
});

export default auth;
