import { writeFile, mkdir } from "node:fs/promises";
import { questions, characters, TRAITS } from "../data.js";
import { calculateTraits, diagnose, simulateDiagnoses } from "../engine.js";
// 代表回答は人物の特徴に合わせて作成。調整は全軸での二乗誤差の最小化のみ。
const error = (answers, target) => {
  const t = calculateTraits(answers);
  return TRAITS.reduce((s, k) => s + (t[k] - target[k]) ** 2, 0);
};
const profiles = characters.map((c) => {
  const answers = questions.map((q) => {
    const entries = Object.entries(q.weights);
    const mean =
      entries.reduce((s, [k, w]) => s + w * (c.traits[k] - 50), 0) /
      entries.reduce((s, [, w]) => s + Math.abs(w), 0);
    return Math.max(0, Math.min(3, Math.round(1.5 + mean / 20)));
  });
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (let i = 0; i < 28; i++) {
      const before = answers[i];
      let best = before,
        score = error(answers, c.traits);
      for (let value = 0; value < 4; value++) {
        answers[i] = value;
        const current = error(answers, c.traits);
        if (current < score - 1e-8) {
          score = current;
          best = value;
        }
      }
      answers[i] = best;
      if (best !== before) changed = true;
    }
    if (!changed) break;
  }
  const result = diagnose(answers);
  return {
    id: c.id,
    name: c.name,
    type: c.typeName,
    answers,
    winner: result.ranking[0].character.id,
    similarity: result.ranking[0].similarity,
    traits: result.traits,
  };
});
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/model-profiles.json",
  JSON.stringify(profiles, null, 2),
);
console.table(
  profiles.map((p) => ({
    name: p.name,
    winner: p.winner,
    similarity: p.similarity,
    answers: p.answers.join(""),
  })),
);
for (const seed of [20260914, 42, 2026]) {
  const rows = simulateDiagnoses(10000, seed);
  console.log(
    "seed",
    seed,
    "min",
    Math.min(...rows.map((r) => r.Rate)),
    "max",
    Math.max(...rows.map((r) => r.Rate)),
  );
}
for (const value of [0, 1, 2, 3])
  console.log(
    "全回答",
    value,
    diagnose(Array(28).fill(value))
      .ranking.slice(0, 3)
      .map((r) => r.character.name),
  );
if (profiles.some((p) => p.id !== p.winner)) process.exitCode = 1;
