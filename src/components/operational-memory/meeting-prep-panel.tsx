import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMeetingPrepTopics } from "@/lib/operational-memory/chair-dashboard";

export async function MeetingPrepPanel({ meetingId }: { meetingId: string }) {
  const supabase = createClient();
  void meetingId;
  const topics = await buildMeetingPrepTopics(supabase);

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Topics likely requiring follow-up
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Based on open records and prior meeting overlap (heuristic).
      </p>
      {topics.length === 0 ? (
        <p className="text-sm text-slate-500">No follow-up topics flagged right now.</p>
      ) : (
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.href + t.label} className="rounded-lg bg-slate-50 px-3 py-2">
              <Link href={t.href} className="text-sm font-medium text-green-700 hover:underline">
                {t.label}
              </Link>
              <p className="text-xs text-slate-600">{t.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
