import { BrandLogo } from "@/components/brand";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-navy px-6 py-4">
        <BrandLogo light href="#" />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
    </div>
  );
}
