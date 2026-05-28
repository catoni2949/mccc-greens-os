"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TimelineFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function apply(form: FormData | HTMLFormElement) {
    const fd = form instanceof FormData ? form : new FormData(form);
    const q = new URLSearchParams();
    const hole = String(fd.get("hole") ?? "").trim();
    const category = String(fd.get("category") ?? "all");
    const owner = String(fd.get("owner") ?? "").trim();
    const theme = String(fd.get("theme") ?? "all");
    const board = fd.get("board") ? "1" : "";
    if (hole) q.set("hole", hole);
    if (category && category !== "all") q.set("category", category);
    if (owner) q.set("owner", owner);
    if (theme && theme !== "all") q.set("theme", theme);
    if (board) q.set("board", board);
    router.push(`/timeline?${q.toString()}`);
  }

  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
    >
      <div>
        <Label htmlFor="hole">Hole / area</Label>
        <Input
          id="hole"
          name="hole"
          defaultValue={params.get("hole") ?? ""}
          placeholder="e.g. 8"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue={params.get("category") ?? "all"}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="meeting">Meetings</option>
          <option value="decision">Decisions</option>
          <option value="action">Actions</option>
          <option value="strategic">Strategic</option>
          <option value="tree">Trees</option>
          <option value="capital">Capital</option>
          <option value="communication">Communications</option>
        </select>
      </div>
      <div>
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          name="theme"
          defaultValue={params.get("theme") ?? "all"}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="strategic">Strategic plan</option>
          <option value="tree">Tree management</option>
          <option value="capital">Capital</option>
        </select>
      </div>
      <div>
        <Label htmlFor="owner">Owner</Label>
        <Input
          id="owner"
          name="owner"
          defaultValue={params.get("owner") ?? ""}
          placeholder="Ryan"
        />
      </div>
      <div className="flex flex-col justify-end gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="board"
            defaultChecked={params.get("board") === "1"}
          />
          Board relevant only
        </label>
        <Button type="submit" className="bg-green-700 text-white hover:bg-green-800">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
