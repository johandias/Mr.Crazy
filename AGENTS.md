# Guia de Engenharia e Colaboração Multi-Agente (Codex & Antigravity)

Este repositório é desenvolvido em colaboração paralela entre agentes de IA (**Codex** e **Antigravity**) e o desenvolvedor humano. Este documento estabelece a arquitetura, regras de negócio invariáveis, diretrizes de código e o protocolo de sincronização mútua.

---

## 1. Visão Geral do Produto
O **Mr.Crazy** é um SaaS gamificado de conversação oral em inglês voltado para brasileiros.
- **Diferencial**: O professor (Mr. Crazy) é impaciente, brabo e exigente, reagindo visualmente e verbalmente aos erros do aluno.
- **Comunicação do Tutor**: Explicações 100% em português brasileiro, curtas (< 25 palavras), diretas e sem enrolação.
- **Stack**: Next.js 16 (App Router), React 19, TypeScript, WebRTC Realtime (`gpt-realtime-2.1-mini`), fallback TTS (`gpt-4o-mini-tts`), Three.js / Canvas 3D, Supabase (Postgres/Auth), Tailwind CSS + CSS modular em `src/app/globals.css`.
- **Deploy**: Vercel conectado diretamente à branch `main` no domínio de produção [mrcrazy.fun](https://www.mrcrazy.fun).

---

## 2. Protocolo de Sincronização entre Agentes (Codex & Antigravity)

Para garantir que o Codex e o Antigravity trabalhem simultaneamente sem conflitos, sobrescritas ou regressões, **ambos os agentes devem seguir este protocolo**:

### A. Antes de Qualquer Alteração
1. **Pull & Rebase**: Sempre execute `git pull --rebase origin main` antes de iniciar edições para garantir que o workspace local está com os últimos commits do outro agente.
2. **Consultar `CODEX_SYNC.md`**: Verifique as tarefas ativas e anote a sua intenção de alteração no arquivo [`CODEX_SYNC.md`](CODEX_SYNC.md) se for uma tarefa de múltiplos passos.
3. **Escopo Atômico**: Isole mudanças em módulos específicos (ex.: se o Codex estiver trabalhando no backend de exames, o Antigravity foca na UI ou testes).

### B. Durante as Alterações
1. **Preservar Testes**: Nunca remova ou quebre os testes existentes.
2. **Respeitar as Invariantes**: Siga rigorosamente as regras da Seção 3.
3. **Estilos em `src/app/globals.css`**: Evite apagar regras globais existentes; faça alterações cirúrgicas ou crie classes complementares.

### C. Antes de Fazer Commit e Push
1. **Rodar a Suíte de Testes**:
   ```bash
   node --experimental-strip-types tests/stage-progression.test.mjs
   node --experimental-strip-types tests/scoring.test.mjs
   node --experimental-strip-types tests/realtime-session.test.mjs
   ```
   **Todos os 24+ testes devem passar (exit code 0).**
2. **Commit Semântico**: Use mensagens padronizadas (ex.: `feat(exam): ...`, `fix(voice): ...`, `refactor(ui): ...`).
3. **Push Seguro**: Execute `git push origin main`.
4. **Atualizar `CODEX_SYNC.md`**: Registre o que foi entregue e o status atual.

---

## 3. Invariantes e Regras de Negócio Cruciais

### Regra 1: Estado Inicial do Microfone (Sempre Mutado / Vermelho)
- Ao iniciar a tela ou conectar ao Mr. Crazy, o microfone **DEVE** iniciar mutado (`initialMicrophoneEnabled: false` e `setMicrophoneEnabled(false)`).
- Visual: Borda vermelha de alerta, ícone [`MicOff`](src/components/VoiceInputControl.tsx), badge dizendo *"Toque no microfone para falar"*.
- **Motivo**: O WebRTC só deve capturar e transmitir áudio quando o usuário tocar explicitamente no botão de microfone (ou segurar no modo *Hold to Talk*), evitando dessincronização de trilhas de áudio.

### Regra 2: Nomenclatura dos Modos de Voz (Zero "WhatsApp")
- Modo de toque contínuo: **"Tap to Talk"** (ou "Toque p/ Falar").
- Modo de segurar para falar: **"Hold to Talk"**.
- **Proibição**: Nunca use a palavra "WhatsApp" em botões, abas ou tooltips.

### Regra 3: Ergonomia Mobile e Sem Barra de Rolagem
- A tela principal de prática (`/practice`) deve caber exatamente em `100dvh` no celular.
- **Não deve haver scroll vertical na página principal**. O histórico de conversas é recolhido por padrão e abre em gaveta/painel colapsável.
- O dock do microfone deve ficar elevado e centralizado (altura ergonômica para o polegar), sem ser empurrado para fora da tela.

### Regra 4: Chefão (Prova Oral ao Final de Cada Módulo)
- Ao concluir todas as fases de ensino de um módulo, o sistema **NÃO** deve pular de fase sozinho.
- Ele dispara automaticamente o modal do **Chefão** ([`ExamModal.tsx`](src/components/ExamModal.tsx)), onde o examinador faz perguntas orais dinâmicas via `/api/exam/reply`.
- O aluno precisa responder oralmente, receber sua nota (0 a 10), o resumo de pontos fortes e melhorias, e clicar para avançar.

### Regra 5: Persona do Mr. Crazy (Sem Prolixidade)
- **Instruções Curtas**: Máximo de 25 palavras por intervenção.
- **Fórmula de Abertura**: *"Fase X: Pra dizer 'X', fala: 'Y' (pronúncia). Manda bala!"*.
- **Sem Repetições**: Não repetir a frase em inglês duas vezes na mesma fala.
- **Stress Level**: Se o aluno comete erros repetidos, Mr. Crazy fica irritado e mais enérgico, mas foca no aprendizado.

---

## 4. Mapa da Arquitetura do Repositório

```
Mr.Crazy/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Shell da aplicação
│   │   ├── globals.css               # Design system principal (HUD, dock, avatares, ondas)
│   │   ├── page.tsx / practice/      # Rotas principais de prática
│   │   └── api/
│   │       ├── realtime/session/     # Proxy e token efêmero WebRTC OpenAI Realtime
│   │       ├── realtime/relay/       # Proxy SDP direto
│   │       ├── exam/reply/           # Backend do Chefão examinador com fallbacks
│   │       └── text-analysis/        # Análise sintática e fonética de fallback
│   ├── components/
│   │   ├── PracticeExperience.tsx    # Orquestrador central de estado, áudio e transições
│   │   ├── VoiceInputControl.tsx     # Botões de mic (Tap to Talk vs Hold to Talk) e visualizador de ondas
│   │   ├── ExamModal.tsx             # Modal do Chefão (Prova Oral do Módulo)
│   │   ├── RpgCharacter.tsx          # Renderizador do avatar 3D/canvas reativo
│   │   ├── StudyGuidePill.tsx        # Pill flutuante com fonética e suporte
│   │   └── LearningMapModal.tsx      # Mapa visual das fases do curso
│   └── lib/
│       ├── modules.ts                # Definição dos 12 módulos e conceitos de treino
│       ├── realtime-client.ts        # Cliente WebRTC, captura de mic e áudio remoto
│       ├── mr-crazy.ts               # Lógica de estresse, persona e fallbacks de diálogo
│       ├── scoring.ts                # Algoritmo de pontuação e tolerância a sotaque
│       └── supabase/                 # Conexão de banco e persistência
├── tests/
│   ├── stage-progression.test.mjs    # Testes de fluxo, fases, Chefão e mic
│   ├── scoring.test.mjs              # Testes da régua de notas e correções
│   └── realtime-session.test.mjs     # Testes das configurações WebRTC
├── AGENTS.md                         # Este arquivo (guia para Codex e Antigravity)
└── CODEX_SYNC.md                     # Quadro vivo de sincronização entre agentes
```

---

## 5. Como Testar e Executar

- **Rodar Testes Rápidos (Node.js nativo)**:
  ```bash
  node --experimental-strip-types tests/stage-progression.test.mjs
  node --experimental-strip-types tests/scoring.test.mjs
  node --experimental-strip-types tests/realtime-session.test.mjs
  ```
- **Ambiente de Desenvolvimento**:
  ```bash
  npm run dev
  ```
- **Verificar Build do Next.js**:
  ```bash
  npm run build
  ```
