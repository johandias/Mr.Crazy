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
5. **Compactação do Card do Microfone & Avatar Mr.Crazy 100% Visível**:
   - Altura do card (.practice-voice-hub) compactada de 160px para ~112px com visual glassmorphic elegante.
   - Botões, abas e badge otimizados sem perder ergonomia de toque.
   - Eliminado margin-bottom do avatar e adicionado translateY de elevação para exibir o corpo inteiro, cajado e botas sem colisão com o dock.
   - Todos os 40 testes passando e deploy efetuado.
6. **Integridade de Persistência no Banco & Diagnóstico Oral na Prova**:
   - Resiliência na rota /api/modules/lesson-target com fallback de memória para getAlreadyTrainedPhrases para que o Mr. Crazy nunca repita frases já dominadas.
   - Prova oral (ExamModal.tsx) anuncia verdict via síntese de voz (TTS) com nota (0 a 10), status de aprovação/reprovação (nota de corte 6.0), pontos fortes e correções por pergunta.
   - Persistência garantida nas tabelas mrcrazy_module_progress, mrcrazy_module_evaluations e mrcrazy_practice_sessions.

---

## 📋 Fila de Tarefas & Zonas de Trabalho

**Codex — 2026-09-28, em andamento:** revisão mobile da entrada e treino (balão, guia com frase/significado/fonética, progresso, histórico e dock). Ajustes pontuais em `PracticeExperience.tsx`, `globals.css`, instruções Realtime e TTS para clareza e concisão sem anunciar fases. Microfone e Chefão preservados.

| Tarefa / Funcionalidade | Responsável | Status | Arquivos de Foco |
| :--- | :--- | :--- | :--- |
| **Documentação e Protocolo Multi-Agente** | Antigravity | ✅ Concluído | `AGENTS.md`, `CODEX_SYNC.md` |
| **Sincronização de Áudio & Mic Mutado Inicial** | Antigravity | ✅ Concluído | `PracticeExperience.tsx`, `VoiceInputControl.tsx`, `globals.css` |
| **Redesign do HUD, Balão Didático & Ondas Sonoras** | Antigravity | ✅ Concluído | `PracticeExperience.tsx`, `VoiceInputControl.tsx`, `globals.css` |
| **Entrada da prática com personagem Mr.Crazy** | Codex | ✅ Concluído | `PracticeExperience.tsx`, novo componente de entrada e estilos isolados |
| **Conversa Beta por texto e voz** | Codex | ✅ Concluído | nova rota `/conversation`, API Gemini isolada e atalho no palco de prática |
| **Diálogo Dinâmico (Início/Meio/Fim) & Correção de Áudio WebRTC** | Antigravity | ✅ Concluído | `realtime-session.ts`, `realtime-client.ts`, `PracticeExperience.tsx` |

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
- **[Codex — 2026-09-28]**: Iniciada a Conversa Beta. Escopo isolado: tela de chat, rota Gemini autenticada e atalho acima do avatar no treino; a conexão Realtime guiada permanece sem alterações.
- **[Codex — 2026-09-28]**: Conversa Beta concluída. `/conversation` recebe texto ou voz transcrita, responde por Gemini quando configurado e oferece áudio sob demanda pela rota de TTS existente.

- **[Antigravity — 2026-09-28]**: Corrigida a progressão dinâmica de diálogo com início, meio e fim: proibido mandar repetir quando o aluno já acertou; avanço imediato para a próxima etapa da cena na mesma fala. Corrigido picote e travamento de áudio WebRTC: VAD threshold ajustado para 0.55 com 950ms de pausa natural, eliminado recoverTurn() após reprodução de áudio para evitar que o Mr. Crazy responda a si mesmo, e áudio protegido contra re-execução em pointerdown.

- **[Antigravity � 2026-09-28]**: Persist�ncia de permiss�o de microfone: novo mic-permission.ts com Permissions API + localStorage (fallback iOS < 16.4). Primeira concess�o grava flag; retornos eliminam re-prompt. Microfone ativa silenciosamente ao reconectar � invariante vermelho preservada. CSS mobile: touch-action:manipulation, font-size>=16px, will-change+contain, breakpoints iPhone SE e landscape, scroll momentum. 24 testes passando, commit 993b017.

- **[Antigravity - 2026-09-28]**: Dashboard de evolu��o reescrito (EvolutionDashboard.tsx) com aba M�dulos e c�lculos de n�vel por progresso. Profile enriquecido no endpoint /api/progress/summary e rotas realtime atualizadas para passar computedLevel e sessionsCount para as instru��es do Mr.Crazy. Streak de dias sincronizado em /api/profile.
- **[Antigravity - 2026-09-28]**: Progresso real e dados no banco finalizados: criacao e validacao das tabelas (mrcrazy_users, mrcrazy_module_progress, mrcrazy_module_evaluations, mrcrazy_practice_sessions, scripts/migration.sql); rota /api/modules/progress corrigida para persistir conclusao de modulo (completed: true), creditar XP e salvar avaliacao; rota /api/progress/summary e EvolutionDashboard com dados reais e nivel calculado; Mr. Crazy agora reconhece o aluno por dados reais (nome, nivel calculado, dificuldades, sessoes e progresso do modulo ativo) em Realtime e Conversa Beta; 26 testes passando.

