import type { FC } from "hono/jsx";
import type { FoodStock } from "../db/schema";

function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const cards = [
  {
    icon: "bi-apple",
    color: "text-warning",
    title: "Food Stock",
    desc: "View and manage current food stock levels",
    btn: "Manage Stock",
    href: "/stock",
  },
  {
    icon: "bi-box2-heart",
    color: "text-success",
    title: "Food Bundles",
    desc: "Create and manage food bundles",
    btn: "Manage Bundles",
    href: "/bundles",
  },
  {
    icon: "bi-people-fill",
    color: "text-info",
    title: "Users",
    desc: "View and manage registered foodbank users",
    btn: "Manage Users",
    href: "/users",
  },
  {
    icon: "bi-hand-thumbs-up-fill",
    color: "text-danger",
    title: "Volunteers",
    desc: "View and manage foodbank volunteers",
    btn: "Manage Volunteers",
    href: "/volunteers",
  },
];

export const Dashboard: FC<{ expiring: FoodStock[] }> = ({ expiring }) => {
  return (
    <>
      <div class="welcome-banner mb-4">
        <h1 class="display-6">Welcome to the Food Bank Manager</h1>
        <p class="mb-0">
          Efficiently manage food stock, bundles, users, and volunteers from
          your dashboard.
        </p>
      </div>

      <div class="row g-3 justify-content-center mb-4">
        {cards.map((c) => (
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="card feature-card text-center h-100">
              <div class="card-body">
                <i class={`bi ${c.icon} ${c.color}`}></i>
                <h5 class="card-title mt-2">{c.title}</h5>
                <p class="card-text text-muted small">{c.desc}</p>
                <a href={c.href} class="btn btn-primary btn-sm">
                  {c.btn}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div class="row justify-content-center mb-4">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card feature-card text-center h-100">
            <div class="card-body">
              <i class="bi bi-cash-stack text-secondary"></i>
              <h5 class="card-title mt-2">Expenses</h5>
              <p class="card-text text-muted small">View and manage Expenses</p>
              <a href="/expenses" class="btn btn-primary btn-sm">
                Manage Expenses
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="card feature-card">
        <div class="section-header-warn">
          <i class="bi bi-exclamation-triangle-fill"></i> Expiring Stock
        </div>
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {expiring.length === 0 ? (
                <tr>
                  <td colspan={4} class="text-center text-muted py-3">
                    No stock items found.
                  </td>
                </tr>
              ) : (
                expiring.map((s) => (
                  <tr>
                    <td>
                      <a href={`/stock/${s.id}`}>{s.itemName}</a>
                    </td>
                    <td>{s.quantity}</td>
                    <td>{fmtDate(s.expiryDate)}</td>
                    <td>{s.location || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
