import { Hono } from "hono";
import { asc } from "drizzle-orm";
import { getDb } from "./db/client";
import { foodStock } from "./db/schema";
import type { Env, Variables } from "./lib/types";
import { loadUser, requireAuth } from "./middleware/auth";
import { csrf } from "./middleware/csrf";
import { Layout } from "./views/layout";
import { Dashboard } from "./views/dashboard";
import authRoutes from "./routes/auth";
import setupRoutes from "./routes/setup";
import stockRoutes from "./routes/stock";
import bundleRoutes from "./routes/bundles";
import userRoutes from "./routes/users";
import volunteerRoutes from "./routes/volunteers";
import expenseRoutes from "./routes/expenses";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Populate current user on every request
app.use("*", loadUser);

// CSRF protection: validates tokens on unsafe methods and auto-injects the
// hidden token field into HTML forms on GET responses.
app.use("*", csrf);

// Public auth + setup routes
app.route("/", authRoutes);
app.route("/setup", setupRoutes);

// Everything below requires login
app.use("/*", requireAuth);

// Dashboard
app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const expiring = await db
    .select()
    .from(foodStock)
    .orderBy(asc(foodStock.expiryDate))
    .limit(25);

  // At-a-glance counts via a single grouped query where possible.
  const counts = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM food_stock) AS stockItems,
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM volunteers) AS volunteers,
       (SELECT COUNT(*) FROM bundles) AS bundles,
       (SELECT COUNT(*) FROM food_stock WHERE expiry_date IS NOT NULL AND expiry_date < date('now')) AS expired,
       (SELECT COUNT(*) FROM food_stock WHERE expiry_date IS NOT NULL AND expiry_date >= date('now') AND expiry_date <= date('now','+30 day')) AS expiringSoon`
  ).first<{
    stockItems: number;
    users: number;
    volunteers: number;
    bundles: number;
    expired: number;
    expiringSoon: number;
  }>();

  const stats = {
    stockItems: counts?.stockItems ?? 0,
    users: counts?.users ?? 0,
    volunteers: counts?.volunteers ?? 0,
    bundles: counts?.bundles ?? 0,
    expired: counts?.expired ?? 0,
    expiringSoon: counts?.expiringSoon ?? 0,
  };

  return c.html(
    <Layout title="Home" user={c.get("user")} active="home">
      <Dashboard expiring={expiring} stats={stats} />
    </Layout>
  );
});

app.route("/stock", stockRoutes);
app.route("/bundles", bundleRoutes);
app.route("/users", userRoutes);
app.route("/volunteers", volunteerRoutes);
app.route("/expenses", expenseRoutes);

app.get("/help", (c) =>
  c.html(
    <Layout title="Help" user={c.get("user")} active="help">
      <h3>Help</h3>
      <div class="card feature-card">
        <div class="card-body">
          <p>
            Food Bank Manager helps you track food stock, build distribution
            bundles, and manage registered users, volunteers, and expenses.
          </p>
          <ul>
            <li><strong>Food Stock</strong> — record items, quantities, expiry dates and storage locations.</li>
            <li><strong>Food Bundles</strong> — group stock items into bundles for distribution.</li>
            <li><strong>Users</strong> — manage registered foodbank recipients.</li>
            <li><strong>Volunteers</strong> — track volunteers and availability.</li>
            <li><strong>Expenses</strong> — log and categorise expenditure.</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
);

app.notFound((c) =>
  c.html(
    <Layout title="Not Found" user={c.get("user")}>
      <div class="text-center py-5">
        <h1 class="display-4">404</h1>
        <p class="text-muted">Page not found.</p>
        <a href="/" class="btn btn-primary">Back to dashboard</a>
      </div>
    </Layout>,
    404
  )
);

// Surface server errors instead of a bare 500, and log the stack to the
// Worker logs for diagnosis.
app.onError((err, c) => {
  console.error("Unhandled error:", err?.stack || err);
  return c.text(
    `Server error: ${err instanceof Error ? err.message : String(err)}`,
    500
  );
});

export default app;
