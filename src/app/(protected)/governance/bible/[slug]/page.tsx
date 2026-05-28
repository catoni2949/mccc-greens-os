import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GOVERNANCE_CATEGORIES } from "@/lib/governance/constants";

export default async function CommitteeBibleSectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("governance_sections")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !data) notFound();

  const categoryLabel =
    GOVERNANCE_CATEGORIES[data.category as keyof typeof GOVERNANCE_CATEGORIES] ??
    data.category;

  return (
    <div>
      <Link
        href="/governance/bible"
        className="text-sm text-green-700 hover:underline"
      >
        ← Committee Bible
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{data.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {categoryLabel} · v{data.version_label ?? "1.0"}
      </p>
      {data.summary ? (
        <p className="mt-4 text-slate-600">{data.summary}</p>
      ) : null}
      <article className="prose prose-sm prose-slate mt-6 max-w-none rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="whitespace-pre-wrap font-sans text-slate-800">
          {data.body?.trim() || "_Content pending._"}
        </div>
      </article>
    </div>
  );
}
