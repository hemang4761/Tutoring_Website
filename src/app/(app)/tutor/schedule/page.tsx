import { Panel } from "@/components/panel";
import { MasterSchedule } from "@/components/schedule/master-schedule";
import { AvailabilityEditor } from "@/components/schedule/availability-editor";
import { requireUser } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { getScheduleData } from "@/lib/queries/schedule";
import { TutorProfile } from "@/models";

export const metadata = { title: "Schedule" };

export default async function TutorSchedulePage() {
  const user = await requireUser(["tutor"]);
  await connectDB();
  const [data, profile] = await Promise.all([getScheduleData(user._id), TutorProfile.findOne({ user: user._id }).lean()]);
  return (
    <div className="space-y-8">
      <MasterSchedule mode="tutor" {...data} />
      <Panel title="When you're usually free">
        <AvailabilityEditor slots={plain(profile?.availability ?? [])} />
      </Panel>
    </div>
  );
}
