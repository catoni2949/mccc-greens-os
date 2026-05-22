import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TreeItemForm } from "@/components/trees/tree-item-form";
import type { StrategicProject } from "@/lib/database.types";

export default async function NewTreePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("strategic_projects")
    .select("id, title")
    .order("title");

  return (
    <div>
      <PageHeader title="New Tree Item" />
      <TreeItemForm projects={(data ?? []) as Pick<StrategicProject, "id" | "title">[]} />
    </div>
  );
}
