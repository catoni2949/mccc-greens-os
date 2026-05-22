import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<
  VariantProps<typeof import("@/components/ui/badge").badgeVariants>["variant"]
>;

export function statusBadgeVariant(
  status: string,
  priority?: string
): BadgeVariant {
  if (priority === "High" && status !== "Completed") return "destructive";
  if (status === "Completed") return "secondary";
  if (status === "In Progress") return "outline";
  if (status === "High" || status === "High Priority") return "destructive";
  return "default";
}

export function StatusBadge({
  status,
  priority,
  className,
}: {
  status: string;
  priority?: string;
  className?: string;
}) {
  const variant = statusBadgeVariant(status, priority);
  return (
    <Badge
      variant={variant}
      className={
        status === "Completed"
          ? cn(
              "border-emerald-200 bg-emerald-50 text-emerald-800",
              className
            )
          : className
      }
    >
      {status}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const variant =
    priority === "High" ? "destructive" : priority === "Low" ? "ghost" : "default";
  return (
    <Badge variant={variant} className={className}>
      {priority}
    </Badge>
  );
}
