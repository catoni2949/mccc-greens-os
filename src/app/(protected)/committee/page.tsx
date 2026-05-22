"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { CommitteeMember } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/lib/status-badge";
import { PageHeader } from "@/components/page-header";
import { CommitteeMemberForm } from "@/components/committee/committee-member-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

export default function CommitteePage() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommitteeMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("committee_members")
      .select("*")
      .order("status")
      .order("full_name");
    if (toastSupabaseError(error)) {
      setLoading(false);
      return;
    }
    setMembers((data ?? []) as CommitteeMember[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (!searchMatchesTitle(m.full_name, search)) return false;
      if (!matchesStatusFilter(m.status, statusFilter)) return false;
      return true;
    });
  }, [members, search, statusFilter]);

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(members.map((m) => m.status)))],
    [members]
  );

  return (
    <div>
      <PageHeader title="Committee" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="bg-green-700 text-white hover:bg-green-800 sm:order-2"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Member
        </Button>
        <Input
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              statusFilter === s
                ? "bg-green-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate-500 shadow-sm">
          <Users className="size-10 text-slate-300" />
          <p>No committee members found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setEditing(m);
                setDialogOpen(true);
              }}
              className="rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{m.full_name}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.role ?? "—"}</p>
              <div className="mt-3">
                <StatusBadge status={m.status} />
              </div>
              {m.email && (
                <p className="mt-2 truncate text-xs text-slate-500">{m.email}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Since {formatDate(m.start_date)}
              </p>
            </button>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Member" : "Add Committee Member"}
            </DialogTitle>
          </DialogHeader>
          <CommitteeMemberForm
            member={editing}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              load();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
