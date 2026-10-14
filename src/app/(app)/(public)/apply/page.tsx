import { ApplicationForm } from "./application-form";

export const metadata = { title: "Apply to tutor", description: "Join the BCLearns tutor team." };

export default function ApplyPage() {
  return (
    <>
      <section className="bg-navy pb-24 text-white">
        <div className="mx-auto max-w-3xl px-5 pt-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">Join the team</p>
          <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">Tutor with BCLearns</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Help younger students succeed, set your own schedule, and pick the students you want to work with from our
            claim board.
          </p>
        </div>
      </section>
      <div className="mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <ApplicationForm />
      </div>
    </>
  );
}
