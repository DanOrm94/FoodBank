import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { accounts } from "../db/schema";
import { verifyPassword, signSession } from "../lib/auth";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { LoginPage } from "../views/login";
import { SESSION_COOKIE } from "../middleware/auth";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.get("/login", (c) => {
  if (c.get("user")) return c.redirect("/");
  return c.html(
    <Layout title="Log in">
      <LoginPage />
    </Layout>
  );
});

auth.post("/login", async (c) => {
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
    return c.html(
      <Layout title="Log in">
        <LoginPage error="Invalid username or password." />
      </Layout>,
      401
    );
  }

  const secret = c.env.SESSION_SECRET || "dev-insecure-secret-change-me";
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
