/* usage: npm run seed            -> first admin, templates, general channel, settings
          npm run seed -- --demo  -> also sample tutors, leads, assignments, sessions */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { addDays, addMinutes, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import {
  Assignment,
  Channel,
  ClaimRequest,
  Lead,
  Message,
  OnboardingTemplate,
  Session,
  Settings,
  TutorProfile,
  User,
  AdminRequest,
  ActivityLog,
} from "../src/models";
import { DEFAULT_FAMILY_TEMPLATE, DEFAULT_TUTOR_TEMPLATE } from "../src/lib/onboarding-defaults";
import { LEAD_SOURCES, RATE_TIERS, type LeadStatus } from "../src/lib/constants";

const demo = process.argv.includes("--demo");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("[seed] connected");

  await Settings.updateOne(
    { key: "global" },
    { $setOnInsert: { key: "global", rateTiers: RATE_TIERS.map((r) => ({ ...r })) } },
    { upsert: true },
  );

  for (const [audience, tpl] of [
    ["tutor", DEFAULT_TUTOR_TEMPLATE],
    ["family", DEFAULT_FAMILY_TEMPLATE],
  ] as const) {
    await OnboardingTemplate.updateOne({ audience }, { $setOnInsert: { audience, ...tpl } }, { upsert: true });
  }
  console.log("[seed] onboarding templates ready");

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@bclearns.com").toLowerCase();
  let admin = await User.findOne({ email });
  if (!admin) {
    const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || "BCLearns Admin",
      email,
      role: "admin",
      status: "active",
      passwordHash: await bcrypt.hash(password, 11),
      onboarding: { status: "complete", completedAt: new Date() },
    });
    console.log(`[seed] created admin ${email} with password: ${password}`);
  } else {
    console.log(`[seed] admin ${email} already exists`);
  }

  let general = await Channel.findOne({ kind: "general" });
  if (!general) {
    general = await Channel.create({
      kind: "general",
      name: "general",
      topic: "Team-wide announcements and chatter",
      createdBy: admin._id,
    });
    await Message.create({
      channel: general._id,
      kind: "system",
      body: "Welcome to the BCLearns team chat. New leads get their own thread automatically.",
    });
    console.log("[seed] created #general");
  }

  if (demo) await seedDemo(admin._id, general._id);

  await mongoose.disconnect();
  console.log("[seed] done");
}

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];
const rand = (n: number) => Math.floor(Math.random() * n);

