import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getTemplate } from "@/actions/onboarding";
import { User } from "@/models";
import Link from "next/link";
import { DEFAULT_TEMPLATES } from "@/lib/constants";
import { SettingsForms } from "./settings-forms";
import { TemplatesEditor } from "./templates-editor";
import { DataControls } from "./data-controls";
import { AccountForm } from "@/components/account-form";
import { demoDataCounts } from "@/actions/data";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  await connectDB();
  const [settings, tutorTpl, familyTpl, admins, demo] = await Promise.all([
    getSettings(),
    getTemplate("tutor"),
    getTemplate("family"),
    User.find({ role: "admin" }).select("name email status").lean(),
    demoDataCounts(),
  ]);
  return (
    <>
      <PageHeader title="Settings" />
      <div className="mb-6 space-y-6">
        <AccountForm name={me.name} email={me.email} />
        <TemplatesEditor
          initial={
            settings.templates?.length
              ? settings.templates.map((t) => ({ label: t.label ?? "", body: t.body ?? "" }))
              : DEFAULT_TEMPLATES.map((t) => ({ ...t }))
          }
        />
        <DataControls demo={demo} />
        <Panel title="Website" actions={<Link href="/admin/website" className="text-sm font-medium hover:underline">Edit website →</Link>}>
          <p className="text-sm text-muted-foreground">Homepage text, pricing, courses and the tutors shown on the site.</p>
        </Panel>
      </div>
      <SettingsForms
        settings={plain({
          orgName: settings.orgName,
          replyTo: settings.replyTo,
          notifyTutorsOnNewLead: settings.notifyTutorsOnNewLead,
          extraNotifyEmails: (settings.extraNotifyEmails ?? []).join(", "),
          remindersEnabled: settings.remindersEnabled,
          digestEnabled: settings.digestEnabled,
          rateTiers: settings.rateTiers.map((r) => ({ key: r.key ?? "", label: r.label ?? "", rate: r.rate ?? 0 })),
        })}
        tutorSteps={tutorTpl.steps.map((s) => ({
          key: s.key,
          type: s.type,
          title: s.title,
          description: s.description ?? undefined,
          body: s.body ?? undefined,
          options: s.options ?? [],
          required: s.required,
        }))}
        familySteps={familyTpl.steps.map((s) => ({
          key: s.key,
          type: s.type,
          title: s.title,
          description: s.description ?? undefined,
          body: s.body ?? undefined,
          options: s.options ?? [],
          required: s.required,
        }))}
        tutorIntro={tutorTpl.intro ?? ""}
        familyIntro={familyTpl.intro ?? ""}
        admins={plain(admins).map((a) => ({ name: a.name, email: a.email, status: a.status }))}
      />
    </>
  );
}
