"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ResultGroup = {
  title: string;
  items: { label: string; href: string; sub?: string }[];
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ResultGroup[]>([]);

  async function runSearch() {
    const term = q.trim();
    if (term.length < 2) return;
    setLoading(true);
    const supabase = createClient();
    const pattern = `%${term}%`;

    const [
      meetingsT,
      meetingsS,
      meetingsD,
      actionsT,
      actionsN,
      projectsT,
      treesT,
      capitalT,
      feedbackT,
      committee,
    ] = await Promise.all([
      supabase.from("meetings").select("id, title").ilike("title", pattern).limit(15),
      supabase.from("meetings").select("id, title").ilike("summary", pattern).limit(15),
      supabase.from("meetings").select("id, title").ilike("decisions", pattern).limit(15),
      supabase.from("action_items").select("id, title").ilike("title", pattern).limit(15),
      supabase.from("action_items").select("id, title").ilike("notes", pattern).limit(15),
      supabase.from("strategic_projects").select("id, title").ilike("title", pattern).limit(15),
      supabase.from("tree_items").select("id, title").ilike("title", pattern).limit(15),
      supabase.from("capital_items").select("id, title").ilike("title", pattern).limit(15),
      supabase.from("member_feedback").select("id, topic").ilike("topic", pattern).limit(15),
      supabase.from("committee_members").select("id, full_name, role").ilike("full_name", pattern).limit(15),
    ]);

    const meetingMap = new Map<string, { id: string; title: string }>();
    for (const res of [meetingsT, meetingsS, meetingsD]) {
      for (const row of res.data ?? []) {
        meetingMap.set(row.id as string, {
          id: row.id as string,
          title: row.title as string,
        });
      }
    }
    const meetings = { data: Array.from(meetingMap.values()) };

    const actionMap = new Map<string, { id: string; title: string }>();
    for (const res of [actionsT, actionsN]) {
      for (const row of res.data ?? []) {
        actionMap.set(row.id as string, {
          id: row.id as string,
          title: row.title as string,
        });
      }
    }
    const actions = { data: Array.from(actionMap.values()) };
    const projects = projectsT;
    const trees = treesT;
    const capital = capitalT;
    const feedback = feedbackT;


    const next: ResultGroup[] = [
      {
        title: "Meetings",
        items: (meetings.data ?? []).map((m) => ({
          label: m.title as string,
          href: `/meetings/${m.id}`,
        })),
      },
      {
        title: "Actions",
        items: (actions.data ?? []).map((a) => ({
          label: a.title as string,
          href: "/actions",
          sub: "Open Actions to edit",
        })),
      },
      {
        title: "Strategic Projects",
        items: (projects.data ?? []).map((p) => ({
          label: p.title as string,
          href: `/strategic-plan/${p.id}`,
        })),
      },
      {
        title: "Trees",
        items: (trees.data ?? []).map((t) => ({
          label: t.title as string,
          href: `/trees/${t.id}`,
        })),
      },
      {
        title: "Capital",
        items: (capital.data ?? []).map((c) => ({
          label: c.title as string,
          href: `/capital/${c.id}`,
        })),
      },
      {
        title: "Feedback",
        items: (feedback.data ?? []).map((f) => ({
          label: f.topic as string,
          href: "/communications",
        })),
      },
      {
        title: "Committee",
        items: (committee.data ?? []).map((c) => ({
          label: c.full_name as string,
          href: "/committee",
          sub: c.role as string,
        })),
      },
    ].filter((g) => g.items.length > 0);

    setGroups(next);
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="Search" />
      <p className="-mt-4 mb-4 text-sm text-slate-500">
        Search meetings, actions, projects, trees, capital, feedback, and committee.
      </p>
      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          className="max-w-lg bg-white"
        />
        <Button
          type="button"
          className="bg-green-700 text-white hover:bg-green-800"
          disabled={loading}
          onClick={runSearch}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>
      {groups.length === 0 && !loading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
          <Search className="size-10 text-slate-300" />
          <p>Enter at least 2 characters to search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section
              key={g.title}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">
                {g.title}
              </h2>
              <ul className="divide-y divide-slate-100">
                {g.items.map((item, i) => (
                  <li key={i} className="py-2">
                    <Link
                      href={item.href}
                      className="font-medium text-green-700 hover:underline"
                    >
                      {item.label}
                    </Link>
                    {item.sub && (
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
