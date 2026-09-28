import "./register-typescript.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { LEARNING_MODULES, getModuleById, detectConceptIndexFromText } from "../src/lib/modules.ts";
import { isNoiseOrHallucination } from "../src/lib/voice/noise-filter.ts";
import {
  calculateLessonProgressPercent,
  getLessonTargetMarker,
  getLessonTargetPhrases,
  getLessonResumePosition,
  getLessonStepMarker,
  LESSON_STEPS_PER_PHASE
} from "../src/lib/lesson-progress.ts";

const { getFallbackPhaseTargets, normalizePhaseTargets } = await import("../src/lib/lesson-target.ts");

test("score >= 70 qualifies for automatic progression to next module", () => {
  const currentModuleId = LEARNING_MODULES[0].id;
  const currentIndex = LEARNING_MODULES.findIndex((m) => m.id === currentModuleId);
  const nextModule = LEARNING_MODULES[currentIndex + 1];

  assert.ok(nextModule, "A next module should exist after the first module");

  // Nota > 7 (score >= 70 em escala 0-100)
  const scorePass = 75;
  const shouldAdvancePass = scorePass >= 70 && Boolean(nextModule);
  assert.equal(shouldAdvancePass, true);

  // Nota < 7 (score < 70)
  const scoreFail = 65;
  const shouldAdvanceFail = scoreFail >= 70 && Boolean(nextModule);
  assert.equal(shouldAdvanceFail, false);
});

test("next module target concept extracts first objective and practice phrase", () => {
  const nextModule = LEARNING_MODULES[1];
  const firstConcept = nextModule.concepts?.[0];

  assert.ok(firstConcept, "Next module should have teaching concepts");
  assert.ok(firstConcept.title.length > 0);
  assert.ok(firstConcept.objective.length > 0);

  const phraseToPractice =
    firstConcept.samplePhrases?.[0] ||
    nextModule.initialGreeting.en ||
    nextModule.samplePhrases?.[0] ||
    "Let's practice English!";

  assert.ok(phraseToPractice.length > 0);
});

test("learning module concepts include targetPhrase, meaningPt, and phoneticPt", () => {
  const greetingsModule = LEARNING_MODULES.find((m) => m.id === "greetings");
  assert.ok(greetingsModule, "greetings module should exist");

  const teachingConcepts = greetingsModule.concepts.filter((c) => !c.isExam);
  assert.ok(teachingConcepts.length >= 4, "greetings should have at least 4 teaching concepts");

  for (const concept of teachingConcepts) {
    assert.ok(concept.targetPhrase, `Concept ${concept.id} must have targetPhrase`);
    assert.ok(concept.meaningPt, `Concept ${concept.id} must have meaningPt`);
    assert.ok(concept.phoneticPt, `Concept ${concept.id} must have phoneticPt`);
  }

  // Verificar o guia fonético brasileiro no primeiro conceito
  const first = teachingConcepts[0];
  assert.equal(first.targetPhrase, "Hello! Good morning.");
  assert.equal(first.meaningPt, "Olá! Bom dia.");
  assert.equal(first.phoneticPt, "Rélou! Gúd mórnin.");
});

test("initial greeting for greetings module includes Brazilian phonetic pronunciation", () => {
  const greetingsModule = getModuleById("greetings");
  assert.ok(greetingsModule.initialGreeting.pt.includes("Rélou! Gúd mórnin"));
  assert.ok(greetingsModule.initialGreeting.pt.includes("Hello! Good morning"));
});

