export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date + (date.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m ?? "00"} ${ampm}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(
  dueDate: string | null | undefined,
  status: string
): boolean {
  if (!dueDate || status === "Completed") return false;
  return dueDate < todayIsoDate();
}

export function attendeeCount(attendees: string | null | undefined): number {
  if (!attendees?.trim()) return 0;
  return attendees
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
}
