"use client";

import { useTransition } from "react";
import { updateMyAccount } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/panel";
import { toastResult } from "@/lib/toast";

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <Panel title="Your account">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const next = String(fd.get("newPassword") || "");
          if (next && next !== String(fd.get("confirm") || "")) {
            toastResult({ ok: false, error: "The new passwords don't match." });
            return;
          }
          start(async () => {
            const res = await updateMyAccount({
              name: String(fd.get("name") || ""),
              email: String(fd.get("email") || ""),
              currentPassword: String(fd.get("currentPassword") || ""),
              newPassword: next,
            });
            toastResult(res);
            if (res.ok) {
              (form.elements.namedItem("currentPassword") as HTMLInputElement).value = "";
              (form.elements.namedItem("newPassword") as HTMLInputElement).value = "";
              (form.elements.namedItem("confirm") as HTMLInputElement).value = "";
            }
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="acct-name">Name</Label>
          <Input id="acct-name" name="name" defaultValue={name} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acct-email">Email (your login)</Label>
          <Input id="acct-email" name="email" type="email" defaultValue={email} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acct-new">New password</Label>
          <Input id="acct-new" name="newPassword" type="password" autoComplete="new-password" placeholder="Leave blank to keep it" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acct-confirm">Confirm new password</Label>
          <Input id="acct-confirm" name="confirm" type="password" autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acct-current">Current password</Label>
          <Input id="acct-current" name="currentPassword" type="password" autoComplete="current-password" required />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            Save account
          </Button>
        </div>
      </form>
    </Panel>
  );
}
