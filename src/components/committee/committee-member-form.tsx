"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { CommitteeMember } from "@/lib/database.types";
import { COMMITTEE_MEMBER_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CommitteeMemberForm({
  member,
  onSuccess,
}: {
  member?: CommitteeMember | null;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: member?.full_name ?? "",
    role: member?.role ?? "",
    status: member?.status ?? "Active",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    start_date: member?.start_date ?? "",
    end_date: member?.end_date ?? "",
    notes: member?.notes ?? "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name,
        role: member.role ?? "",
        status: member.status,
        email: member.email ?? "",
        phone: member.phone ?? "",
        start_date: member.start_date ?? "",
        end_date: member.end_date ?? "",
        notes: member.notes ?? "",
      });
    }
  }, [member]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      full_name: form.full_name.trim(),
      role: form.role || null,
      status: form.status,
      email: form.email || null,
      phone: form.phone || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };

    if (member?.id) {
      const { error } = await supabase
        .from("committee_members")
        .update(payload)
        .eq("id", member.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Member updated");
    } else {
      const { error } = await supabase.from("committee_members").insert(payload);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Member added");
    }
    onSuccess();
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name *</Label>
        <Input
          id="name"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v ? String(v) : f.status }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMITTEE_MEMBER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start">Start date</Label>
          <Input
            id="start"
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End date</Label>
          <Input
            id="end"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
        />
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-green-700 text-white hover:bg-green-800"
      >
        {saving ? "Saving…" : member?.id ? "Save" : "Add member"}
      </Button>
    </form>
  );
}
