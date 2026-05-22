import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TreeItemForm } from "@/components/trees/tree-item-form";
import type { StrategicProject, TreeItem } from "@/lib/database.types";

export default async function EditTreePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [itemRes, projectsRes] = await Promise.all([
    supabase.from("tree_items").select("*").eq("id", params.id).single(),
    supabase.from("strategic_projects").select("id, title").order("title"),
  ]);

  if (itemRes.error || !itemRes.data) notFound();

  return (
    <div>
      <PageHeader title="Edit Tree Item" />
      <TreeItemForm
        item={itemRes.data as TreeItem}
        projects={(projectsRes.data ?? []) as Pick<StrategicProject, "id" | "title">[]}
      />
    </div>
  );
}
