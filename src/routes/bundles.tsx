import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { bundles, bundleItems, foodStock } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceForm, type Field } from "../views/resource";
import { BundlesPage, type BundleRow } from "../views/bundles";
import { todayISO, fmtDateLong } from "../lib/status";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  {
    name: "bundleType",
    label: "Bundle Type",
    type: "select",
    value: (row?.bundleType as string) || "General Bundle",
    options: [
      { value: "General Bundle", label: "General Bundle" },
      { value: "Halal Bundle", label: "Halal Bundle" },
    ],
  },
  { name: "createdDate", label: "Creation Date", type: "date", value: (row?.createdDate as string) || todayISO() },
  { name: "name", label: "Bundle Name (optional)", value: row?.name as string },
  { name: "description", label: "Description", type: "textarea", value: row?.description as string },
];

// List: date • type with item count, newest first
app.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT
       b.id           AS id,
       b.bundle_type  AS bundleType,
       b.created_date AS createdDate,
       COUNT(bi.id)   AS itemCount
     FROM bundles b
     LEFT JOIN bundle_items bi ON bi.bundle_id = b.id
     GROUP BY b.id
     ORDER BY b.created_date ASC, b.id ASC`
  ).all<BundleRow>();
  const rows = result.results ?? [];

  return c.html(
    <Layout title="Food Bundles" user={c.get("user")} active="bundles">
      <BundlesPage bundles={rows} />
    </Layout>
  );
});

app.get("/new", (c) =>
  c.html(
    <Layout title="New Bundle" user={c.get("user")} active="bundles">
      <ResourceForm title="Create Bundle" action="/bundles" cancelHref="/bundles" fields={fields()} />
    </Layout>
  )
);

app.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  const bundleType = String(b.bundleType || "General Bundle");
  const res = await db
    .insert(bundles)
    .values({
      name: String(b.name || "") || bundleType,
      bundleType,
      createdDate: String(b.createdDate || "") || todayISO(),
      description: String(b.description || "") || null,
      status: "active",
    })
    .returning({ id: bundles.id });
  const newId = res[0]?.id;
  return c.redirect(newId ? `/bundles/${newId}` : "/bundles");
});

// Bundle detail with item management
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(bundles).where(eq(bundles.id, id)).limit(1);
  const bundle = found[0];
  if (!bundle) return c.notFound();

  const items = await db
    .select({
      id: bundleItems.id,
      quantity: bundleItems.quantity,
      itemName: foodStock.itemName,
      stockId: foodStock.id,
    })
    .from(bundleItems)
    .leftJoin(foodStock, eq(bundleItems.stockId, foodStock.id))
    .where(eq(bundleItems.bundleId, id));

  const stockOptions = await db.select().from(foodStock).orderBy(foodStock.itemName);

  return c.html(
    <Layout title={bundle.bundleType} user={c.get("user")} active="bundles">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">
          {fmtDateLong(bundle.createdDate)}{" "}
          <span class={`badge ${bundle.bundleType === "Halal Bundle" ? "bg-success" : "bg-primary"}`}>
            {bundle.bundleType}
          </span>
        </h3>
        <div>
          <a href={`/bundles/${id}/edit`} class="btn btn-outline-secondary btn-sm">Edit</a>
          <a href="/bundles" class="btn btn-outline-secondary btn-sm">Back</a>
        </div>
      </div>
      {bundle.description ? <p class="text-muted">{bundle.description}</p> : null}

      <div class="card feature-card mb-3">
        <div class="section-header-warn">Items in Bundle</div>
        <div class="card-body p-0">
          <table class="table mb-0 align-middle">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th class="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colspan={3} class="text-center text-muted py-3">No items added.</td></tr>
              ) : (
                items.map((it) => (
                  <tr>
                    <td>{it.itemName || "(deleted item)"}</td>
                    <td>{it.quantity}</td>
                    <td class="text-end">
                      <form method="post" action={`/bundles/${id}/items/${it.id}/delete`} class="d-inline">
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
        <div class="card-body">
          <h6>Add Item to Bundle</h6>
          <form method="post" action={`/bundles/${id}/items`} class="row g-2">
            <div class="col-md-7">
              <select name="stockId" class="form-select" required>
                <option value="">Select stock item...</option>
                {stockOptions.map((s) => (
                  <option value={String(s.id)}>{s.itemName}</option>
                ))}
              </select>
            </div>
            <div class="col-md-3">
              <input type="number" name="quantity" class="form-control" value="1" min="1" required />
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary w-100">Add</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
});

app.post("/:id/items", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const stockId = parseInt(String(b.stockId || "0"), 10);
  if (stockId) {
    const db = getDb(c.env.DB);
    await db.insert(bundleItems).values({
      bundleId: id,
      stockId,
      quantity: parseInt(String(b.quantity || "1"), 10) || 1,
    });
  }
  return c.redirect(`/bundles/${id}`);
});

app.post("/:id/items/:itemId/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const itemId = parseInt(c.req.param("itemId"), 10);
  const db = getDb(c.env.DB);
  await db.delete(bundleItems).where(eq(bundleItems.id, itemId));
  return c.redirect(`/bundles/${id}`);
});

app.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(bundles).where(eq(bundles.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  return c.html(
    <Layout title="Edit Bundle" user={c.get("user")} active="bundles">
      <ResourceForm
        title="Edit Bundle"
        action={`/bundles/${id}`}
        cancelHref={`/bundles/${id}`}
        fields={fields(found[0] as unknown as Record<string, unknown>)}
      />
    </Layout>
  );
});

app.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  const bundleType = String(b.bundleType || "General Bundle");
  await db
    .update(bundles)
    .set({
      name: String(b.name || "") || bundleType,
      bundleType,
      createdDate: String(b.createdDate || "") || null,
      description: String(b.description || "") || null,
    })
    .where(eq(bundles.id, id));
  return c.redirect(`/bundles/${id}`);
});

app.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
  await db.delete(bundles).where(eq(bundles.id, id));
  return c.redirect("/bundles");
});

export default app;