async function seedDemo(adminId: mongoose.Types.ObjectId, generalId: mongoose.Types.ObjectId) {
  if (await Lead.exists({ tags: "demo" })) {
    console.log("[seed] demo data already present, skipping");
    return;
  }
  const passwordHash = await bcrypt.hash("password123", 11);

  const team = [
    { name: "Hemang Mittal", photo: "/media/hemang.jpeg", headline: "Math, Engineering & Humanities Tutor | College Essay Consultant", subjects: ["AP Calculus BC", "Engineering", "College Consulting & Essays", "AP English Language & Composition"], bio: "Has mastered college-level coursework across engineering, math beyond calculus, and computer science. Experienced in essay consulting, with deep knowledge of admissions and debate experience." },
    { name: "Shlok Shah", photo: "", headline: "Math & Science Tutor | Expert Test Prep Mentor", subjects: ["AP Chemistry", "AP Calculus AB", "SAT", "Precalculus"], bio: "Excels at making challenging math and science concepts intuitive and approachable. Has mastered coursework through multivariable calculus and college-level chemistry and physics." },
    { name: "James Doherty", photo: "", headline: "Math, Physics, Music & Computer Science Tutor | Expert Test Prep Mentor", subjects: ["AP Physics 1", "AP Computer Science A", "AP Music Theory", "Python", "SAT"], bio: "Brings a versatile skill set across computer science, math, physics, test prep, and music theory. Experienced in web development, databases, and programming through college-level coursework." },
    { name: "Mohammed Zariwala", photo: "/media/mohammed.jpg", headline: "Competitive Math & Science Tutor | Expert Test Prep Mentor", subjects: ["Competition Math (AMC, AIME)", "AP Physics C: Mechanics", "SAT", "Algebra 2"], bio: "Dedicated to challenging subjects dealing with high level mathematics. Has spent years perfecting coursework through multivariable calculus and college-level chemistry and physics." },
    { name: "Mohit Kalia", photo: "/media/mohit.jpeg", headline: "Math, Engineering & Science Tutor | Expert Test Prep Mentor", subjects: ["AP Biology", "AP Psychology", "Chemistry (honors / intro)", "Geometry"], bio: "An experienced tutor with a track record of improving confidence in subjects across biology, chemistry, and psychology, with further applications in engineering." },
    { name: "Michael Hernandez", photo: "/media/michaelmit.webp", headline: "Expert Engineering & Math Tutor | Expert Test Prep Mentor", subjects: ["Engineering", "AP Calculus AB", "Physics (honors / intro)", "ACT"], bio: "A knowledgeable tutor committed to the craft of engineering, ready to help you with any project or goal to become a future engineer. Also ready to tutor anything across math and physics." },
  ];

  const tutors = [];
  for (const [i, t] of team.entries()) {
    const email = t.name.split(" ")[0].toLowerCase() + "@demo.bclearns.com";
    const user = await User.create({
      name: t.name,
      email,
      role: "tutor",
      status: "active",
      passwordHash,
      phone: `201-555-01${10 + i}`,
      onboarding: { status: "complete", completedAt: subDays(new Date(), 60) },
    });
    const profile = await TutorProfile.create({
      user: user._id,
      headline: t.headline,
      bio: t.bio,
      photoUrl: t.photo || undefined,
      subjects: t.subjects,
      gradeLevels: ["6", "7", "8", "9", "10", "11", "12"],
      gradYear: "2026",
      status: "active",
      showOnSite: true,
      siteOrder: i,
      maxStudents: 4,
      availability: [1, 2, 3, 4].map((day) => ({ day: (day + i) % 6 + 1, start: "15:30", end: "19:30" })),
    });
    user.tutorProfile = profile._id;
    await user.save();
    tutors.push(user);
  }
  console.log(`[seed] created ${tutors.length} demo tutors (password: password123)`);

  const parents = ["Patel", "Kim", "Garcia", "Chen", "Rossi", "Nguyen", "Cohen", "Singh", "Park", "Murphy", "Shah", "Lee", "Ahmed", "Lopez", "Kaur", "Wong", "Brown", "Rivera", "Gupta", "Choi", "Davis", "Ali", "Martin", "Russo"];
  const firstNames = ["Aarav", "Mia", "Lucas", "Emma", "Noah", "Ava", "Leo", "Zoe", "Ethan", "Lily", "Ryan", "Sofia"];
  const statuses: LeadStatus[] = ["new", "new", "contacted", "open", "open", "claimed", "assigned", "onboarding", "active", "active", "active", "active", "paused", "lost"];
  const subjectsPool = ["AP Calculus AB", "SAT", "AP Chemistry", "Algebra 2", "AP Physics 1", "Geometry", "BCA/BCTS Entrance Exam", "AP Biology", "Precalculus", "College Consulting & Essays", "Middle school math (grades K–8)", "AP Computer Science A"];

  let sessionCount = 0;
  for (let i = 0; i < parents.length; i++) {
    const status = pick(statuses, i);
    const createdAt = subDays(new Date(), 70 - i * 3 + rand(2));
    const subject = pick(subjectsPool, i);
    const grade = String(6 + (i % 7));
    const student = { name: `${pick(firstNames, i)} ${parents[i]}`, grade, school: pick(["Hackensack HS", "Paramus HS", "Ridgewood HS", "Teaneck MS", "Fort Lee HS"], i), subjects: [subject] };
    const lead = await Lead.create({
      parent: { name: `${pick(["Priya", "Daniel", "Maria", "Wei", "Laura", "Minh", "Rachel", "Harpreet"], i)} ${parents[i]}`, email: `${parents[i].toLowerCase()}${i}@example.com`, phone: `201-555-02${String(i).padStart(2, "0")}`, preferredContact: pick(["email", "text", "phone"] as const, i) },
      students: [student],
      subjects: [subject],
      services: [subject.includes("SAT") || subject.includes("BCA") ? "Test prep" : subject.includes("College") ? "College consulting" : "Academic tutoring"],
      goals: pick(["Raise grade from a B- to an A", "Score 1500+ on the SAT", "Prepare for the BCA entrance exam", "Build confidence before the AP exam", "Stay ahead in a fast-paced class"], i),
      format: pick(["online", "in_person", "either"] as const, i),
      location: pick(["Hackensack", "Paramus", "Ridgewood", "Teaneck", "Fort Lee"], i),
      availability: [{ day: 1 + (i % 5), block: "afternoon" }, { day: 2 + (i % 4), block: "evening" }],
      source: pick(LEAD_SOURCES, i),
      status,
      tags: ["demo"],
      rateTier: subject.includes("SAT") || subject.startsWith("AP") || subject.includes("BCA") ? "testprep" : subject.includes("College") ? "specialized" : Number(grade) <= 8 ? "k8" : "hs",
      lostReason: status === "lost" ? "Went with another program" : undefined,
      createdAt,
      updatedAt: createdAt,
      lastActivityAt: createdAt,
    });
    const channel = await Channel.create({ kind: "lead", name: `${parents[i]} family`, lead: lead._id, topic: `${student.name} · ${subject}`, createdBy: adminId, createdAt, lastMessageAt: createdAt });
    lead.channel = channel._id;
    await Message.create({ channel: channel._id, kind: "system", body: `New lead: ${student.name} (grade ${grade}) needs help with ${subject}.`, createdAt });
    await ActivityLog.create({ action: "lead.created", entityType: "lead", entityId: lead._id, summary: "Lead submitted via onboarding form", createdAt });

    const tutor = tutors[i % tutors.length];
    if (status === "claimed") {
      await ClaimRequest.create({ lead: lead._id, tutor: tutor._id, message: `I'd love to work with ${student.name.split(" ")[0]}. I've tutored ${subject} for two years.` });
      await Message.create({ channel: channel._id, author: tutor._id, body: `Claiming this one, ${subject} is my strongest subject.`, createdAt: addDays(createdAt, 1) });
    }

    if (["assigned", "onboarding", "active", "paused"].includes(status)) {
      const assignedAt = addDays(createdAt, 1 + rand(3));
      lead.assignedTutors = [tutor._id];
      lead.assignedAt = assignedAt;
      if (status === "active" || status === "paused") lead.activeAt = addDays(assignedAt, 2);
      const tier = RATE_TIERS.find((r) => r.key === lead.rateTier) ?? RATE_TIERS[1];
      const assignment = await Assignment.create({
        lead: lead._id,
        studentId: lead.students[0]._id,
        studentName: student.name,
        tutor: tutor._id,
        subjects: [subject],
        rateTier: tier.key,
        rate: tier.rate,
        status: status === "paused" ? "paused" : "active",
        startDate: assignedAt,
        createdBy: adminId,
        createdAt: assignedAt,
      });
      await ClaimRequest.create({ lead: lead._id, tutor: tutor._id, status: "approved", decidedBy: adminId, decidedAt: assignedAt, createdAt: addDays(createdAt, 1) });
      await ActivityLog.create({ actor: adminId, action: "lead.assigned", entityType: "lead", entityId: lead._id, summary: `Assigned to ${tutor.name}`, createdAt: assignedAt });

      if (status === "active" || status === "paused") {
        const family = await User.create({
          name: lead.parent.name,
          email: lead.parent.email,
          role: "family",
          status: "active",
          passwordHash,
          phone: lead.parent.phone,
          lead: lead._id,
          onboarding: { status: "complete", completedAt: addDays(assignedAt, 2) },
        });
        lead.familyUser = family._id;

        // weekly sessions from activation until two weeks out
        const day = 1 + (i % 5);
        let cursor = startOfDay(addDays(assignedAt, 3));
        const until = status === "paused" ? subDays(new Date(), 14) : addDays(new Date(), 14);
        const recurrenceId = crypto.randomUUID();
        while (cursor < until) {
          if (cursor.getDay() === day) {
            const start = setMinutes(setHours(cursor, 15 + (i % 4)), i % 2 ? 30 : 0);
            const end = addMinutes(start, i % 3 === 0 ? 90 : 60);
            const past = end < new Date();
            const roll = rand(20);
            await Session.create({
              assignment: assignment._id,
              lead: lead._id,
              tutor: tutor._id,
              studentName: student.name,
              subject,
              start,
              end,
              location: lead.format === "online" ? undefined : `${lead.location} Public Library`,
              meetingLink: lead.format === "online" ? "https://meet.google.com/demo-link" : undefined,
              status: past ? (roll === 0 ? "no_show" : roll === 1 ? "canceled" : "completed") : "scheduled",
              notes: past ? pick(["Worked through practice problems on limits; homework: 2.3 #1-15.", "Reviewed last quiz and corrected mistakes. Great progress!", "Timed practice section, focus next week on pacing.", "Covered new unit material and built a study guide."], sessionCount) : undefined,
              recurrenceId,
              createdBy: tutor._id,
            });
            sessionCount++;
          }
          cursor = addDays(cursor, 1);
        }
      }
    }
    await lead.save();
  }
  console.log(`[seed] created ${parents.length} demo leads and ${sessionCount} sessions`);

  await AdminRequest.create({ requester: tutors[1]._id, requesterRole: "tutor", type: "time_off", title: "Out next Thursday for a competition", body: "Can someone cover my Thursday session or should I reschedule?", priority: "normal" });
  await AdminRequest.create({ requester: tutors[3]._id, requesterRole: "tutor", type: "more_students", title: "Open to two more SAT students", body: "I have Tuesday and Friday evenings free.", priority: "low" });

  await Message.create({ channel: generalId, author: adminId, body: "Reminder: log your sessions within 24 hours so hours stay accurate.", createdAt: subDays(new Date(), 2) });
  await Message.create({ channel: generalId, author: tutors[2]._id, body: "Got it! Also, anyone have good AP Physics 1 practice sets?", createdAt: subDays(new Date(), 1) });
}

main().catch(async (err) => {
  console.error("[seed] failed", err);
  await mongoose.disconnect();
  process.exit(1);
});
