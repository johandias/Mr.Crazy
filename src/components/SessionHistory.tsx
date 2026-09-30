"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Calendar, Clock, FileCheck2, MessageSquare, RotateCcw, Target } from "lucide-react";
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
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError("");
    fetch("/api/progress/summary")
      .then(async (response) => {
        if (!response.ok) throw new Error("O histórico não respondeu agora.");
        return response.json();
      })
      .then((data: ProgressSummaryResponse | null) => {
        if (active) setSessions(data?.recentSessions ?? []);
      })
      .catch((error: unknown) => {
        if (active) {
          setSessions(null);
          setLoadError(error instanceof Error ? error.message : "Não consegui abrir seu histórico agora.");
        }
      });
    return () => { active = false; };
  }, [reloadKey]);

  if (sessions === null) {
    if (loadError) {
      return (
        <section className="history-error-state" role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <div>
            <h2>O histórico ficou preso no caminho.</h2>
            <p>{loadError} Seus treinos continuam seguros.</p>
          </div>
          <button type="button" className="secondary-action-btn" onClick={() => setReloadKey((key) => key + 1)}>
            <RotateCcw size={15} /> Tentar de novo
          </button>
        </section>
      );
    }
    return (
      <div className="history-loading" role="status" aria-live="polite">
        <div className="history-loading-skeleton" aria-hidden="true"><i /><i /><i /></div>
        <strong>Mr.Crazy está puxando seu histórico de treino...</strong>
        <span>Erros, acertos e XP aparecem aqui depois de cada sessão.</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <section className="history-empty-state" aria-label="Nenhuma aula registrada">
        <MessageSquare size={24} />
        <div>
          <h2>Sua primeira prática começa aqui.</h2>
          <p>Faça sua primeira prática e o Mr.Crazy começa a registrar seus erros, acertos e evolução.</p>
        </div>
        <Link href="/practice" className="primary-link quick-practice-btn">Começar primeira prática <ArrowRight size={16} /></Link>
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