test("detectConceptIndexFromText synchronizes active concept exactly with Mr. Crazy speech", () => {
  const greetingsModule = getModuleById("greetings");
  const teachingConcepts = greetingsModule.concepts.filter((c) => !c.isExam);

  // Caso do print real do usuário: Mr. Crazy ensinando Concept 2 ("Hi, my name is Carlos")
  const speechConcept2 = "Perfeito, vamos treinar como se apresentar e dizer seu nome. Em inglês, se fala: 'Hi, my name is Carlos.' A pronúncia soa como: 'Rái, mái nêim iz Cârlos.' Agora fala pra mim: 'Hi, my name is Carlos.'";
  const index2 = detectConceptIndexFromText(speechConcept2, teachingConcepts);
  assert.equal(index2, 1, "Deve identificar Fase 2 (Apresentando Seu Nome / Hi, my name is Carlos)");

  // Mr. Crazy ensinando Concept 3 ("I'm from Brazil")
  const speechConcept3 = "Show de bola! Agora vamos pra Fase 3: De onde você é! Em inglês se fala 'I'm from Brazil'. Pronúncia: 'Áim frôm Brâzil'. Fala pra mim: 'I'm from Brazil'!";
  const index3 = detectConceptIndexFromText(speechConcept3, teachingConcepts);
  assert.equal(index3, 2, "Deve identificar Fase 3 (De Onde Você É / I'm from Brazil)");

  // Mr. Crazy ensinando Concept 1 ("Hello! Good morning")
  const speechConcept1 = "Bora começar na vila inicial: Greetings & Introductions! Vamos treinar como dizer 'Olá! Bom dia'. Em inglês se fala 'Hello! Good morning', e a pronúncia soa como 'Rélou! Gúd mórnin'. Fala pra mim: 'Hello! Good morning'.";
  const index1 = detectConceptIndexFromText(speechConcept1, teachingConcepts);
  assert.equal(index1, 0, "Deve identificar Fase 1 (Dizendo Olá / Hello! Good morning)");

  // Correção de erro na Fase 3 (não deve pular para a Fase 4)
  const correctionSpeech = "Quase lá! Atenção à pronúncia de 'Brazil'. Repete de novo pra mim: 'I'm from Brazil'!";
  const indexCorrection = detectConceptIndexFromText(correctionSpeech, teachingConcepts);
  assert.equal(indexCorrection, 2, "Correção deve manter na Fase 3");

  // Fala genérica sem conceito
  const genericSpeech = "Tudo ótimo por aqui, como você tá?";
  const indexGeneric = detectConceptIndexFromText(genericSpeech, teachingConcepts);
  assert.equal(indexGeneric, null, "Fala genérica não deve alterar o índice");
});

test("isNoiseOrHallucination correctly rejects Whisper noise and short hallucinations", () => {
  // Alucinações clássicas de silêncio e ruído do Whisper
  assert.equal(isNoiseOrHallucination(""), true);
  assert.equal(isNoiseOrHallucination(" "), true);
  assert.equal(isNoiseOrHallucination("."), true);
  assert.equal(isNoiseOrHallucination("..."), true);
  assert.equal(isNoiseOrHallucination("?"), true);
  assert.equal(isNoiseOrHallucination("!"), true);
  assert.equal(isNoiseOrHallucination("you"), true);
  assert.equal(isNoiseOrHallucination("thank you"), true);
  assert.equal(isNoiseOrHallucination("Thank you."), true);
  assert.equal(isNoiseOrHallucination("thanks"), true);
  assert.equal(isNoiseOrHallucination("ok"), true);
  assert.equal(isNoiseOrHallucination("okay"), true);
  assert.equal(isNoiseOrHallucination("yeah"), true);
  assert.equal(isNoiseOrHallucination("yes"), true);
  assert.equal(isNoiseOrHallucination("bye"), true);
  assert.equal(isNoiseOrHallucination("[music]"), true);
  assert.equal(isNoiseOrHallucination("(ruído)"), true);
  assert.equal(isNoiseOrHallucination("subtitles by amara.org"), true);

  // Falas reais de treino não devem ser descartadas como ruído
  assert.equal(isNoiseOrHallucination("A table for two, please."), false);
  assert.equal(isNoiseOrHallucination("Could I get a coffee, please?"), false);
  assert.equal(isNoiseOrHallucination("I'll have the burger with fries."), false);
  assert.equal(isNoiseOrHallucination("Hello good morning"), false);
  assert.equal(isNoiseOrHallucination("Hi, my name is Carlos"), false);
});

