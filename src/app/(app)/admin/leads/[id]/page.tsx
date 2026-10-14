import { redirect } from "next/navigation";

// old links from emails open the client panel instead
export default async function LeadRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/clients?client=${id}`);
}
