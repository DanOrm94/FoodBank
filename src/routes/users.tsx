import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceList, ResourceForm, type Field } from "../views/resource";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  { name: "name", label: "Name", required: true, value: row?.name as string },
  { name: "email", label: "Email", type: "email", value: row?.email as string },
  { name: "phone", label: "Phone", value: row?.phone as string },
  { name: "address", label: "Address", type: "textarea", value: row?.address as string },
  { name: "householdSize", label: "Household Size", type: "number", value: (row?.householdSize as number) ?? 1 },
  { name: "notes", label: "Notes", type: "textarea", value: row?.notes as string },
];

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(users).orderBy(desc(users.id));
  return c.html(
    <Layout title="Users" user={c.get("user")} active="users">
      <ResourceList
        title="Registered Users"
        basePath="/users"
        addLabel="Add User"
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "householdSize", label: "Household" },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
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
    email: String(b.email || "") || null,
    phone: String(b.phone || "") || null,
    address: String(b.address || "") || null,
    householdSize: parseInt(String(b.householdSize || "1"), 10) || 1,
    notes: String(b.notes || "") || null,
  });
  return c.redirect("/users");
});

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
      email: String(b.email || "") || null,
      phone: String(b.phone || "") || null,
      address: String(b.address || "") || null,
      householdSize: parseInt(String(b.householdSize || "1"), 10) || 1,
      notes: String(b.notes || "") || null,
    })
    .where(eq(users.id, id));
  return c.redirect("/users");
});

app.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(users).where(eq(users.id, id));
  return c.redirect("/users");
});

export default app;
