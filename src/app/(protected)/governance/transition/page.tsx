import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { CHECKLIST_TYPES } from "@/lib/governance/constants";
import { ChairTransitionForm } from "@/components/governance/chair-transition-form";

export default async function GovernanceTransitionPage() {
  const supabase = createClient();

  const [{ data: transitions }, { data: checklist }] = await Promise.all([
    supabase
      .from("chair_transitions")
      .select("*")
      .order("effective_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("governance_checklist_items")
      .select("*")
      .eq("checklist_type", "outgoing_chair")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader title="Chair transition" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Succession is institutional, not personal. Record handoffs so the next chair
        inherits context, not inbox archaeology.
      </p>
      <Link href="/governance" className="text-sm text-green-700 hover:underline">
        ← Governance hub
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Record transition</h2>
          <ChairTransitionForm />
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">
            {CHECKLIST_TYPES.outgoing_chair}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {(checklist ?? []).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ol>
          <Link
            href="/governance/intelligence"
            className="mt-4 block text-sm text-green-700 hover:underline"
          >
            Outgoing Chair Intelligence Brief →
          </Link>
          <Link
            href="/chair"
            className="mt-2 inline-block text-sm text-green-700 hover:underline"
          >
            Open Chair command center →
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">
          Transition history
        </h2>
        {!transitions?.length ? (
          <p className="text-sm text-slate-500">No transitions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
            {transitions.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <p className="font-medium text-slate-900">
                  {t.outgoing_chair ?? "—"} → {t.incoming_chair}
                </p>
                <p className="text-sm text-slate-500">
                  Effective {formatDate(t.effective_date)}
                </p>
                {t.handoff_summary ? (
                  <p className="mt-1 text-sm text-slate-600">{t.handoff_summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
