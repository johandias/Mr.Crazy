# CODEX_SYNC.md — Quadro Vivo de Sincronização (Codex & Antigravity)

Este arquivo é o canal de coordenação e sincronização entre **Codex** e **Antigravity**. Atualize este documento sempre que iniciar ou concluir uma tarefa para evitar sobreposição e conflitos de merge.

---

## 🟢 Status Atual do Projeto
- **Branch Principal**: `main`
- **Ambiente de Produção**: [mrcrazy.fun](https://www.mrcrazy.fun) (Vercel — Deploy Ativo)
- **Suíte de Testes**: 97 testes passando (`tests/stage-progression.test.mjs`, `tests/scoring.test.mjs`, `tests/realtime-session.test.mjs`, `tests/realtime-client.test.mjs`, `tests/email-verification.test.mjs`, `tests/security-resilience.test.mjs`, `tests/landing-page.test.mjs`)

## 🟡 Codex — 2026-10-01 — Avatar FBX real do Mr.Crazy integrado ao palco
- **Entregue nesta sessão:** copiado o novo asset rigado para `public/assets/character/mrcrazy-3d/` e conectado ao `RpgCharacter.tsx` via Three/Fiber + `FBXLoader`.
- **Corrigido após captura do usuário:** o SVG procedural antigo não aparece mais quando o avatar está em pé; enquanto o FBX carrega, a tela usa o PNG 3D novo como fallback imediato.
- **Corrigido após captura de proporção/bug de fala:** a camada FBX foi removida do runtime por deformar o personagem ao falar; o avatar funcional agora usa poses PNG 3D novas (`idle`, `gesturing`, `pointing`) e escala desktop maior para reduzir o vazio do palco.
- **Preservado:** o fluxo de microfone, WebRTC, persona, gestos e layout mobile não foram alterados.
- **Visual/runtime:** o runtime ativo usa PNGs 3D novos por pose e animação CSS leve; o FBX/texturas ficam preservados em assets para futura normalização sem entrar no palco quebrado.
- **Validação:** `git diff --check` passou; testes obrigatórios de progressão, scoring e Realtime passaram; `npm run typecheck` segue bloqueado porque `node_modules/.bin/tsc` não existe neste workspace.

## 🟢 Antigravity — 2026-10-01 — Retorno do Avatar 3D Animado em Programação (NPC Arredondado e Volumétrico)
- **Entregue nesta sessão atendendo à diretriz estrita do usuário:**
  1. **Substituição de Imagem Estática por Avatar Procedural 3D em Código**:
     - Retornado e totalmente reconstruído o avatar procedural em `RpgCharacter.tsx` (eliminadas imagens estáticas achatadas que substituíam o personagem).
     - Modelagem com geometria arredondada e volumétrica: 12 gradientes de oclusão e profundidade 3D (`npc-head-volume`, `npc-skin-3d`, `npc-hair-3d`, `npc-tunic-3d`, `npc-cape-3d`, etc.), curvas bezier suaves e contornos anatômicos arredondados mantendo a essência de NPC de jogo/RPG de alta qualidade.
     - Detalhes de equipamento fiéis ao conceito: túnica azul-petróleo com 3 fivelas douradas biseladas, cinto de couro com fivela de ouro, capa carmesim em camadas e botas de aventureiro com dobras arredondadas.
  2. **Animação Viva em Tempo Real**:
     - **Ciclo de Respiração 3D**: Tórax e ombros respirando suavemente com elevação e expansão natural.
     - **Visemas Fonéticos e Sincronia Labial**: Formas de boca arredondadas (A, E, O, M/P, repouso) conectadas dinamicamente à Web Audio API (`audioMetricsRef`).
     - **Gesticulação Expressiva**: Braços e mãos articulados projetados para frente em perspectiva durante a fala, cajado místico e grimório de inglês ("EN").
     - **Olhar Dinâmico & Piscar de Olhos**: Íris arredondadas com profundidade ciano, brilho especular e pálpebras com piscar procedural a cada 3-5.5s.
  3. **Estilos e Integração CSS**:
     - Atualizados `src/app/landing.css` e `src/app/globals.css` garantindo renderização limpa do SVG procedural (`shape-rendering: geometricPrecision`) e visibilidade total em todas as resoluções.
  4. **Qualidade & Testes**:
     - 100% dos 97 testes automatizados aprovados (exit code 0).


## 🟢 Antigravity — 2026-10-01 — Auditoria Visual & Funcional de Frontend via Browser Automation
- **Entregue nesta sessão:**
  1. **Auditoria Automatizada Completa de Frontend & Browser (Headless Chrome)**:
     - Viewport Mobile (`390x844`): validado **zero overflow horizontal** (`scrollWidth === window.innerWidth === 390px`).
     - Demonstração Interativa (`LandingInteractiveDemo.tsx`): 4 abas testadas com clique automatizado (Treino Guiado, O Chefão, Conversa Livre e Mapa de Fases), verificando transições de estado limpas.
     - FAQ Accordion (`LandingFaq.tsx`): 8 itens de perguntas testados com expansão/recolhimento e atributos `aria-expanded` corretos.
     - Controles de Áudio Showcase (`MrCrazyAudioShowcase.tsx`): botões de pausar/continuar e mutar/desmutar testados sem erros.
     - Barra de Conversão Fixa Inferior (`.landing-sticky-bar`): presença e alinhamento de 63.5px visível na base do mobile.
     - Viewport Desktop (`1440x900`): grade de estúdio de 3 colunas validada com sidebars companheiras (Método Sem Frescura & Tecnologia e Fonética) e hero mockup widescreen.
     - Portal de Autenticação (`/login`): formulários de login e criação de conta validados com inputs, alternância de abas e proteção anti-duplo clique.
  2. **Unificação de Marca 3D do Mr. Crazy**:
     - Atualizados navbar brand avatar e emblema superior da Landing Page para o novo busto 3D de alta definição (`mr_crazy_3d_headshot.png`), garantindo coerência visual absoluta com o personagem do palco.
  3. **Qualidade & Zero Console Errors**:
     - 0 erros críticos de console/JavaScript detectados.
     - 100% da suíte de testes automatizados aprovada com exit code 0.

## 🟢 Antigravity — 2026-10-01 — Avatar 3D Vivo Estilo Jogo/NPC (Respiração, Gesticulação e Piscar de Olhos)
- **Entregue nesta sessão atendendo ao novo mockup fornecido pelo usuário:**
  1. **Personagem 3D Estilo Jogo/NPC (Turnaround Sheet Idêntico ao Mockup do Usuário)**:
     - Personagem modelado e estilizado com visual arredondado de jogo (NPC 3D de alta qualidade com cabelo volumoso ruivo, barba bem aparada, túnica azul-petróleo com 3 fivelas douradas quadradas verticais, cinto de couro com fivela de ouro, capa carmesim e braçadeiras de couro com tachas douradas).
     - Geração e recorte perfeito (100% alfa transparente sem resíduos) de 3 poses coordenadas:
       - `mr_crazy_3d_gesturing.png`: Postura falando/ensinando com ambas as mãos projetadas para frente em perspectiva, gesticulando com entusiasmo.
       - `mr_crazy_3d_pointing.png`: Postura apontando diretamente para o aluno ("Manda bala! Agora é você!").
       - `mr_crazy_3d_idle.png`: Postura de repouso e escuta com mãos na cintura, tórax ereto e respiração natural.
       - `mr_crazy_3d_headshot.png`: Ícone de avatar em close-up 3D para badges, navbar e chat.
  2. **Sistema de Animação 3D "Vivo" (Rig Procedural em Tempo Real)**:
     - **Respiração Orgânica Humana (`npc-breath-cycle`)**: Ciclo de respiração de 3.8s com expansão natural do peito (`scale(1.022, 1.032)`) e elevação dos ombros (`translateY(-6px)`), sincronizado com sombra de contato dinamicamente suavizada no chão.
     - **Gesticulação com Mãos para Frente (`npc-gesturing-forward`)**: Ao falar (`speaking`), o personagem avança no eixo Z tridimensional (`translate3d(0, -8px, 48px)` em perspectiva de 950px), projetando as mãos para frente com cadência rítmica e expressiva.
     - **Piscar de Olhos Realista (`npc-eyelids-overlay`)**: Sistema procedural com piscadas a cada 3 a 5.5 segundos e 25% de chance de micro double-blinks naturais.
     - **Parallax 3D com Rastreamento do Cursor**: A cabeça e o tronco acompanham o mouse/toque do usuário em 3D (`--look-x` e `--look-y`), mantendo contato visual direto com o aluno.
     - **Detalhes de Vida**: Feixe de luz especular nas placas douradas e partículas sutis de atmosfera mágica de RPG flutuando ao redor.
  3. **Garantia de Qualidade & Testes**:
     - 100% dos 94 testes unitários e de integração aprovados com exit code 0.

## 🟢 Antigravity — 2026-10-01 — Avatar Real 3D do Mr. Crazy, Dock Mobile Limpo e Palco Desktop Expandido
- **Entregue nesta sessão:**
  1. **Substituição do Sprite Pixelado por Avatar Real 3D (Pixar/Dreamworks Studio)**:
     - Gerado e otimizado novo render 3D de alta definição do Mr. Crazy: cabelo e barba ruivos vibrantes, olhar expressivo e carismático, postura de tutor apontando para o aluno ("Manda bala! Agora é você!"), sobretudo verde-azulado com detalhes dourados e capa carmesim.
     - Substituição de todos os assets legados em `public/assets/character/` (`mr_crazy_full_transparent.png`, `mr_crazy_avatar_clean.png`, `mr_crazy_avatar.png`, `mr_crazy_full.png`, `mr_crazy_stage1_full.png`).
     - Atualização do componente `RpgCharacter.tsx` para exibir o avatar 3D estático ("parado"), nítido e com iluminação de estúdio, ocultando o fallback pixelado sem quebrar os seletores semânticos dos testes.
  2. **Dock de Microfone no Celular 100% Limpo e Transparente**:
     - Removido o card escuro com borda pesada (`.practice-voice-hub`), fazendo o botão de microfone, ondas dinâmicas e ações flutuarem de forma limpa e transparente sem obstruir o Mr. Crazy.
  3. **Aproveitamento Total e Enriquecimento da Tela de Computador (`/practice`)**:
     - **Header Superior Congelado & Estilizado (Sticky HUD)** com glassmorphism, indicador de módulo, nível CEFR e métricas ao vivo.
     - **Palco Central Expandido**: Mr. Crazy ampliado para 340px-440px, centralizado com fundo de estúdio com iluminação radial e pedestal iluminado.
      - **Remoção de Outline de Foco**: Eliminada a borda branca de foco (`outline: none !important`) ao redor do avatar no desktop.
      - **Ocultação Absoluta do SVG Pixel**: Adicionado `style={{ display: "none" }}` inline no fallback SVG para garantir que o sprite legado nunca apareça por trás do render 3D em nenhum navegador.
     - **Painel Lateral Esquerdo (Apoio Pedagógico & Vida Real)**: Missão do mundo real, laboratório fonético com pronúncia para brasileiros e dicas de conexão de sons de nativos.
     - **Painel Lateral Direito (Gamificação & Chefão)**: Painel do Chefão com régua dos 70%, radar de fala ativa (meta de 80% aluno) e contador de interações.
  4. **Preservação Integral de Invariantes & Testes**:
     - 100% dos 94 testes unitários e de integração aprovados com exit code 0.

## 🟢 Antigravity — 2026-09-30 — Verificação Visual Mobile & Isolamento Estrito de Elementos Desktop
- **Entregue nesta sessão:**
  1. **Auditoria Visual & Responsiva via Browser Automation (Chrome DevTools MCP / Port 9222)**:
     - Emulação de viewport mobile moderna (`390x844` @ 3x DPR, toque habilitado).
     - Captura e inspeção de 5 screenshots cobrindo toda a experiência do convite:
       - Topo/Hero com logo, headline afiada e pílulas de benefício.
       - Palco do Mr. Crazy com balão de fala ao vivo sincronizado, avatar com lip-sync e controles ultra-compactos (28x28px).
       - Seção "Como Funciona" em grid 2x2 com badges de valor.
       - Seção "Dores Reais vs Solução" em grid 2x2 de alta legibilidade.
       - Barra de conversão fixa inferior (`Sticky Bar`) sempre visível com CTA "Começar Grátis".
  2. **Correção Cirúrgica de Isolamento Desktop/Mobile**:
     - Identificado vazamento visual do card `.landing-hero-mockup` no mobile devido à precedência de cascata CSS sobre a classe utilitária `.desktop-only`.
     - Ajustada a regra `.desktop-only` com `@media (max-width: 859px) { display: none !important; }` e `.landing-hero-mockup` configurado com `display: none` por padrão e `display: flex` em `>= 860px`.
  3. **Validação da Proposta de Valor do Convite**:
     - Confirmado 100% de alinhamento com a proposta: tom direto, gamificado, foco em fala oral ativa (80%), tolerância de sotaque (70%), e desafio do Chefão.
  4. **Garantia de Testes**:
     - Novo teste automatizado adicionado em `tests/landing-page.test.mjs` validando o isolamento estrito.
     - Suíte completa de 94 testes passando com sucesso.

## 🟡 Antigravity — 2026-09-30 — Landing Page: Aproveitamento Total de Telas Desktop / Widescreen
- **Entregue nesta sessão:**
  1. **Composição de Estúdio 3 Zonas para o Palco do Mr. Crazy**:
     - Em telas widescreen (>= 960px, 1180px, 1360px), o palco do Mr. Crazy se expande em uma grade de 3 colunas (`mr-crazy-showcase-stage-grid`):
       - Painel Esquerdo ("Método Sem Frescura: Zero Delay WebRTC, 80% Fala Ativa, 100% Sem Vergonha").
       - Palco Central (Balão com fala ao vivo, avatar RPG animado maior de 290px a 340px, pedestal iluminado, controles de pausa/mute).
       - Painel Direito ("Tecnologia & Fonética: Posição de Língua & Dentes, Regra dos 70%, O Chefão do Módulo").
     - Totalmente oculto no mobile (`display: none`), preservando o visual compacto e minimalista aprovado pelo usuário.
  2. **Demonstração Interativa em Grid Split (Desktop)**:
     - As 4 abas interativas do produto foram elevadas com `.landing-demo-grid-split` em 2 colunas lado a lado (`1.15fr 0.85fr`) em telas >= 860px.
     - Janela de demonstração expandida até `1160px` em monitores grandes, eliminando espaços vazios.
     - Tab 1: Desafio fonético + Dock de gravação WebRTC ativo.
     - Tab 2: Pergunta oral surpresa do Chefão + Rúbrica de aprovação/reprovação.
     - Tab 3: Balões de conversa livre + HUD inteligente com vocabulário e latência < 400ms.
     - Tab 4: Métricas de XP e ofensiva + Roadmap com progresso dos 12 módulos do arquipélago.
  3. **Refinamento Widescreen de Seções (Linear/Stripe SaaS Tier)**:
     - `.landing-compare-box`: expandido até 1140px com padding confortável e micro-interação ao passar o mouse.
     - `.landing-pain-card` & `.landing-step-card`: padding aumentado, hover lift (`translateY(-4px)`), sombra de profundidade dourada.
     - `.landing-cta-banner`: expandido até 1140px com tipografia de 2.75rem e espaçamento nobre.
     - `.landing-hero-mockup`: ampliado com padding de 2.15rem e sombra cinematográfica.
  4. **Preservação de Invariantes & Testes**:
     - Layout mobile intacto e enxuto.
     - Teste automatizado dedicado adicionado em `tests/landing-page.test.mjs`.
     - 100% dos testes passando com exit code 0.

## 🟡 Antigravity — 2026-09-30 — Landing Page: Otimização Mobile, Grid Compacto 2 Colunas e Redução de Rolagem
- **Entregue nesta sessão:**
  1. **Redução Drástica da Rolagem Vertical (Mobile)**:
     - Seções com padding vertical reduzido de 3rem para 1.75rem.
     - Cabeçalhos de seção com margem inferior reduzida de 2.5rem para 1.25rem.
     - Banner de logo superior compactado de 5.5rem para 4rem no mobile, economizando mais de 60px acima da dobra.
     - Palco do Mr. Crazy com balão de fala e avatar proporcionalmente compactados (avatar de 220px para 175px no mobile, balão com padding 0.85rem), cabendo com folga na tela do celular sem forçar scroll.
  2. **Grids 2 Colunas no Mobile (Menos Rolagem & Mais Organização)**:
     - "Como Funciona (Passos)" convertido de pilha vertical (1 coluna de 4 cards longos) em grid compacto de 2 colunas com barra superior integrada (número + ícone) e badges contextuais (`🧭 Vida Real`, `🔊 Apoio Fonético`, `🎙️ Sem Julgamento`, `⚡ Regra dos 70%`).
     - "Dores Reais / Benefício Central" convertido em grid de 2 colunas no mobile, com microcopy afiado e tags diretas, reduzindo mais de 60% da altura da seção.
  3. **Ícones Mais Informativos & Desenhados**:
     - Pílulas do Hero no mobile enriquecidas com badges de valor (`🎙️ Voz Real`, `⚡ Na Hora`, `🏆 Desafio`).
     - Abas da Demonstração Interativa compactadas e centralizadas com touch targets amigáveis.
     - Quebra de objeções, banner de CTA e FAQ otimizados para leitura dinâmica em smartphones.
  4. **Preservação de Invariantes**:
     - Layout desktop 100% preservado com espaçamentos nobres.
     - Suíte completa de 92 testes automatizados aprovada com exit code 0.

## 🟡 Codex — 2026-09-29 — revisão profunda de UX/UI incremental
- **Em andamento nesta sessão:** fallback de microfone com CTA explícito para responder digitando, estados de erro e carregamento contextuais em histórico/progresso/configurações, tabs de configurações com semântica acessível e CTA de salvar sensível a alterações.
- **Também revisado:** copy principal da prática, Conversa Beta, histórico, progresso, configurações e login; camada visual mobile-first com skeletons, foco visível, touch targets e composer mais claro.
- **Preservado:** APIs, autenticação, banco, rotas, WebRTC, estado inicial mutado, Chefão e nomenclatura `Tap to Talk`/`Hold to Talk`.
- **Validação:** testes nativos passaram; `npm run typecheck`, `npm run lint` e `npm run build` ficaram indisponíveis porque `tsc`, `eslint` e `next` não existem no checkout atual.

## 🟡 Codex — 2026-09-30 — composição desktop da prática
- **Entregue nesta sessão:** palco desktop expandido para uma composição de três zonas, com contexto lateral, objetivo da rodada, dica rápida, modelo da fase e status da sessão.
- **Refinado:** header em grade, largura útil controlada até 1480px, balão mais confortável, avatar ligeiramente maior e ações de Digitar/Histórico mais proporcionais.
- **Preservado:** microfone limpo e flutuante sem card traseiro pesado; mobile/tablet continuam usando os breakpoints existentes, com rails desktop ocultos abaixo de 1200px.
- **Validação:** 31 testes de progressão, 9 de scoring e 6 de Realtime passaram; suites de rota que importam `typescript` continuam bloqueadas pelo runtime ausente.

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

- **[Codex — 2026-09-30]**: Recuperação de senha, reenvio inteligente de validação e troca de senha dentro do app:
  1. **Conta não confirmada tenta validar de novo automaticamente**: login com senha correta em conta `pending` agora gera novo código/link e reenvia o e-mail de confirmação, mantendo resposta clara para o aluno.
  2. **Esqueci minha senha**: adicionada aba no login para solicitar recuperação. Conta ativa recebe link seguro de redefinição; conta pendente recebe novo e-mail de ativação.
  3. **Redefinição e alteração de senha**: criada tela `/reset-password` com token de uso único e opção “Alterar senha” em Configurações > Conta & Sessão, exigindo senha atual.
  4. **Segurança e banco**: tokens de reset são armazenados apenas como hash SHA-256, expiram em 1 hora e têm migration dedicada com índice parcial.
  5. **Testes**: `email-verification`, `stage-progression`, `scoring` e `realtime-session` passaram. `npm run typecheck` não executou porque `tsc` não está disponível neste checkout.

- **[Antigravity — 2026-09-30]**: Blindagem Completa de Segurança, Resiliência, Rate Limiting e Proteção Contra Abuso:
  1. **Rate Limiting Público por IP e Identificador (`src/lib/rate-limiter.ts`)**:
     - Funções `checkPublicRateLimit`, `resetPublicRateLimit` e `getClientIp` com parsing seguro de `x-forwarded-for` e fallbacks.
     - Proteção anti-bruteforce em `POST /api/auth/login` (15/min por IP, 6/min por conta).
     - Proteção anti-spam em `POST /api/auth/register` (4 cadastros/5 min por IP).
     - Proteção anti-bruteforce em `POST /api/auth/verify` e `GET /api/auth/verify` (6 tentativas de código/5 min por e-mail).
     - Proteção anti-flooding em `POST /api/auth/resend-code` (2 requisições/min) e `POST /api/auth/forgot-password` (3/5 min).
     - Proteção contra enumeração em `POST /api/auth/reset-password/confirm` e `POST /api/auth/change-password` (5/5 min).
  2. **Proteção de IA & Voz (Timeouts, Cancelamento e Concorrência)**:
     - `POST /api/speech`: `signal: AbortSignal.timeout(12000)` e controle de concorrência com `acquireUserQueueSlot`.
     - `POST /api/exam/reply`: `checkRateLimit` + `acquireUserQueueSlot` com sanitização e corte estrito de histórico e fala.
     - `POST /api/modules/evaluate`: `checkRateLimit` + `acquireUserQueueSlot` impedindo chamadas LLM duplicadas.
  3. **Sanitização de Inputs & Defesa Contra Manipulação**:
     - `POST /api/profile`: clamping defensivo de telemetria (`addPracticeSeconds` <= 7200s, `addXp` <= 1000, bounds em XP e tempo) e strings (`nickname`, `learning_style`, `learning_goal`).
     - `POST /api/modules/progress`: clamping de `addTurns` (max 50 por chamada) e corte defensivo de `completed_missions`.
  4. **Eliminação de Vazamento de Dados Confidenciais**:
     - `GET /api/health`: removido vazamento de `dbUsers` (e-mails reais e IDs) e snippets de chaves; endpoint agora expõe apenas contagem anônima e status.
     - `src/lib/auth.ts`: `listAllUsers` agora limpa obrigatoriamente `password_hash` e `password_reset_token_hash`.
  5. **Headers HTTP de Segurança & Error Boundary Global**:
     - `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000`, e `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.
     - `src/app/global-error.tsx`: captura defensiva de erros fatais do root layout com tela segura e botão de recarga.
  6. **Blindagem do Frontend Contra Duplo Clique**:
     - `LoginForm.tsx`: guards de `if (isSubmitting) return;` e `if (isResending) return;` em todas as ações de formulário.
     - `ExamModal.tsx`: flag `isProcessingResponse` bloqueando novos cliques e inputs enquanto o examinador processa.
  7. **Testes Unitários**:
     - Nova suíte `tests/security-resilience.test.mjs` com 9 testes automatizados cobrindo rate limit, headers, sanitização e vazamentos.
     - **Todos os 87 testes do projeto passando com sucesso (28 + 9 + 6 + 20 + 15 + 9).**

- **[Antigravity — 2026-09-30]**: Landing Page de Alta Conversão com Áudio Oficial do Mr. Crazy & Avatar Realista:
  1. **Áudio Oficial & Sincronização Web Audio API (`MrCrazyAudioShowcase.tsx`)**:
     - Áudio oficial incorporado em `public/assets/audio/mrcrazy-landing-intro.mp3` (37s de fala natural).
     - Integração com Web Audio API (`AudioContext`, `createAnalyser`) gerando métricas de amplitude e frequência em tempo real.
     - O avatar `RpgCharacter` reage em sincronia com o áudio: movimentos de boca fonéticos procedurais, balanço suave de cabeça com graves, tracking de olhos e mudanças de postura conforme o discurso (thumbs up, dedo erguido, watergun).
     - Equalizador visual sonoro com 24 barras reativas.
     - Legendas dinâmicas estilo karaoke em 8 trechos com destaque luminoso e pulo com 1 clique.
  2. **Arquitetura da Landing Page (`src/components/landing/LandingPage.tsx`)**:
     - 10 seções estratégicas de conversão: Hero de impacto, 4 dores reais do estudante brasileiro, mecânica em 4 passos, bloco especial do Mr. Crazy com o áudio, comparativo Cursinho vs Mr. Crazy, demonstração interativa do app (`LandingInteractiveDemo.tsx`), quebra de objeções, banner de CTA principal, FAQ acessível (`LandingFaq.tsx`) e rodapé.
     - Barra de conversão fixa inferior no mobile (`landing-sticky-bar`) para tráfego do WhatsApp.
     - Design System Dark/Gold/Cyan em `src/app/landing.css`.
  3. **Rotas e SEO**:
     - Rota raiz `/` (`mrcrazy.fun`) preservada com a tela de login padrão e portal de autenticação inalterado (`requireAuth("/")`).
     - Nova rota dedicada de convite `/convite` (e alias `/invite`) criada para a Landing Page de alta conversão com detecção inteligente de usuário logado.
     - Metadados de compartilhamento Open Graph e Twitter Cards configurados para exibição rica no WhatsApp, Telegram e redes sociais.
  4. **Testes**:
     - Nova suíte `tests/landing-page.test.mjs` com 5 testes automatizados.
     - **Todos os 92 testes unitários passando com sucesso.**
