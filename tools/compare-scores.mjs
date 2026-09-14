import { characters, questions } from "../data.js";
import { diagnose, calculateSimilarity, seededRandom } from "../engine.js";
const r = seededRandom();
let oldGap = 0,
  newGap = 0,
  mean = 0,
  ties = 0,
  oldTies = 0,
  high = 0;
for (let i = 0; i < 10000; i++) {
  const result = diagnose(questions.map(() => Math.floor(r() * 4)));
  const old = [...result.ranking].sort((a, b) => a.distance - b.distance);
  oldGap +=
    calculateSimilarity(old[0].distance) - calculateSimilarity(old[1].distance);
  newGap += result.ranking[0].similarity - result.ranking[1].similarity;
  mean += result.ranking[0].similarity;
  if (result.ranking[0].similarity >= 98) high++;
  if (result.ranking[0].similarity - result.ranking[1].similarity <= 3) ties++;
  if (
    calculateSimilarity(old[0].distance) -
      calculateSimilarity(old[1].distance) <=
    3
  )
    oldTies++;
}
console.log(
  JSON.stringify(
    {
      samples: 10000,
      oldAverageGap: oldGap / 10000,
      newAverageGap: newGap / 10000,
      meanTopScore: mean / 10000,
      oldCloseWithin3: oldTies,
      newCloseWithin3: ties,
      top98OrMore: high,
    },
    null,
    2,
  ),
);
