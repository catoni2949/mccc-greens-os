import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BibleGenerateClient } from "@/components/governance/bible-generate-client";

export default function BibleGeneratePage() {
  return (
    <div>
      <PageHeader title="Generate Greens Committee Bible" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Synthesizes governance sections, institutional decisions, meetings, strategic
        projects, trees, capital, and discussion mentions into a markdown Bible preview.
      </p>
      <Link href="/governance/bible" className="text-sm text-green-700 hover:underline">
        ← Committee Bible
      </Link>
      <div className="mt-6">
        <BibleGenerateClient />
      </div>
    </div>
  );
}
