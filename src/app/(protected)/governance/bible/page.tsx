import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GOVERNANCE_CATEGORIES } from "@/lib/governance/constants";

export default async function CommitteeBibleIndexPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("governance_sections")
    .select("slug, title, category, summary")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader title="Greens Committee Bible" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Institutional standards and operating knowledge. Edit sections in Supabase or
        future in-app editor.
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/governance" className="text-green-700 hover:underline">
          ← Governance hub
        </Link>
        <Link href="/governance/bible/import" className="text-green-700 hover:underline">
          Import substance
        </Link>
        <Link href="/governance/bible/generate" className="text-green-700 hover:underline">
          Generate from data
        </Link>
      </div>
      <div className="mt-6 space-y-8">
        {Object.entries(GOVERNANCE_CATEGORIES).map(([cat, label]) => {
          const items = (data ?? []).filter((s) => s.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">
                {label}
              </h2>
              <ul className="space-y-2">
                {items.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/governance/bible/${s.slug}`}
                      className="text-green-700 hover:underline"
                    >
                      {s.title}
                    </Link>
                    {s.summary ? (
                      <span className="text-slate-500"> — {s.summary}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
