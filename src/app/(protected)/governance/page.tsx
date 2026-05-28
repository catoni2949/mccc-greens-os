import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PanelCard } from "@/components/panel-card";

export default function GovernanceHubPage() {
  return (
    <div>
      <PageHeader title="Governance & continuity" />
      <p className="-mt-4 mb-8 max-w-2xl text-sm text-slate-600">
        Institutional doctrine and chair continuity—synthesized from committee history,
        not scattered notes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelCard title="Committee Bible" href="/governance/bible">
          <p className="text-sm text-slate-600">
            Synthesized standards and operating doctrine by chapter.
          </p>
        </PanelCard>
        <PanelCard title="Chair handoff" href="/governance/transition">
          <p className="text-sm text-slate-600">
            Succession, transition record, outgoing chair brief.
          </p>
        </PanelCard>
        <PanelCard title="Onboarding / offboarding" href="/governance/onboarding">
          <p className="text-sm text-slate-600">Member and chair checklists.</p>
        </PanelCard>
        <PanelCard title="Governance intelligence" href="/governance/intelligence">
          <p className="text-sm text-slate-600">
            Themes, risks, evolution, institutional read.
          </p>
        </PanelCard>
        <PanelCard title="Historical backfill" href="/admin/backfill">
          <p className="text-sm text-slate-600">
            Import minutes, transcripts, USGA material into records.
          </p>
        </PanelCard>
        <PanelCard title="System setup" href="/admin/setup">
          <p className="text-sm text-slate-600">
            Migrations, seeds, synthesis—no manual SQL.
          </p>
        </PanelCard>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        <Link href="/chair" className="text-green-700 hover:underline">
          Chair command center
        </Link>
        {" · "}
        <Link href="/timeline" className="text-green-700 hover:underline">
          Timeline
        </Link>
      </p>
    </div>
  );
}