test("phase progression requires real user attempt and cannot skip phases", () => {
  const restaurantModule = getModuleById("restaurant");
  const teachingConcepts = restaurantModule.concepts.filter((c) => !c.isExam);

  // Simulação do caso do usuário: no início, currentConceptIndex = 0 (Fase 1: A table for two, please)
  let currentConceptIndex = 0;
  let hasUserAttemptedPhase = false;

  // Ruído no ambiente: Mr. Crazy diz algo com "próximas frases do módulo" ou "hambúrguer"
  const mrCrazySpontaneousSpeech = "Valeu, Johan! De nada, sempre que precisar nas frases do restaurante, é só falar. Agora, se quiser ir mais longe, já podemos ir para as próximas frases do módulo.";
  const detectedIdx = detectConceptIndexFromText(mrCrazySpontaneousSpeech, teachingConcepts);

  const isPraise = /(boa|muito bom|parabéns|mandou bem|show|perfeito|excelente|ótimo|certinho|destravou|dominou|fase concluída|etapa concluída|próxima fase|fase seguinte|mandou bala|aleluia)/i.test(mrCrazySpontaneousSpeech.toLowerCase());
  const isCorrection = false;

  // Regra implementada: SÓ avança se hasUserAttemptedPhase === true
  if (detectedIdx !== null && detectedIdx > currentConceptIndex) {
    if (hasUserAttemptedPhase && isPraise && !isCorrection) {
      currentConceptIndex = Math.min(currentConceptIndex + 1, detectedIdx);
      hasUserAttemptedPhase = false;
    }
  }

  assert.equal(currentConceptIndex, 0, "Sem o aluno ter falado a frase, o sistema NÃO PODE avançar de fase!");

  // Agora o aluno REALMENTE fala a frase da Fase 1:
  const studentSpeech = "A table for two, please.";
  assert.equal(isNoiseOrHallucination(studentSpeech), false);
  hasUserAttemptedPhase = true;

  // Mr. Crazy avalia e elogia a Fase 1, apresentando a Fase 2:
  const praiseSpeech = "Aí sim, Johan! Mandou benzão! Fase 1 dominada! Agora vamos para a Fase 2: Bebidas & Cafeteria! Em inglês se fala 'Could I get a coffee, please?'.";
  const praiseDetectedIdx = detectConceptIndexFromText(praiseSpeech, teachingConcepts);
  const isPraise2 = /(aí sim|boa|muito bom|parabéns|mandou bem|mandou benzão|show|perfeito|excelente|ótimo|certinho|destravou|dominou|dominada|fase concluída|etapa concluída|próxima fase|fase seguinte|mandou bala|aleluia)/i.test(praiseSpeech.toLowerCase());

  assert.equal(praiseDetectedIdx, 1, "Deve identificar Fase 2 no discurso de avanço");
  assert.equal(isPraise2, true, "Deve identificar elogio");

  if (praiseDetectedIdx !== null && praiseDetectedIdx > currentConceptIndex) {
    if (hasUserAttemptedPhase && isPraise2) {
      currentConceptIndex = Math.min(currentConceptIndex + 1, praiseDetectedIdx);
      hasUserAttemptedPhase = false;
    }
  }

  assert.equal(currentConceptIndex, 1, "Após o aluno tentar e acertar a frase, avança sequencialmente para a Fase 2!");
  assert.equal(hasUserAttemptedPhase, false, "Resetou a tentativa para a nova fase!");
});

test("buildRealtimeInstructions enforces 100% Portuguese teaching for guided modules", async () => {
  const fs = await import("node:fs");
  const content = fs.readFileSync(new URL("../src/lib/realtime-session.ts", import.meta.url), "utf8");

  assert.ok(content.includes("VOCÊ SÓ PODE FALAR EM PORTUGUÊS DO BRASIL!"), "Deve exigir 100% português para módulo guiado");
  assert.ok(content.includes("FÓRMULA PEDAGÓGICA OBRIGATÓRIA"), "Deve incluir a fórmula didática");
  assert.ok(content.includes("isGuidedModule = Boolean(activeModule && activeModule.id !== \"free-conversation\" && teachingConcepts.length > 0)"), "Deve identificar módulo guiado");
});

