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
