import type { FC } from "hono/jsx";
import type { FoodStock } from "../db/schema";
import { fmtDate, expiryState } from "../lib/status";

export interface DashboardStats {
  stockItems: number;
  users: number;
  volunteers: number;
  bundles: number;
  expiringSoon: number;
  expired: number;
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

interface StatCard {
  label: string;
  value: number;
  icon: string;
  bg: string;
  href: string;
}

export const Dashboard: FC<{ expiring: FoodStock[]; stats: DashboardStats }> = ({
  expiring,
  stats,
}) => {
  const statCards: StatCard[] = [
    { label: "Stock Items", value: stats.stockItems, icon: "bi-box-seam", bg: "bg-primary", href: "/stock" },
    { label: "Registered Users", value: stats.users, icon: "bi-people", bg: "bg-info", href: "/users" },
    { label: "Volunteers", value: stats.volunteers, icon: "bi-hand-thumbs-up", bg: "bg-success", href: "/volunteers" },
    { label: "Bundles", value: stats.bundles, icon: "bi-box2-heart", bg: "bg-secondary", href: "/bundles" },
    { label: "Expiring Soon", value: stats.expiringSoon, icon: "bi-clock-history", bg: "bg-warning", href: "/stock" },
    { label: "Expired", value: stats.expired, icon: "bi-x-octagon", bg: "bg-danger", href: "/stock" },
  ];

  return (
    <>
      <div class="welcome-banner mb-4">
        <h1 class="display-6">Welcome to the Food Bank Manager</h1>
        <p class="mb-0">
          Efficiently manage food stock, bundles, users, and volunteers from
          your dashboard.
        </p>
      </div>

      {/* At-a-glance summary stats */}
      <div class="row g-3 mb-4">
        {statCards.map((s) => (
          <div class="col-6 col-md-4 col-lg-2">
            <a href={s.href} class="text-decoration-none">
              <div class={`card ${s.bg} text-white h-100`}>
                <div class="card-body py-3 text-center">
                  <i class={`bi ${s.icon} fs-4`}></i>
                  <div class="fs-3 fw-bold lh-1 mt-1">{s.value}</div>
                  <div class="small">{s.label}</div>
                </div>
              </div>
            </a>
          </div>
        ))}
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
                expiring.map((s) => {
                  const st = expiryState(s.expiryDate);
                  const rowClass =
                    st === "expired"
                      ? "table-danger"
                      : st === "soon"
                      ? "table-warning"
                      : "";
                  return (
                    <tr class={rowClass}>
                      <td>
                        <a href={`/stock/${s.id}`}>{s.itemName}</a>
                      </td>
                      <td>{s.quantity}</td>
                      <td>
                        {fmtDate(s.expiryDate)}
                        {st === "expired" ? (
                          <span class="badge bg-danger ms-2">Expired</span>
                        ) : st === "soon" ? (
                          <span class="badge bg-warning text-dark ms-2">Expiring Soon</span>
                        ) : null}
                      </td>
                      <td>{s.location || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
