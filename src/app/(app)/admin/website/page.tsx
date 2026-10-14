import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/session";
import { getPublicTeam } from "@/lib/queries/team";
import { getSavedSiteContent } from "@/lib/queries/site";
import { defaultSiteContent, withTextFallbacks } from "@/lib/site";
import { WebsiteForm } from "./website-form";

export const metadata = { title: "Website" };

export default async function WebsitePage() {
  await requireAdmin();
  const [saved, live] = await Promise.all([getSavedSiteContent(), getPublicTeam()]);
  const base = saved ? withTextFallbacks(saved) : defaultSiteContent();
  const tutors =
    base.customTutors && base.tutors.length
      ? base.tutors
      : live.map((t) => ({ name: t.name, role: t.role, bio: t.bio, photo: t.photo ?? "" }));

  return (
    <>
      <PageHeader
        title="Website"
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="text-sm font-medium underline-offset-4 hover:underline">
            View homepage
          </a>
        }
      />
      <WebsiteForm initial={{ ...base, tutors }} />
    </>
  );
}
