import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { volunteers } from "../db/schema";
import type { Env, Variables } from "../lib/types";
import { Layout } from "../views/layout";
import { ResourceList, ResourceForm, type Field } from "../views/resource";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const fields = (row?: Record<string, unknown>): Field[] => [
  { name: "name", label: "Name", required: true, value: row?.name as string },
  { name: "email", label: "Email", type: "email", value: row?.email as string },
  { name: "phone", label: "Phone", value: row?.phone as string },
  { name: "role", label: "Role", value: row?.role as string },
  { name: "availability", label: "Availability", value: row?.availability as string },
  {
    name: "active",
    label: "Active",
    type: "checkbox",
    value: row ? Boolean(row.active) : true,
  },
];

app.get("/", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(volunteers).orderBy(desc(volunteers.id));
  return c.html(
    <Layout title="Volunteers" user={c.get("user")} active="volunteers">
      <ResourceList
        title="Volunteers"
        basePath="/volunteers"
        addLabel="Add Volunteer"
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </Layout>
  );
});

app.get("/new", (c) =>
  c.html(
    <Layout title="New Volunteer" user={c.get("user")} active="volunteers">
      <ResourceForm title="Add Volunteer" action="/volunteers" cancelHref="/volunteers" fields={fields()} />
    </Layout>
  )
);

app.post("/", async (c) => {
  const b = await c.req.parseBody();
  const db = getDb(c.env.DB);
  await db.insert(volunteers).values({
    name: String(b.name || ""),
    email: String(b.email || "") || null,
    phone: String(b.phone || "") || null,
    role: String(b.role || "") || null,
    availability: String(b.availability || "") || null,
    active: b.active ? true : false,
  });
  return c.redirect("/volunteers");
});

app.get("/:id/edit", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  const found = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
  if (!found[0]) return c.notFound();
  return c.html(
    <Layout title="Edit Volunteer" user={c.get("user")} active="volunteers">
      <ResourceForm
        title="Edit Volunteer"
        action={`/volunteers/${id}`}
        cancelHref="/volunteers"
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
    .update(volunteers)
    .set({
      name: String(b.name || ""),
      email: String(b.email || "") || null,
      phone: String(b.phone || "") || null,
      role: String(b.role || "") || null,
      availability: String(b.availability || "") || null,
      active: b.active ? true : false,
    })
    .where(eq(volunteers.id, id));
  return c.redirect("/volunteers");
});

app.post("/:id/delete", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb(c.env.DB);
  await db.delete(volunteers).where(eq(volunteers.id, id));
  return c.redirect("/volunteers");
});

export default app;
