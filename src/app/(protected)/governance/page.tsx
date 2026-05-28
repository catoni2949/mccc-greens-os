import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PanelCard } from "@/components/panel-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GOVERNANCE_CATEGORIES } from "@/lib/governance/constants";

export default async function GovernanceHubPage() {
  const supabase = createClient();
  const { data: sections } = await supabase
    .from("governance_sections")
    .select("id, slug, title, category, summary")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const byCategory = new Map<string, typeof sections>();
  for (const s of sections ?? []) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  return (
    <div>
      <PageHeader title="Governance & continuity" />
      <div className="mb-8 max-w-3xl space-y-3 text-sm text-slate-600">
        <p>
          <strong className="text-slate-900">Operational memory</strong> captures
          what happened in meetings — actions, trees, capital, transcripts.
        </p>
        <p>
          <strong className="text-slate-900">Institutional continuity</strong> is
          how the Greens Committee governs itself over years: standards, onboarding,
          chair succession, decision rationale, and the Committee Bible.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PanelCard title="Committee Bible" href="/governance/bible">
          <p className="text-sm text-slate-600">
            Standards, procedures, and continuity chapters.
          </p>
        </PanelCard>
        <PanelCard title="Import substance" href="/governance/bible/import">
          <p className="text-sm text-slate-600">
            Extract Bible and decisions from real source text.
          </p>
        </PanelCard>
        <PanelCard title="Generate Bible" href="/governance/bible/generate">
          <p className="text-sm text-slate-600">
            Markdown from existing Greens OS records.
          </p>
        </PanelCard>
        <PanelCard title="Historical backfill" href="/admin/backfill">
          <p className="text-sm text-slate-600">
            Admin: minutes, agendas, USGA, transcripts → records.
          </p>
        </PanelCard>
        <PanelCard title="Onboarding" href="/governance/onboarding">
          <p className="text-sm text-slate-600">New members and incoming chairs.</p>
        </PanelCard>
        <PanelCard title="Chair transition" href="/governance/transition">
          <p className="text-sm text-slate-600">Succession and handoff record.</p>
        </PanelCard>
        <PanelCard title="Living history" href="/timeline">
          <p className="text-sm text-slate-600">Timeline of decisions and work.</p>
        </PanelCard>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/chair" className={cn(buttonVariants({ variant: "outline" }))}>
          Chair command center
        </Link>
        <Link href="/committee" className={cn(buttonVariants({ variant: "outline" }))}>
          Committee roster
        </Link>
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Bible by category
      </h2>
      <div className="space-y-6">
        {Object.entries(GOVERNANCE_CATEGORIES).map(([key, label]) => {
          const items = byCategory.get(key) ?? [];
          if (!items.length) return null;
          return (
            <section key={key}>
              <h3 className="mb-2 font-medium text-slate-800">{label}</h3>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/governance/bible/${item.slug}`}
                      className="block px-4 py-3 hover:bg-slate-50"
                    >
                      <p className="font-medium text-green-700">{item.title}</p>
                      {item.summary ? (
                        <p className="text-sm text-slate-500">{item.summary}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {!sections?.length && (
        <p className="text-sm text-amber-800">
          No governance sections yet. Run migrations{" "}
          <code className="text-xs">006</code>/<code className="text-xs">007</code> and{" "}
          <code className="text-xs">seed_governance.sql</code> in Supabase.
        </p>
      )}
    </div>
  );
}