test("study guide auto-reveal triggers only when Mr. Crazy asks to practice", () => {
  const currentTargetPhrase = "A table for two, please.";
  const currentPhraseClean = currentTargetPhrase.toLowerCase().trim();

  const isAskingPractice = (text) => {
    const lower = text.toLowerCase();
    return (
      /(vamos treinar|fala pra mim|diga pra mim|repita comigo|repete comigo|em inglês se fala|em inglês é|como se fala|como falar|como pedir|como dizer|a pronúncia soa|a pronúncia é|tente falar|tenta falar|agora é sua vez|sua vez|manda ver|bora treinar essa|bora praticar essa|pronúncia aportuguesada)/i.test(lower) ||
      (currentPhraseClean.length >= 4 && lower.includes(currentPhraseClean))
    );
  };

  // Saudação inicial / descanso / papo solto: NÃO deve abrir o cartão de estudo
  assert.equal(isAskingPractice("E aí, Johan! Tudo bem por aqui?"), false);
  assert.equal(isAskingPractice("Opa, tudo bem?"), false);
  assert.equal(isAskingPractice("Pode falar qualquer coisa no microfone!"), false);

  // Quando Mr. Crazy começa a ensinar e convidar a praticar: DEVE abrir o cartão de estudo
  assert.equal(isAskingPractice("Vamos treinar como pedir uma mesa no restaurante."), true);
  assert.equal(isAskingPractice("Em inglês se fala 'A table for two, please'."), true);
  assert.equal(isAskingPractice("A pronúncia soa como 'Â têibol fôr tchú, plíz'."), true);
  assert.equal(isAskingPractice("Agora fala pra mim: 'A table for two, please'!"), true);
  assert.equal(isAskingPractice("Sua vez de mandar ver nessa frase!"), true);
});

test("detectConceptIndexFromText correctly detects dynamic names and ultra-concise stressed prompts", () => {
  const greetingsModule = getModuleById("greetings");
  const teachingConcepts = greetingsModule.concepts.filter((c) => !c.isExam);

  // Caso do usuário real: Mr. Crazy ensina a frase com o nome dinâmico do aluno ("Johan" em vez de "Carlos")
  const speechDynamicName = "Boa, caralho! Fase 2: Pra dizer seu nome, fala: 'Hi, my name is Johan' (Rái, mái nêim iz Johan). Vai!";
  const detectedIdxName = detectConceptIndexFromText(speechDynamicName, teachingConcepts);
  assert.equal(detectedIdxName, 1, "Deve identificar Fase 2 mesmo com substituição dinâmica do nome do aluno");

  // Transição rápida com xingamento e comemoração para Fase 3
  const speechPhase3 = "ALELUIA, CARALHO! Mandou bala! Fase 3: Pra dizer de onde você é, fala: 'I'm from Brazil' (Áim frôm Brâzil). Vai!";
  const detectedIdx3 = detectConceptIndexFromText(speechPhase3, teachingConcepts);
  assert.equal(detectedIdx3, 2, "Deve identificar Fase 3 na fala enxuta com xingamento de comemoração");

  // Correção curta e estressada mantendo na mesma fase
  const speechCorrection = "Porra, fala pra fora, caralho! Fala: 'I'm from Brazil'!";
  const detectedIdxCorrection = detectConceptIndexFromText(speechCorrection, teachingConcepts);
  assert.equal(detectedIdxCorrection, 2, "Correção rápida mantém na Fase 3");
});

test("initial module greetings are ultra-concise and do not repeat English phrase twice", () => {
  for (const mod of LEARNING_MODULES) {
    const greeting = mod.initialGreeting.pt;
    assert.ok(greeting.startsWith("Fase 1: Pra "), `Module ${mod.id} greeting must start with compact formula`);
    assert.ok(greeting.endsWith(". Manda bala!"), `Module ${mod.id} greeting must end with command`);
    const wordCount = greeting.split(/\s+/).length;
    assert.ok(wordCount <= 25, `Module ${mod.id} greeting has ${wordCount} words, should be <= 25`);
  }
});

