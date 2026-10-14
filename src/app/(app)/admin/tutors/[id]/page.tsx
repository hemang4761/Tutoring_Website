import { redirect } from "next/navigation";

export default async function TutorRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/tutors?tutor=${id}`);
}
