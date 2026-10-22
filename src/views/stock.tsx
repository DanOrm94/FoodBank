import type { FC } from "hono/jsx";
import type { FoodStock } from "../db/schema";
import { fmtDate, expiryState } from "../lib/status";

export interface LocationGroup {
  location: string;
  items: FoodStock[];
}

export const FoodItemsPage: FC<{ groups: LocationGroup[] }> = ({ groups }) => {
  return (
    <>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">
          <i class="bi bi-apple text-success"></i> Food Items
        </h2>
        <a href="/stock/new" class="btn btn-success">
          <i class="bi bi-plus-lg"></i> Add New Food Item
        </a>
      </div>

      <div class="d-flex justify-content-end mb-3">
        <input
          type="text"
          id="stockSearch"
          class="form-control"
          style="max-width: 360px;"
          placeholder="Search food items by name, type, or location..."
        />
      </div>

      <div class="accordion" id="locationAccordion">
        {groups.length === 0 ? (
          <div class="text-center text-muted py-4">No food items found.</div>
        ) : (
          groups.map((g, idx) => {
            const slug = `loc-${idx}`;
            return (
              <div class="accordion-item location-group" data-location={g.location.toLowerCase()}>
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${slug}`}
                  >
                    <i class="bi bi-geo-alt-fill text-primary me-2"></i>
                    <span class="fw-semibold me-2">{g.location}</span>
                    <span class="badge bg-primary rounded-pill">
                      {g.items.length} item(s)
                    </span>
                  </button>
                </h2>
                <div
                  id={slug}
                  class="accordion-collapse collapse"
                  data-bs-parent="#locationAccordion"
                >
                  <div class="accordion-body p-0">
                    <table class="table table-hover mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Check In</th>
                          <th>Expiry</th>
                          <th class="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((it) => {
                          const st = expiryState(it.expiryDate);
                          return (
                          <tr class="stock-row" data-name={(it.itemName || "").toLowerCase()} data-category={(it.category || "").toLowerCase()}>
                            <td>
                              <a href={`/stock/${it.id}`}>{it.itemName}</a>
                            </td>
                            <td>{it.category || "-"}</td>
                            <td>{it.quantity}</td>
                            <td>{fmtDate(it.checkInDate)}</td>
                            <td>
                              {fmtDate(it.expiryDate)}
                              {st === "expired" ? (
                                <span class="badge bg-danger ms-2">Expired</span>
                              ) : st === "soon" ? (
                                <span class="badge bg-warning text-dark ms-2">Expiring Soon</span>
                              ) : null}
                            </td>
                            <td class="text-end">
                              <a href={`/stock/${it.id}/edit`} class="btn btn-sm btn-outline-secondary me-1">
                                <i class="bi bi-pencil"></i>
                              </a>
                              <form method="post" action={`/stock/${it.id}/delete`} class="d-inline" onsubmit="return confirm('Delete this item?')">
                                <button class="btn btn-sm btn-outline-danger">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </form>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            var input = document.getElementById('stockSearch');
            if (!input) return;
            input.addEventListener('input', function () {
              var term = this.value.toLowerCase();
              document.querySelectorAll('.location-group').forEach(function (group) {
                var loc = group.getAttribute('data-location') || '';
                var rows = group.querySelectorAll('tr.stock-row');
                var anyVisible = false;
                rows.forEach(function (row) {
                  var name = row.getAttribute('data-name') || '';
                  var cat = row.getAttribute('data-category') || '';
                  var match = !term || name.includes(term) || cat.includes(term) || loc.includes(term);
                  row.style.display = match ? '' : 'none';
                  if (match) anyVisible = true;
                });
                group.style.display = (anyVisible || !term) ? '' : 'none';
                // auto-expand matching groups when searching
                var panel = group.querySelector('.accordion-collapse');
                var btn = group.querySelector('.accordion-button');
                if (term && anyVisible) {
                  panel.classList.add('show');
                  btn.classList.remove('collapsed');
                } else if (!term) {
                  panel.classList.remove('show');
                  btn.classList.add('collapsed');
                }
              });
            });
          })();
        `,
        }}
      />
    </>
  );
};