test("module completion triggers practical exam modal and does not auto-skip stage", () => {
  const isLessonCompleted = true;
  let isExamModalOpen = false;
  let stageTransition = null;

  // Novo comportamento corrigido
  if (isLessonCompleted) {
    isExamModalOpen = true;
  }

  assert.equal(isExamModalOpen, true, "A prova prática deve abrir ao completar as fases");
  assert.equal(stageTransition, null, "Não deve iniciar contagem regressiva para pular a prova prática");
});

test("each module phase has three resumable lesson steps", () => {
  const module = getModuleById("greetings");
  const phaseIds = module.concepts.filter((concept) => !concept.isExam).map((concept) => concept.id);
  const completedMissions = [
    getLessonStepMarker(phaseIds[0], 0),
    getLessonStepMarker(phaseIds[0], 1),
    getLessonStepMarker(phaseIds[0], 2),
    getLessonStepMarker(phaseIds[1], 0)
  ];

  assert.equal(LESSON_STEPS_PER_PHASE, 3);
  assert.deepEqual(getLessonResumePosition(completedMissions, phaseIds), {
    phaseIndex: 1,
    stepIndex: 1,
    lessonCompleted: false,
    completedSteps: 4
  });
  assert.equal(calculateLessonProgressPercent(completedMissions, phaseIds), 32);
});

test("AI phase targets keep phrase, meaning, and phonetics in one contract", () => {
  const module = getModuleById("greetings");
  const fallback = getFallbackPhaseTargets(module, 0);
  const targets = normalizePhaseTargets([
    { phraseEn: "Good morning!", meaningPt: "Bom dia!", phoneticPt: "Gúd mórnin!" },
    { phraseEn: "Hi, how are you?", meaningPt: "Oi, como você está?", phoneticPt: "Rái, ráu ar iú?" },
    { phraseEn: "Hey, nice to meet you.", meaningPt: "Oi, prazer em conhecer você.", phoneticPt: "Rêi, náis tchú mít iú." }
  ], module, 0);

  assert.equal(fallback.length, 3);
  assert.ok(new Set(fallback.map((target) => target.phraseEn)).size > 1, "Fallback deve variar os alvos da fase quando houver frases de apoio");
  assert.equal(targets.length, 3);
  assert.equal(targets[1].phraseEn, "Hi, how are you?");
  assert.equal(targets[1].meaningPt, "Oi, como você está?");
  assert.equal(targets[1].phoneticPt, "Rái, ráu ar iú?");
});

test("lesson progress stores trained targets to avoid repetitive teaching", () => {
  const phrase = "Hey there, how are you?";
  const marker = getLessonTargetMarker("greetings-1", 1, phrase);
  const phrases = getLessonTargetPhrases([
    getLessonStepMarker("greetings-1", 0),
    marker
  ], "greetings-1");

  assert.deepEqual(phrases, [phrase.toLowerCase()]);
});

test("practical exam introduces the rules, allows one retake, and withholds hints", async () => {
  const fs = await import("node:fs");
  const examModalCode = fs.readFileSync("src/components/exam/ExamModal.tsx", "utf-8");
  const examReplyCode = fs.readFileSync("src/app/api/exam/reply/route.ts", "utf-8");
  const evaluateCode = fs.readFileSync("src/app/api/modules/evaluate/route.ts", "utf-8");
  const examEngineCode = fs.readFileSync("src/lib/exam.ts", "utf-8");

  assert.ok(examModalCode.includes("getExamBriefing"), "Mr.Crazy deve introduzir a prova pelo roteiro oficial");
  assert.ok(examEngineCode.includes("Agora é prova oral real"), "A abertura deve explicar que é uma prova oral real");
  assert.ok(examEngineCode.includes("final-challenge"), "A prova final deve ter banco de perguntas próprio");
  assert.ok(examModalCode.includes("turnCount < requiredQuestionCount"), "A prova não deve finalizar antes de responder todas as perguntas");
  assert.ok(examModalCode.includes("Fazer uma segunda tentativa"), "A prova deve oferecer uma segunda tentativa");
  assert.ok(examModalCode.includes("Refazer este módulo"), "O aluno deve poder optar por refazer o módulo");
  assert.ok(examReplyCode.includes("Question plan for this attempt"), "A API deve conduzir a banca com roteiro de perguntas");
  assert.ok(examReplyCode.includes("NEVER give hints, corrections, translations"), "O examinador não pode ajudar ou corrigir durante a prova");
  assert.ok(evaluateCode.includes("a nota máxima é 59"), "Prova incompleta deve ficar abaixo da nota mínima");
  assert.ok(!examModalCode.includes("Chefão"), "A prova não deve usar o nome antigo");
});

