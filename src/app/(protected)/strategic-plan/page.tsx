import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StrategicPlanListClient } from "@/components/strategic/strategic-plan-list-client";
import type { StrategicProject } from "@/lib/database.types";

export default async function StrategicPlanPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("strategic_projects")
    .select("*")
    .order("priority_tier", { ascending: true, nullsFirst: false })
    .order("title");

  if (error) {
    return (
      <div>
        <PageHeader
          title="Strategic Plan"
          action={{ label: "New Project", href: "/strategic-plan/new" }}
        />
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Strategic Plan"
        action={{ label: "New Project", href: "/strategic-plan/new" }}
      />
      <StrategicPlanListClient projects={(data ?? []) as StrategicProject[]} />
    </div>
  );
}
