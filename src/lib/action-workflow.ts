import { todayIsoDate } from "@/lib/format";
import { isCompletedStatus, isHighPriority } from "@/lib/list-filters";

export function actionIsOverdue(
  dueDate: string | null | undefined,
  status: string | null | undefined
): boolean {
  if (!dueDate || isCompletedStatus(status)) return false;
  return dueDate < todayIsoDate();
}

export function actionIsBoardRelevant(boardRelevance: boolean): boolean {
  return boardRelevance;
}

export { isCompletedStatus, isHighPriority };

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
