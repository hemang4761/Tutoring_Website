import { OnboardingWizard } from "./wizard";

export const metadata = {
  title: "Book a session",
  description: "Tell BCLearns what you need and we'll match you with a tutor.",
};

export default function GetStartedPage() {
  return <OnboardingWizard />;
}
