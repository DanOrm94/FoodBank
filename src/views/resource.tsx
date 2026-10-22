import type { FC } from "hono/jsx";

export interface Column {
  key: string;
  label: string;
  // optional render override returns string
  render?: (row: Record<string, unknown>) => string;
}

export interface Field {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "textarea" | "select" | "checkbox";
  required?: boolean;
  options?: { value: string; label: string }[];
  value?: string | number | boolean | null;
  placeholder?: string;
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

interface ListProps {
  title: string;
  basePath: string; // e.g. /stock
  columns: Column[];
  rows: Record<string, unknown>[];
  addLabel?: string;
}

export const ResourceList: FC<ListProps> = ({
  title,
  basePath,
  columns,
  rows,
  addLabel,
}) => {
  return (
    <>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">{title}</h3>
        <a href={`${basePath}/new`} class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> {addLabel || "Add New"}
        </a>
      </div>
      <div class="card feature-card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th>{c.label}</th>
                ))}
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colspan={columns.length + 1} class="text-center text-muted py-3">
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr>
                    {columns.map((c) => (
                      <td>{c.render ? c.render(row) : String(row[c.key] ?? "-")}</td>
                    ))}
                    <td class="text-end">
                      <a
                        href={`${basePath}/${row.id}/edit`}
                        class="btn btn-sm btn-outline-secondary me-1"
                      >
                        <i class="bi bi-pencil"></i>
                      </a>
                      <form
                        method="post"
                        action={`${basePath}/${row.id}/delete`}
                        class="d-inline"
                        onsubmit="return confirm('Delete this record?')"
                      >
                        <button class="btn btn-sm btn-outline-danger" type="submit">
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

interface FormProps {
  title: string;
  action: string;
  fields: Field[];
  cancelHref: string;
}

export const ResourceForm: FC<FormProps> = ({
  title,
  action,
  fields,
  cancelHref,
}) => {
  return (
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <h3 class="mb-3">{title}</h3>
        <div class="card feature-card">
          <div class="card-body">
            <form method="post" action={action}>
              {fields.map((f) => (
                <div class="mb-3">
                  <label class="form-label">
                    {f.label}
                    {f.required ? <span class="text-danger"> *</span> : null}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea name={f.name} class="form-control" rows={3} required={f.required}>{f.value != null ? String(f.value) : ""}</textarea>
                  ) : f.type === "select" ? (
                    <select name={f.name} class="form-select" required={f.required}>
                      {(f.options || []).map((o) => (
                        <option
                          value={o.value}
                          selected={String(f.value) === o.value}
                        >
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <div class="form-check">
                      <input
                        type="checkbox"
                        name={f.name}
                        value="1"
                        class="form-check-input"
                        checked={Boolean(f.value)}
                      />
                    </div>
                  ) : (
                    <input
                      type={f.type || "text"}
                      name={f.name}
                      class="form-control"
                      required={f.required}
                      placeholder={f.placeholder || ""}
                      value={f.value != null ? String(f.value) : ""}
                    />
                  )}
                </div>
              ))}
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                  Save
                </button>
                <a href={cancelHref} class="btn btn-outline-secondary">
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
