import { test } from "node:test";
import assert from "node:assert/strict";
import { createQuestionSet } from "../question-bank.js";
import {
  validateProgress,
  loadProgress,
  saveProgress,
  clearProgress,
  STORAGE_KEY,
} from "../storage.js";
const valid = () => ({
  version: 1,
  currentQuestion: 2,
  answers: [3, 2, ...Array(26).fill(null)],
  startedAt: "2026-09-14T00:00:00Z",
});
test("保存・読み込み・削除が他のデータを触らない", () => {
  const map = new Map([["other", "keep"]]);
  const storage = {
    getItem: (k) => map.get(k),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  assert.ok(saveProgress(storage, valid()));
  const restored = loadProgress(storage).data;
  assert.deepEqual(restored.answers, valid().answers);
  assert.equal(restored.version, 2);
  assert.equal(restored.questionSet.length, 28);
  assert.ok(clearProgress(storage));
  assert.equal(map.has(STORAGE_KEY), false);
  assert.equal(map.get("other"), "keep");
});
test("破損・異なるバージョン・穴あき回答・不正な位置を復元しない", () => {
  assert.equal(validateProgress(valid()).currentQuestion, 2);
  for (const data of [
    null,
    { ...valid(), version: 2 },
    { ...valid(), answers: Array(28) },
    { ...valid(), answers: [null, 3, ...Array(26).fill(null)] },
    { ...valid(), currentQuestion: 20 },
    { ...valid(), startedAt: "invalid" },
  ])
    assert.equal(validateProgress(data), null);
  assert.ok(loadProgress({ getItem: () => "{broken" }).error);
});
test("ストレージ拒否・容量不足でも例外を外に出さない", () => {
  const denied = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("denied");
    },
  };
  assert.ok(loadProgress(denied).error);
  assert.equal(saveProgress(denied, valid()), false);
  assert.equal(clearProgress(denied), false);
});
test("v2の質問の並びと回答を保ち、不正な質問セットを拒否", () => {
  const v = { ...valid(), version: 2, questionSet: createQuestionSet(77) };
  assert.deepEqual(validateProgress(v), v);
  assert.equal(
    validateProgress({ ...v, questionSet: v.questionSet.slice(1) }),
    null,
  );
  assert.equal(
    validateProgress({ ...v, questionSet: Array(28).fill(v.questionSet[0]) }),
    null,
  );
  assert.equal(
    validateProgress({
      ...v,
      questionSet: v.questionSet.map((q) => ({ ...q, variant: 99 })),
    }),
    null,
  );
});
test("追加前のv2出題も、追加した種類3・4もそのまま再開できる", () => {
  for (const variants of [[0, 1, 2], [3, 4]]) {
    const questionSet = Array.from({ length: 28 }, (_, slot) => ({
      slot,
      variant: variants[slot % variants.length],
    })).reverse();
    const saved = { ...valid(), version: 2, questionSet };
    assert.deepEqual(validateProgress(saved), saved);
  }
});
