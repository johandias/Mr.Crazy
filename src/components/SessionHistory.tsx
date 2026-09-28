"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, FileCheck2, MessageSquare, Target } from "lucide-react";
import type { ProgressSummaryResponse, RecentPracticeSession } from "@/lib/progress-types";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function SessionCard({ session }: { session: RecentPracticeSession }) {
  const isExam = session.sessionType === "exam";
  return (
    <article className="history-row swipe-card-wide">
      <div className="history-header">
        <span className="history-date"><Calendar size={13} /> {formatDate(session.startedAt)}</span>
        <span className="history-xp">+{session.xpEarned} XP</span>
      </div>
      <strong className="history-mode">{isExam ? "Prova prática" : session.moduleTitle}</strong>
      <div className="history-meta">
        <span className="history-time"><Clock size={13} /> {formatDuration(session.durationSeconds)}</span>
        <span className="history-focus">{isExam ? <FileCheck2 size={13} /> : <Target size={13} />} {session.turnsCount} turnos</span>
      </div>
    </article>
  );
}

export function SessionHistory() {
  const [sessions, setSessions] = useState<RecentPracticeSession[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/progress/summary")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: ProgressSummaryResponse | null) => {
        if (active) setSessions(data?.recentSessions ?? []);
      })
      .catch(() => {
        if (active) setSessions([]);
      });
    return () => { active = false; };
  }, []);

  if (sessions === null) {
    return <div className="history-loading" role="status">Carregando suas aulas…</div>;
  }

  if (sessions.length === 0) {
    return (
      <section className="history-empty-state" aria-label="Nenhuma aula registrada">
        <MessageSquare size={24} />
        <div>
          <h2>Sua primeira prática começa aqui.</h2>
          <p>Quando você treinar, as sessões, turnos e XP reais aparecerão neste histórico.</p>
        </div>
        <Link href="/practice" className="primary-link quick-practice-btn">Começar a praticar <ArrowRight size={16} /></Link>
      </section>
    );
  }

  return (
    <>
      <div className="mobile-swipe-hint"><span>👉 Arraste para o lado para ver suas aulas</span></div>
      <section className="history-list horizontal-swipe-track" aria-label="Histórico real de sessões">
        {sessions.map((session) => <SessionCard key={session.id} session={session} />)}
      </section>
      <div className="history-cta-wrap">
        <Link href="/practice" className="primary-link quick-practice-btn">Iniciar nova sessão <ArrowRight size={16} /></Link>
      </div>
    </>
  );
}
