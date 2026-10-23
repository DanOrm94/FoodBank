import type { FC } from "hono/jsx";
import type { SessionPayload } from "../lib/auth";

interface LayoutProps {
  title: string;
  user?: SessionPayload | null;
  active?: string;
  children?: unknown;
}

const navItems = [
  { href: "/", label: "Home", key: "home" },
  { href: "/stock", label: "Food Stock", key: "stock" },
  { href: "/bundles", label: "Food Bundles", key: "bundles" },
  { href: "/users", label: "Users", key: "users" },
  { href: "/volunteers", label: "Volunteers", key: "volunteers" },
  { href: "/expenses", label: "Expense", key: "expenses" },
  { href: "/help", label: "Help", key: "help" },
];

export const Layout: FC<LayoutProps> = ({ title, user, active, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} | Food Bank Manager</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body { background-color: #f4f6f9; }
            .navbar-brand { font-weight: 700; color: #f0ad20 !important; }
            .navbar-brand .bi { color: #f0ad20; }
            .welcome-banner {
              background: linear-gradient(90deg, #f6b528, #f0ad20);
              color: #fff; border-radius: .5rem; padding: 2rem;
            }
            .feature-card {
              border: none; box-shadow: 0 1px 3px rgba(0,0,0,.08);
              transition: transform .15s ease, box-shadow .15s ease;
            }
            .feature-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 .5rem 1rem rgba(0,0,0,.12);
            }
            .feature-card .bi { font-size: 2.5rem; }
            .section-header-warn {
              background: #f0ad20; color: #fff; font-weight: 600;
              border-radius: .4rem .4rem 0 0; padding: .6rem 1rem;
            }

            /* Button polish: subtle lift + press feedback */
            .btn {
              transition: transform .12s ease, box-shadow .12s ease,
                          filter .12s ease;
            }
            .btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 .25rem .5rem rgba(0,0,0,.15);
              filter: brightness(1.05);
            }
            .btn:active {
              transform: translateY(0);
              box-shadow: 0 .1rem .2rem rgba(0,0,0,.15) inset;
              filter: brightness(.97);
            }
            .btn:focus-visible {
              outline: 3px solid rgba(13,110,253,.35);
              outline-offset: 2px;
            }
            /* Small icon action buttons: gentler effect */
            .btn-sm.btn-outline-secondary:hover,
            .btn-sm.btn-outline-danger:hover { transform: translateY(-1px); }

            /* Clickable summary stat cards feel interactive */
            a .card { transition: transform .15s ease, box-shadow .15s ease; }
            a:hover .card {
              transform: translateY(-3px);
              box-shadow: 0 .5rem 1rem rgba(0,0,0,.15);
            }

            /* Respect users who prefer no motion (accessibility) */
            @media (prefers-reduced-motion: reduce) {
              .btn, .feature-card, a .card { transition: none; }
              .btn:hover, .feature-card:hover, a:hover .card { transform: none; }
            }
          `,
          }}
        />
      </head>
      <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container-fluid">
            <a class="navbar-brand" href="/">
              <i class="bi bi-box-seam"></i> FoodBankManager
            </a>
            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
            >
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNav">
              {user ? (
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                  {navItems.map((item) => (
                    <li class="nav-item">
                      <a
                        class={`nav-link${active === item.key ? " active" : ""}`}
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul class="navbar-nav me-auto"></ul>
              )}
              {user ? (
                <div class="dropdown">
                  <a
                    class="nav-link dropdown-toggle text-white"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                  >
                    <i class="bi bi-person-circle"></i> {user.email}
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <span class="dropdown-item-text text-muted small">
                        {user.name} ({user.role})
                      </span>
                    </li>
                    <li>
                      <hr class="dropdown-divider" />
                    </li>
                    <li>
                      <form method="post" action="/logout">
                        <button class="dropdown-item" type="submit">
                          <i class="bi bi-box-arrow-right"></i> Log out
                        </button>
                      </form>
                    </li>
                  </ul>
                </div>
              ) : (
                <a class="btn btn-outline-light btn-sm" href="/login">
                  Log in
                </a>
              )}
            </div>
          </div>
        </nav>

        <main class="container py-4">{children}</main>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
};
