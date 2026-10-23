import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { expenses, users } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceForm, type Field } from "../views/resource";
import { ExpensesPage, type ExpenseRow, type SupplierGroup } from "../views/expenses";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (
  userOptions: { value: string; label: string }[],
  row?: Record<string, unknown>
): Field[] => [
  { name: "supplier", label: "Supplier", value: row?.supplier as string, placeholder: "e.g. Fareshare" },
  { name: "description", label: "Description", required: true, value: row?.description as string },
  { name: "amount", label: "Amount (£)", type: "number", required: true, value: (row?.amount as number) ?? 0 },
  {
    name: "paymentMethod",
    label: "Payment Method",
    type: "select",
    value: (row?.paymentMethod as string) || "Card",
    options: [
      { value: "Card", label: "Card" },
      { value: "Cash", label: "Cash" },
      { value: "Bank Transfer", label: "Bank Transfer" },
      { value: "Other", label: "Other" },
    ],
  },
  { name: "date", label: "Payment Date", type: "date", value: row?.date as string },
  { name: "category", label: "Category", value: row?.category as string },
  {
    name: "userId",
    label: "Food Bank User (optional)",
    type: "select",
    value: row?.userId != null ? String(row.userId) : "",
    options: [{ value: "", label: "(none)" }, ...userOptions],
  },
];

async function userOpts(db: ReturnType<typeof getDb>) {
  const us = await db.select().from(users).orderBy(users.name);
  return us.map((u) => ({ value: String(u.id), label: u.name }));
}

// List grouped by supplier
app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select({
      id: expenses.id,
      supplier: expenses.supplier,
      description: expenses.description,
      amount: expenses.amount,
      paymentMethod: expenses.paymentMethod,
      date: expenses.date,
      userName: users.name,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.userId, users.id))
    .orderBy(desc(expenses.date));

  const map = new Map<string, ExpenseRow[]>();
  for (const r of rows as ExpenseRow[]) {
    const key = r.supplier && r.supplier.trim() ? r.supplier : "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const groups: SupplierGroup[] = Array.from(map.entries())
    .map(([supplier, items]) => ({
      supplier,
      items,
      total: items.reduce((s, i) => s + Number(i.amount ?? 0), 0),
    }))
    .sort((a, b) => a.supplier.localeCompare(b.supplier));

  return c.html(
    <Layout title="Expenses" user={c.get("user")} active="expenses">
      <ExpensesPage groups={groups} />
    </Layout>
  );
});

app.get("/new", async (c) => {
  const db = getDb(c.env.DB);
  const opts = await userOpts(db);
  return c.html(
    <Layout title="New Expense" user={c.get("user")} active="expenses">
      <ResourceForm title="Add Expense" action="/expenses" cancelHref="/expenses" fields={fields(opts)} />
    </Layout>
  );
});

app.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  const uid = parseInt(String(b.userId || ""), 10);
  await db.insert(expenses).values({
    supplier: String(b.supplier || "") || null,
    description: String(b.description || ""),
    amount: parseFloat(String(b.amount || "0")) || 0,
    paymentMethod: String(b.paymentMethod || "") || null,
    date: String(b.date || "") || null,
    category: String(b.category || "") || null,
    userId: Number.isNaN(uid) ? null : uid,
  });
  return c.redirect("/expenses");
});

app.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  const opts = await userOpts(db);
  return c.html(
    <Layout title="Edit Expense" user={c.get("user")} active="expenses">
      <ResourceForm
        title="Edit Expense"
        action={`/expenses/${id}`}
        cancelHref="/expenses"
        fields={fields(opts, found[0] as unknown as Record<string, unknown>)}
      />
    </Layout>
  );
});

app.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  const uid = parseInt(String(b.userId || ""), 10);
  await db
    .update(expenses)
    .set({
      supplier: String(b.supplier || "") || null,
      description: String(b.description || ""),
      amount: parseFloat(String(b.amount || "0")) || 0,
      paymentMethod: String(b.paymentMethod || "") || null,
      date: String(b.date || "") || null,
      category: String(b.category || "") || null,
      userId: Number.isNaN(uid) ? null : uid,
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
