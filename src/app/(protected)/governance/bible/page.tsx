import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BibleSectionList } from "@/components/governance/bible-section-list";

export default async function CommitteeBibleIndexPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("governance_sections")
    .select(
      "slug, title, category, summary, synthesized_body, last_synthesized_at, source_count"
    )
    .eq("published", true)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader title="Greens Committee Bible" />
      <p className="-mt-4 mb-4 max-w-2xl text-sm text-slate-600">
        Institutional doctrine by chapter. Sections update automatically when you save
        transcripts and approve extracted records.
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/governance" className="text-green-700 hover:underline">
          ← Governance
        </Link>
        <Link href="/governance/bible/import" className="text-green-700 hover:underline">
          Import substance
        </Link>
        <Link href="/admin/setup" className="text-green-700 hover:underline">
          Run synthesis (setup)
        </Link>
      </div>
      <BibleSectionList sections={data ?? []} />
    </div>
  );
}
