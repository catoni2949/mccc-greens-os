import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CapitalItemForm } from "@/components/capital/capital-item-form";
import type { CapitalItem, StrategicProject } from "@/lib/database.types";

export default async function EditCapitalPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [itemRes, projectsRes] = await Promise.all([
    supabase.from("capital_items").select("*").eq("id", params.id).single(),
    supabase.from("strategic_projects").select("id, title").order("title"),
  ]);

  if (itemRes.error || !itemRes.data) notFound();

  return (
    <div>
      <PageHeader title="Edit Capital Item" />
      <CapitalItemForm
        item={itemRes.data as CapitalItem}
        projects={(projectsRes.data ?? []) as Pick<StrategicProject, "id" | "title">[]}
      />
    </div>
  );
}
