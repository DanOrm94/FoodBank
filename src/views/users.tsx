import type { FC } from "hono/jsx";
import { bundleStatus } from "../lib/status";

export interface UserRow {
  id: number;
  name: string;
  familySize: number;
  contact: number;
  dietaryRequirements: string | null;
  latestDate: string | null;
  latestCollected: number | null;
}

export const UsersPage: FC<{ users: UserRow[]; q?: string }> = ({
  users,
  q,
}) => {
  return (
    <>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">
          <i class="bi bi-people-fill text-primary"></i> Food Bank Users
        </h2>
        <a href="/users/new" class="btn btn-success">
          <i class="bi bi-person-plus"></i> Add New User
        </a>
      </div>

      <input
        type="text"
        id="userSearch"
        class="form-control mb-3"
        placeholder="Search users by name, dietary, or contact..."
        value={q || ""}
      />

      <div class="card feature-card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0 align-middle" id="usersTable">
            <thead class="table-dark">
              <tr>
                <th>Name</th>
                <th>Family Size</th>
                <th>Contact</th>
                <th>Dietary Requirements</th>
                <th>Bundle Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colspan={6} class="text-center text-muted py-3">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const status = bundleStatus(u.latestDate, u.latestCollected);
                  return (
                    <tr class="user-row">
                      <td class="u-name">{u.name}</td>
                      <td>{u.familySize}</td>
                      <td>{u.contact}</td>
                      <td class="u-diet">{u.dietaryRequirements || "none"}</td>
                      <td>
                        <span
                          class={`badge rounded-pill ${
                            status.assigned ? "bg-success" : "bg-danger"
                          }`}
                        >
                          <i
                            class={`bi ${
                              status.assigned
                                ? "bi-check-circle"
                                : "bi-x-circle"
                            }`}
                          ></i>{" "}
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div class="btn-group" role="group">
                          <form
                            method="post"
                            action={`/users/${u.id}/assign`}
                            class="d-inline"
                          >
                            <button
                              class="btn btn-sm btn-success"
                              title="Assign Bundle"
                            >
                              <i class="bi bi-box-seam"></i>
                            </button>
                          </form>
                          <a
                            href={`/users/${u.id}/attendance`}
                            class="btn btn-sm btn-info text-white"
                            title="Attendance"
                          >
                            <i class="bi bi-calendar-check"></i>
                          </a>
                          <a
                            href={`/users/${u.id}/edit`}
                            class="btn btn-sm btn-warning text-white"
                            title="Edit"
                          >
                            <i class="bi bi-pencil-square"></i>
                          </a>
                          <form
                            method="post"
                            action={`/users/${u.id}/delete`}
                            class="d-inline"
                            onsubmit="return confirm('Delete this user?')"
                          >
                            <button
                              class="btn btn-sm btn-danger"
                              title="Delete"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            var input = document.getElementById('userSearch');
            if (!input) return;
            input.addEventListener('input', function () {
              var term = this.value.toLowerCase();
              document.querySelectorAll('#usersTable tbody tr.user-row').forEach(function (row) {
                var name = (row.querySelector('.u-name')?.textContent || '').toLowerCase();
                var diet = (row.querySelector('.u-diet')?.textContent || '').toLowerCase();
                row.style.display = (name.includes(term) || diet.includes(term)) ? '' : 'none';
              });
            });
          })();
        `,
        }}
      />
    </>
  );
};
