import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { expenses } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceList, ResourceForm, fmtDate, type Field } from "../views/resource";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  { name: "description", label: "Description", required: true, value: row?.description as string },
  { name: "amount", label: "Amount (£)", type: "number", required: true, value: (row?.amount as number) ?? 0 },
  { name: "category", label: "Category", value: row?.category as string },
  { name: "date", label: "Date", type: "date", value: row?.date as string },
];

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date));
  return c.html(
    <Layout title="Expenses" user={c.get("user")} active="expenses">
      <ResourceList
        title="Expenses"
        basePath="/expenses"
        addLabel="Add Expense"
        columns={[
          { key: "description", label: "Description" },
          { key: "amount", label: "Amount (£)", render: (r) => `£${Number(r.amount ?? 0).toFixed(2)}` },
          { key: "category", label: "Category" },
          { key: "date", label: "Date", render: (r) => fmtDate(r.date as string) },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </Layout>
  );
});

app.get("/new", (c) =>
  c.html(
    <Layout title="New Expense" user={c.get("user")} active="expenses">
      <ResourceForm title="Add Expense" action="/expenses" cancelHref="/expenses" fields={fields()} />
    </Layout>
  )
);

app.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db.insert(expenses).values({
    description: String(b.description || ""),
    amount: parseFloat(String(b.amount || "0")) || 0,
    category: String(b.category || "") || null,
    date: String(b.date || "") || null,
  });
  return c.redirect("/expenses");
});

app.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  return c.html(
    <Layout title="Edit Expense" user={c.get("user")} active="expenses">
      <ResourceForm
        title="Edit Expense"
        action={`/expenses/${id}`}
        cancelHref="/expenses"
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
    .update(expenses)
    .set({
      description: String(b.description || ""),
      amount: parseFloat(String(b.amount || "0")) || 0,
      category: String(b.category || "") || null,
      date: String(b.date || "") || null,
    })
    .where(eq(expenses.id, id));
  return c.redirect("/expenses");
});

app.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(expenses).where(eq(expenses.id, id));
  return c.redirect("/expenses");
});

export default app;
