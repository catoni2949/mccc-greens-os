import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CapitalListClient } from "@/components/capital/capital-list-client";
import type { CapitalItem } from "@/lib/database.types";

export default async function CapitalPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capital_items")
    .select("*")
    .order("target_year", { ascending: false, nullsFirst: false })
    .order("title");

  if (error) {
    return (
      <div>
        <PageHeader
          title="Capital"
          action={{ label: "New Capital Item", href: "/capital/new" }}
        />
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Capital"
        action={{ label: "New Capital Item", href: "/capital/new" }}
      />
      <CapitalListClient items={(data ?? []) as CapitalItem[]} />
    </div>
  );
}
