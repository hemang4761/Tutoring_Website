import { PageHeader } from "@/components/page-header";
import { NewRequestForm, RequestInbox } from "@/components/requests/request-inbox";
import { requireUser } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { AdminRequest } from "@/models";

export const metadata = { title: "Requests" };

export default async function PortalRequestsPage() {
  const user = await requireUser(["family"]);
  await connectDB();
  const requests = await AdminRequest.find({ requester: user._id }).sort({ createdAt: -1 }).populate("requester", "name role").populate("replies.author", "name").lean();
  return (
    <>
      <PageHeader title="Requests" description="Need to reschedule or change something? Send a note to the BCLearns team." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <RequestInbox role="family" requests={plain(requests) as never} />
        <NewRequestForm types={["schedule_change", "need_help", "other"]} />
      </div>
    </>
  );
}