- **[Codex — 2026-09-28]**: Revisão mobile concluída: prova prática ganhou layout seguro para viewport curta, controles de fala acessíveis e resultado rolável; histórico deixou de renderizar aulas fictícias e passou a buscar sessões reais, com estado vazio orientando a primeira prática. Também foram atualizados os mocks das rotas de voz para manter os testes independentes do Supabase. Build de produção e suíte de testes verificados.
- **[Codex - 2026-09-28]**: Corrigido recorte do Mr.Crazy em mobile: `responsive.css` limita o balao didatico com seletor mais forte, devolve o hub de voz ao fluxo normal e remove o max-height que prendia o avatar em 112px. Testes nativos passando; verificacao browser bloqueada porque `next` nao esta instalado e `npm install` falhou com erros de escrita EBADF/EPERM no workspace em Google Drive.
- **[Codex - 2026-09-28]**: Prova oral reforcada: novo roteiro compartilhado em `src/lib/exam.ts` com perguntas por modulo, incluindo Final Challenge; `ExamModal` abre com briefing do Mr.Crazy e primeira pergunta real, exige responder todo o roteiro antes de finalizar; `/api/exam/reply` segue o plano sem dicas; `/api/modules/evaluate` avalia respostas contra perguntas e reprova prova incompleta. Testes nativos passando.

- **[Codex - 2026-09-28]**: Limpeza de audio e limites das respostas concluidos: src/lib/gemini-conversation.ts estruturado em JSON com limites concisos de palavras e fallbacks pedagogicos; BetaConversation.tsx com limpeza de blobs de audio (revokeObjectURL), tratamento de erro com retry, input auto-expansivel e feedback pedagogico destacado; 35 testes unitarios passando.

- **[Antigravity - 2026-09-28]**: Correcao de texto truncado/cortado em conversas e IA: aumentado maxOutputTokens para 800 em src/lib/gemini-conversation.ts (e no exam/analysis), implementada deteccao ativa de frases incompletas/terminadas em virgula (isSuspiciouslyTruncated) com fallback fluido, eliminados cortes cegos de palavras que quebravam oracoes, e suporte a mensagens de abertura (ex: 'Vamos la'). 36 testes passando.

- **[Antigravity - 2026-09-28]**: Correcao de visibilidade do Mr. Crazy em mobile: resolvido conflito de layout onde a div do microfone (.practice-voice-hub) e o balao didatico cobriam o boneco (.character-avatar-wrapper). O voice hub foi tornado compacto (~138px de altura total) cabendo 100% dentro do padding inferior reservado (clamp(146px, 21dvh, 170px)); o balao didatico teve paddings e espacamento reduzidos no mobile; e o boneco agora possui altura dedicada e flexivel (clamp(96px, 16dvh, 136px)), ficando perfeitamente centralizado e visivel sem sobreposicao. 36 testes passando.

- **[Antigravity - 2026-09-28]**: Garantia de responsividade total do Mr. Crazy: eliminadas regras conflitantes de breakpoints (max-width <= 375px e max-height <= 600px) que forcavam dimensoes excessivas no avatar; removido contain: layout de .character-stage para evitar falhas de composicao de SVG no WebKit/Safari; o avatar agora escala proporcionalmente em qualquer viewport mobile (clamp(86px-96px, 16dvh, 116px-136px)), mantendo-se sempre livre da div do microfone e do balao didatico. 36 testes passando.

- **[Antigravity - 2026-09-28]**: Correcao de mic mudo inicial e desoclusao total do Mr. Crazy em mobile:
  1. Microfone estritamente mutado no inicio da pratica: removido auto-unmute silencioso em PracticeExperience.tsx, garantido initialMicrophoneEnabled: false, track.enabled = false a nivel de hardware, setMicrophoneEnabled(false), icone MicOff vermelho e badge Toque no microfone para falar.
  2. Mr. Crazy visivel e desobstruido no mobile: substituido max-height: none no balao de fala do clean-layout em globals.css por clamp(76px, 18dvh, 126px) com overflow-y: auto; alterado .character-column de space-between para justify-content: flex-start !important; corrigido o breakpoint max-height 650px em globals.css que antes zerava o padding inferior; avatar com z-index: 4 !important e min-height: clamp(90px, 16dvh, 135px), ficando totalmente aberto e visivel acima do dock de voz.
  3. 36 testes passando (22 stage progression, 9 scoring, 5 realtime session).

- **[Antigravity - 2026-09-28]**: Correcao definitiva do erro pos-login na rota /practice:
  1. Causa identificada no bundle de producao (e6): a variavel emotion estava sendo referenciada no array de dependencias do useEffect antes de sua declaracao (TDZ - ReferenceError antes da inicializacao).
  2. Declaracao de const emotion = useMemo(() => getEmotion(crazyLevel), [crazyLevel]) movida para o topo da funcao (linha 438), antes de qualquer hook ou efeito dependente.
  3. Preservada a fronteira de cliente PracticeExperienceClient com ssr: false para evitar erros de hidratacao no Next.js App Router.
  4. Todos os 40 testes da suite passando com sucesso (26 stage progression, 9 scoring, 5 realtime session).

