import type { SessionPayload } from "./auth";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

// Hono context variables
export interface Variables {
  user: SessionPayload | null;
}
