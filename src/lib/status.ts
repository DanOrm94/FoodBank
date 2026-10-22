export function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export interface BundleStatus {
  assigned: boolean; // green vs red
  label: string; // e.g. "Assigned: 22/10/2026"
  date: string | null;
}

// Derives the pill shown in the "Bundle Status" column from a user's latest
// assignment. Green ("Assigned") when the latest assignment is not yet
// collected, red ("Last Assignment") otherwise or when none exist.
export function bundleStatus(
  latestDate: string | null,
  latestCollected: boolean | number | null
): BundleStatus {
  if (!latestDate) {
    return { assigned: false, label: "No assignments", date: null };
  }
  const collected = Boolean(latestCollected);
  if (!collected) {
    return {
      assigned: true,
      label: `Assigned: ${fmtDate(latestDate)}`,
      date: latestDate,
    };
  }
  return {
    assigned: false,
    label: `Last Assignment: ${fmtDate(latestDate)}`,
    date: latestDate,
  };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ExpiryState = "expired" | "soon" | "ok";

// Classifies an expiry date relative to today.
// expired: in the past. soon: within the next 30 days. ok: further out.
export function expiryState(
  iso?: string | null,
  soonDays = 30
): ExpiryState {
  if (!iso) return "ok";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "ok";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / 86_400_000
  );
  if (diffDays < 0) return "expired";
  if (diffDays <= soonDays) return "soon";
  return "ok";
}
