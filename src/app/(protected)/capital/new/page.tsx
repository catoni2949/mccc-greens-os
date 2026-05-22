import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CapitalItemForm } from "@/components/capital/capital-item-form";
import type { StrategicProject } from "@/lib/database.types";

export default async function NewCapitalPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("strategic_projects")
    .select("id, title")
    .order("title");

  return (
    <div>
      <PageHeader title="New Capital Item" />
      <CapitalItemForm
        projects={(data ?? []) as Pick<StrategicProject, "id" | "title">[]}
      />
    </div>
  );
}
