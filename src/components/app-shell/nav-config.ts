import type { Role } from "@/lib/constants";

export type NavItem = { key: string; label: string; href: string; icon: string; exact?: boolean };
export type NavSection = { title?: string; items: NavItem[] };

export const NAV: Record<Role, NavSection[]> = {
  admin: [
    {
      items: [
        { key: "dashboard", label: "Dashboard", href: "/admin", icon: "layout-dashboard", exact: true },
        { key: "schedule", label: "Schedule", href: "/admin/schedule", icon: "calendar" },
        { key: "clients", label: "Clients", href: "/admin/clients", icon: "users" },
        { key: "tutors", label: "Tutors", href: "/admin/tutors", icon: "graduation-cap" },
        { key: "chat", label: "Messages", href: "/admin/chat", icon: "messages" },
        { key: "settings", label: "Settings", href: "/admin/settings", icon: "settings" },
      ],
    },
  ],
  tutor: [
    {
      items: [
        { key: "dashboard", label: "Home", href: "/tutor", icon: "layout-dashboard", exact: true },
        { key: "schedule", label: "Schedule", href: "/tutor/schedule", icon: "calendar" },
        { key: "students", label: "My students", href: "/tutor/students", icon: "users" },
        { key: "chat", label: "Messages", href: "/tutor/chat", icon: "messages" },
        { key: "requests", label: "Ask the admin", href: "/tutor/requests", icon: "life-buoy" },
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
