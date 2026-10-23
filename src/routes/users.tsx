import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, assignments, attendance, bundles } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceForm, type Field } from "../views/resource";
import { UsersPage, type UserRow } from "../views/users";
import { fmtDate, todayISO } from "../lib/status";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  { name: "name", label: "Name", required: true, value: row?.name as string },
  { name: "familySize", label: "Family Size", type: "number", required: true, value: (row?.familySize as number) ?? 1 },
  { name: "contact", label: "Contact", type: "number", value: (row?.contact as number) ?? 0 },
  { name: "dietaryRequirements", label: "Dietary Requirements", type: "textarea", value: row?.dietaryRequirements as string },
  { name: "email", label: "Email", type: "email", value: row?.email as string },
  { name: "phone", label: "Phone", value: row?.phone as string },
  { name: "address", label: "Address", type: "textarea", value: row?.address as string },
  { name: "notes", label: "Notes", type: "textarea", value: row?.notes as string },
];

// List with derived bundle status (latest assignment per user)
app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const q = c.req.query("q") || "";

  // Use the D1 binding directly for this aggregate (latest assignment per user).
  const result = await c.env.DB.prepare(
    `SELECT
       u.id            AS id,
       u.name          AS name,
       u.family_size   AS familySize,
       u.contact       AS contact,
       u.dietary_requirements AS dietaryRequirements,
       a.assigned_date AS latestDate,
       a.collected     AS latestCollected
     FROM users u
     LEFT JOIN (
       SELECT a1.user_id, a1.assigned_date, a1.collected
       FROM assignments a1
       JOIN (
         SELECT user_id, MAX(assigned_date) AS max_date
         FROM assignments
         GROUP BY user_id
       ) m ON m.user_id = a1.user_id AND m.max_date = a1.assigned_date
     ) a ON a.user_id = u.id
     ORDER BY u.id ASC`
  ).all<UserRow>();
  const rows = result.results ?? [];

  return c.html(
    <Layout title="Users" user={c.get("user")} active="users">
      <UsersPage users={rows} q={q} />
    </Layout>
  );
});

app.get("/new", (c) =>
  c.html(
    <Layout title="New User" user={c.get("user")} active="users">
      <ResourceForm title="Add User" action="/users" cancelHref="/users" fields={fields()} />
    </Layout>
  )
);

app.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db.insert(users).values({
    name: String(b.name || ""),
    familySize: parseInt(String(b.familySize || "1"), 10) || 1,
    contact: parseInt(String(b.contact || "0"), 10) || 0,
    dietaryRequirements: String(b.dietaryRequirements || "") || null,
    email: String(b.email || "") || null,
    phone: String(b.phone || "") || null,
    address: String(b.address || "") || null,
    notes: String(b.notes || "") || null,
  });
  return c.redirect("/users");
});

// Green action: assign a bundle (creates an assignment dated today, uncollected)
app.post("/:id/assign", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const b = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
  const bundleId = b.bundleId ? parseInt(String(b.bundleId), 10) : null;
  await db.insert(assignments).values({
    userId: id,
    bundleId: bundleId || null,
    assignedDate: todayISO(),
    collected: false,
  });
  return c.redirect("/users");
});

// "Complete Distribution Cycle": marks the user's latest open assignment as
// collected and records attendance for today. If there is no open assignment,
// it simply records an attendance visit.
app.post("/:id/complete-cycle", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);

  const latest = await db
    .select()
    .from(assignments)
    .where(eq(assignments.userId, id))
    .orderBy(desc(assignments.assignedDate), desc(assignments.id))
    .limit(1);

  const open = latest[0] && !latest[0].collected ? latest[0] : null;
  if (open) {
    await db
      .update(assignments)
      .set({ collected: true })
      .where(eq(assignments.id, open.id));
  }

  await db.insert(attendance).values({
    userId: id,
    visitDate: todayISO(),
    notes: open ? "Distribution cycle completed" : "Visit recorded",
  });

  return c.redirect("/users");
});

// Assign page (choose a bundle) — optional richer flow via GET
app.get("/:id/assign", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  const bundleOptions = await db.select().from(bundles).orderBy(bundles.name);
  return c.html(
    <Layout title="Assign Bundle" user={c.get("user")} active="users">
      <h3 class="mb-3">Assign Bundle — {found[0].name}</h3>
      <div class="card feature-card">
        <div class="card-body">
          <form method="post" action={`/users/${id}/assign`}>
            <div class="mb-3">
              <label class="form-label">Bundle</label>
              <select name="bundleId" class="form-select">
                <option value="">(No specific bundle)</option>
                {bundleOptions.map((bd) => (
                  <option value={String(bd.id)}>{bd.name}</option>
                ))}
              </select>
            </div>
            <button class="btn btn-success">Assign for Today ({fmtDate(todayISO())})</button>
            <a href="/users" class="btn btn-outline-secondary">Cancel</a>
          </form>
        </div>
      </div>
    </Layout>
  );
});

