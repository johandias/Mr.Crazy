import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = ["Meet Mr.Crazy.", "He teaches English.", "He also has very little patience.", "Try not to break him."];

export default function OnboardingPage() {
  return (
    <main className="simple-page">
      <section className="onboarding-steps" aria-label="Onboarding">
        {steps.map((step, index) => (
          <article className="step-tile" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h1>{step}</h1>
          </article>
        ))}
      </section>
      <Link className="floating-action" href="/practice">
        Comecar conversa
        <ArrowRight size={18} />
      </Link>
    </main>
  );
}
