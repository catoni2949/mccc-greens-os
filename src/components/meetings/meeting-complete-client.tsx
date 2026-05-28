"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { POST_CREATE_KEY } from "@/lib/meetings/post-create";

export type PostCreatePayload = {
  created: {
    actions: number;
    projects: number;
    trees: number;
    capital: number;
    feedback: number;
  };
  operationalMemoryUpdated: boolean;
  bibleSectionsUpdated: string[];
  synthesisSkipped?: boolean;
  synthesisReason?: string;
  nextSteps: string[];
};

export function MeetingCompleteClient({ meetingId }: { meetingId: string }) {
  const [payload, setPayload] = useState<PostCreatePayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`${POST_CREATE_KEY}_${meetingId}`);
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw) as PostCreatePayload);
      sessionStorage.removeItem(`${POST_CREATE_KEY}_${meetingId}`);
    } catch {
      /* ignore */
    }
  }, [meetingId]);

  if (!payload) {
    return (
      <div className="text-sm text-slate-600">
        <p>No completion summary in session.</p>
        <Link href={`/meetings/${meetingId}`} className="text-green-700 hover:underline">
          Back to meeting
        </Link>
      </div>
    );
  }

  const total =
    payload.created.actions +
    payload.created.projects +
    payload.created.trees +
    payload.created.capital +
    payload.created.feedback;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-green-100 bg-green-50/60 p-5">
        <h2 className="font-semibold text-green-900">Records created</h2>
        <p className="mt-1 text-sm text-green-950">{total} items saved from your review.</p>
        <ul className="mt-3 list-inside list-disc text-sm text-green-900">
          {payload.created.actions > 0 && <li>{payload.created.actions} actions</li>}
          {payload.created.projects > 0 && (
            <li>{payload.created.projects} strategic projects</li>
          )}
          {payload.created.trees > 0 && <li>{payload.created.trees} tree items</li>}
          {payload.created.capital > 0 && <li>{payload.created.capital} capital items</li>}
          {payload.created.feedback > 0 && (
            <li>{payload.created.feedback} member feedback</li>
          )}
        </ul>
      </div>

      {payload.operationalMemoryUpdated && (
        <p className="text-sm text-slate-700">Operational memory updated.</p>
      )}

      {payload.bibleSectionsUpdated.length > 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Bible sections updated</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            {payload.bibleSectionsUpdated.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : payload.synthesisSkipped ? (
        <p className="text-sm text-slate-500">
          Governance auto-synthesis skipped
          {payload.synthesisReason ? `: ${payload.synthesisReason}` : ""}.
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Recommended next steps</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {payload.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <Link
        href={`/meetings/${meetingId}`}
        className="inline-block text-sm font-medium text-green-700 hover:underline"
      >
        Return to meeting →
      </Link>
    </div>
  );
}
