"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ChairTransitionForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    outgoing_chair: "",
    incoming_chair: "",
    effective_date: "",
    handoff_summary: "",
    handoff_notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.incoming_chair.trim()) {
      toast.error("Incoming chair is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("chair_transitions").insert({
      outgoing_chair: form.outgoing_chair.trim() || null,
      incoming_chair: form.incoming_chair.trim(),
      effective_date: form.effective_date || null,
      handoff_summary: form.handoff_summary.trim() || null,
      handoff_notes: form.handoff_notes.trim() || null,
    });
    if (toastSupabaseError(error)) {
      setSaving(false);
      return;
    }
    toast.success("Transition recorded");
    router.refresh();
    setForm({
      outgoing_chair: "",
      incoming_chair: "",
      effective_date: "",
      handoff_summary: "",
      handoff_notes: "",
    });
    setSaving(false);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div>
        <Label htmlFor="outgoing">Outgoing chair</Label>
        <Input
          id="outgoing"
          value={form.outgoing_chair}
          onChange={(e) =>
            setForm((f) => ({ ...f, outgoing_chair: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="incoming">Incoming chair</Label>
        <Input
          id="incoming"
          required
          value={form.incoming_chair}
          onChange={(e) =>
            setForm((f) => ({ ...f, incoming_chair: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="effective">Effective date</Label>
        <Input
          id="effective"
          type="date"
          value={form.effective_date}
          onChange={(e) =>
            setForm((f) => ({ ...f, effective_date: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="summary">Handoff summary</Label>
        <Input
          id="summary"
          value={form.handoff_summary}
          onChange={(e) =>
            setForm((f) => ({ ...f, handoff_summary: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          value={form.handoff_notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, handoff_notes: e.target.value }))
          }
        />
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="bg-green-700 text-white hover:bg-green-800"
      >
        {saving ? "Saving…" : "Save transition"}
      </Button>
    </form>
  );
}