// Blue action: attendance history + record a visit
app.get("/:id/attendance", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = found[0];
  if (!user) return c.notFound();

  const visits = await db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, id))
    .orderBy(desc(attendance.visitDate));

  const history = await db
    .select({
      id: assignments.id,
      assignedDate: assignments.assignedDate,
      collected: assignments.collected,
      bundleName: bundles.name,
    })
    .from(assignments)
    .leftJoin(bundles, eq(assignments.bundleId, bundles.id))
    .where(eq(assignments.userId, id))
    .orderBy(desc(assignments.assignedDate));

  return c.html(
    <Layout title="Attendance" user={c.get("user")} active="users">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">
          <i class="bi bi-calendar-check text-info"></i> Attendance — {user.name}
        </h3>
        <a href="/users" class="btn btn-outline-secondary btn-sm">Back to Users</a>
      </div>

      <div class="card feature-card mb-3">
        <div class="card-body">
          <h6>Record a Visit</h6>
          <form method="post" action={`/users/${id}/attendance`} class="row g-2">
            <div class="col-md-4">
              <input type="date" name="visitDate" class="form-control" value={todayISO()} required />
            </div>
            <div class="col-md-6">
              <input type="text" name="notes" class="form-control" placeholder="Notes (optional)" />
            </div>
            <div class="col-md-2">
              <button class="btn btn-info text-white w-100">Add</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card feature-card mb-3">
        <div class="section-header-warn">Visit History</div>
        <div class="card-body p-0">
          <table class="table mb-0 align-middle">
            <thead><tr><th>Date</th><th>Notes</th><th class="text-end">Actions</th></tr></thead>
            <tbody>
              {visits.length === 0 ? (
                <tr><td colspan={3} class="text-center text-muted py-3">No visits recorded.</td></tr>
              ) : (
                visits.map((v) => (
                  <tr>
                    <td>{fmtDate(v.visitDate)}</td>
                    <td>{v.notes || "-"}</td>
                    <td class="text-end">
                      <form method="post" action={`/users/${id}/attendance/${v.id}/delete`} class="d-inline">
                        <button class="btn btn-sm btn-outline-danger">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card feature-card">
        <div class="section-header-warn">Bundle Assignment History</div>
        <div class="card-body p-0">
          <table class="table mb-0 align-middle">
            <thead><tr><th>Date</th><th>Bundle</th><th>Collected</th></tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colspan={3} class="text-center text-muted py-3">No assignments.</td></tr>
              ) : (
                history.map((h) => (
                  <tr>
                    <td>{fmtDate(h.assignedDate)}</td>
                    <td>{h.bundleName || "(none)"}</td>
                    <td>{h.collected ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
});

app.post("/:id/attendance", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db.insert(attendance).values({
    userId: id,
    visitDate: String(b.visitDate || todayISO()),
    notes: String(b.notes || "") || null,
  });
  return c.redirect(`/users/${id}/attendance`);
});

app.post("/:id/attendance/:aid/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const aid = parseInt(c.req.param("aid"), 10);
  const db = getDb(c.env.DB);
  await db.delete(attendance).where(eq(attendance.id, aid));
  return c.redirect(`/users/${id}/attendance`);
});

// Yellow action: edit
app.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  return c.html(
    <Layout title="Edit User" user={c.get("user")} active="users">
      <ResourceForm
        title="Edit User"
        action={`/users/${id}`}
        cancelHref="/users"
        fields={fields(found[0] as unknown as Record<string, unknown>)}
      />
    </Layout>
  );
});

app.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db
    .update(users)
    .set({
      name: String(b.name || ""),
      familySize: parseInt(String(b.familySize || "1"), 10) || 1,
      contact: parseInt(String(b.contact || "0"), 10) || 0,
      dietaryRequirements: String(b.dietaryRequirements || "") || null,
      email: String(b.email || "") || null,
      phone: String(b.phone || "") || null,
      address: String(b.address || "") || null,
      notes: String(b.notes || "") || null,
    })
    .where(eq(users.id, id));
  return c.redirect("/users");
});

// Red action: delete
app.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(users).where(eq(users.id, id));
  return c.redirect("/users");
});

export default app;
