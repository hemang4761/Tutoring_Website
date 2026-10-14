"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { reviewApplication, resendInvite, setTutorStatus, updateTutorProfile } from "@/actions/tutors";
import { toastResult } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ApplicationActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => start(async () => toastResult(await reviewApplication(id, "approved")))}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Approve & invite
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => toastResult(await reviewApplication(id, "rejected")))}>
        Decline
      </Button>
    </div>
  );
}

export function TutorAdminControls({
  userId,
  status,
  showOnSite,
  invited,
}: {
  userId: string;
  status: string;
  showOnSite: boolean;
  invited: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="site">Show on public site</Label>
        <Switch
          id="site"
          checked={showOnSite}
          disabled={pending}
          onCheckedChange={(v) => start(async () => toastResult(await updateTutorProfile(userId, { showOnSite: v })))}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => toastResult(await setTutorStatus(userId, status === "disabled" ? "active" : "inactive")))}
        >
          {status === "disabled" ? "Reactivate" : "Deactivate"}
        </Button>
        {invited ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => toastResult(await resendInvite(userId)))}>
            Resend invite
          </Button>
        ) : null}
      </div>
    </div>
  );
}
