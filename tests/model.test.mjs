import { test } from "node:test";
import assert from "node:assert/strict";
import { characters, TRAITS } from "../data.js";
import { diagnose, simulateDiagnoses } from "../engine.js";
export const profileAnswers = {
  chiikawa: "3021132220021210223132323313",
  hachiware: "2223133011213221323133131313",
  usagi: "2212230002213222302313212312",
  momonga: "2033033112103213322133321123",
  kurimanju: "2322330122123331320022011122",
  rakko: "1232232121211320223213113132",
  shisa: "3122133121023320013133133332",
  kani: "2022233220033211330032021222",
  anoko: "2112330112023311311103001120",
  dekatsuyo: "3031123321033111333131313121",
  kabutomushi: "2331032111013322300331121313",
  ode: "1323132020213212300320222130",
  shimajiro: "1333232120323321322223022133",
  pochetteArmor: "2132233211223321330031123223",
  workerArmor: "2122233221121220013003122032",
  ramenArmor: "2310231122023310333001103330",
  chimera: "2121122112313213313312311211",
  goblin: "2321233121122111001100132031",
  siren: "1032122122112301332231302120",
  muchauman: "1223131021313321323223121333",
};
test("固定した28回答で全20キャラに到達する", () => {
  for (const [id, string] of Object.entries(profileAnswers)) {
    assert.equal(string.length, 28);
    assert.equal(diagnose([...string].map(Number)).ranking[0].character.id, id);
  }
});
test("全ペアが少なくとも3軸で8点以上異なる", () => {
  for (let i = 0; i < characters.length; i++)
    for (let j = i + 1; j < characters.length; j++)
      assert.ok(
        TRAITS.filter(
          (k) =>
            Math.abs(characters[i].traits[k] - characters[j].traits[k]) >= 8,
        ).length >= 3,
        `${characters[i].id}/${characters[j].id}`,
      );
});
test("3つのシードで各1万件、全キャラ1〜15%に収まる", () => {
  for (const seed of [20260914, 42, 2026]) {
    const rows = simulateDiagnoses(10000, seed);
    assert.equal(
      rows.reduce((s, r) => s + r.Count, 0),
      10000,
    );
    for (const row of rows)
      assert.ok(
        row.Rate >= 1 && row.Rate <= 15,
        `${seed}: ${row.Character} ${row.Rate}%`,
      );
  }
});
