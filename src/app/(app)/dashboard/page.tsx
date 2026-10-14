import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth.config";
import { getCurrentUser, isOnboarded } from "@/lib/session";

// post-login landing that routes each role to its home
export default async function DashboardRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isOnboarded(user)) redirect("/onboarding");
  redirect(homeFor(user.role));
}
