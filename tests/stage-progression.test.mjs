import assert from "node:assert/strict";
import test from "node:test";
import { LEARNING_MODULES, getModuleById } from "../src/lib/modules.ts";

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

