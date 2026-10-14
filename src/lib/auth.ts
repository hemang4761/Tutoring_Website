import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        await connectDB();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
        if (!user || !user.passwordHash || user.status !== "active") return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        user.lastLoginAt = new Date();
        await user.save();
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});

export const hashPassword = (password: string) => bcrypt.hash(password, 11);
