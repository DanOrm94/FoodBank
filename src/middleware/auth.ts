import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifySession } from "../lib/auth";
import type { Env, Variables } from "../lib/types";

export const SESSION_COOKIE = "fbm_session";

// Populates c.var.user from the signed session cookie (if present/valid).
export const loadUser: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  let user = null;
  if (token) {
    const secret = c.env.SESSION_SECRET || "dev-insecure-secret-change-me";
    user = await verifySession(token, secret);
  }
  c.set("user", user);
  await next();
};

// Guards routes that require a logged-in user.
export const requireAuth: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  if (!c.get("user")) {
    return c.redirect("/login");
  }
  await next();
};
