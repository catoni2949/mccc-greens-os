import Link from "next/link";
import type { SupportingQuote } from "@/lib/governance/governance-types";

export function SupportingHistoryPanel({
  meetingIds,
  decisionIds,
  quotes,
}: {
  meetingIds: string[];
  decisionIds: string[];
  quotes: SupportingQuote[];
}) {
  const has =
    meetingIds.length > 0 || decisionIds.length > 0 || quotes.length > 0;
  if (!has) {
    return (
      <p className="text-sm text-slate-500">
        No supporting sources linked yet. Run governance synthesis after adding
        meetings and decisions.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {meetingIds.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-700">Meetings</h4>
          <ul className="mt-1 list-inside list-disc text-green-700">
            {meetingIds.map((id) => (
              <li key={id}>
                <Link href={`/meetings/${id}`} className="hover:underline">
                  View meeting {id.slice(0, 8)}…
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {decisionIds.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-700">Institutional decisions</h4>
          <ul className="mt-1 list-inside list-disc text-slate-600">
            {decisionIds.map((id) => (
              <li key={id}>Decision record {id.slice(0, 8)}…</li>
            ))}
          </ul>
        </div>
      )}
      {quotes.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-700">Supporting quotes</h4>
          <ul className="mt-2 space-y-2">
            {quotes.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700"
              >
                <p className="italic">&ldquo;{q.quote}&rdquo;</p>
                <p className="mt-1 text-xs text-slate-500">
                  {q.meeting_title ?? q.label ?? ""}
                  {q.meeting_id ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/meetings/${q.meeting_id}`}
                        className="text-green-700 hover:underline"
                      >
                        Source meeting
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
