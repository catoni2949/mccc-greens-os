import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MeetingCompleteClient } from "@/components/meetings/meeting-complete-client";

export default function MeetingCompletePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <PageHeader title="Meeting records saved" />
      <Link
        href={`/meetings/${params.id}`}
        className="text-sm text-green-700 hover:underline"
      >
        ← Meeting
      </Link>
      <div className="mt-6">
        <MeetingCompleteClient meetingId={params.id} />
      </div>
    </div>
  );
}
