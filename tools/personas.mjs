import { diagnose } from "../engine.js";
export const personas = [
  [
    "非常に慎重",
    [
      3, 1, 0, 1, 3, 3, 3, 3, 3, 0, 2, 3, 1, 3, 0, 0, 2, 2, 0, 0, 3, 1, 2, 2, 3,
      1, 3, 1,
    ],
    "cautiousness",
  ],
  [
    "非常に社交的",
    [
      0, 3, 2, 3, 0, 2, 2, 0, 1, 1, 3, 0, 3, 1, 3, 2, 1, 2, 3, 2, 2, 2, 3, 3, 1,
      3, 2, 3,
    ],
    "sociability",
  ],
  [
    "非常に行動的",
    [
      0, 3, 3, 2, 1, 2, 2, 0, 0, 2, 2, 1, 3, 1, 3, 3, 2, 1, 3, 3, 1, 3, 3, 2, 1,
      3, 2, 3,
    ],
    "activity",
  ],
  [
    "非常に内向的",
    [
      3, 0, 1, 0, 3, 2, 2, 2, 2, 2, 1, 3, 1, 2, 1, 1, 2, 2, 0, 0, 3, 2, 1, 1, 3,
      1, 2, 0,
    ],
    "sociability",
  ],
  [
    "非常に共感的",
    [
      2, 2, 1, 1, 2, 3, 3, 2, 2, 0, 3, 3, 1, 2, 2, 1, 1, 3, 1, 1, 3, 2, 2, 3, 2,
      2, 3, 2,
    ],
    "empathy",
  ],
  [
    "非常に独立的",
    [
      1, 1, 2, 2, 3, 1, 2, 1, 1, 3, 1, 2, 3, 2, 2, 2, 3, 1, 2, 2, 1, 3, 1, 0, 3,
      2, 2, 1,
    ],
    "independence",
  ],
  [
    "非常に勤勉",
    [
      2, 1, 0, 1, 3, 2, 3, 1, 3, 1, 2, 2, 1, 3, 2, 0, 3, 2, 1, 0, 2, 2, 1, 2, 3,
      1, 3, 1,
    ],
    "diligence",
  ],
  [
    "非常に自由",
    [
      0, 2, 3, 2, 3, 1, 1, 0, 0, 3, 1, 1, 3, 1, 3, 3, 3, 2, 2, 3, 1, 3, 2, 0, 2,
      3, 1, 2,
    ],
    "independence",
  ],
  [
    "非常に感情的",
    [
      3, 2, 3, 3, 0, 2, 2, 3, 1, 2, 2, 2, 3, 1, 0, 3, 3, 2, 2, 3, 3, 2, 3, 2, 2,
      2, 2, 3,
    ],
    "emotionalIntensity",
  ],
  [
    "非常にリーダー型",
    [
      0, 3, 3, 3, 1, 3, 3, 0, 2, 2, 3, 1, 3, 2, 3, 1, 2, 2, 3, 3, 2, 3, 2, 3, 2,
      2, 3, 3,
    ],
    "leadership",
  ],
];
export const personaResults = personas.map(([name, answers, key]) => {
  const result = diagnose(answers);
  return {
    name,
    axis: key,
    score: Math.round(result.traits[key]),
    top3: result.ranking
      .slice(0, 3)
      .map((r) => `${r.character.name} ${r.similarity}%`)
      .join(" / "),
  };
});
if (process.argv[1]?.endsWith("personas.mjs")) console.table(personaResults);
