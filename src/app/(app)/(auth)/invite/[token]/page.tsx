import { TokenPage } from "../../token-page";

export const metadata = { title: "Accept invite" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TokenPage token={token} type="invite" />;
}
