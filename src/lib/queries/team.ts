import "server-only";
import { connectDB } from "@/lib/db";
import { TutorProfile, User } from "@/models";

export type PublicTutor = { name: string; role: string; bio: string; photo?: string };

const FALLBACK: PublicTutor[] = [
  { name: "Hemang Mittal", photo: "/media/hemang.jpeg", role: "Math, Engineering & Humanities Tutor | College Essay Consultant", bio: "Has mastered college-level coursework across engineering, math beyond calculus, and computer science. Experienced in essay consulting, with deep knowledge of admissions and debate experience." },
  { name: "Shlok Shah", role: "Math & Science Tutor | Expert Test Prep Mentor", bio: "Excels at making challenging math and science concepts intuitive and approachable. Has mastered coursework through multivariable calculus and college-level chemistry and physics." },
  { name: "James Doherty", role: "Math, Physics, Music & Computer Science Tutor | Expert Test Prep Mentor", bio: "Brings a versatile skill set across computer science, math, physics, test prep, and music theory. Experienced in web development, databases, and programming through college-level coursework." },
  { name: "Mohammed Zariwala", photo: "/media/mohammed.jpg", role: "Competitive Math & Science Tutor | Expert Test Prep Mentor", bio: "Dedicated to challenging subjects dealing with high level mathematics. Has spent years perfecting coursework through multivariable calculus and college-level chemistry and physics." },
  { name: "Mohit Kalia", photo: "/media/mohit.jpeg", role: "Math, Engineering & Science Tutor | Expert Test Prep Mentor", bio: "An experienced tutor with a track record of improving confidence in subjects across biology, chemistry, and psychology, with further applications in engineering." },
  { name: "Michael Hernandez", photo: "/media/michaelmit.webp", role: "Expert Engineering & Math Tutor | Expert Test Prep Mentor", bio: "A knowledgeable tutor committed to the craft of engineering, ready to help you with any project or goal to become a future engineer. Also ready to tutor anything across math and physics." },
];

// tutors flagged showOnSite drive the public team section; falls back to the static list
export async function getPublicTeam(): Promise<PublicTutor[]> {
  if (!process.env.MONGODB_URI) return FALLBACK;
  try {
    await connectDB();
    const profiles = await TutorProfile.find({ showOnSite: true, status: "active" })
      .sort({ siteOrder: 1, createdAt: 1 })
      .populate<{ user: { name: string } }>({ path: "user", model: User, select: "name" })
      .lean();
    const team = profiles
      .filter((p) => p.user)
      .map((p) => ({ name: p.user.name, role: p.headline, bio: p.bio, photo: p.photoUrl ?? undefined }));
    return team.length ? team : FALLBACK;
  } catch (err) {
    console.error("[team] falling back to static team", err);
    return FALLBACK;
  }
}
