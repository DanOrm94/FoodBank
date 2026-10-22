import type { FC } from "hono/jsx";

export const LoginPage: FC<{ error?: string }> = ({ error }) => {
  return (
    <div class="row justify-content-center">
      <div class="col-12 col-md-5">
        <div class="card feature-card mt-5">
          <div class="card-body p-4">
            <h4 class="text-center mb-4">
              <i class="bi bi-box-seam text-warning"></i> Food Bank Manager
            </h4>
            {error ? (
              <div class="alert alert-danger py-2">{error}</div>
            ) : null}
            <form method="post" action="/login">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input
                  type="text"
                  name="email"
                  class="form-control"
                  required
                  autofocus
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  class="form-control"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Log in
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};
