import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StrategicProjectForm } from "@/components/strategic/strategic-project-form";
import type { StrategicProject } from "@/lib/database.types";

export default async function EditStrategicProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("strategic_projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  return (
    <div>
      <PageHeader title="Edit Project" />
      <StrategicProjectForm project={data as StrategicProject} />
    </div>
  );
}
