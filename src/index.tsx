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
    <Layout title="Help & Support" user={c.get("user")} active="help">
      <h2 class="mb-3">Help &amp; Support</h2>
      <div class="card feature-card mb-4">
        <div class="card-body">
          <p class="mb-0">
            If you need assistance, please check the FAQs below or contact us at:{" "}
            <a href="mailto:danielorm@live.co.uk">danielorm@live.co.uk</a>
          </p>
        </div>
      </div>

      <h4 class="mb-3">Frequently Asked Questions (FAQ)</h4>
      <div class="accordion mb-4" id="faqAccordion">
        {[
          {
            q: "How do I update my account information?",
            a: 'Navigate to the "Volunteers" page and click "Edit" to update your account details.',
          },
          {
            q: "How do I assign a bundle to a food bank user?",
            a: 'Go to the "Users" page and click "Assign Bundle" next to the selected user. A form will open, allowing you to choose the bundle you want to assign. Once selected, click "Assign" to complete the process.',
          },
          {
            q: "How do I record food bank user attendance?",
            a: 'Visit the "Users" page and click "Complete Distribution Cycle". This action will automatically record the attendance of the user based on their bundle assignment, which can be viewed by clicking the "Attendance" button.',
          },
          {
            q: "How do I add reserve food items for food items in a bundle?",
            a: "Go to the Food Bundles page and select your desired bundle by clicking the Details button (blue icon). This opens the bundle details page, with a Bundle Information card and an Items in Bundle card. In the Items in Bundle card, locate the item you want to assign reserves to and click Set Reserve. A popup lets you assign as many reserve items as needed.",
          },
          {
            q: "How do I generate and print a PDF for a food bundle?",
            a: "Navigate to the Food Bundles page and find the bundle you want to export. Click the Details button (blue icon) to open its detailed view. Inside, click the Export to PDF button to generate a printable PDF of the bundle contents, including all items and their reserve assignments. The PDF can then be downloaded or printed directly from your browser.",
          },
        ].map((item, i) => (
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#faq-${i}`}
              >
                {item.q}
              </button>
            </h2>
            <div id={`faq-${i}`} class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div class="accordion-body">{item.a}</div>
            </div>
          </div>
        ))}
      </div>

      <p class="text-center text-muted small">
        © 2024 - FoodBankManager - Working together to support our community.
      </p>
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
