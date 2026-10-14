import { OnboardingWizard } from "./wizard";

export const metadata = {
  title: "Get started",
  description: "Tell us about your student and we'll match you with a BCLearns tutor.",
};

export default function GetStartedPage() {
  return (
    <>
      <section className="bg-navy pb-24 text-white">
        <div className="mx-auto max-w-3xl px-5 pt-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">BCLearns onboarding</p>
          <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">Let&apos;s find the right tutor</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Takes about 3 minutes. Filling this out doesn&apos;t commit you to anything. It just helps us match your
            student with the best tutor. We&apos;ll reach out within 24–48 hours.
          </p>
        </div>
      </section>
      <div className="mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <OnboardingWizard />
      </div>
    </>
  );
}
