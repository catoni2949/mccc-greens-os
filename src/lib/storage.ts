import { MEETING_FILES_BUCKET } from "@/lib/constants";

export function meetingFileStoragePath(
  meetingId: string,
  fileName: string
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `meetings/${meetingId}/${crypto.randomUUID()}-${safe}`;
}

export function publicStorageUrl(
  supabaseUrl: string,
  bucketPath: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEETING_FILES_BUCKET}/${bucketPath}`;
}
