import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/tutor/:path*", "/portal/:path*", "/onboarding/:path*", "/login", "/forgot-password"],
};
