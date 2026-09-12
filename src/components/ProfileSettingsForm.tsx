"use client";

import { useEffect, useState, type FormEvent } from "react";
import { User, Check, Sparkles, BookOpen, AlertCircle, Clock, Award } from "lucide-react";
import type { UserProfile } from "@/lib/auth";

const COMMON_DIFFICULTIES = [
  "Pronúncia do som TH (think, this)",
  "R americano vs R caipira (car, water)",
  "Evitar colocar 'i' no fim das palavras (like-i, take-i)",
  "Conexão de palavras (connected speech)",
  "Verbos no passado (-ed e irregulares)",
  "Entender gringo falando rápido",
  "Trava ou vergonha na hora de falar",
  "Vocabulário do dia a dia"
];

const SELF_LEVEL_OPTIONS = [
  "Iniciante do absoluto zero",
  "Entendo um pouco mas travo completamente ao falar",
  "Intermediário querendo destravar fluência e ritmo",
  "Avançado querendo lapidar pronúncia e vocabulário natural"
];

const LEARNING_STYLE_OPTIONS = [
  "Conversação prática e descontraída com correções rápidas",
  "Foco anatômico na posição da boca, dentes e língua",
  "Inglês para trabalho, reuniões e entrevistas de emprego",
  "Situações reais de viagens, aeroportos e restaurantes",
  "Direto ao ponto: ensina a frase, eu repito e você me corrige"
];

export function ProfileSettingsForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"masculino" | "feminino" | "outro">("masculino");
  const [selfAssessedLevel, setSelfAssessedLevel] = useState(SELF_LEVEL_OPTIONS[1]);
  const [learningStyle, setLearningStyle] = useState(LEARNING_STYLE_OPTIONS[0]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile as UserProfile;
          setProfile(p);
          setNickname(p.nickname || "");
          setGender(p.gender || "masculino");
          if (p.self_assessed_level) setSelfAssessedLevel(p.self_assessed_level);
          if (p.learning_style) setLearningStyle(p.learning_style);
          if (Array.isArray(p.main_difficulties) && p.main_difficulties.length > 0) {
            setSelectedDifficulties(p.main_difficulties);
          } else {
            setSelectedDifficulties([COMMON_DIFFICULTIES[0], COMMON_DIFFICULTIES[6]]);
          }
        }
      } catch {
        // silencioso
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function toggleDifficulty(diff: string) {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          gender,
          self_assessed_level: selfAssessedLevel,
          learning_style: learningStyle,
          main_difficulties: selectedDifficulties
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar preferências.");

      setProfile(data.profile);
      setFeedback({
        type: "success",
        text: "Preferências salvas! O Mr.Crazy vai se adaptar imediatamente ao seu perfil na próxima fala."
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao salvar."
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="settings-loading">Carregando perfil...</div>;
  }

  return (
    <form className="profile-settings-form" onSubmit={handleSubmit}>
      {/* Feedback banner */}
      {feedback ? (
        <div className={`auth-notice ${feedback.type === "success" ? "success-notice" : "error-notice"}`}>
          {feedback.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      ) : null}

      {/* Metrics overview */}
      {profile ? (
        <div className="profile-stats-card">
          <div className="stat-item">
            <Clock size={16} />
            <div>
              <span className="stat-label">Tempo de Prática</span>
              <strong>{Math.round((profile.practice_time_seconds || 0) / 60)} min</strong>
            </div>
          </div>
          <div className="stat-item">
            <Award size={16} />
            <div>
              <span className="stat-label">XP Acumulado</span>
              <strong>{profile.xp || 0} XP</strong>
            </div>
          </div>
          <div className="stat-item">
            <User size={16} />
            <div>
              <span className="stat-label">E-mail Cadastrado</span>
              <strong className="email-display">{profile.email}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dados Pessoais & Gênero */}
      <fieldset className="settings-section">
        <legend>
          <User size={18} /> Como o Mr.Crazy deve te tratar
        </legend>

        <label className="field-block">
          <span className="field-title">Seu Apelido ou Primeiro Nome:</span>
          <input
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ex: Carlos, Juliana, Rafa"
            required
            type="text"
            value={nickname}
          />
          <small className="field-hint">O professor vai usar esse nome para te chamar de forma natural na conversa.</small>
        </label>

        <div className="field-block">
          <span className="field-title">Sexo / Flexão Gramatical do Professor:</span>
          <div className="radio-group-gender">
            <label className={`gender-card ${gender === "masculino" ? "selected" : ""}`}>
              <input
                checked={gender === "masculino"}
                name="gender"
                onChange={() => setGender("masculino")}
                type="radio"
                value="masculino"
              />
              <span className="gender-title">Masculino</span>
              <small>Usa &quot;bem-vindo&quot;, &quot;pronto&quot;, &quot;focado&quot;, &quot;preparado&quot;.</small>
            </label>

            <label className={`gender-card ${gender === "feminino" ? "selected" : ""}`}>
              <input
                checked={gender === "feminino"}
                name="gender"
                onChange={() => setGender("feminino")}
                type="radio"
                value="feminino"
              />
              <span className="gender-title">Feminino</span>
              <small>Usa &quot;bem-vinda&quot;, &quot;pronta&quot;, &quot;focada&quot;, &quot;preparada&quot;.</small>
            </label>

            <label className={`gender-card ${gender === "outro" ? "selected" : ""}`}>
              <input
                checked={gender === "outro"}
                name="gender"
                onChange={() => setGender("outro")}
                type="radio"
                value="outro"
              />
              <span className="gender-title">Neutro / Outro</span>
              <small>Usa linguagem neutra e direta.</small>
            </label>
          </div>
        </div>
      </fieldset>

      {/* Como se considera no inglês */}
      <fieldset className="settings-section">
        <legend>
          <BookOpen size={18} /> Como você se considera no inglês
        </legend>
        <div className="field-block">
          <span className="field-title">Autoavaliação do seu momento atual:</span>
          <select
            onChange={(e) => setSelfAssessedLevel(e.target.value)}
            value={selfAssessedLevel}
          >
            {SELF_LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <small className="field-hint">O Mr.Crazy usa isso para dosar a velocidade e a paciência com você.</small>
        </div>
      </fieldset>

      {/* Como gosta de aprender */}
      <fieldset className="settings-section">
        <legend>
          <Sparkles size={18} /> Como você prefere aprender
        </legend>
        <div className="field-block">
          <span className="field-title">Seu estilo de aprendizado favorito:</span>
          <select
            onChange={(e) => setLearningStyle(e.target.value)}
            value={learningStyle}
          >
            {LEARNING_STYLE_OPTIONS.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        <div className="field-block">
          <span className="field-title">Suas maiores dificuldades no inglês (marque as que se aplicam):</span>
          <div className="difficulties-grid">
            {COMMON_DIFFICULTIES.map((diff) => {
              const isChecked = selectedDifficulties.includes(diff);
              return (
                <button
                  className={`diff-toggle-btn ${isChecked ? "active" : ""}`}
                  key={diff}
                  onClick={() => toggleDifficulty(diff)}
                  type="button"
                >
                  <span className="diff-checkbox">{isChecked ? "✓" : "+"}</span>
                  {diff}
                </button>
              );
            })}
          </div>
          <small className="field-hint">O agente dará atenção especial a esses pontos anatômicos e fonéticos.</small>
        </div>
      </fieldset>

      <button className="primary-link submit-settings-btn" disabled={isSaving} type="submit">
        <Check size={18} />
        {isSaving ? "Gravando no seu perfil..." : "Salvar e Calibrar Mr.Crazy"}
      </button>
    </form>
  );
}

