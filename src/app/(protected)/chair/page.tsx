import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buildChairDashboard } from "@/lib/operational-memory/chair-dashboard";

export default async function ChairDashboardPage() {
  const supabase = createClient();
  const sections = await buildChairDashboard(supabase);

  return (
    <div>
      <PageHeader title="Chair command center" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Operational view for the Greens Committee chair — overdue work, board prep,
        and recurring topics. Institutional standards live under{" "}
        <Link href="/governance" className="text-green-700 hover:underline">
          Governance & continuity
        </Link>
        .
      </p>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/meetings" className="text-green-700 hover:underline">
          Meetings
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/timeline" className="text-green-700 hover:underline">
          Timeline
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/actions" className="text-green-700 hover:underline">
          Actions
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {section.title}
            </h2>
            {section.items.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing flagged.</p>
            ) : (
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-green-700 hover:underline"
                    >
                      {item.label}
                    </Link>
                    {item.meta ? (
                      <p className="text-xs text-slate-500">{item.meta}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
