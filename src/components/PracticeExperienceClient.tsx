"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { CharacterLoadingScreen } from "@/components/CharacterLoadingScreen";
import { MR_CRAZY_MODEL_CACHE_KEY } from "@/lib/character-assets";

const PracticeExperience = dynamic(
  () => import("@/components/PracticeExperience").then((module) => module.PracticeExperience),
  {
    ssr: false,
    loading: () => <main className="practice-loading-screen" aria-label="Carregando prática" />
  }
);

export function PracticeExperienceClient({ isAdmin }: { isAdmin: boolean }) {
  const [avatarReady, setAvatarReady] = useState<boolean | null>(null);
  const handleAvatarReady = useCallback(() => setAvatarReady(true), []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(MR_CRAZY_MODEL_CACHE_KEY) === "ready") {
        setAvatarReady(true);
      } else {
        setAvatarReady(false);
      }
    } catch {
      setAvatarReady(false);
    }
  }, []);

  if (avatarReady !== true) {
    return <CharacterLoadingScreen onReady={handleAvatarReady} />;
  }

  return <PracticeExperience isAdmin={isAdmin} />;
}
