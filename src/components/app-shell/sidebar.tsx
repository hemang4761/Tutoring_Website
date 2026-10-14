"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  CalendarDays,
  Globe,
  GraduationCap,
  Hand,
  Home,
  Inbox,
  LayoutDashboard,
  Link2,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Moon,
  Settings,
  Sun,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { BrandLogo } from "@/components/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { NavSection } from "./nav-config";

const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  hand: Hand,
  "life-buoy": LifeBuoy,
  messages: MessagesSquare,
  globe: Globe,
  "graduation-cap": GraduationCap,
  link: Link2,
  calendar: CalendarDays,
  chart: BarChart3,
  mail: Mail,
  settings: Settings,
  users: Users,
  user: User,
  home: Home,
};

export type ShellUser = { name: string; email: string; role: string };

function Badge({ badges, id }: { badges: Promise<Partial<Record<string, number>>>; id: string }) {
  const badge = use(badges)[id];
  if (!badge) return null;
  return (
    <span className="min-w-5 rounded-full bg-sidebar-primary px-1.5 text-center text-[0.68rem] leading-5 font-bold text-sidebar-primary-foreground">
      {badge > 99 ? "99+" : badge}
    </span>
  );
}

function NavLinks({
  sections,
  badges,
  onNavigate,
}: {
  sections: NavSection[];
  badges: Promise<Partial<Record<string, number>>>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={i} className="space-y-1">
          {section.title ? (
            <p className="px-3 pb-1 text-[0.68rem] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("size-4", active ? "text-sidebar-primary" : "opacity-80")} />
                <span className="flex-1">{item.label}</span>
                <Suspense fallback={null}>
                  <Badge badges={badges} id={item.key} />
                </Suspense>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent/60">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the public site is a separate root layout */}
          <a href="/">
            <Home /> Public website
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => signOutAction()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({
  user,
  sections,
  badges,
  onNavigate,
}: {
  user: ShellUser;
  sections: NavSection[];
  badges: Promise<Partial<Record<string, number>>>;
  onNavigate?: () => void;
}) {
  const home = user.role === "admin" ? "/admin" : user.role === "tutor" ? "/tutor" : "/portal";
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <BrandLogo href={home} light />
      </div>
      <NavLinks sections={sections} badges={badges} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <UserMenu user={user} />
      </div>
    </div>
  );
}

export function AppSidebar(props: { user: ShellUser; sections: NavSection[]; badges: Promise<Partial<Record<string, number>>> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody {...props} />
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-0 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <BrandLogo href="#" />
      </header>
    </>
  );
}
