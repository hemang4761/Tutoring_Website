import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, plain } from "@/lib/db";
import { EmailLog } from "@/models";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(40).lean();
  return NextResponse.json({ logs: plain(logs) });
}
