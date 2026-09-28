# CODEX_SYNC.md — Quadro Vivo de Sincronização (Codex & Antigravity)

Este arquivo é o canal de coordenação e sincronização entre **Codex** e **Antigravity**. Atualize este documento sempre que iniciar ou concluir uma tarefa para evitar sobreposição e conflitos de merge.

---

## 🟢 Status Atual do Projeto
- **Branch Principal**: `main`
- **Último Commit Estável**: `ee9f9eb`
- **Ambiente de Produção**: [mrcrazy.fun](https://www.mrcrazy.fun) (Vercel — Deploy Ativo)
- **Suíte de Testes**: 24 testes passando (`tests/stage-progression.test.mjs`, `tests/scoring.test.mjs`, `tests/realtime-session.test.mjs`)

---

## 📌 Últimas Entregas Realizadas (Contexto Compartilhado)
1. **Microfone Inicia no Estado Vermelho / Mutado**:
   - `initialMicrophoneEnabled: false` configurado em `src/components/PracticeExperience.tsx`.
   - Botão central do microfone exibe ícone `MicOff` com borda e glow vermelho alerta.
   - Badge inferior orienta *"Toque no microfone para falar"*. Ao tocar, o fluxo de áudio WebRTC e o estado verde ativam sincronizadamente sem dessincronização.
2. **Nomenclatura Padronizada dos Modos de Voz**:
   - Substituído qualquer termo "WhatsApp" por **"Hold to Talk"** e **"Tap to Talk"**.
3. **Elevação e Ergonomia do Dock de Voz**:
   - Dock do *Hold to Talk* elevado (`translateY(-8px)`) e botão ampliado para 46px com destaque em gradiente âmbar/ouro.
   - Espaçamento inferior do layout mobile ajustado para 24px (evitando scrollbars na viewport `100dvh`).
4. **Modal do Chefão (Prova Oral) Automático**:
   - Ao concluir a última fase de ensino de um módulo, o modal do Chefão abre automaticamente.
   - O examinador faz perguntas orais e calcula a nota (0 a 10) com resumo de acertos e melhorias antes de liberar o próximo módulo.

---

## 📋 Fila de Tarefas & Zonas de Trabalho

| Tarefa / Funcionalidade | Responsável | Status | Arquivos de Foco |
| :--- | :--- | :--- | :--- |
| **Documentação e Protocolo Multi-Agente** | Antigravity | ✅ Concluído | `AGENTS.md`, `CODEX_SYNC.md` |
| **Sincronização de Áudio & Mic Mutado Inicial** | Antigravity | ✅ Concluído | `PracticeExperience.tsx`, `VoiceInputControl.tsx`, `globals.css` |
| **Redesign do HUD, Balão Didático & Ondas Sonoras** | Antigravity | ✅ Concluído | `PracticeExperience.tsx`, `VoiceInputControl.tsx`, `globals.css` |
| **Entrada da prática com personagem Mr.Crazy** | Codex | 🚧 Em andamento | `PracticeExperience.tsx`, novo componente de entrada e estilos isolados |

---

## 🔒 Zonas de Isolamento de Arquivos (Evitar Conflitos)
Para trabalhar em paralelo com máxima segurança:

- **Se o Codex estiver editando**:
  - `src/lib/` ou rotas de API em `src/app/api/` (lógica de backend, IA, banco, exames):
    *Antigravity não deve reescrever essas rotas simultaneamente.*
- **Se o Antigravity estiver editando**:
  - `src/components/` ou `src/app/globals.css` (UI, HUD, animações 3D, layout mobile):
    *Codex não deve refatorar classes CSS globais ou reordenar JSX no mesmo instante.*
- **No arquivo central (`PracticeExperience.tsx`)**:
  - É o componente maestro do app. Modificações nele devem ser atômicas e focadas nas funções específicas de cada tarefa, rodando `git pull --rebase origin main` logo antes de alterar.

---

## 🛡️ Checklist de Sincronização Obrigatória Antes do Push
Antes de qualquer push na `main`:
- [ ] Executou `git pull --rebase origin main`?
- [ ] Executou `node --experimental-strip-types tests/stage-progression.test.mjs; node --experimental-strip-types tests/scoring.test.mjs; node --experimental-strip-types tests/realtime-session.test.mjs`?
- [ ] Todos os testes passaram sem falha?
- [ ] O microfone continua iniciando em estado mudo/vermelho?
- [ ] Não há termos como "WhatsApp" em botões de voz?
- [ ] O layout mobile não gerou barra de rolagem na tela de treino?

---

## 💬 Registro de Comunicação / Hand-off entre Agentes
*(Use esta seção para deixar notas de transição quando concluir uma frente de trabalho)*

- **[Antigravity — 2026-09-27]**: Microfone inicial corrigido para mudo/vermelho, modo renomeado para "Hold to Talk" e dock elevado. Todos os 24 testes unitários passando. `AGENTS.md` e `CODEX_SYNC.md` criados e prontos para coordenação paralela com o Codex.
- **[Codex — 2026-09-27]**: Iniciada a tela de entrada da prática. Escopo: novo componente visual isolado que reutiliza o `RpgCharacter`; o mapa continua sendo a escolha de módulo e o treino de voz permanece inalterado.
- **[Antigravity — 2026-09-28]**: Diagnóstico completo e otimização do HUD de prática entregues: consolidação do topo (recuperando 100px de altura vertical), balão didático integrado com botão de replay de voz e guia fonético, badge de fala do aluno em tempo real no palco principal, ondas responsivas ao áudio e graves com fallback harmônico procedural, digitação rápida inline (teclado) e ergonomia mobile 100dvh sem rolagem.
