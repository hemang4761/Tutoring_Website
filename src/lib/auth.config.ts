import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/constants";

// set to true only for local previews without signing in
export const AUTH_DISABLED = false;

export function homeFor(role: Role | undefined) {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/tutor";
  if (role === "family") return "/portal";
  return "/login";
}

const AREA_ROLES: Array<[prefix: string, roles: Role[]]> = [
  ["/admin", ["admin"]],
  ["/tutor", ["tutor"]],
  ["/portal", ["family"]],
  ["/onboarding", ["tutor", "family"]],
];

const AUTH_PAGES = ["/login", "/forgot-password"];

// edge-safe config shared by middleware and the node auth instance
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (AUTH_DISABLED && (pathname === "/admin" || pathname.startsWith("/admin/"))) return true;
      const role = auth?.user?.role;

      if (AUTH_PAGES.includes(pathname) && role) {
        return Response.redirect(new URL(homeFor(role), request.nextUrl));
      }

      const area = AREA_ROLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
      if (!area) return true;
      if (!role) return false;
      if (!area[1].includes(role)) {
        return Response.redirect(new URL(homeFor(role), request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
