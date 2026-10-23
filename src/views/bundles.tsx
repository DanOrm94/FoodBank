import type { FC } from "hono/jsx";
import { fmtDateLong } from "../lib/status";

export interface BundleRow {
  id: number;
  bundleType: string;
  createdDate: string | null;
  itemCount: number;
}

export const BundlesPage: FC<{ bundles: BundleRow[] }> = ({ bundles }) => {
  return (
    <>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">
          <i class="bi bi-box2-heart text-success"></i> Food Bundles
        </h2>
        <a href="/bundles/new" class="btn btn-success">
          <i class="bi bi-plus-lg"></i> Create Bundle
        </a>
      </div>

      <div class="card feature-card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Creation Date</th>
                <th>Number of Items</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bundles.length === 0 ? (
                <tr>
                  <td colspan={3} class="text-center text-muted py-3">
                    No bundles found.
                  </td>
                </tr>
              ) : (
                bundles.map((b) => (
                  <tr>
                    <td>
                      <a href={`/bundles/${b.id}`} class="text-decoration-none">
                        {fmtDateLong(b.createdDate)}
                      </a>
                      <span class="text-muted"> • </span>
                      <span
                        class={`badge ${
                          b.bundleType === "Halal Bundle"
                            ? "bg-success"
                            : "bg-primary"
                        }`}
                      >
                        {b.bundleType}
                      </span>
                    </td>
                    <td>{b.itemCount}</td>
                    <td class="text-end">
                      <a href={`/bundles/${b.id}`} class="btn btn-sm btn-outline-secondary me-1" title="View">
                        <i class="bi bi-eye"></i>
                      </a>
                      <a href={`/bundles/${b.id}/edit`} class="btn btn-sm btn-outline-secondary me-1" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </a>
                      <form method="post" action={`/bundles/${b.id}/delete`} class="d-inline" onsubmit="return confirm('Delete this bundle?')">
                        <button class="btn btn-sm btn-outline-danger" title="Delete">
                          <i class="bi bi-trash"></i>
                        </button>
                      </form>
                    </td>
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
