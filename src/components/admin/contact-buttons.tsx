"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Phone } from "lucide-react";
import { logContact, removeContact } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContactChannel } from "@/lib/constants";
import { fillTemplate, useAdmin } from "./admin-context";
import type { ClientRef } from "@/lib/queries/dashboard";

const digits = (phone: string) => phone.replace(/[^\d+]/g, "");

// opens the admin's own phone/mail app and records the touchpoint, with an undo
function useLog(client: ClientRef) {
  const [pending, start] = useTransition();
  const log = (channel: ContactChannel) =>
    start(async () => {
      const res = await logContact(client.id, channel);
      if (!res.ok) return void toast.error(res.error);
      const entryId = res.data;
      toast.success(`Logged for ${client.name}`, {
        action: entryId ? { label: "Undo", onClick: () => void removeContact(client.id, entryId) } : undefined,
      });
    });
  return { log, pending };
}

export function ContactButtons({ client, size = "sm", tutor }: { client: ClientRef; size?: "sm" | "xs"; tutor?: string }) {
  const { templates, adminName } = useAdmin();
  const { log, pending } = useLog(client);
  const vars = { parent: client.name, student: client.student, tutor, admin: adminName };
  const btn = size === "xs" ? "h-7 px-2 text-xs" : "h-8 px-2.5";

  const openSms = (body = "") => {
    const href = `sms:${digits(client.phone)}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
    window.location.href = href;
    log("text");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {client.phone ? (
        templates.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className={btn} disabled={pending}>
                <MessageSquare /> Text
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{client.phone}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => openSms()}>Blank message</DropdownMenuItem>
              {templates.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => openSms(fillTemplate(t.body, vars))}>
                  {t.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {templates.map((t) => (
                <DropdownMenuItem
                  key={`copy-${t.id}`}
                  onSelect={() => {
                    void navigator.clipboard.writeText(fillTemplate(t.body, vars));
                    toast.success("Copied. Paste it into your texts.");
                  }}
                >
                  <Copy /> Copy “{t.label}”
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(client.phone);
                  toast.success("Number copied");
                }}
              >
                <Copy /> Copy number
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => log("text")}>Just log a text</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" variant="outline" className={btn} disabled={pending} onClick={() => openSms()}>
            <MessageSquare /> Text
          </Button>
        )
      ) : null}
      {client.phone ? (
        <Button size="sm" variant="ghost" className={btn} disabled={pending} asChild>
          <a href={`tel:${digits(client.phone)}`} onClick={() => log("call")}>
            <Phone /> Call
          </a>
        </Button>
      ) : null}
      {client.email ? (
        <Button size="sm" variant="ghost" className={btn} disabled={pending} asChild>
          <a href={`mailto:${client.email}`} onClick={() => log("email")}>
            <Mail /> Email
          </a>
        </Button>
      ) : null}
    </div>
  );
}
