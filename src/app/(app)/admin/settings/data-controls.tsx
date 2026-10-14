"use client";

import { useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { purgeDemoData } from "@/actions/data";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { toastResult } from "@/lib/toast";

export function DataControls({ demo }: { demo: { clients: number; sessions: number } }) {
  const [pending, start] = useTransition();
  return (
    <Panel title="Data">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            {demo.clients
              ? `${demo.clients} made-up demo families and ${demo.sessions} of their sessions are in the system. Real tutors and anything you added aren't touched.`
              : "No demo data left. Everything here is real."}
          </p>
          {demo.clients ? (
            <Button
              variant="outline"
              className="text-rose-600"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete all demo families and their sessions? This can't be undone.")) return;
                start(async () => toastResult(await purgeDemoData()));
              }}
            >
              <Trash2 /> Delete demo data
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-muted-foreground">Clients, tutors, matches and sessions can each be deleted from their panel. Select several on the Clients page to change or delete them together.</p>
          <Button variant="ghost" asChild>
            <a href="/api/leads/export">
              <Download /> Export clients
            </a>
          </Button>
        </div>
      </div>
    </Panel>
  );
}
