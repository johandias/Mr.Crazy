"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  User,
  Check,
  Sparkles,
  BookOpen,
  AlertCircle,
  Clock,
  Award,
  Mic,
  Volume2,
  VolumeX,
  Gauge,
  Sliders,
  LogOut,
  ArrowLeftRight,
  RotateCcw,
  Smartphone,
  Eye,
  Activity,
  Flame,
  Shield,
  Layers
} from "lucide-react";
import type { UserProfile, UserGender } from "@/lib/auth";

type SettingsTab = "profile" | "audio" | "ai" | "interface" | "account";

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

const DAILY_GOAL_OPTIONS = [
  { mins: 5, label: "5 min/dia (Casual)", desc: "Ideal para manter o streak sem pressa" },
  { mins: 15, label: "15 min/dia (Recomendado)", desc: "Ritmo perfeito para destravar fluência" },
  { mins: 30, label: "30 min/dia (Intensivo)", desc: "Evolução acelerada para viagens ou trabalho" },
  { mins: 60, label: "60 min/dia (Imersão)", desc: "Foco total para dominar o idioma" }
];

export function ProfileSettingsForm() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Perfil
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<UserGender>("masculino");
  const [selfAssessedLevel, setSelfAssessedLevel] = useState(SELF_LEVEL_OPTIONS[1]);
  const [learningLevel, setLearningLevel] = useState<"basic" | "intermediate" | "advanced">("basic");
  const [learningStyle, setLearningStyle] = useState(LEARNING_STYLE_OPTIONS[0]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [dailyGoalMins, setDailyGoalMins] = useState(15);

  // Áudio & Hardware
  const [talkMode, setTalkMode] = useState<"continuous" | "push-to-talk">("continuous");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState("1.0");
  const [audioVolume, setAudioVolume] = useState(100);
  const [vadSensitivity, setVadSensitivity] = useState<"high" | "balanced" | "low">("balanced");
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micAnimRef = useRef<number | null>(null);

  // IA & Personalidade
  const [personalityMode, setPersonalityMode] = useState<"classic" | "hardcore" | "zen">("classic");
  const [correctionFocus, setCorrectionFocus] = useState<"phonetics" | "fluency" | "grammar">("phonetics");

  // Interface & Acessibilidade
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [autoStudyGuide, setAutoStudyGuide] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [ecoMode, setEcoMode] = useState(false);

  // Estados de feedback & submissão
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Carrega dados iniciais do backend e localStorage
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
          if (p.learning_level) setLearningLevel(p.learning_level);
          if (p.self_assessed_level) setSelfAssessedLevel(p.self_assessed_level);
          if (p.learning_style) setLearningStyle(p.learning_style);
          if (Array.isArray(p.main_difficulties) && p.main_difficulties.length > 0) {
            setSelectedDifficulties(p.main_difficulties);
          } else {
            setSelectedDifficulties([COMMON_DIFFICULTIES[0], COMMON_DIFFICULTIES[6]]);
          }
          if (p.learning_goal) {
            const goalNum = parseInt(p.learning_goal, 10);
            if (!isNaN(goalNum)) setDailyGoalMins(goalNum);
          }
        }
      } catch {
        // silencioso
      } finally {
        setIsLoading(false);
      }
    }

    // Carrega preferências de hardware do localStorage
    if (typeof window !== "undefined") {
      try {
        const storedTalkMode = window.localStorage.getItem("mr-crazy-talk-mode");
        if (storedTalkMode === "continuous" || storedTalkMode === "push-to-talk") {
          setTalkMode(storedTalkMode);
        }
        const storedDevice = window.localStorage.getItem("mr-crazy-input-device-id");
        if (storedDevice) setSelectedDevice(storedDevice);

        const storedSpeed = window.localStorage.getItem("mr-crazy-speech-speed");
        if (storedSpeed) setSpeechSpeed(storedSpeed);

        const storedVol = window.localStorage.getItem("mr-crazy-audio-volume");
        if (storedVol) {
          const v = parseInt(storedVol, 10);
          if (!isNaN(v)) setAudioVolume(v);
        }

        const storedPersonality = window.localStorage.getItem("mr-crazy-personality-mode");
        if (storedPersonality === "classic" || storedPersonality === "hardcore" || storedPersonality === "zen") {
          setPersonalityMode(storedPersonality);
        }

        const storedVad = window.localStorage.getItem("mr-crazy-vad-sensitivity");
        if (storedVad === "high" || storedVad === "balanced" || storedVad === "low") {
          setVadSensitivity(storedVad);
        }

        const storedSubtitles = window.localStorage.getItem("mr-crazy-show-subtitles");
        if (storedSubtitles !== null) setShowSubtitles(storedSubtitles !== "false");

        const storedGuide = window.localStorage.getItem("mr-crazy-auto-study-guide");
        if (storedGuide !== null) setAutoStudyGuide(storedGuide !== "false");

        const storedHaptic = window.localStorage.getItem("mr-crazy-haptic-feedback");
        if (storedHaptic !== null) setHapticFeedback(storedHaptic !== "false");

        const storedEco = window.localStorage.getItem("mr-crazy-eco-mode");
        if (storedEco !== null) setEcoMode(storedEco === "true");
      } catch {}

      // Lista microfones disponíveis
      if (navigator?.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const audioInputs = devices.filter((d) => d.kind === "audioinput");
            setAudioDevices(audioInputs);
          })
          .catch(() => {});
      }
    }

    load();

    return () => {
      stopTestMic();
    };
  }, []);

  function toggleDifficulty(diff: string) {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  }

  // Testador de Microfone ao Vivo
  async function startTestMic() {
    try {
      stopTestMic();
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      micCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicTestLevel(normalized);
        micAnimRef.current = requestAnimationFrame(updateMeter);
      };
      micAnimRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.warn("Erro ao iniciar teste de microfone:", err);
      setFeedback({
        type: "error",
        text: "Não foi possível acessar o microfone selecionado. Verifique as permissões do navegador."
      });
      setIsTestingMic(false);
    }
  }

  function stopTestMic() {
    if (micAnimRef.current) {
      cancelAnimationFrame(micAnimRef.current);
      micAnimRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (micCtxRef.current) {
      void micCtxRef.current.close().catch(() => {});
      micCtxRef.current = null;
    }
    setIsTestingMic(false);
    setMicTestLevel(0);
  }

  // Testador de Áudio do Mr. Crazy
  function testAudioVoice() {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio("https://cdn.freesound.org/previews/274/274178_5121236-lq.mp3");
      audio.volume = Math.max(0, Math.min(1, audioVolume / 100));
      audio.playbackRate = parseFloat(speechSpeed) || 1.0;
      audio.play().catch(() => {
        // Fallback para síntese de voz nativa se não conseguir áudio externo
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance("Hey! I'm Mr. Crazy! Let's train your English!");
          utterance.lang = "en-US";
          utterance.rate = parseFloat(speechSpeed) || 1.0;
          utterance.volume = audioVolume / 100;
          window.speechSynthesis.speak(utterance);
        }
      });
    } catch {}
  }

  // Ações de Conta & Sessão
  function handleLogout() {
    try {
      window.localStorage.removeItem("mr-crazy-session");
      window.sessionStorage.removeItem("mr-crazy-session-turns");
    } catch {}
    window.location.href = "/api/auth/logout?reset=1";
  }

  function handleSwitchAccount() {
    try {
      window.localStorage.removeItem("mr-crazy-session");
      window.sessionStorage.removeItem("mr-crazy-session-turns");
    } catch {}
    window.location.href = "/api/auth/logout?switch=1";
  }

  function handleResetCache() {
    try {
      window.localStorage.removeItem("mr-crazy-session");
      window.localStorage.removeItem("mr-crazy-talk-mode");
      window.localStorage.removeItem("mr-crazy-input-device-id");
      window.localStorage.removeItem("mr-crazy-speech-speed");
      window.localStorage.removeItem("mr-crazy-audio-volume");
      window.localStorage.removeItem("mr-crazy-personality-mode");
      window.localStorage.removeItem("mr-crazy-vad-sensitivity");
      window.localStorage.removeItem("mr-crazy-show-subtitles");
      window.localStorage.removeItem("mr-crazy-auto-study-guide");
      window.localStorage.removeItem("mr-crazy-haptic-feedback");
      window.localStorage.removeItem("mr-crazy-eco-mode");
      window.sessionStorage.clear();
      setFeedback({
        type: "success",
        text: "Cache local de áudio e dados temporários foram limpos. Recarregando página..."
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      window.location.reload();
    }
  }

  // Salvar Todas as Preferências (Backend + LocalStorage)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    // Salva preferências locais de Hardware / Sistema
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("mr-crazy-talk-mode", talkMode);
        window.localStorage.setItem("mr-crazy-input-device-id", selectedDevice);
        window.localStorage.setItem("mr-crazy-speech-speed", speechSpeed);
        window.localStorage.setItem("mr-crazy-audio-volume", String(audioVolume));
        window.localStorage.setItem("mr-crazy-personality-mode", personalityMode);
        window.localStorage.setItem("mr-crazy-vad-sensitivity", vadSensitivity);
        window.localStorage.setItem("mr-crazy-show-subtitles", String(showSubtitles));
        window.localStorage.setItem("mr-crazy-auto-study-guide", String(autoStudyGuide));
        window.localStorage.setItem("mr-crazy-haptic-feedback", String(hapticFeedback));
        window.localStorage.setItem("mr-crazy-eco-mode", String(ecoMode));
      } catch {}
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          gender,
          learning_level: learningLevel,
          self_assessed_level: selfAssessedLevel,
          learning_style: `${learningStyle} | Modo: ${personalityMode} | Foco: ${correctionFocus}`,
          learning_goal: String(dailyGoalMins),
          main_difficulties: selectedDifficulties
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar preferências.");

      setProfile(data.profile);
      setFeedback({
        type: "success",
        text: "Configurações salvas e aplicadas! O áudio, microfone e personalização do Mr.Crazy estão 100% atualizados."
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
    return <div className="settings-loading">Carregando painel de calibração...</div>;
  }

  return (
    <form className="profile-settings-form advanced-settings-suite" onSubmit={handleSubmit}>
      {/* Feedback banner */}
      {feedback ? (
        <div className={`auth-notice ${feedback.type === "success" ? "success-notice" : "error-notice"}`}>
          {feedback.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      ) : null}

      {/* Visão Geral da Conta e Métricas */}
      {profile ? (
        <div className="profile-stats-card advanced-stats-bar">
          <div className="stat-item">
            <Clock size={18} className="stat-icon-gold" />
            <div>
              <span className="stat-label">Tempo de Prática</span>
              <strong>{Math.round((profile.practice_time_seconds || 0) / 60)} min</strong>
            </div>
          </div>
          <div className="stat-item">
            <Award size={18} className="stat-icon-gold" />
            <div>
              <span className="stat-label">XP Acumulado</span>
              <strong>{profile.xp || 0} XP</strong>
            </div>
          </div>
          <div className="stat-item">
            <Flame size={18} className="stat-icon-gold" />
            <div>
              <span className="stat-label">Ofensiva Atual</span>
              <strong>{profile.streak_days || 7} dias</strong>
            </div>
          </div>
          <div className="stat-item user-info-stat">
            <User size={18} className="stat-icon-gold" />
            <div>
              <span className="stat-label">Conta Logada</span>
              <strong className="email-display" title={profile.email}>{profile.email}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {/* Barra de Abas de Configurações Avançadas */}
      <nav className="settings-tabs-bar" aria-label="Abas de configuração">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "profile" ? "is-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={16} />
          <span>Perfil & Aluno</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "audio" ? "is-active" : ""}`}
          onClick={() => setActiveTab("audio")}
        >
          <Mic size={16} />
          <span>Voz & Microfone</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "ai" ? "is-active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          <Sparkles size={16} />
          <span>Personalidade da IA</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "interface" ? "is-active" : ""}`}
          onClick={() => setActiveTab("interface")}
        >
          <Sliders size={16} />
          <span>Interface & Exibição</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "account" ? "is-active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <Shield size={16} />
          <span>Conta & Sessão</span>
        </button>
      </nav>

      {/* ABA 1: PERFIL & APRENDIZADO */}
      {activeTab === "profile" && (
        <div className="settings-tab-content">
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
              <small className="field-hint">O professor vai usar esse nome para te chamar de forma natural na conversa oral.</small>
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

                <label className={`gender-card ${gender === "prefiro_nao_dizer" ? "selected" : ""}`}>
                  <input
                    checked={gender === "prefiro_nao_dizer"}
                    name="gender"
                    onChange={() => setGender("prefiro_nao_dizer")}
                    type="radio"
                    value="prefiro_nao_dizer"
                  />
                  <span className="gender-title">Prefiro não dizer</span>
                  <small>Linguagem neutra sem flexão de gênero.</small>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="settings-section">
            <legend>
              <BookOpen size={18} /> Nível de Fluência e Meta Diária
            </legend>
            <div className="field-block">
              <span className="field-title">Nível Gramatical Base:</span>
              <div className="level-select-grid">
                {[
                  { id: "basic", label: "Básico (A1-A2)", desc: "Construção de frases do dia a dia e vocabulário inicial" },
                  { id: "intermediate", label: "Intermediário (B1-B2)", desc: "Destravar fluência, rotina de trabalho e viagens" },
                  { id: "advanced", label: "Avançado (C1)", desc: "Lapidar sotaque, conectivos e expressões nativas" }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`level-card-btn ${learningLevel === lvl.id ? "is-selected" : ""}`}
                    onClick={() => setLearningLevel(lvl.id as "basic" | "intermediate" | "advanced")}
                  >
                    <strong>{lvl.label}</strong>
                    <small>{lvl.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span className="field-title">Meta Diária de Prática:</span>
              <div className="goal-options-grid">
                {DAILY_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.mins}
                    type="button"
                    className={`goal-card-btn ${dailyGoalMins === g.mins ? "is-selected" : ""}`}
                    onClick={() => setDailyGoalMins(g.mins)}
                  >
                    <span className="goal-mins">{g.mins}m</span>
                    <div className="goal-info">
                      <strong>{g.label}</strong>
                      <small>{g.desc}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span className="field-title">Autoavaliação do seu momento atual:</span>
              <select onChange={(e) => setSelfAssessedLevel(e.target.value)} value={selfAssessedLevel}>
                {SELF_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="settings-section">
            <legend>
              <Sparkles size={18} /> Estilo & Dificuldades Fonéticas
            </legend>
            <div className="field-block">
              <span className="field-title">Estilo de aprendizado favorito:</span>
              <select onChange={(e) => setLearningStyle(e.target.value)} value={learningStyle}>
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
            </div>
          </fieldset>
        </div>
      )}

      {/* ABA 2: VOZ, MICROFONE & HARDWARE */}
      {activeTab === "audio" && (
        <div className="settings-tab-content">
          <fieldset className="settings-section">
            <legend>
              <Mic size={18} /> Modo de Controle de Voz
            </legend>
            <p className="section-desc">
              Escolha como você prefere interagir pelo microfone durante as aulas e treinos:
            </p>
            <div className="talk-mode-cards-grid">
              <div
                className={`talk-mode-card ${talkMode === "continuous" ? "is-selected" : ""}`}
                onClick={() => setTalkMode("continuous")}
                role="button"
                tabIndex={0}
              >
                <div className="mode-card-header">
                  <strong>Tap to Talk (Toque Contínuo)</strong>
                  <span className="mode-badge">{talkMode === "continuous" ? "Ativo" : "Selecionar"}</span>
                </div>
                <p>Toque no botão para abrir o microfone e converse à vontade. O Mr. Crazy detecta suas pausas automaticamente.</p>
                <small className="mode-recommendation">Recomendado para ambientes calmos e fones de ouvido.</small>
              </div>

              <div
                className={`talk-mode-card ${talkMode === "push-to-talk" ? "is-selected" : ""}`}
                onClick={() => setTalkMode("push-to-talk")}
                role="button"
                tabIndex={0}
              >
                <div className="mode-card-header">
                  <strong>Hold to Talk (Segure para Falar)</strong>
                  <span className="mode-badge">{talkMode === "push-to-talk" ? "Ativo" : "Selecionar"}</span>
                </div>
                <p>Pressione e segure o botão enquanto fala. Ao soltar, a resposta é gerada imediatamente na mesma hora.</p>
                <small className="mode-recommendation">Perfeito para rua, transporte ou lugares com barulho de fundo.</small>
              </div>
            </div>
          </fieldset>

          <fieldset className="settings-section">
            <legend>
              <Activity size={18} /> Dispositivo de Microfone & Teste ao Vivo
            </legend>
            <div className="field-block">
              <span className="field-title">Microfone em Uso:</span>
              <select
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value);
                  if (isTestingMic) stopTestMic();
                }}
              >
                <option value="">Padrão do Sistema Operacional</option>
                {audioDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Microfone ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mic-test-container">
              <div className="mic-test-header">
                <span className="mic-test-label">Nível de Entrada do Microfone:</span>
                <button
                  type="button"
                  className={`mic-test-action-btn ${isTestingMic ? "is-testing" : ""}`}
                  onClick={isTestingMic ? stopTestMic : startTestMic}
                >
                  <Mic size={14} />
                  <span>{isTestingMic ? "Parar Teste" : "Testar Microfone"}</span>
                </button>
              </div>
              <div className="mic-test-meter-track">
                <div
                  className="mic-test-meter-fill"
                  style={{
                    width: `${micTestLevel}%`,
                    background: micTestLevel > 75 ? "#ef4444" : micTestLevel > 35 ? "#10b981" : "#eab308"
                  }}
                />
              </div>
              <small className="field-hint">
                {isTestingMic
                  ? "Fale no microfone para checar a sensibilidade. A barra deve oscilar entre o verde e o amarelo."
                  : "Clique em 'Testar Microfone' para calibrar a captação antes de praticar."}
              </small>
            </div>

            <div className="field-block">
              <span className="field-title">Sensibilidade do VAD (Detecção de Silêncio):</span>
              <div className="pill-selector-row">
                {[
                  { id: "high", label: "Alta (Sussurros)", desc: "Capta vozes baixas em lugares silenciosos" },
                  { id: "balanced", label: "Equilibrada (Padrão)", desc: "Ideal para o dia a dia" },
                  { id: "low", label: "Filtro de Ruído Alto", desc: "Ignora TV, música e conversas ao fundo" }
                ].map((sens) => (
                  <button
                    key={sens.id}
                    type="button"
                    className={`pill-select-btn ${vadSensitivity === sens.id ? "is-active" : ""}`}
                    onClick={() => setVadSensitivity(sens.id as "high" | "balanced" | "low")}
                  >
                    <strong>{sens.label}</strong>
                    <small>{sens.desc}</small>
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="settings-section">
            <legend>
              <Volume2 size={18} /> Áudio de Retorno do Mr. Crazy
            </legend>
            <div className="field-block">
              <div className="slider-header-row">
                <span className="field-title">Volume da Voz do Professor:</span>
                <span className="slider-value-pill">{audioVolume}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseInt(e.target.value, 10))}
                className="settings-range-slider"
              />
            </div>

            <div className="field-block">
              <span className="field-title">Velocidade de Fala do Mr. Crazy:</span>
              <div className="pill-selector-row speed-selector">
                {[
                  { val: "0.85", label: "0.85x", desc: "Didático / Pausado para ouvir fonemas" },
                  { val: "1.0", label: "1.0x (Padrão)", desc: "Velocidade natural de conversação" },
                  { val: "1.15", label: "1.15x", desc: "Nativo rápido / Desafio de escuta" }
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    className={`pill-select-btn ${speechSpeed === s.val ? "is-active" : ""}`}
                    onClick={() => setSpeechSpeed(s.val)}
                  >
                    <strong>{s.label}</strong>
                    <small>{s.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="test-audio-button" onClick={testAudioVoice}>
              <Volume2 size={16} />
              <span>Ouvir Exemplo de Áudio</span>
            </button>
          </fieldset>
        </div>
      )}

      {/* ABA 3: PERSONALIDADE DA IA */}
      {activeTab === "ai" && (
        <div className="settings-tab-content">
          <fieldset className="settings-section">
            <legend>
              <Gauge size={18} /> Nível de Paciência do Mr. Crazy
            </legend>
            <p className="section-desc">
              Defina como o Mr. Crazy se comporta diante dos seus erros e acertos:
            </p>
            <div className="personality-options-grid">
              <div
                className={`personality-card ${personalityMode === "classic" ? "is-selected" : ""}`}
                onClick={() => setPersonalityMode("classic")}
                role="button"
                tabIndex={0}
              >
                <div className="personality-card-header">
                  <strong>Brabo Clássico (Padrão)</strong>
                  <span className="personality-badge">Equilibrado</span>
                </div>
                <p>Sem enrolação. É irônico quando você comete erros bobos, enérgico e vibra com você quando acerta.</p>
                <small>Ideal para a experiência autêntica e divertida do Mr. Crazy.</small>
              </div>

              <div
                className={`personality-card ${personalityMode === "hardcore" ? "is-selected" : ""}`}
                onClick={() => setPersonalityMode("hardcore")}
                role="button"
                tabIndex={0}
              >
                <div className="personality-card-header">
                  <strong>Modo Militar / Hardcore</strong>
                  <span className="personality-badge hardcore">Sem Moleza</span>
                </div>
                <p>Rigor absoluto. Cobra connected speech e sotaque preciso. Se falar com sotaque abrasileirado, ele não perdoa.</p>
                <small>Para quem precisa de resultado rápido e quer ser desafiado ao limite.</small>
              </div>

              <div
                className={`personality-card ${personalityMode === "zen" ? "is-selected" : ""}`}
                onClick={() => setPersonalityMode("zen")}
                role="button"
                tabIndex={0}
              >
                <div className="personality-card-header">
                  <strong>Modo Paciente / Zen</strong>
                  <span className="personality-badge zen">Acolhedor</span>
                </div>
                <p>Mais paciente e didático. Faz correções graduais e elogia qualquer esforço inicial.</p>
                <small>Perfeito para quem tem muita vergonha ou trauma de falar em público.</small>
              </div>
            </div>
          </fieldset>

          <fieldset className="settings-section">
            <legend>
              <Sparkles size={18} /> Foco Principal de Correção
            </legend>
            <div className="field-block">
              <span className="field-title">Qual aspecto você mais quer que ele corrija:</span>
              <div className="pill-selector-row">
                {[
                  { id: "phonetics", label: "Fonética & Posição da Boca", desc: "Ajuste anatômico de dentes, lábios e língua" },
                  { id: "fluency", label: "Fluência & Connected Speech", desc: "Conectar palavras para não soar robotizado" },
                  { id: "grammar", label: "Estrutura & Tempos Verbais", desc: "Precisão gramatical e vocabulário correto" }
                ].map((foc) => (
                  <button
                    key={foc.id}
                    type="button"
                    className={`pill-select-btn ${correctionFocus === foc.id ? "is-active" : ""}`}
                    onClick={() => setCorrectionFocus(foc.id as "phonetics" | "fluency" | "grammar")}
                  >
                    <strong>{foc.label}</strong>
                    <small>{foc.desc}</small>
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* ABA 4: INTERFACE & ACESSIBILIDADE */}
      {activeTab === "interface" && (
        <div className="settings-tab-content">
          <fieldset className="settings-section">
            <legend>
              <Sliders size={18} /> Ajustes de Tela e Usabilidade
            </legend>

            <div className="toggle-setting-row">
              <div className="toggle-text">
                <strong>Exibir Legendas em Tempo Real</strong>
                <small>Mostra o texto em inglês e a transcrição no balão de fala durante o treino.</small>
              </div>
              <button
                type="button"
                className={`switch-toggle-btn ${showSubtitles ? "is-on" : ""}`}
                onClick={() => setShowSubtitles((prev) => !prev)}
                role="switch"
                aria-checked={showSubtitles}
              >
                <span className="switch-toggle-handle" />
              </button>
            </div>

            <div className="toggle-setting-row">
              <div className="toggle-text">
                <strong>Abrir Cartão Didático Fonético Automaticamente</strong>
                <small>Revela a pronúncia aportuguesada assim que o Mr. Crazy pedir repetição.</small>
              </div>
              <button
                type="button"
                className={`switch-toggle-btn ${autoStudyGuide ? "is-on" : ""}`}
                onClick={() => setAutoStudyGuide((prev) => !prev)}
                role="switch"
                aria-checked={autoStudyGuide}
              >
                <span className="switch-toggle-handle" />
              </button>
            </div>

            <div className="toggle-setting-row">
              <div className="toggle-text">
                <strong>Feedback Tátil (Vibração no Celular)</strong>
                <small>Vibra suavemente ao ativar o microfone e ao acertar ou errar cada fase.</small>
              </div>
              <button
                type="button"
                className={`switch-toggle-btn ${hapticFeedback ? "is-on" : ""}`}
                onClick={() => setHapticFeedback((prev) => !prev)}
                role="switch"
                aria-checked={hapticFeedback}
              >
                <span className="switch-toggle-handle" />
              </button>
            </div>

            <div className="toggle-setting-row">
              <div className="toggle-text">
                <strong>Modo Econômico de Bateria</strong>
                <small>Reduz a taxa de quadros e desativa partículas pesadas em aparelhos mais modestos.</small>
              </div>
              <button
                type="button"
                className={`switch-toggle-btn ${ecoMode ? "is-on" : ""}`}
                onClick={() => setEcoMode((prev) => !prev)}
                role="switch"
                aria-checked={ecoMode}
              >
                <span className="switch-toggle-handle" />
              </button>
            </div>
          </fieldset>
        </div>
      )}

      {/* ABA 5: CONTA & SESSÃO */}
      {activeTab === "account" && (
        <div className="settings-tab-content">
          <fieldset className="settings-section account-management-section">
            <legend>
              <Shield size={18} /> Dados da Sua Conta
            </legend>
            <div className="account-details-card">
              <div className="account-user-badge">
                <span className="account-avatar-circle">
                  {(nickname || profile?.email || "U")[0].toUpperCase()}
                </span>
                <div className="account-user-meta">
                  <strong className="account-name">{nickname || "Aluno Mr.Crazy"}</strong>
                  <span className="account-email">{profile?.email}</span>
                  <span className="account-role-tag">
                    {profile?.role === "admin" ? "Administrador Master" : "Matrícula Ativa (Aluno)"}
                  </span>
                </div>
              </div>

              <div className="account-grid-stats">
                <div className="acc-stat-box">
                  <span className="acc-stat-title">Nível Calculado</span>
                  <strong className="acc-stat-val">{(profile?.computedLevel || profile?.learning_level || "basic").toUpperCase()}</strong>
                </div>
                <div className="acc-stat-box">
                  <span className="acc-stat-title">Tempo Acumulado</span>
                  <strong className="acc-stat-val">{Math.round((profile?.practice_time_seconds || 0) / 60)} minutos</strong>
                </div>
                <div className="acc-stat-box">
                  <span className="acc-stat-title">Total de XP</span>
                  <strong className="acc-stat-val">{profile?.xp || 0} XP</strong>
                </div>
                <div className="acc-stat-box">
                  <span className="acc-stat-title">Status da Sessão</span>
                  <strong className="acc-stat-val status-online">Conectado / Ativo</strong>
                </div>
              </div>
            </div>

            <div className="account-actions-container">
              <h4 className="actions-header-title">Ações de Sessão e Acesso</h4>

              <div className="account-buttons-row">
                <button
                  type="button"
                  className="account-action-btn switch-account-btn"
                  onClick={handleSwitchAccount}
                >
                  <ArrowLeftRight size={16} />
                  <span>Trocar de Conta</span>
                </button>

                <button
                  type="button"
                  className="account-action-btn logout-account-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>

              <div className="cache-reset-row">
                <button
                  type="button"
                  className="account-action-btn reset-cache-btn"
                  onClick={handleResetCache}
                  title="Limpa cookies residuais e preferências locais de áudio"
                >
                  <RotateCcw size={15} />
                  <span>Limpar Cache Local e Resetar Áudio</span>
                </button>
                <small className="field-hint">
                  Use esta opção se estiver tendo problemas de captura de microfone ou áudio picotado.
                </small>
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* Botão de Salvar Global */}
      <div className="settings-submit-footer">
        <button className="primary-link submit-settings-btn" disabled={isSaving} type="submit">
          <Check size={18} />
          <span>{isSaving ? "Gravando preferências..." : "Salvar Configurações e Calibrar"}</span>
        </button>
      </div>
    </form>
  );
}
