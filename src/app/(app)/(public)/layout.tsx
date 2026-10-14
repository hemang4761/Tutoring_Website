import Link from "next/link";
import { BrandLogo } from "@/components/brand";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <BrandLogo light href="/" />
          <nav className="flex items-center gap-5 text-sm text-white/75">
            <a href="/#pricing" className="hidden hover:text-white sm:inline">
              Pricing
            </a>
            <a href="tel:+12019517942" className="hidden hover:text-white sm:inline">
              (201) 951-7942
            </a>
            <Link href="/login" className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/15">
              Log in
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Bergen County Learns · contact.bclearns@gmail.com · (201) 951-7942
      </footer>
    </div>
  );
}
