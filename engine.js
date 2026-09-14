import { TRAITS, questions, characters } from "./data.js";
export const TRAIT_WEIGHTS = Object.fromEntries(TRAITS.map((key) => [key, 1]));
export function calculateTraits(answers) {
  if (
    !Array.isArray(answers) ||
    answers.length !== questions.length ||
    Array.from(answers).some((a) => !Number.isInteger(a) || a < 0 || a > 3)
  )
    throw new TypeError("28問すべてに0〜3で回答してください。");
  return Object.fromEntries(
    TRAITS.map((key) => {
      let positive = 0,
        negative = 0,
        positiveWeight = 0,
        negativeWeight = 0;
      questions.forEach((q, i) => {
        const w = q.weights[key] || 0;
        if (w > 0) {
          positive += answers[i] * w;
          positiveWeight += w;
        }
        if (w < 0) {
          negative += (3 - answers[i]) * -w;
          negativeWeight -= w;
        }
      });
      // 肯定・逆転それぞれの総重みを揃え、同じボタンの連打を高得点にしない。
      return [
        key,
        Math.max(
          0,
          Math.min(
            100,
            50 *
              (positive / (3 * positiveWeight) +
                negative / (3 * negativeWeight)),
          ),
        ),
      ];
    }),
  );
}
export function calculateSimilarity(distance) {
  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        100 -
          (distance /
            Math.sqrt(
              Object.values(TRAIT_WEIGHTS).reduce((a, b) => a + b, 0),
            )) *
            1.7,
      ),
    ),
  );
}
export function rankCharacters(userTraits, roster = characters) {
  if (
    TRAITS.some(
      (key) =>
        !Number.isFinite(userTraits?.[key]) ||
        userTraits[key] < 0 ||
        userTraits[key] > 100,
    )
  )
    throw new TypeError("性格スコアが不正です。");
  return roster
    .map((character, index) => {
      const distance = Math.sqrt(
        TRAITS.reduce(
          (sum, key) =>
            sum +
            TRAIT_WEIGHTS[key] * (userTraits[key] - character.traits[key]) ** 2,
          0,
        ),
      );
      const primaryDistance = character.primaryTraits.reduce(
        (sum, key) => sum + (userTraits[key] - character.traits[key]) ** 2,
        0,
      );
      return {
        character,
        distance,
        primaryDistance,
        similarity: calculateSimilarity(distance),
        index,
      };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.primaryDistance - b.primaryDistance ||
        a.index - b.index,
    );
}
export function diagnose(answers) {
  const traits = calculateTraits(answers);
  return { traits, ranking: rankCharacters(traits) };
}
export function seededRandom(seed = 20260914) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function simulateDiagnoses(count = 10000, seed = 20260914) {
  if (!Number.isInteger(count) || count < 1 || count > 100000)
    throw new RangeError("回数は1〜100000の整数です。");
  const random = seededRandom(seed),
    counts = Object.fromEntries(characters.map((c) => [c.id, 0]));
  for (let i = 0; i < count; i++)
    counts[
      diagnose(questions.map(() => Math.floor(random() * 4))).ranking[0]
        .character.id
    ]++;
  return characters.map((c) => ({
    Character: c.name,
    id: c.id,
    Count: counts[c.id],
    Rate: Math.round((counts[c.id] / count) * 10000) / 100,
  }));
}
export const runRandomSimulation = simulateDiagnoses;
