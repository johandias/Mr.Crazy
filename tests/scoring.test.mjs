import assert from "node:assert/strict";
import test from "node:test";

import { calibrateAttemptMetrics } from "../src/lib/mr-crazy.ts";

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
