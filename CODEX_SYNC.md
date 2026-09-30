# CODEX_SYNC.md — Quadro Vivo de Sincronização (Codex & Antigravity)

Este arquivo é o canal de coordenação e sincronização entre **Codex** e **Antigravity**. Atualize este documento sempre que iniciar ou concluir uma tarefa para evitar sobreposição e conflitos de merge.

---

## 🟢 Status Atual do Projeto
- **Branch Principal**: `main`
- **Último Commit Estável**: `4ba571e`
- **Ambiente de Produção**: [mrcrazy.fun](https://www.mrcrazy.fun) (Vercel — Deploy Ativo)
- **Suíte de Testes**: 72 testes passando (`tests/stage-progression.test.mjs`, `tests/scoring.test.mjs`, `tests/realtime-session.test.mjs`, `tests/realtime-client.test.mjs`, `tests/email-verification.test.mjs`)

---

## 📌 Últimas Entregas Realizadas (Contexto Compartilhado)
 - **[Codex — 2026-09-30]**: Redesign do email de validação/ativação concluído: template transacional escuro e gamificado, uma arte principal otimizada do Mr.Crazy, código como foco visual, CTA único com fallback VML para Outlook, link alternativo e bloco de segurança discreto. Lógica de código/link/expiração e envio via Resend preservada.

 - **[Codex — 2026-09-30]**: Revisão mobile da prática concluída: topo hierárquico (módulo + menu), progresso em duas linhas compactas, balão sem rolagem interna com “Ver mais”, avatar/cenário adaptados a viewport baixa e dock de voz de largura útil com uma instrução principal. `Digitar` e `Histórico` preservam alvos de 44px; validação cobre regressões do palco.

 - **[Codex — 2026-09-30]**: Cenário dinâmico leve entregue na prática: salão mágico em CSS com tochas de múltiplas camadas, luz reativa sutil, arcos e quatro partículas escassas. Interface e microfone ficam acima da cena; `prefers-reduced-motion` interrompe movimento e remove partículas.

 - **[Codex — 2026-09-29]**: Conexão de voz agora faz handshake discretamente: o microfone segue tocável e vermelho/mutado, sem spinner ou texto de carregamento, e ativa assim que a sessão estiver pronta. Erros redundantes recebidos após conexão viram diagnóstico técnico, não alerta ao aluno. O palco mobile recebeu personagem maior e mais baixo, balão maior e boas-vindas visuais rotativas sem fala automática.

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

- **[Antigravity — 2026-09-29]**: Refinamento profissional do treino, articulação áudio-reativa e ensino de variações naturais:
  1. **Articulação Áudio-Reativa do Mr. Crazy**: Conectado `audioMetricsRef` diretamente ao `<RpgCharacter />`. O personagem agora analisa nível sonoro (`level`), graves (`bass`) e espectro vocal em tempo real (`requestAnimationFrame`). Quando fala, os lábios alternam visemas vocálicos/consonantais de acordo com as frequências sonoras reais, fecham em repouso natural durante pausas entre palavras (fonema 4) e a cabeça oscila suavemente (`--live-head-bob`) com a ênfase vocal.
  2. **Ensino de Formas Diferentes de Falar (Variações e Connected Speech)**: Adicionadas diretrizes no `realtime-session.ts` instruindo Mr. Crazy a ensinar inglês falado natural do dia a dia (casual vs formal, reduções conectadas como *gonna/wanna/gotta*, linking sounds) e validar alternativas idiomáticas usadas pelo aluno. Alvos de aula (`lesson-target.ts`) agora fornecem `variationPt` (ex: "Casual: 'Morning!'", "No balcão: 'Can I grab a coffee?'", "Check, please!"), exibidas de forma clara e profissional no cartão didático do balão.
  3. **Visual Profissional e Polido do Treino (`/practice`)**: Estilização refinada de `.speech-study-variation`, tipografia aprimorada, contrastes e bordas glassmórficas no balão didático e dock de voz.
  4. **Testes Unitários e de Regressão**: 42 testes passando com sucesso (27 stage progression, 9 scoring, 6 realtime session).



- **[Antigravity - 2026-09-29]**: Enquadramento do Mr. Crazy, Modo Beta na navegacao inferior e polimento de cards:
  1. **Enquadramento e Foco Visual no Mr. Crazy**: Corrigido override em globals.css que encolhia o personagem para 96px; restauradas as dimensoes ideais clamp(148px, 24dvh, 184px) em harmonia com responsive.css e os testes. Adicionado halo de iluminacao de palco (.character-avatar-wrapper::before), dando protagonismo e presenca visual clara ao Mr. Crazy.
  2. **Modo Beta no Menu Inferior (MobileNav) & Desktop (AppShell)**: Eliminado o botao flutuante disperso no meio do palco. Criado botao com destaque escuro, borda roxa e pill 'BETA' agrupado com 'Praticar' na barra inferior para navegar a /conversation.
  3. **Polimento dos Cartoes e Enquadramento de Texto**: O badge de fase foi unificado em linha unica sem quebras deselegantes (concept-badge-header-row). O prompt do Gemini (/api/modules/lesson-target) e o limpador (lesson-target.ts) foram ajustados para entregar traducoes curtas e idiomaticas (2-6 palavras), eliminando explicacoes de dicionario como 'Usado para cumprimentar...'.
  4. **Todos os 42 testes passando com sucesso** (27 stage progression, 9 scoring, 6 realtime session).

- **[Antigravity — 2026-09-29]**: Modo Conversa Beta: explicacao pedagogica em portugues para iniciantes e alternativas interativas de resposta:
  1. **Explicacao Pedagogica em Portugues (Iniciante vs Avancado)**:
     - Adicionado banner explicativo colapsavel (.beta-explainer-banner) explicando o funcionamento do modo livre, correcao instantanea e uso das alternativas rapidas.
     - Para iniciantes, o banner inicia expandido com badge 'Para iniciantes' e o Mr. Crazy faz abertura acolhedora em portugues contextualizando as situacoes do dia a dia.
     - Para alunos avancados ('advanced' / 'avancado'), o banner inicia recolhido e o Mr. Crazy mergulha diretamente no desafio em ingles com vocabulario rico ('caso o usuario seja avancado, pode seguir').
     - O prompt do Gemini foi instruido a gerar explicacoes e contexto em portugues para iniciantes (explanationPt) e manter imersao em ingles para avancados.
  2. **Alternativas Interativas de Resposta (Tocar e Responder sem Digitar)**:
     - Cada pergunta do Mr. Crazy agora oferece 2 a 4 alternativas praticas de resposta (.beta-interactive-card e .beta-interactive-option-btn), contendo a frase em ingles (textEn) e a traducao em portugues (textPt).
     - O aluno pode tocar na alternativa para enviar na hora (handleSelectOption), sem precisar abrir o teclado ou digitar no chat.
     - A mensagem enviada recebe badge visual de 'Alternativa rapida' (.beta-chosen-badge).
     - Fallback resiliente no backend (generateContextualOptions) garante que alternativas contextuais sempre estejam presentes para qualquer cenario (restaurante, trabalho, viagem, hobbies, rotina).
  3. **43 testes unitarios passando** (28 stage progression, 9 scoring, 6 realtime session).

- **[Codex — 2026-09-29]**: Entregue e publicado: correção da conexão WebRTC do microfone após a otimização de latência. Ajustados ICE/SDP, fallback do token efêmero para o proxy, início da permissão somente por gesto, diagnóstico visível, schema GA da sessão (`gpt-4o-mini-transcribe` + `max_output_tokens`) e histórico inicial sem itens assistant inválidos. Produção validada: conectar, manter mudo, ativar e desativar microfone. Commits `e4d5e14`, `dd18190`, `1f927aa` e `f8a5869`; mudanças paralelas de conta preservadas.

- **[Antigravity — 2026-09-29]**: Otimizacao profunda de performance, audio WebRTC, latencia e enquadramento visual:
  1. **Enquadramento do Mr. Crazy**: Personagem ampliado e posicionado em primeiro plano sem margens pretas mortas. O SVG agora usa characterViewBox dinamico ("14 18 132 130" quando de pe ou pulando), proporcionando zoom frontal de 23% que elimina espacos vazios. Dimensoes no .clean-layout .clean-stage ajustadas para min(100%, clamp(220px, 46dvh, 380px)) com halo proporcional de iluminacao.
  2. **Reducao da Latencia de Resposta**: silence_duration_ms do VAD da OpenAI otimizado de 950ms para 450ms (reducao de 500ms no tempo de espera do fim da fala), prefix_padding_ms ajustado para 250ms, threshold para 0.52 e limite de tokens de saida para 300.
  3. **Estabilidade de Audio WebRTC & Eliminacao de Picotes**: O elemento <audio> agora utiliza renderizacao inline nao-bloqueante (opacity: 0.001; position: fixed) em vez de display: none (que disparava suspensao de audio no Chrome/Safari mobile). Adicionado sink mudo conectado ao audioCtx.destination para sincronizar o clock da Web Audio API sem buffer starvation. Removida interrupcao destrutiva (response.cancel / pause) quando o assistente esta falando ativamente.
  4. **Aceleracao da Conexao e Abertura do Microfone**: Timeout de ICE gathering reduzido de 1500ms para 150ms / resolucao imediata no primeiro candidato ICE. Consultas de perfil no Supabase em /api/realtime/session e /api/realtime/client-secret paralelizadas via Promise.all com timeout de seguranca de 900ms para nao bloquear a negociacao SDP.
  5. **Microfone Inicia no MUTE e Ativacao Fluida**: Invariante do microfone mutado no boot preservada (initialMicrophoneEnabled: false, borda vermelha, MicOff). Implementado pendingMicEnableRef em PracticeExperience.tsx: se o usuario clicar no microfone enquanto a conexao e estabelecida, a intencao e preservada e o microfone abre imediatamente assim que a sessao estiver pronta.
  6. **Todos os 43 testes da suite passando com sucesso** (28 stage progression, 9 scoring, 6 realtime session).

- **[Antigravity — 2026-09-29]**: Correcao critica de tela preta "This page couldn't load":
  1. Identificado e corrigido ReferenceError de 'activity' em src/components/RpgCharacter.tsx (variavel havia sido omitida na criacao do characterViewBox, mas ainda era acessada no aria-label e classes).
  2. Ajustada rota raiz (src/app/page.tsx) para carregar PracticeExperience atraves de PracticeExperienceClient com ssr: false, igualando o comportamento estavel de /practice e eliminando inconsistencias de hidratacao do React 19.
  3. Adicionado error boundary global (src/app/error.tsx) para recuperacao amigavel de erros com botao de recarregar.
  4. 43 testes unitarios passando. Commit 4f5c5dd enviado para a main.

- **[Antigravity — 2026-09-29]**: Suite de Configuracoes Avancadas, Troca de Conta e Logout Totalmente Funcionais:
  1. **Opcoes de Sair (Logout) e Trocar de Conta**:
     - Criadas rotas e handlers dedicados (/api/auth/logout com suporte a GET/POST e parâmetro ?switch=1).
     - Adicionado menu de usuário suspenso no topo do AppShell (exibindo email, avatar, atalhos, "Trocar de Conta" e "Sair").
     - Adicionada seção dedicada "Conta & Sessão" na página de configurações (/settings), com botões para Trocar de Conta, Sair da Conta e Limpar Cache Local/Áudio.
     - Suporte a feedback amigável no LoginForm ao trocar de conta ou deslogar sem redirecionamento automático indesejado.
  2. **Suite de Configurações Avançadas com 5 Abas**:
     - Perfil & Aluno: Apelido, sexo/flexão, nível de inglês (A1/A2, B1/B2, C1), meta diária (5, 15, 30, 60m), estilo de aprendizado e dificuldades fonéticas.
     - Voz & Microfone: Modos Hold to Talk vs Tap to Talk, seleção de dispositivo de microfone com VU Meter interativo em tempo real para teste, sensibilidade VAD, velocidade da voz (0.85x a 1.15x) e controle de volume (10% a 100%).
     - Personalidade da IA: Nível de Paciência (Brabo Clássico, Militar Hardcore, Modo Zen), foco de correção (fonética, fluência, gramática) e instruções dinâmicas.
     - Interface & Acessibilidade: Legendas em tempo real (escuta pura vs com texto), guia didático automático, feedback tátil (vibração) e modo econômico.
     - Conta & Sessão: Métricas, gerenciamento de acesso e reset de cache.
  3. **Integridade de Código e Testes**: Todos os 43 testes passando com sucesso.

- **[Antigravity — 2026-09-29]**: Verificação de Conta por E-mail via Resend e Aprovação Dupla:
  1. **Envio de Código e Link Transacional via Resend (`src/lib/email.ts`)**:
     - Integração com a API REST do Resend (`https://api.resend.com/emails`) usando `RESEND_API_KEY` e `RESEND_FROM_EMAIL`.
     - Template de e-mail no padrão estético completo do Mr. Crazy: imagem pixel-art do Mr. Crazy com cajado e livro, balão de fala cômico da persona, caixa do código de 6 dígitos com glow dourado, botão de 1 clique (`/verify?email=...&code=...`) e cards didáticos.
  2. **Mecanismo de Aprovação Dupla Preservado (`src/lib/auth.ts`)**:
     - O usuário pode ser ativado inserindo o código de 6 dígitos recebido por e-mail ou clicando no link direto.
     - O administrador continua podendo aprovar ou rejeitar qualquer conta pendente diretamente no painel `/admin` (ambas as vias ativam o status para `"approved"`).
     - Adicionada rota de reenvio de código (`/api/auth/resend-code`) com novo código e expiração de 24h.
  3. **Comunicação 100% Voltada ao Aluno (Zero Menção a Admin)**:
     - As telas de cadastro, login e o formulário (`LoginForm.tsx` e rotas de API) orientam o aluno exclusivamente sobre o código de 6 dígitos e link de validação enviados para o seu e-mail.
     - Removida qualquer menção a "aguardando aprovação do administrador" na visão do estudante.
     - Nova tela de validação em 1 clique (`src/app/verify/page.tsx`) com animações de carregamento, feedback de sucesso e redirecionamento direto para a prática.
  4. **Migration e Testes**:
     - Criada migration `supabase/migrations/202609290001_email_verification_codes.sql`.
     - Criada suíte dedicada de 9 testes em `tests/email-verification.test.mjs`.
     - **Todos os 52 testes da suíte completa passando sem falhas (28 + 9 + 6 + 9).**
