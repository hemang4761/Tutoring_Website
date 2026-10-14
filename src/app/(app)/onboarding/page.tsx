import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth.config";
import { getCurrentUser, isOnboarded } from "@/lib/session";
import { getTemplate } from "@/actions/onboarding";
import { OnboardingChecklist } from "./checklist";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (isOnboarded(user)) redirect(homeFor(user.role));
  const template = await getTemplate(user.role === "tutor" ? "tutor" : "family");
  const done = new Set((user.onboarding?.responses ?? []).map((r) => r.stepKey));
  return (
    <OnboardingChecklist
      intro={template.intro ?? ""}
      steps={template.steps.map((s) => ({
        key: s.key,
        type: s.type,
        title: s.title,
        description: s.description ?? "",
        body: s.body ?? "",
        options: s.options ?? [],
        required: s.required,
        done: done.has(s.key),
        value: user.onboarding?.responses?.find((r) => r.stepKey === s.key)?.value,
      }))}
      name={user.name}
      phone={user.phone ?? ""}
      role={user.role}
    />
  );
}
