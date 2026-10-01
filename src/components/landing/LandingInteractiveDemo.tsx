"use client";

import { useState } from "react";
import { MessageSquare, Mic, Trophy, Compass, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function LandingInteractiveDemo() {
  const [activeTab, setActiveTab] = useState<"practice" | "exam" | "conversation" | "map">("practice");

  return (
    <div className="landing-demo-wrapper">
      <div className="landing-demo-tabs" role="tablist" aria-label="Demonstração das telas do aplicativo">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "practice"}
          className={`landing-demo-tab-btn ${activeTab === "practice" ? "active" : ""}`}
          onClick={() => setActiveTab("practice")}
        >
          <Mic size={16} />
          <span>1. Treino Guiado de Fala</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "exam"}
          className={`landing-demo-tab-btn ${activeTab === "exam" ? "active" : ""}`}
          onClick={() => setActiveTab("exam")}
        >
          <Trophy size={16} />
          <span>2. O Chefão (Prova Oral)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "conversation"}
          className={`landing-demo-tab-btn ${activeTab === "conversation" ? "active" : ""}`}
          onClick={() => setActiveTab("conversation")}
        >
          <MessageSquare size={16} />
          <span>3. Conversa Livre</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "map"}
          className={`landing-demo-tab-btn ${activeTab === "map" ? "active" : ""}`}
          onClick={() => setActiveTab("map")}
        >
          <Compass size={16} />
          <span>4. Mapa de Fases & XP</span>
        </button>
      </div>

      <div className="landing-demo-window">
        <div className="landing-demo-window-header">
          <span className="landing-demo-dot red" />
          <span className="landing-demo-dot yellow" />
          <span className="landing-demo-dot green" />
          <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>
            app.mrcrazy.fun/{activeTab}
          </span>
        </div>

        {/* Tab 1: Practice Screen */}
        {activeTab === "practice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="landing-mockup-stage-pill">Módulo 1: Primeiros Passos • Fase 2/4</span>
              <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700 }}>+20 XP por acerto</span>
            </div>

            <div className="landing-demo-grid-split">
              <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "0.85rem", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fbbf24", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  <span>Mr. Crazy:</span>
                </div>
                <p style={{ margin: "0.4rem 0 0", color: "#f3f4f6", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  Pra pedir um café educadamente, fala: <strong>&ldquo;Could I get a coffee, please?&rdquo;</strong>. Manda bala!
                </p>
                <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.8rem", color: "#94a3b8" }}>
                  💡 <em>Apoio Fonético:</em> <span style={{ color: "#38bdf8" }}>Cúd ái gét â cófi, pliz</span>
                </div>
              </div>

              <div style={{ background: "rgba(10, 13, 18, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "1rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "9999px", background: "linear-gradient(135deg, #ef4444, #b91c1c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 0 16px rgba(239, 68, 68, 0.4)" }}>
                      <Mic size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f3f4f6" }}>Toque no microfone para falar</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>WebRTC de baixa latência • Zero delay</div>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 700, background: "rgba(34, 197, 94, 0.12)", padding: "0.3rem 0.6rem", borderRadius: "9999px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                    Conectado
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#fbbf24", background: "rgba(245, 158, 11, 0.08)", padding: "0.45rem 0.75rem", borderRadius: "0.5rem" }}>
                  <span>⚡ Desafio: Falar &ldquo;Could I get a coffee, please?&rdquo;</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chefão Oral Exam */}
        {activeTab === "exam" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trophy size={18} className="text-amber-400" />
                <span style={{ fontWeight: 800, color: "#fbbf24", fontSize: "0.9rem" }}>Prova Prática: O Chefão do Módulo</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 700 }}>Nota de Corte: 6.0</span>
            </div>

            <div className="landing-demo-grid-split">
              <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.85rem", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 800, textTransform: "uppercase" }}>
                  Pergunta Oral 1 de 3 (Sem Colinha na Tela):
                </div>
                <p style={{ margin: "0.4rem 0 0", color: "#ffffff", fontSize: "1rem", fontWeight: 600 }}>
                  &ldquo;Where are you from, and what do you do every morning?&rdquo;
                </p>
                <p style={{ margin: "0.5rem 0 0", color: "#9ca3af", fontSize: "0.8rem" }}>
                  Responda oralmente no microfone. O examinador avalia coesão, gramática e pronúncia em tempo real.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "0.75rem", padding: "0.85rem" }}>
                  <div style={{ color: "#22c55e", fontSize: "0.8rem", fontWeight: 700 }}>✅ Se você passar:</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>Desbloqueia o próximo módulo e ganha badge de domínio.</div>
                </div>
                <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "0.75rem", padding: "0.85rem" }}>
                  <div style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 700 }}>⚠️ Se não passar:</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>O Mr. Crazy aponta o erro exato e você treina novamente.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Beta Conversation */}
        {activeTab === "conversation" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="landing-mockup-stage-pill">Conversa Livre • Tema: Viagens & Aeroporto</span>
              <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 600 }}>Suporte Bilíngue Inteligente</span>
            </div>

            <div className="landing-demo-grid-split">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
                <div style={{ alignSelf: "flex-end", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "0.75rem", padding: "0.6rem 0.9rem", maxWidth: "90%", fontSize: "0.85rem", color: "#f3f4f6" }}>
                  &ldquo;Como eu falo que minha mala foi extraviada no aeroporto?&rdquo;
                </div>
                <div style={{ alignSelf: "flex-start", background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(230, 183, 68, 0.3)", borderRadius: "0.75rem", padding: "0.75rem 1rem", maxWidth: "95%", fontSize: "0.875rem", color: "#f3f4f6", lineHeight: 1.45 }}>
                  <span style={{ color: "#fbbf24", fontWeight: 700, display: "block", marginBottom: "0.2rem" }}>Mr. Crazy:</span>
                  Boa pergunta! Anota essa: fala <strong>&ldquo;My luggage was lost&rdquo;</strong> ou <strong>&ldquo;My baggage didn&apos;t arrive&rdquo;</strong>. Aperta o mic e fala comigo!
                </div>
              </div>

              <div style={{ background: "rgba(10, 13, 18, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "0.85rem", padding: "1.15rem", display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assistente de Vocabulário</span>
                  <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 600 }}>● Ativo</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                    <span>Expressão sugerida:</span>
                    <strong style={{ color: "#fbbf24" }}>Lost luggage</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                    <span>Latência do tutor:</span>
                    <strong style={{ color: "#22c55e" }}>&lt; 400ms (WebRTC)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                    <span>Explicações:</span>
                    <strong style={{ color: "#f3f4f6" }}>100% em Português</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Map & XP */}
        {activeTab === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="landing-mockup-stage-pill">Arquipélago do Treino • 12 Módulos</span>
              <span style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: 700 }}>Nível Calculado: A2 Intermediário</span>
            </div>

            <div className="landing-demo-grid-split">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fbbf24" }}>420</div>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", marginTop: "0.2rem" }}>Minutos Falados</div>
                </div>
                <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#38bdf8" }}>1.450</div>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", marginTop: "0.2rem" }}>XP Acumulado</div>
                </div>
                <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.35)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#22c55e" }}>7 Dias</div>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", marginTop: "0.2rem" }}>Ofensiva Ativa</div>
                </div>
              </div>

              <div style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "0.75rem", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#f3f4f6", fontWeight: 600 }}>Módulo 1: Primeiros Passos</span>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>100% Concluído</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#fbbf24", fontWeight: 600 }}>Módulo 2: Viagem & Aeroporto</span>
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>Em Andamento (Fase 2/4)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#6b7280" }}>Módulo 3: Restaurante & Pedidos</span>
                  <span style={{ color: "#6b7280" }}>🔒 Bloqueado</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
