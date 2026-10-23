import type { SessionPayload } from "./auth";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  // Optional: gate the one-time /setup route. If set, /setup requires ?token=<SETUP_TOKEN>.
  SETUP_TOKEN?: string;
  // Optional: admin seed credentials. If unset, /setup uses safe defaults
  // and reports that the password must be changed.
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

// Hono context variables
export interface Variables {
  user: SessionPayload | null;
  csrfToken: string;
}
