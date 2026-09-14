import { chromium } from "./browser-runtime.mjs";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://127.0.0.1:4173/";
const context = await chromium.launchPersistentContext(
  resolve("Data/extended-test-browser"),
  {
    channel: "msedge",
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  },
);
try {
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("artifacts", { recursive: true });
  const profiles = JSON.parse(
    await readFile("artifacts/model-profiles.json", "utf8"),
  );
  async function seed(answers) {
    await page.evaluate(
      (answers) =>
        localStorage.setItem(
          "chiikawa-character-match:v1",
          JSON.stringify({
            version: 1,
            currentQuestion: 27,
            answers,
            startedAt: new Date().toISOString(),
          }),
        ),
      answers,
    );
    await page.reload();
    await page.locator(".result-hero").waitFor();
  }
  async function layout() {
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "horizontal overflow",
    );
    for (const b of await page.locator("button").all()) {
      const box = await b.boundingBox();
      if (box) assert.ok(box.height >= 44, "tap target");
    }
  }
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (const width of [320, 390, 768, 1366, 3840]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await layout();
    if (width === 390)
      await page.screenshot({
        path: "artifacts/home-mobile.png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole("button", { name: "診断をはじめる" }).click();
  await layout();
  await page.screenshot({
    path: "artifacts/question-small.png",
    fullPage: true,
  });
  for (const profile of profiles) {
    await seed(profile.answers);
    assert.equal(
      await page.locator(".result-hero h1").textContent(),
      `${profile.name}タイプ！`,
    );
    await layout();
  }
  await seed(profiles.find((p) => p.id === "pochetteArmor").answers);
  await page.screenshot({
    path: "artifacts/long-name-result-small.png",
    fullPage: true,
  });
  // Native share/clipboard contracts are mocked: no external sharing is performed.
  await page.evaluate(() => {
    window.shared = null;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.shared = data;
      },
    });
  });
  await page.getByRole("button", { name: "結果をシェアする" }).click();
  await page.waitForFunction(() => window.shared !== null);
  const shared = await page.evaluate(() => window.shared);
  assert.ok(shared.text.includes("ポシェットの鎧さんタイプ"));
  assert.equal(shared.url, base);
  await page.evaluate(() => {
    window.copied = null;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => (window.copied = text) },
    });
  });
  await page.getByRole("button", { name: "URLをコピー", exact: true }).click();
  await page.waitForFunction(() => window.copied !== null);
  assert.equal(await page.evaluate(() => window.copied), base);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("cancelled", "AbortError");
      },
    }),
  );
  await page.getByRole("button", { name: "結果をシェアする" }).click();
  assert.equal(await page.locator("#share-fallback textarea").count(), 0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
  });
  await page.getByRole("button", { name: "結果をシェアする" }).click();
  await page.locator("#manual-copy").waitFor();
  assert.ok(
    (await page.locator("#manual-copy").inputValue()).includes(
      "ポシェットの鎧さんタイプ",
    ),
  );
  await page.goto(`${base}?debug=1`);
  await page.locator(".debug").waitFor();
  assert.equal(await page.locator(".debug li").count(), 20);
  await page.locator("summary").click();
  await page
    .getByRole("button", { name: "1万件シミュレーションを実行" })
    .click();
  assert.equal(await page.locator("#simulation-output li").count(), 20);
  await page.goto(base);
  assert.equal(await page.locator(".debug").count(), 0);
  assert.equal(
    await page.evaluate(() => typeof window.runRandomSimulation),
    "undefined",
  );
  await page.evaluate(() =>
    localStorage.setItem("chiikawa-character-match:v1", "{broken"),
  );
  await page.reload();
  await page.getByRole("button", { name: "診断をはじめる" }).waitFor();
  assert.ok(
    (await page.locator("#toast").textContent()).includes("保存データ"),
  );
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "診断をはじめる" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.answer),
    "3",
  );
  await page.keyboard.press("Enter");
  await page.locator(".question-number").filter({ hasText: "Q02" }).waitFor();
  // Normal animation: repeat a rapid double click five times, ensure only one answer advances.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (let i = 2; i <= 6; i++) {
    await page.locator('[data-answer="2"]').dblclick({ delay: 20 });
    await page
      .locator(".question-number")
      .filter({ hasText: `Q${String(i + 1).padStart(2, "0")}` })
      .waitFor();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const blocked = await context.newPage();
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    }),
  );
  await blocked.goto(base);
  await blocked.getByRole("button", { name: "診断をはじめる" }).click();
  for (let i = 0; i < 28; i++) {
    await blocked
      .locator(".question-number")
      .filter({ hasText: `Q${String(i + 1).padStart(2, "0")}` })
      .waitFor();
    await blocked.locator(`[data-answer="${i % 4}"]`).click();
  }
  await blocked.locator(".result-hero").waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 320/390/768/1366/3840 layout; all 20 result themes; share/copy/cancel/fallback contracts; debug; corrupt/blocked storage; keyboard; 5 rapid double clicks.",
  );
} finally {
  await context.close();
}
