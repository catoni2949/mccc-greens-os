import Link from "next/link";
import { cn } from "@/lib/utils";

export function PanelCard({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </>
  );

  const boxClass = cn(
    "rounded-xl border border-slate-100 bg-white p-4 shadow-sm",
    href && "transition-shadow hover:shadow-md",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn(boxClass, "block")}>
        {inner}
      </Link>
    );
  }

  return <div className={boxClass}>{inner}</div>;
}

export function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </>
  );

  const className =
    "rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={cn(className, "block")}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
