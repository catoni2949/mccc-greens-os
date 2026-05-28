import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { IntelligenceDashboard } from "@/components/governance/intelligence-dashboard";

export default function GovernanceIntelligencePage() {
  return (
    <div>
      <PageHeader title="Governance intelligence" />
      <p className="-mt-4 mb-6 max-w-3xl text-sm text-slate-600">
        Institutional operating intelligence — recurring themes, board sensitivities,
        governance gaps, and continuity risks synthesized from committee history.
      </p>
      <Link href="/governance" className="text-sm text-green-700 hover:underline">
        ← Governance hub
      </Link>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <IntelligenceDashboard />
        </Suspense>
      </div>
    </div>
  );
}
