/** Client list filters — case-insensitive status, safe empty search */

export function searchMatchesTitle(
  title: string | null | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (title ?? "").toLowerCase().includes(q);
}

export function matchesStatusFilter(
  value: string | null | undefined,
  filter: string
): boolean {
  const f = filter.trim().toLowerCase();
  if (f === "all") return true;
  return (value ?? "").trim().toLowerCase() === f;
}

export function isCompletedStatus(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "completed";
}

export function isHighPriority(priority: string | null | undefined): boolean {
  return (priority ?? "").trim().toLowerCase() === "high";
}
