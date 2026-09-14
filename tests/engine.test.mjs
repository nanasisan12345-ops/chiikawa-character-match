import { test } from "node:test";
import assert from "node:assert/strict";
import { TRAITS, questions, characters } from "../data.js";
import {
  calculateTraits,
  diagnose,
  rankCharacters,
  calculateSimilarity,
} from "../engine.js";
test("28問・20キャラ・16軸のデータ契約", () => {
  assert.equal(questions.length, 28);
  assert.equal(characters.length, 20);
  assert.equal(TRAITS.length, 16);
  assert.equal(new Set(characters.map((c) => c.id)).size, 20);
  for (const c of characters) {
    assert.equal(Object.keys(c.traits).length, 16);
    for (const v of Object.values(c.traits)) assert.ok(v >= 0 && v <= 100);
    for (const key of [
      "description",
      "strengths",
      "caution",
      "relationships",
      "scenes",
    ])
      assert.ok(c[key].length > 30);
  }
  for (const q of questions)
    assert.ok(
      Object.keys(q.weights).length >= 2 && Object.keys(q.weights).length <= 3,
    );
  for (const key of TRAITS) {
    assert.ok(
      questions.some((q) => q.weights[key] > 0),
      key,
    );
    assert.ok(
      questions.some((q) => q.weights[key] < 0),
      key,
    );
  }
});
test("全軸が0〜100、反対回答のスコアは対称、再現性", () => {
  const a = questions.map((_, i) => i % 4),
    b = a.map((v) => 3 - v),
    ta = calculateTraits(a),
    tb = calculateTraits(b);
  for (const key of TRAITS) {
    assert.ok(ta[key] >= 0 && ta[key] <= 100);
    assert.ok(Math.abs(ta[key] + tb[key] - 100) < 1e-8);
  }
  assert.deepEqual(diagnose(a), diagnose(a));
  assert.equal(diagnose(a).ranking.length, 20);
});
test("欠損・不正な入力を拒否", () => {
  for (const a of [
    null,
    [],
    Array(28),
    Array(28).fill(4),
    Array(28).fill("2"),
    Array(28).fill(NaN),
  ])
    assert.throws(() => calculateTraits(a));
});
test("浮動小数点の端数で100を超えない", () => {
  const a = [
    1, 3, 0, 3, 0, 3, 0, 1, 1, 2, 0, 0, 3, 0, 2, 1, 2, 1, 2, 1, 3, 0, 1, 3, 3,
    2, 3, 3,
  ];
  assert.equal(calculateTraits(a).sociability, 100);
  assert.doesNotThrow(() => diagnose(a));
});
test("全肯定・全否定では全軸が中立となり人気キャラに誘導しない", () => {
  for (const value of [0, 1, 2, 3]) {
    const a = Array(28).fill(value);
    for (const v of Object.values(calculateTraits(a)))
      assert.ok(Math.abs(v - 50) < 1e-9);
    assert.ok(
      !["chiikawa", "hachiware", "usagi"].includes(
        diagnose(a).ranking[0].character.id,
      ),
    );
  }
});
test("完全一致・類似度端点・固定順同点", () => {
  assert.equal(calculateSimilarity(0), 100);
  assert.equal(calculateSimilarity(1000), 0);
  const c = characters[0];
  const copy = { ...c, id: "copy" };
  assert.equal(rankCharacters(c.traits, [c, copy])[0].character.id, c.id);
  assert.equal(rankCharacters(c.traits)[0].similarity, 100);
});