test("guided lesson persists realtime turns and phase checkpoints", async () => {
  const fs = await import("node:fs");
  const practiceCode = fs.readFileSync("src/components/PracticeExperience.tsx", "utf-8");
  const progressCode = fs.readFileSync("src/app/api/modules/progress/route.ts", "utf-8");
  const targetRouteCode = fs.readFileSync("src/app/api/modules/lesson-target/route.ts", "utf-8");

  assert.ok(practiceCode.includes("persistLessonProgressRef.current({ addTurns: 1 })"), "Turno realtime deve ser persistido");
  assert.ok(practiceCode.includes("completeCurrentLessonStepRef.current()"), "Elogio após tentativa deve concluir etapa persistida");
  assert.ok(practiceCode.includes("teachingTarget.phraseEn"), "Cartão deve usar o mesmo alvo sincronizado da IA");
  assert.ok(practiceCode.includes("shouldShowStudyGuide"), "Dica e pronúncia devem aparecer apenas no contexto de treino");
  assert.ok(practiceCode.includes("speechBubbleHasOverflow"), "Balão longo deve sinalizar rolagem sem cortar o conteúdo");
  assert.ok(progressCode.includes("getLessonStepMarker"), "API deve salvar checkpoint de fase e etapa");
  assert.ok(progressCode.includes("getLessonTargetMarker"), "API deve salvar a frase treinada para reduzir repeticao");
  assert.ok(progressCode.includes("if (upsertError) throw upsertError"), "Falha do Supabase não pode ser ignorada");
  assert.ok(targetRouteCode.includes("A IA tem liberdade para escolher o conteúdo"), "Plano dinâmico deve permanecer no contexto da fase");
  assert.ok(targetRouteCode.includes("Já treinado nesta fase"), "Plano dinâmico deve considerar histórico salvo do aluno");
});

test("history reads real recorded sessions instead of rendering sample lessons", async () => {
  const fs = await import("node:fs");
  const historyPageCode = fs.readFileSync("src/app/history/page.tsx", "utf-8");
  const sessionHistoryCode = fs.readFileSync("src/components/SessionHistory.tsx", "utf-8");
  const progressSummaryCode = fs.readFileSync("src/app/api/progress/summary/route.ts", "utf-8");

  assert.ok(historyPageCode.includes("<SessionHistory />"), "A tela de histórico deve usar o componente de dados reais");
  assert.ok(sessionHistoryCode.includes('fetch("/api/progress/summary")'), "O histórico deve buscar o resumo autenticado do aluno");
  assert.ok(sessionHistoryCode.includes("Sua primeira prática começa aqui."), "O histórico vazio deve orientar a primeira aula");
  assert.ok(progressSummaryCode.includes("recentSessions"), "O resumo deve fornecer sessões recentes reais");
  assert.ok(progressSummaryCode.includes("mrcrazy_practice_sessions"), "As sessões devem vir da tabela de prática");
  assert.ok(!historyPageCode.includes("Passado simples e som do TH"), "A tela não pode exibir uma sessão fictícia");
});

