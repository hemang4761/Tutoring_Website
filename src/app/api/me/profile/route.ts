import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TutorProfile, User } from "@/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user.id).lean();
  const profile = await TutorProfile.findOne({ user: session.user.id }).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    userId: user._id.toString(),
    name: user.name,
    phone: user.phone ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    subjects: profile?.subjects ?? [],
  });
}
