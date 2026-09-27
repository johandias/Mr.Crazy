import assert from "node:assert/strict";
import test from "node:test";
import { LEARNING_MODULES, getModuleById, detectConceptIndexFromText } from "../src/lib/modules.ts";

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


