import { TRAITS, questions, characters } from "./data.js?v=3";
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
      let dot = 0,
        userNorm = 0,
        characterNorm = 0;
      for (const key of TRAITS) {
        const x = userTraits[key] - 50,
          y = character.traits[key] - 50,
          w = TRAIT_WEIGHTS[key];
        dot += w * x * y;
        userNorm += w * x * x;
        characterNorm += w * y * y;
      }
      const cosine =
        userNorm < 1e-10
          ? 0
          : Math.max(
              -1,
              Math.min(1, dot / Math.sqrt(userNorm * characterNorm)),
            );
      const directionDistance =
        userNorm < 1e-10 ? distance : Math.sqrt(2 - 2 * cosine);
      return {
        character,
        distance,
        primaryDistance,
        // 0=共通する特徴の方向がない、100=特徴の方向が完全一致。
        // 全キャラ共通の平方根スケール。順位への固定加点・乱数補正はしない。
        similarity: Math.round(100 * Math.sqrt(Math.max(0, cosine))),
        directionDistance,
        cosine,
        index,
      };
    })
    .sort(
      (a, b) =>
        a.directionDistance - b.directionDistance ||
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

const traitPhrases = {
  sociability: ["少人数でじっくり", "人との交流を楽しむ"],
  cautiousness: ["思い切りよく動く", "慎重に確かめる"],
  activity: ["考えてから動く", "まず行動に移す"],
  selfExpression: ["控えめに思いを伝える", "自分の思いを表す"],
  calmness: ["気持ちが動きやすい", "落ち着いて受け止める"],
  responsibility: ["柔軟に役割を変える", "責任を持ってやり切る"],
  diligence: ["その時の興味を大切に", "地道に積み重ねる"],
  empathy: ["自分の気持ちも大切に", "人の気持ちに寄り添う"],
  independence: ["周りと相談して進む", "自分の判断で進む"],
  sensitivity: ["細かなことを引きずらない", "小さな変化に気づく"],
  curiosity: ["慣れたものを楽しむ", "新しいことを試す"],
  optimism: ["先の心配もよく考える", "前向きに切り替える"],
  leadership: ["支える役割を大切に", "先頭に立って導く"],
  creativity: ["決まった方法を活かす", "工夫して形にする"],
  cooperation: ["自分のペースを大切に", "仲間と力を合わせる"],
  emotionalIntensity: ["穏やかに感情を受け止める", "思いを強く持つ"],
};
export function getMatchReasons(traits, character) {
  return TRAITS.map((key) => ({
    key,
    strength: (traits[key] - 50) * (character.traits[key] - 50),
  }))
    .filter((x) => x.strength > 20)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map((x) => traitPhrases[x.key][traits[x.key] >= 50 ? 1 : 0]);
}
