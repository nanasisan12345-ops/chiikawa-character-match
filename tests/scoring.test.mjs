import { test } from "node:test";
import assert from "node:assert/strict";
import { TRAITS, characters } from "../data.js";
import { rankCharacters, getMatchReasons } from "../engine.js";
test("特徴の方向が同じなら、強さの違いだけで一致度が下がらない", () => {
  const c = characters[0],
    mild = Object.fromEntries(
      TRAITS.map((k) => [k, 50 + (c.traits[k] - 50) * 0.5]),
    );
  assert.equal(rankCharacters(mild)[0].character.id, c.id);
  assert.equal(rankCharacters(mild)[0].similarity, 100);
});
test("同じ特徴のキャラ同士に順位別の固定差を付けない", () => {
  const c = characters[0];
  const r = rankCharacters(c.traits, [c, { ...c, id: "same" }]);
  assert.equal(r[0].similarity, r[1].similarity);
});
test("一致理由は双方が中立から同じ方向に持つ特徴だけを使う", () => {
  const c = characters[0];
  assert.equal(getMatchReasons(c.traits, c).length, 2);
  assert.deepEqual(
    getMatchReasons(Object.fromEntries(TRAITS.map((k) => [k, 50])), c),
    [],
  );
  const r = rankCharacters(Object.fromEntries(TRAITS.map((k) => [k, 50])));
  assert.ok(
    r.every((x) => Number.isFinite(x.similarity) && x.similarity === 0),
  );
});