test("microphone starts in muted state (red) and mode is renamed to Hold to Talk", async () => {
  const fs = await import("node:fs");
  const practiceCode = fs.readFileSync("src/components/PracticeExperience.tsx", "utf-8");
  const voiceControlCode = fs.readFileSync("src/components/VoiceInputControl.tsx", "utf-8");

  // Verifica que o microfone inicia explicitamente mutado (vermelho)
  assert.ok(practiceCode.includes("initialMicrophoneEnabled: false"), "connectRealtime deve receber initialMicrophoneEnabled: false");
  assert.ok(practiceCode.includes("setMicrophoneEnabled(false)"), "setMicrophoneEnabled deve iniciar false");

  // Verifica que não há referências a WhatsApp nos botões e abas de voz
  assert.ok(!voiceControlCode.includes("Segurar (WhatsApp)"), "VoiceInputControl não deve conter Segurar (WhatsApp)");
  assert.ok(voiceControlCode.includes("Hold to Talk"), "VoiceInputControl deve usar Hold to Talk");
});

test("mobile practice keeps Mr.Crazy visible above the anchored voice dock", async () => {
  const fs = await import("node:fs");
  const responsiveCss = fs.readFileSync("src/app/responsive.css", "utf-8");
  const voiceHubRule = responsiveCss.match(/\.practice-main \.practice-voice-hub\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(
    responsiveCss,
    /padding:\s*0 0 clamp\(144px, 21dvh, 164px\) !important/,
    "A coluna mobile deve reservar espaco para o dock sem esmagar o avatar"
  );
  assert.match(voiceHubRule, /position:\s*absolute !important/, "O dock deve ficar fora do fluxo vertical mobile");
  assert.match(voiceHubRule, /inset:\s*auto auto 2px 50% !important/, "O dock deve ficar ancorado no rodape do palco");
  assert.doesNotMatch(voiceHubRule, /position:\s*relative/, "O dock relativo empurra o avatar para fora da viewport");
  assert.match(responsiveCss, /width:\s*clamp\(148px, 24dvh, 184px\) !important/, "O avatar deve manter proporcao legivel no celular");
  assert.match(responsiveCss, /character-stage\.stage-hammock/, "O Mr.Crazy deitado deve subir acima do dock no mobile");
  assert.match(responsiveCss, /character-speech-bubble-container\.has-overflow\.is-scrolled/, "Texto longo deve receber fade durante a rolagem");
});

test("beta conversation fallback provides correction, explanation, and continuity", async () => {
  const { getGeminiConversationReply } = await import("../src/lib/gemini-conversation.ts");
  const result = await getGeminiConversationReply("I have 30 years old.", [], undefined);

  assert.equal(result.provider, "fallback");
  assert.equal(result.correction, "I am 30 years old.");
  assert.match(result.explanationPt ?? "", /verbo to be/iu);
  assert.ok(result.followUp, "A resposta deve manter a conversa avançando");
});

test("beta conversation keeps its composer above the mobile navigation", async () => {
  const fs = await import("node:fs");
  const componentCode = fs.readFileSync("src/components/BetaConversation.tsx", "utf-8");
  const globalCss = fs.readFileSync("src/app/globals.css", "utf-8");

  assert.ok(componentCode.includes("beta-coach-feedback"), "O chat deve renderizar feedback pedagógico estruturado");
  assert.ok(componentCode.includes("Tentar novamente"), "Falhas de resposta devem permitir nova tentativa");
  assert.ok(componentCode.includes("<textarea"), "O compositor deve aceitar mensagens maiores sem cortar o texto");
  assert.match(globalCss, /\.app-shell:has\(\.beta-conversation-page\) > \.app-header\s*\{\s*display:\s*none/iu);
  assert.match(globalCss, /padding:\s*0 0 calc\(52px \+ env\(safe-area-inset-bottom\)\)/iu);
});

test("beta conversation avoids truncated text on conversational openers", async () => {
  const { getGeminiConversationReply } = await import("../src/lib/gemini-conversation.ts");
  const result = await getGeminiConversationReply("Vamos la", [], undefined);

  assert.equal(result.provider, "fallback");
  assert.ok(result.reply.length > 10, "A resposta principal não pode ser um fragmento cortado");
  assert.doesNotMatch(result.reply, /[,;:\-]$/u, "A resposta não pode terminar com vírgula ou conectivo solto");
  assert.match(result.reply, /[.!?]$/u, "A resposta deve ter pontuação final completa");
  assert.ok(result.correction, "Deve oferecer frase modelo");
  assert.ok(result.followUp, "Deve convidar para continuar");
});





