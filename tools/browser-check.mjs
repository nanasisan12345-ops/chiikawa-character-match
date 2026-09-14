import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "./browser-runtime.mjs";
await mkdir("artifacts", { recursive: true });
const context = await chromium.launchPersistentContext(
  resolve("Data/test-browser"),
  {
    channel: "msedge",
    headless: true,
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
  },
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:4173/");
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.locator(".character-chip").last().waitFor();
assert.equal(await page.locator(".character-chip").count(), 20);
await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
await page.getByRole("button", { name: "診断をはじめる" }).click();
await page.getByRole("button", { name: "とてもそう思う", exact: true }).click();
await page.locator(".question-number").filter({ hasText: "Q02" }).waitFor();
await page.getByRole("button", { name: "前の質問" }).click();
assert.equal(
  await page.locator('[data-answer="3"]').getAttribute("aria-pressed"),
  "true",
);
await page.getByRole("button", { name: "ややそう思う", exact: true }).click();
await page.locator(".question-number").filter({ hasText: "Q02" }).waitFor();
await page.reload();
await page.getByRole("button", { name: "続きから", exact: false }).click();
assert.equal(await page.locator(".question-number").textContent(), "Q02");
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "artifacts/question-mobile.png",
  fullPage: true,
});
for (let i = 1; i < 28; i++) {
  await page
    .locator(`.question-number`)
    .filter({ hasText: `Q${String(i + 1).padStart(2, "0")}` })
    .waitFor();
  await page.locator(`[data-answer="${i % 4}"]`).click();
}
await page.locator(".result-hero").waitFor();
assert.equal(await page.locator(".rank-row").count(), 3);
assert.equal(await page.locator('[role="meter"]').count(), 6);
const result = await page.locator(".result-hero h1").textContent();
await page.reload();
assert.equal(await page.locator(".result-hero h1").textContent(), result);
await page.screenshot({ path: "artifacts/result-mobile.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.getByRole("button", { name: "もう一度診断する" }).click();
assert.equal(await page.locator(".question-number").textContent(), "Q01");
assert.equal(
  await page.evaluate(() =>
    localStorage.getItem("chiikawa-character-match:v1"),
  ),
  null,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: top → answer → back/change → reload/resume → all 28 → TOP3/chart → reload → reset; no page errors.",
);
await context.close();
