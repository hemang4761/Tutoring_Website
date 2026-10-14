import type { Role } from "@/lib/constants";

export type NavItem = { key: string; label: string; href: string; icon: string; exact?: boolean };
export type NavSection = { title?: string; items: NavItem[] };

export const NAV: Record<Role, NavSection[]> = {
  admin: [
    {
      items: [
        { key: "dashboard", label: "Dashboard", href: "/admin", icon: "layout-dashboard", exact: true },
        { key: "leads", label: "Leads", href: "/admin/leads", icon: "inbox" },
        { key: "claims", label: "Claims", href: "/admin/claims", icon: "hand" },
        { key: "requests", label: "Requests", href: "/admin/requests", icon: "life-buoy" },
        { key: "chat", label: "Team chat", href: "/admin/chat", icon: "messages" },
      ],
    },
    {
      title: "Operations",
      items: [
        { key: "tutors", label: "Tutors", href: "/admin/tutors", icon: "graduation-cap" },
        { key: "assignments", label: "Assignments", href: "/admin/assignments", icon: "link" },
        { key: "schedule", label: "Master schedule", href: "/admin/schedule", icon: "calendar" },
      ],
    },
    {
      title: "Insights",
      items: [
        { key: "reports", label: "Reports", href: "/admin/reports", icon: "chart" },
        { key: "email", label: "Email", href: "/admin/email", icon: "mail" },
        { key: "settings", label: "Settings", href: "/admin/settings", icon: "settings" },
      ],
    },
  ],
  tutor: [
    {
      items: [
        { key: "dashboard", label: "Dashboard", href: "/tutor", icon: "layout-dashboard", exact: true },
        { key: "claim-board", label: "Claim board", href: "/tutor/claim-board", icon: "hand" },
        { key: "students", label: "My students", href: "/tutor/students", icon: "users" },
        { key: "schedule", label: "Schedule", href: "/tutor/schedule", icon: "calendar" },
      ],
    },
    {
      title: "Team",
      items: [
        { key: "chat", label: "Team chat", href: "/tutor/chat", icon: "messages" },
        { key: "requests", label: "Requests", href: "/tutor/requests", icon: "life-buoy" },
        { key: "profile", label: "Profile", href: "/tutor/profile", icon: "user" },
      ],
    },
  ],
  family: [
    {
      items: [
        { key: "home", label: "Overview", href: "/portal", icon: "home", exact: true },
        { key: "sessions", label: "Sessions", href: "/portal/sessions", icon: "calendar" },
        { key: "requests", label: "Requests", href: "/portal/requests", icon: "life-buoy" },
        { key: "account", label: "Account", href: "/portal/account", icon: "user" },
      ],
    },
  ],
};
