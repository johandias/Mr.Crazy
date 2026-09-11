import assert from "node:assert/strict";
import test from "node:test";

import { analyzeEnglishSentence, calibrateAttemptMetrics } from "../src/lib/mr-crazy.ts";

function score(learningLevel, mistakeType = "preposition", repeated = false) {
  return calibrateAttemptMetrics({
    correct: false,
    mistakeType,
    learningLevel,
    rawScore: 82,
    rawXpDelta: 8,
    rawCrazyDelta: 10,
    repeated
  });
}

test("minor errors are coached more gently at basic and intermediate levels", () => {
  const basic = score("basic");
  const intermediate = score("intermediate");
  const advanced = score("advanced");

  assert.ok(basic.score >= 82);
  assert.ok(intermediate.score >= 80);
  assert.ok(advanced.score < intermediate.score);
  assert.ok(basic.crazyDelta < advanced.crazyDelta);
});

test("meaning-changing errors lose more points than minor errors", () => {
  const minor = score("basic", "preposition");
  const major = score("basic", "sentence_fragment");

  assert.ok(major.score < minor.score);
  assert.ok(major.crazyDelta > minor.crazyDelta);
});

test("repeated errors receive a modest extra penalty", () => {
  const firstAttempt = score("intermediate", "past_tense");
  const repeatedAttempt = score("intermediate", "past_tense", true);

  assert.equal(repeatedAttempt.score, firstAttempt.score - 3);
  assert.equal(repeatedAttempt.crazyDelta, firstAttempt.crazyDelta + 2);
});

test("requests for explanation are treated as teaching moments", () => {
  const result = analyzeEnglishSentence({
    sentence: "Não entendi o erro",
    mode: "free-conversation",
    learningLevel: "basic",
    contextHistory: [{ role: "crazy", text: 'Responde isso: "What did you do today?"' }]
  });

  assert.equal(result.correct, true);
  assert.equal(result.mistake_type, "learning_request");
  assert.match(result.correction, /What did you do today/u);
  assert.ok(result.crazy_delta < 0);
});

test("pronunciation help is not scored as a wrong English attempt", () => {
  const result = analyzeEnglishSentence({
    sentence: "Me ajuda com a pronúncia de beautiful",
    mode: "free-conversation",
    learningLevel: "basic"
  });

  assert.equal(result.correct, true);
  assert.equal(result.mistake_type, "learning_request");
  assert.equal(result.corrected_sentence, "beautiful");
  assert.match(result.follow_up, /beautiful/u);
});

test("help request extracts the target phrase instead of translating the request", () => {
  const result = analyzeEnglishSentence({
    sentence: "me ajude a falar eu quero beber agua",
    mode: "free-conversation",
    learningLevel: "basic"
  });

  assert.equal(result.correct, true);
  assert.equal(result.mistake_type, "learning_request");
  assert.equal(result.corrected_sentence, "I want to drink water.");
  assert.match(result.correction, /I want to drink water/u);
  assert.doesNotMatch(result.corrected_sentence, /help me say/u);
});

test("consecutive repeated mistakes teach an easier alternative", () => {
  const result = analyzeEnglishSentence({
    sentence: "I need go home.",
    mode: "free-conversation",
    learningLevel: "basic",
    previousMistakes: ["preposition"]
  });

  assert.equal(result.correct, false);
  assert.equal(result.mistake_type, "preposition");
  assert.match(result.reaction, /(cabaço|ChatGPT|burro|cabeça de vento)/u);
  assert.match(result.follow_up, /I have to go home/u);
});
