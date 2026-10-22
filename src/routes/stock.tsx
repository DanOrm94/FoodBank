import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { getDb } from "../db/client";
import { foodStock } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import {
  ResourceList,
  ResourceForm,
  fmtDate,
  type Field,
} from "../views/resource";

const stock = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  { name: "itemName", label: "Item Name", required: true, value: row?.itemName as string },
  { name: "quantity", label: "Quantity", type: "number", required: true, value: (row?.quantity as number) ?? 0 },
  { name: "expiryDate", label: "Expiry Date", type: "date", value: row?.expiryDate as string },
  { name: "location", label: "Location", value: row?.location as string },
  { name: "category", label: "Category", value: row?.category as string },
];

stock.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(foodStock)
    .orderBy(asc(foodStock.expiryDate));
  return c.html(
    <Layout title="Food Stock" user={c.get("user")} active="stock">
      <ResourceList
        title="Food Stock"
        basePath="/stock"
        addLabel="Add Stock Item"
        columns={[
          { key: "itemName", label: "Item Name" },
          { key: "quantity", label: "Quantity" },
          { key: "expiryDate", label: "Expiry Date", render: (r) => fmtDate(r.expiryDate as string) },
          { key: "location", label: "Location" },
          { key: "category", label: "Category" },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </Layout>
  );
});

stock.get("/new", (c) =>
  c.html(
    <Layout title="New Stock Item" user={c.get("user")} active="stock">
      <ResourceForm
        title="Add Stock Item"
        action="/stock"
        cancelHref="/stock"
        fields={fields()}
      />
    </Layout>
  )
);

stock.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db.insert(foodStock).values({
    itemName: String(b.itemName || ""),
    quantity: parseInt(String(b.quantity || "0"), 10) || 0,
    expiryDate: String(b.expiryDate || "") || null,
    location: String(b.location || "") || null,
    category: String(b.category || "") || null,
  });
  return c.redirect("/stock");
});

stock.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(foodStock).where(eq(foodStock.id, id)).limit(1);
  const item = found[0];
  if (!item) return c.notFound();
  return c.html(
    <Layout title={item.itemName} user={c.get("user")} active="stock">
      <h3>{item.itemName}</h3>
      <div class="card feature-card">
        <ul class="list-group list-group-flush">
          <li class="list-group-item"><strong>Quantity:</strong> {item.quantity}</li>
          <li class="list-group-item"><strong>Expiry Date:</strong> {fmtDate(item.expiryDate)}</li>
          <li class="list-group-item"><strong>Location:</strong> {item.location || "-"}</li>
          <li class="list-group-item"><strong>Category:</strong> {item.category || "-"}</li>
        </ul>
      </div>
      <div class="mt-3">
        <a href={`/stock/${item.id}/edit`} class="btn btn-primary">Edit</a>
        <a href="/stock" class="btn btn-outline-secondary">Back</a>
      </div>
    </Layout>
  );
});

stock.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(foodStock).where(eq(foodStock.id, id)).limit(1);
  const item = found[0];
  if (!item) return c.notFound();
  return c.html(
    <Layout title="Edit Stock Item" user={c.get("user")} active="stock">
      <ResourceForm
        title="Edit Stock Item"
        action={`/stock/${id}`}
        cancelHref="/stock"
        fields={fields(item as unknown as Record<string, unknown>)}
      />
    </Layout>
  );
});

stock.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db
    .update(foodStock)
    .set({
      itemName: String(b.itemName || ""),
      quantity: parseInt(String(b.quantity || "0"), 10) || 0,
      expiryDate: String(b.expiryDate || "") || null,
      location: String(b.location || "") || null,
      category: String(b.category || "") || null,
    })
    .where(eq(foodStock.id, id));
  return c.redirect("/stock");
});

stock.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(foodStock).where(eq(foodStock.id, id));
  return c.redirect("/stock");
});

export default stock;
