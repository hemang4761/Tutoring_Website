import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RequestTypeBadge, StatusPill } from "@/components/status-badge";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { AdminRequest } from "@/models";
import { RequestInbox } from "@/components/requests/request-inbox";

export const metadata = { title: "Requests" };

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  await requireAdmin();
  const { open } = await searchParams;
  await connectDB();
  const requests = await AdminRequest.find()
    .sort({ status: 1, createdAt: -1 })
    .populate("requester", "name email role")
    .populate("lead", "parent")
    .populate("replies.author", "name")
    .lean();
  return (
    <>
      <PageHeader title="Requests" description="Tutors and families asking for help from admins." />
      {requests.length ? (
        <RequestInbox
          role="admin"
          initialId={open}
          requests={plain(requests) as never}
        />
      ) : (
        <EmptyState title="Inbox zero" description="New tutor and family requests show up here." />
      )}
    </>
  );
}
