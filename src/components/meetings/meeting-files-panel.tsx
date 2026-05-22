"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import { MEETING_FILES_BUCKET } from "@/lib/constants";
import type { FileRecord } from "@/lib/database.types";
import {
  meetingFileStoragePath,
  publicStorageUrl,
} from "@/lib/storage";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";

export function MeetingFilesPanel({
  meetingId,
  initialFiles,
}: {
  meetingId: string;
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const bucketPath = meetingFileStoragePath(meetingId, file.name);
    const { error: uploadError } = await supabase.storage
      .from(MEETING_FILES_BUCKET)
      .upload(bucketPath, file, { upsert: false });

    if (toastSupabaseError(uploadError)) {
      setUploading(false);
      e.target.value = "";
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const fileUrl = publicStorageUrl(supabaseUrl, bucketPath);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: dbError } = await supabase
      .from("files")
      .insert({
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type || null,
        bucket_path: bucketPath,
        linked_type: "meeting",
        linked_id: meetingId,
        uploaded_by: user?.id ?? null,
      })
      .select("*")
      .single();

    if (toastSupabaseError(dbError)) {
      setUploading(false);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [data as FileRecord, ...prev]);
    toast.success("File uploaded");
    setUploading(false);
    e.target.value = "";
  }

  async function removeFile(file: FileRecord) {
    const supabase = createClient();
    if (file.bucket_path) {
      await supabase.storage
        .from(MEETING_FILES_BUCKET)
        .remove([file.bucket_path]);
    }
    const { error } = await supabase.from("files").delete().eq("id", file.id);
    if (toastSupabaseError(error)) return;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    toast.success("File removed");
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 space-y-2">
        <Label htmlFor="meeting-file-upload">Upload file</Label>
        <Input
          id="meeting-file-upload"
          type="file"
          disabled={uploading}
          onChange={onUpload}
          className="bg-white"
        />
        {uploading && (
          <p className="text-sm text-slate-500">Uploading…</p>
        )}
      </div>
      {files.length === 0 ? (
        <p className="py-8 text-center text-slate-500">No files attached yet</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-700 hover:underline"
                >
                  {f.file_name}
                </a>
                <p className="mt-1 text-xs text-slate-500">
                  {f.file_type || "File"} · Uploaded {formatDate(f.created_at.slice(0, 10))}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Download
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(f)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
