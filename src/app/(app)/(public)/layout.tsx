import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="font-heading text-xl font-bold">
            BCLearns
          </Link>
          <Link href="/" className="text-sm text-white/75 hover:text-white">
            Back to site
          </Link>
        </div>
      </header>
      {children}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Bergen County Learns · hello@bclearns.com
      </footer>
    </div>
  );
}
