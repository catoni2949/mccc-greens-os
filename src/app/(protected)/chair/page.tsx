import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buildExecutiveChairSections } from "@/lib/operational-memory/executive-chair";
import { ChairExecutiveView } from "@/components/chair/chair-executive-view";

export default async function ChairDashboardPage() {
  const supabase = createClient();
  const { primary, advanced } = await buildExecutiveChairSections(supabase);

  return (
    <div>
      <PageHeader title="Chair command center" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Executive priorities for the Greens Committee chair.{" "}
        <Link href="/governance" className="text-green-700 hover:underline">
          Governance
        </Link>
        {" · "}
        <Link href="/governance/intelligence" className="text-green-700 hover:underline">
          Intelligence
        </Link>
      </p>
      <ChairExecutiveView primary={primary} advanced={advanced} />
    </div>
  );
}
