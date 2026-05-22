"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ActionItem, Meeting, StrategicProject } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function MeetingFollowUpPacket({
  meeting,
  actionItems,
  linkedProjects,
}: {
  meeting: Meeting;
  actionItems: ActionItem[];
  linkedProjects: StrategicProject[];
}) {
  const [copied, setCopied] = useState(false);

  const packet = useMemo(() => {
    const open = actionItems.filter(
      (a) => a.status?.toLowerCase() !== "completed"
    );
    const boardActions = open.filter((a) => a.board_relevance);
    const boardProjects = linkedProjects.filter((p) => p.board_status?.trim());

    return `# Follow-up Packet — ${meeting.title}
Date: ${formatDate(meeting.meeting_date)}
Type: ${meeting.meeting_type}
Status: ${meeting.status}

## Meeting recap
${meeting.summary?.trim() || "(No summary yet)"}

## Decisions
${meeting.decisions?.trim() || "(No decisions recorded)"}

## Open action items
${
  open.length
    ? open
        .map(
          (a) =>
            `- ${a.title} | ${a.owner ?? "Unassigned"} | ${a.priority} | Due ${formatDate(a.due_date)}`
        )
        .join("\n")
    : "(None)"
}

## Board-relevant items
${
  boardActions.length
    ? boardActions.map((a) => `- [Action] ${a.title}`).join("\n")
    : "(No flagged actions)"
}
${
  boardProjects.length
    ? boardProjects.map((p) => `- [Project] ${p.title}`).join("\n")
    : ""
}

## Linked strategic projects
${
  linkedProjects.length
    ? linkedProjects.map((p) => `- ${p.title} (${p.status})`).join("\n")
    : "(None)"
}

## Member communication notes
(Placeholder — pull from member_feedback linked to this meeting in a future release.)

---
Generated locally from MCCC Greens OS records.
`;
  }, [meeting, actionItems, linkedProjects]);

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(packet);
      setCopied(true);
      toast.success("Packet copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
        {packet}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={copyPacket}
        >
          {copied ? "Copied" : "Copy packet text"}
        </Button>
        <Button type="button" variant="outline" disabled title="Coming later">
          Download / export (soon)
        </Button>
      </div>
    </div>
  );
}
