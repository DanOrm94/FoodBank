import type { FC } from "hono/jsx";
import { fmtDate } from "../lib/status";

export interface ExpenseRow {
  id: number;
  supplier: string | null;
  description: string;
  amount: number;
  paymentMethod: string | null;
  date: string | null;
  userName: string | null;
}

export interface SupplierGroup {
  supplier: string;
  items: ExpenseRow[];
  total: number;
}

export const ExpensesPage: FC<{ groups: SupplierGroup[] }> = ({ groups }) => {
  return (
    <>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">
          <i class="bi bi-cash-stack text-secondary"></i> Expense List
        </h2>
        <a href="/expenses/new" class="btn btn-success">
          <i class="bi bi-plus-lg"></i> Add New Expense
        </a>
      </div>

      <div class="d-flex justify-content-end mb-3">
        <input
          type="text"
          id="expenseSearch"
          class="form-control"
          style="max-width: 360px;"
          placeholder="Search expenses by description, supplier, or method..."
        />
      </div>

      <div class="accordion" id="supplierAccordion">
        {groups.length === 0 ? (
          <div class="text-center text-muted py-4">No expenses found.</div>
        ) : (
          groups.map((g, idx) => {
            const slug = `sup-${idx}`;
            return (
              <div class="accordion-item supplier-group" data-supplier={g.supplier.toLowerCase()}>
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${slug}`}
                  >
                    <span class="fw-semibold me-2">{g.supplier}</span>
                    <span class="badge bg-secondary rounded-pill me-2">
                      {g.items.length}
                    </span>
                    <span class="text-muted small">
                      Total £{g.total.toFixed(2)}
                    </span>
                  </button>
                </h2>
                <div
                  id={slug}
                  class="accordion-collapse collapse"
                  data-bs-parent="#supplierAccordion"
                >
                  <div class="accordion-body p-0">
                    <table class="table table-hover mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Payment Date</th>
                          <th>Food Bank User</th>
                          <th class="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((e) => (
                          <tr
                            class="expense-row"
                            data-desc={(e.description || "").toLowerCase()}
                            data-method={(e.paymentMethod || "").toLowerCase()}
                          >
                            <td>{e.description}</td>
                            <td>£{Number(e.amount ?? 0).toFixed(2)}</td>
                            <td>{e.paymentMethod || "-"}</td>
                            <td>{fmtDate(e.date)}</td>
                            <td>{e.userName || "-"}</td>
                            <td class="text-end">
                              <a href={`/expenses/${e.id}/edit`} class="btn btn-sm btn-outline-secondary me-1">
                                <i class="bi bi-pencil"></i>
                              </a>
                              <form method="post" action={`/expenses/${e.id}/delete`} class="d-inline" onsubmit="return confirm('Delete this expense?')">
                                <button class="btn btn-sm btn-outline-danger">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
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
            var input = document.getElementById('expenseSearch');
            if (!input) return;
            input.addEventListener('input', function () {
              var term = this.value.toLowerCase();
              document.querySelectorAll('.supplier-group').forEach(function (group) {
                var sup = group.getAttribute('data-supplier') || '';
                var rows = group.querySelectorAll('tr.expense-row');
                var anyVisible = false;
                rows.forEach(function (row) {
                  var desc = row.getAttribute('data-desc') || '';
                  var method = row.getAttribute('data-method') || '';
                  var match = !term || desc.includes(term) || method.includes(term) || sup.includes(term);
                  row.style.display = match ? '' : 'none';
                  if (match) anyVisible = true;
                });
                group.style.display = (anyVisible || !term) ? '' : 'none';
                var panel = group.querySelector('.accordion-collapse');
                var btn = group.querySelector('.accordion-button');
                if (term && anyVisible) { panel.classList.add('show'); btn.classList.remove('collapsed'); }
                else if (!term) { panel.classList.remove('show'); btn.classList.add('collapsed'); }
              });
            });
          })();
        `,
        }}
      />
    </>
  );
};
