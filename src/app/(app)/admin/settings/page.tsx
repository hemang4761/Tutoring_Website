import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getTemplate } from "@/actions/onboarding";
import { User } from "@/models";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  await connectDB();
  const [settings, tutorTpl, familyTpl, admins] = await Promise.all([
    getSettings(),
    getTemplate("tutor"),
    getTemplate("family"),
    User.find({ role: "admin" }).select("name email status").lean(),
  ]);
  return (
    <>
      <PageHeader title="Settings" description="Rates, notifications, onboarding checklists, and admin team." />
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
