import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CHECKLIST_TYPES } from "@/lib/governance/constants";

export default async function GovernanceOnboardingPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("governance_checklist_items")
    .select("*")
    .in("checklist_type", [
      "incoming_member",
      "incoming_chair",
    ])
    .order("checklist_type")
    .order("sort_order", { ascending: true });

  const grouped = new Map<string, NonNullable<typeof items>>();
  for (const row of items ?? []) {
    const list = grouped.get(row.checklist_type) ?? [];
    list.push(row);
    grouped.set(row.checklist_type, list);
  }

  return (
    <div>
      <PageHeader title="Onboarding" />
      <p className="-mt-4 mb-6 text-sm text-slate-600">
        Institutional onboarding — not just access, but how the committee works.
      </p>
      <Link href="/governance" className="text-sm text-green-700 hover:underline">
        ← Governance hub
      </Link>
      <div className="mt-6 space-y-8">
        {(["incoming_member", "incoming_chair"] as const).map((type) => {
          const list = grouped.get(type) ?? [];
          return (
            <section
              key={type}
              className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-4 font-semibold text-slate-900">
                {CHECKLIST_TYPES[type]}
              </h2>
              {list.length === 0 ? (
                <p className="text-sm text-slate-500">No checklist items seeded.</p>
              ) : (
                <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-700">
                  {list.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.title}</span>
                      {item.is_required ? (
                        <span className="ml-2 text-xs text-amber-700">required</span>
                      ) : null}
                      {item.description ? (
                        <p className="mt-0.5 text-slate-500">{item.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
