import { LoginForm } from "../auth-forms";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Log in</h2>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
