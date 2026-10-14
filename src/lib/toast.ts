import { toast } from "sonner";
import type { ActionResult } from "@/lib/session";

export function toastResult<T>(res: ActionResult<T>, fallback = "Saved"): void {
  if (res.ok) {
    if (res.message || fallback) toast.success(res.message ?? fallback);
  } else {
    toast.error(res.error);
  }
}
