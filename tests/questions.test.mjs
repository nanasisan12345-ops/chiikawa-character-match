import { test } from "node:test";
import assert from "node:assert/strict";
import {
  questionBank,
  createQuestionSet,
  validateQuestionSet,
  legacyQuestionSet,
  canonicalAnswers,
  getQuestion,
} from "../question-bank.js";
import { diagnose } from "../engine.js";
test("84シーン・4択・測定枠の欠落なし", () => {
  assert.equal(questionBank.flat().length, 84);
  assert.equal(new Set(questionBank.flat().map((q) => q.text)).size, 84);
  for (const q of questionBank.flat()) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.text.length > 10);
  }
});
test("毎回28問、作品シーン10問、直前と全問が異なる", () => {
  let previous = [];
  for (let seed = 0; seed < 100; seed++) {
    const next = createQuestionSet(seed, previous);
    assert.ok(validateQuestionSet(next));
    assert.equal(next.filter((q) => getQuestion(q).story).length, 10);
    for (const q of next)
      assert.ok(
        !previous.some((p) => p.slot === q.slot && p.variant === q.variant),
      );
    previous = next;
  }
});
test("質問セットと回答が同じなら再現し、順番は採点に影響しない", () => {
  const set = createQuestionSet(42),
    answers = set.map((q) => q.slot % 4),
    canonical = canonicalAnswers(answers, set);
  assert.deepEqual(
    canonical,
    Array.from({ length: 28 }, (_, i) => i % 4),
  );
  assert.deepEqual(
    diagnose(canonical),
    diagnose(canonicalAnswers([...answers].reverse(), [...set].reverse())),
  );
  assert.deepEqual(createQuestionSet(42), set);
  assert.ok(validateQuestionSet(legacyQuestionSet()));
});
