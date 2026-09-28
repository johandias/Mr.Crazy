"use client";

import dynamic from "next/dynamic";

const PracticeExperience = dynamic(
  () => import("@/components/PracticeExperience").then((module) => module.PracticeExperience),
  {
    ssr: false,
    loading: () => <main className="practice-loading-screen" aria-label="Carregando prática" />
  }
);

export function PracticeExperienceClient({ isAdmin }: { isAdmin: boolean }) {
  return <PracticeExperience isAdmin={isAdmin} />;
}
