import { toast } from "sonner";

export function toastSupabaseError(
  error: { message: string } | null | undefined
): boolean {
  if (error) {
    toast.error(error.message);
    return true;
  }
  return false;
}
