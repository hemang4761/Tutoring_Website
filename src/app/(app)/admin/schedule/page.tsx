import { MasterSchedule } from "@/components/schedule/master-schedule";
import { requireAdmin } from "@/lib/session";
import { getScheduleData } from "@/lib/queries/schedule";

export const metadata = { title: "Schedule" };

export default async function AdminSchedulePage() {
  await requireAdmin();
  const data = await getScheduleData();
  return <MasterSchedule mode="admin" {...data} />;
}
