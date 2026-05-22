import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TreesListClient } from "@/components/trees/trees-list-client";
import type { TreeItem } from "@/lib/database.types";

export default async function TreesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tree_items")
    .select("*")
    .order("committee_status")
    .order("title");

  if (error) {
    return (
      <div>
        <PageHeader
          title="Trees"
          action={{ label: "New Tree Item", href: "/trees/new" }}
        />
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Trees"
        action={{ label: "New Tree Item", href: "/trees/new" }}
      />
      <TreesListClient items={(data ?? []) as TreeItem[]} />
    </div>
  );
}
