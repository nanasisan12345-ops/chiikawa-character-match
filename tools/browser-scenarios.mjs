import { chromium } from "./browser-runtime.mjs";
import { createQuestionSet, getQuestion } from "../question-bank.js";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const context = await chromium.launchPersistentContext(
  resolve("Data/scenario-test-browser"),
  {
    channel: "msedge",
    headless: true,
    viewport: { width: 320, height: 700 },
    reducedMotion: "reduce",
  },
);
try {
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:4173/");
  // v1の途中データを移行しても、質問文・選択済み回答・次の位置が変わらない。
  await page.evaluate(() =>
    localStorage.setItem(
      "chiikawa-character-match:v1",
      JSON.stringify({
        version: 1,
        currentQuestion: 1,
        answers: [3, ...Array(27).fill(null)],
        startedAt: new Date().toISOString(),
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  assert.equal(
    await page.locator(".question-card h1").textContent(),
    "知らない人とも比較的すぐに話せる。",
  );
  assert.ok(
    (await page.locator('[data-answer="3"]').textContent()).includes(
      "とてもそう思う",
    ),
  );
  await page.getByRole("button", { name: "前の質問" }).click();
  assert.equal(
    await page.locator('[data-answer="3"]').getAttribute("aria-pressed"),
    "true",
  );
  for (let slot = 0; slot < 28; slot++)
    for (let variant = 0; variant < 3; variant++) {
      let set = createQuestionSet(100 + slot);
      const entry = set.find((q) => q.slot === slot);
      entry.variant = variant;
      // テスト対象以外の枠で作品シーンを10問に揃える。
      for (const q of set.filter((q) => q.slot !== slot)) {
        const count = set.filter((q) => q.variant === 2).length;
        if (count > 10 && q.variant === 2) q.variant = 0;
        else if (count < 10 && q.variant !== 2) q.variant = 2;
      }
      set = [entry, ...set.filter((q) => q.slot !== slot)];
      await page.evaluate(
        (questionSet) =>
          localStorage.setItem(
            "chiikawa-character-match:v1",
            JSON.stringify({
              version: 2,
              questionSet,
              currentQuestion: 0,
              answers: Array(28).fill(null),
              startedAt: new Date().toISOString(),
            }),
          ),
        set,
      );
      await page.reload();
      await page.getByRole("button", { name: "続きから" }).click();
      assert.equal(
        await page.locator(".question-card h1").textContent(),
        getQuestion(entry).text,
      );
      assert.equal(await page.locator("[data-answer]").count(), 4);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      for (const button of await page.locator("[data-answer]").all()) {
        const b = await button.boundingBox();
        assert.ok(b.height >= 60);
      }
      if (slot === 13 && variant === 2)
        await page.screenshot({
          path: "artifacts/story-question-mobile.png",
          fullPage: true,
        });
    }
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.evaluate(() =>
    localStorage.setItem(
      "chiikawa-character-match:v1",
      JSON.stringify({
        version: 1,
        currentQuestion: 27,
        answers: [..."3031123321033111333131313121"].map(Number),
        startedAt: new Date().toISOString(),
      }),
    ),
  );
  await page.reload();
  await page.locator(".result-hero").waitFor();
  assert.equal(await page.locator(".rank-detail small").count(), 3);
  await page.screenshot({
    path: "artifacts/result-v2-desktop.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: legacy saved answers migrate without changing questions; all 84 scenes render at 320px with four >=60px buttons; result match reasons.",
  );
} finally {
  await context.close();
}
