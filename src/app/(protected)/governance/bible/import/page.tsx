import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BibleImportClient } from "@/components/governance/bible-import-client";

export default function BibleImportPage() {
  return (
    <div>
      <PageHeader title="Import Bible substance" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Turn real committee material into governance sections and institutional
        decisions — with the same review-and-approve flow as historical backfill.
      </p>
      <Link href="/governance/bible" className="text-sm text-green-700 hover:underline">
        ← Committee Bible
      </Link>
      <div className="mt-6">
        <BibleImportClient />
      </div>
    </div>
  );
}
