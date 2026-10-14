import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Assignment, TutorApplication, TutorProfile, User } from "@/models";
import { ApplicationActions } from "./tutor-actions";

export const metadata = { title: "Tutors" };

export default async function TutorsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab = "roster" } = await searchParams;
  await connectDB();
  const [tutors, profiles, applications, loads] = await Promise.all([
    User.find({ role: "tutor" }).sort({ name: 1 }).lean(),
    TutorProfile.find().lean(),
    TutorApplication.find().sort({ createdAt: -1 }).lean(),
    Assignment.aggregate<{ _id: string; n: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$tutor", n: { $sum: 1 } } },
    ]),
  ]);
  const profileByUser = new Map(profiles.map((p) => [p.user.toString(), p]));
  const load = new Map(loads.map((l) => [l._id.toString(), l.n]));
  const pending = applications.filter((a) => a.status === "pending");

  return (
    <>
      <PageHeader title="Tutors" description="Roster, applications, and who is on the public site." />
      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="roster">Roster ({tutors.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications ({pending.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="roster" className="mt-4">
          {tutors.length ? (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tutor</th>
                    <th className="px-4 py-2 font-medium">Subjects</th>
                    <th className="px-4 py-2 font-medium">Load</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tutors.map((t) => {
                    const p = profileByUser.get(t._id.toString());
                    return (
                      <tr key={t._id.toString()} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Link href={`/admin/tutors/${t._id}`} className="font-medium hover:underline">
                            {t.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-3">{p?.subjects.slice(0, 3).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          {load.get(t._id.toString()) ?? 0}/{p?.maxStudents ?? 4}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={t.status === "disabled" ? "inactive" : t.onboarding?.status === "complete" ? "active" : t.status} />
                        </td>
                        <td className="px-4 py-3 text-xs">{p?.showOnSite ? "Shown" : "Hidden"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No tutors yet" description="Approve an application to invite the first one." />
          )}
        </TabsContent>
        <TabsContent value="applications" className="mt-4 space-y-3">
          {applications.length ? (
            applications.map((a) => (
              <div key={a._id.toString()} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.email} · {a.school} {a.gradYear}
                    </p>
                    <p className="mt-1 text-sm">{a.subjects.join(", ")}</p>
                    {a.experience ? <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.experience}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                {a.status === "pending" ? <div className="mt-3"><ApplicationActions id={a._id.toString()} /></div> : null}
              </div>
            ))
          ) : (
            <EmptyState title="No applications" description="Public applications from /apply land here." />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
