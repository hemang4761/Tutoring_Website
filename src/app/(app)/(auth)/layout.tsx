import { BrandLogo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #ffcc00 0, transparent 35%), radial-gradient(circle at 80% 70%, #3b5998 0, transparent 40%)",
          }}
        />
        <BrandLogo light className="relative" />
        <div className="relative mt-auto max-w-md space-y-5">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">Bergen County Learns</p>
          <h1 className="font-heading text-3xl leading-tight font-bold">
            One place for leads, tutors, schedules, and families.
          </h1>
          <p className="text-white/70">
            Claim new students, keep the master schedule in sync, log sessions, and chat with the team, all from one
            dashboard.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              ["Leads", "Claim board"],
              ["Schedule", "Master calendar"],
              ["Team", "Internal chat"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-heading text-sm font-bold text-gold">{a}</p>
                <p className="text-xs text-white/60">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
