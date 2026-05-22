import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {action && (
        <Link
          href={action.href}
          className={cn(
            buttonVariants(),
            "bg-green-700 text-white hover:bg-green-800"
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
