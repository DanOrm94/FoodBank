import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Env, Variables } from "../lib/types";

export const CSRF_COOKIE = "fbm_csrf";
export const CSRF_FIELD = "_csrf";

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Double-submit cookie CSRF protection.
// - Ensures a CSRF token cookie exists and exposes it via c.var.csrfToken
//   so forms can embed it in a hidden field.
// - On unsafe methods (POST/PUT/PATCH/DELETE), requires the submitted token
//   to match the cookie; otherwise returns 403.
export const csrf: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  let token = getCookie(c, CSRF_COOKIE);
  if (!token) {
    token = randomToken();
    setCookie(c, CSRF_COOKIE, token, {
      httpOnly: false, // readable so it can be embedded in forms
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  c.set("csrfToken", token);

  const method = c.req.method.toUpperCase();
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    const body = await c.req.parseBody();
    const submitted = String(body[CSRF_FIELD] || "");
    if (!safeEqual(submitted, token)) {
      return c.text("Forbidden: invalid CSRF token. Please reload and try again.", 403);
    }
    // Hono caches parseBody, so downstream handlers get the same parsed data.
    await next();
    return;
  }

  await next();

  // On HTML GET responses, auto-inject the CSRF hidden field into every <form>.
  // This guarantees coverage without editing each view component by hand.
  const contentType = c.res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    const html = await c.res.text();
    const injected = html.replace(
      /<form\b[^>]*>/gi,
      (match) => `${match}<input type="hidden" name="${CSRF_FIELD}" value="${token}">`
    );
    const headers = new Headers(c.res.headers);
    headers.delete("content-length"); // length changed; let it be recomputed
    c.res = new Response(injected, {
      status: c.res.status,
      headers,
    });
  }
};
