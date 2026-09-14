import {
  questions,
  characters,
  TRAITS,
  TRAIT_LABELS,
  ANSWER_LABELS,
} from "./data.js";
import { diagnose, simulateDiagnoses } from "./engine.js";
import { loadProgress, saveProgress, clearProgress } from "./storage.js";
const app = document.querySelector("#app"),
  debug = new URLSearchParams(location.search).get("debug") === "1",
  reduced = matchMedia("(prefers-reduced-motion: reduce)");
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const loaded = loadProgress(storage);
let progress = loaded.data,
  view = "start",
  busy = false,
  timer,
  toastTimer;
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const star =
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 1 25 15 39 20 25 25 20 39 15 25 1 20 15 15Z" fill="currentColor"/></svg>';
function notify(text) {
  clearTimeout(toastTimer);
  document.querySelector("#toast").textContent = text;
  toastTimer = setTimeout(
    () => (document.querySelector("#toast").textContent = ""),
    4500,
  );
}
function persist() {
  if (!saveProgress(storage, progress))
    notify("途中保存ができません。画面を閉じずに診断を続けてください。");
}
function fresh() {
  clearTimeout(timer);
  busy = false;
  if (!clearProgress(storage))
    notify(
      "保存データを削除できませんでした。この画面では最初から診断します。",
    );
  progress = {
    version: 1,
    answers: Array(28).fill(null),
    currentQuestion: 0,
    startedAt: new Date().toISOString(),
  };
  renderQuestion();
}
function mount(html, focus = true) {
  app.innerHTML = html;
  if (focus) {
    window.scrollTo({ top: 0, behavior: "instant" });
    app.querySelector("h1")?.focus({ preventScroll: true });
  }
}
function renderStart() {
  view = progress ? "resume" : "start";
  mount(
    `<section class="hero"><div class="eyebrow">28 QUESTIONS, YOUR OWN STORY</div><div class="hero-art" aria-hidden="true"><i class="orb pink"></i><i class="orb blue"></i><i class="orb yellow"></i><b class="spark one">${star}</b><b class="spark two">${star}</b><span class="art-label">20 types of personality</span></div><p class="hero-kicker">ちいかわキャラマッチ</p><h1 tabindex="-1">あなたにいちばん<br>近いのは<span class="underline">誰？</span></h1><p class="hero-description">やさしいところも、自由なところも。<br>28の質問から、あなたらしさをひもといて<br>20キャラクターの中から近いタイプを見つけます。</p><div class="facts"><span>全28問</span><i></i><span>約3〜4分</span><i></i><span>登録不要</span></div>${progress ? `<div class="resume card"><p>診断の途中データがあります</p><button class="primary" data-action="resume">続きから<span aria-hidden="true">→</span></button><button class="text-button" data-action="fresh">最初から</button></div>` : `<button class="primary start-button" data-action="fresh">診断をはじめる<span aria-hidden="true">→</span></button>`}<p class="small-note">正解はありません。いつもの自分で答えてみて。</p></section><section class="intro-strip"><div><b>01</b><span>直感で答える</span></div><div><b>02</b><span>性格を分析</span></div><div><b>03</b><span>TOP3に出会う</span></div></section><section class="character-section"><span class="eyebrow">MEET THE TYPES</span><h2>診断に登場する20キャラクター</h2><p>あなたの中に、どんな一面があるでしょう。</p><div class="character-chips">${characters.map((c) => `<span class="character-chip"><i style="background:${c.theme}" aria-hidden="true"></i>${c.name}</span>`).join("")}</div></section><aside class="about-note"><b>この診断について</b><p>回答の傾向と、本サイト独自の性格モデルを比較します。結果はあなたを決めつけるものではなく、自分の一面を楽しむためのヒントです。</p></aside>`,
    false,
  );
}
function renderQuestion() {
  view = "question";
  busy = false;
  const i = progress.currentQuestion,
    q = questions[i];
  mount(
    `<section class="question-screen"><div class="question-top"><span class="eyebrow">QUESTION</span><span class="question-count"><b>${String(i + 1).padStart(2, "0")}</b> / 28</span></div><div class="progress-track" role="progressbar" aria-label="回答の進み具合" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${i}"><div style="width:${(i / 28) * 100}%"></div></div><p class="question-hint">いつものあなたに、いちばん近いものを。</p><div class="card question-card"><span class="question-number">Q${String(i + 1).padStart(2, "0")}</span><h1 tabindex="-1">${q.text}</h1><div class="answer-list" role="group" aria-label="回答を選択">${[3, 2, 1, 0].map((v, n) => `<button class="answer-button ${progress.answers[i] === v ? "selected" : ""}" data-answer="${v}" aria-pressed="${progress.answers[i] === v}"><span class="answer-symbol symbol-${n}" aria-hidden="true"></span>${ANSWER_LABELS[v]}<span class="selection-mark" aria-hidden="true">${progress.answers[i] === v ? "✓" : "→"}</span></button>`).join("")}</div></div><div class="question-bottom"><button class="text-button" data-action="back" ${i === 0 ? "disabled" : ""}>← 前の質問</button><span>あと${28 - i}問</span></div><p class="save-note">回答はこのブラウザに保存されます。途中でも再開できます。</p><button class="text-button home-button" data-action="home">トップへ戻る</button></section>`,
  );
}
function answer(value) {
  if (busy || view !== "question") return;
  busy = true;
  const current = progress.currentQuestion;
  progress.answers[current] = value;
  app.querySelectorAll("[data-answer]").forEach((b) => {
    b.disabled = true;
    b.classList.toggle("selected", Number(b.dataset.answer) === value);
    b.setAttribute("aria-pressed", Number(b.dataset.answer) === value);
  });
  app.querySelector(".question-card").classList.add("leaving");
  const bar = app.querySelector('[role="progressbar"]');
  bar.setAttribute("aria-valuenow", current + 1);
  bar.firstElementChild.style.width = `${((current + 1) / 28) * 100}%`;
  progress.currentQuestion = Math.min(27, current + 1);
  persist();
  timer = setTimeout(
    () => {
      if (current === 27) analyze();
      else renderQuestion();
    },
    reduced.matches ? 0 : 260,
  );
}
function analyze() {
  view = "analyzing";
  const result = diagnose(progress.answers);
  mount(
    `<section class="card analyzing"><span class="analysis-star">${star}</span><p class="eyebrow">FINDING YOUR MATCH</p><h1 tabindex="-1">あなたの性格を分析中…</h1><p>20のタイプと、あなたらしさを照らし合わせています。</p></section>`,
  );
  timer = setTimeout(() => renderResult(result), reduced.matches ? 0 : 900);
}
function renderResult(result = diagnose(progress.answers)) {
  view = "result";
  busy = false;
  const [first, ...rest] = result.ranking.slice(0, 3),
    c = first.character;
  const chart = [
    ["社交性", result.traits.sociability],
    ["行動力", result.traits.activity],
    ["慎重さ", result.traits.cautiousness],
    ["共感性", result.traits.empathy],
    ["自立性", result.traits.independence],
    [
      "感情表現",
      (result.traits.selfExpression + result.traits.emotionalIntensity) / 2,
    ],
  ];
  const neutral = progress.answers.every(
    (value) => value === progress.answers[0],
  );
  const texts = [
    ["あなたの性格", c.description],
    ["あなたの長所", c.strengths],
    ["ちょっと注意するところ", c.caution],
    ["人間関係では…", c.relationships],
    ["こんな場面が得意", c.scenes],
  ];
  mount(
    `<div class="result-page" style="--theme:${c.theme}"><section class="card result-hero"><span class="eyebrow">YOUR CHARACTER MATCH</span><div class="result-emblem" aria-hidden="true">${star}</div><p class="result-pretitle">診断結果 · あなたにいちばん近いのは</p><span class="rank-label">1位</span><h1 tabindex="-1">${c.name}<span>タイプ！</span></h1><p class="type-name">${c.typeName}</p><div class="match-score"><span>MATCH</span><b>${first.similarity}<small>%</small></b><span>類似度</span></div><p class="result-caption">${neutral ? "同じ回答が続いたため、性格の差が少ない参考結果です。<br>いつもの自分を思い浮かべて、答え直すこともできます。" : "あなたらしさが、ひとつ見つかりました。"}</p></section><section class="card top-three"><h2>あなたに近いキャラ TOP3</h2>${result.ranking
      .slice(0, 3)
      .map(
        (r, i) =>
          `<div class="rank-row"><span>${String(i + 1).padStart(2, "0")}</span><i style="background:${r.character.theme}" aria-hidden="true"></i><b>${r.character.name}</b><strong>${r.similarity}<small>%</small></strong></div>`,
      )
      .join(
        "",
      )}</section><section class="card personality"><span class="eyebrow">A LITTLE MORE ABOUT YOU</span>${texts.map(([title, text], i) => `<article><h2><span>${String(i + 1).padStart(2, "0")}</span>${title}</h2><p>${text}</p></article>`).join("")}</section><section class="card chart"><span class="eyebrow">YOUR PERSONALITY</span><h2>あなたの性格バランス</h2><p>高い・低いに、良し悪しはありません。</p>${chart.map(([label, value]) => `<div class="chart-row"><span>${label}</span><div class="chart-track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value)}"><div style="width:${value}%"></div></div><b>${Math.round(value)}</b></div>`).join("")}</section><section class="other-sides"><span class="eyebrow">ANOTHER SIDE OF YOU</span><h2>実はこんな一面も…</h2>${rest.map((r, i) => `<article class="card side-card" style="--side-theme:${r.character.theme}"><span class="side-rank">${i + 2}位</span><div><h3>${r.character.name}<small>${r.similarity}%</small></h3><b class="side-type">${r.character.typeName}</b><p>${r.character.description}</p></div></article>`).join("")}</section><section class="card share-card"><h2>あなたらしさ、シェアしてみる？</h2><p>友達の結果と見比べるのも、きっと楽しい。</p><button class="primary" data-action="share">結果をシェアする<span aria-hidden="true">→</span></button><button class="secondary" data-action="copy">URLをコピー</button><div id="share-fallback"></div></section><button class="restart-button" data-action="fresh">もう一度診断する <span aria-hidden="true">↻</span></button><p class="small-note">※診断結果は本サイト独自の性格分類です。<br>類似度は性格モデルとの近さを表し、確率ではありません。<br>共有URLには回答や個別結果は含まれません。</p>${debug ? `<details class="card debug"><summary>開発情報 / TOP20</summary><h3>User Trait Vector</h3><dl>${TRAITS.map((key, i) => `<dt>${TRAIT_LABELS[i]}</dt><dd>${result.traits[key].toFixed(1)}</dd>`).join("")}</dl><h3>Character Distances / Similarity Scores</h3><ol>${result.ranking.map((r) => `<li>${r.character.name} — 距離 ${r.distance.toFixed(2)} / ${r.similarity}%</li>`).join("")}</ol><button class="secondary" data-action="simulation">1万件シミュレーションを実行</button><div id="simulation-output"></div></details>` : ""}</div>`,
  );
}
function publicUrl() {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}
async function copyText(text, success) {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    notify(success);
  } catch {
    const box = document.querySelector("#share-fallback");
    box.innerHTML = `<label for="manual-copy">下の文章を選択してコピーしてください。</label><textarea id="manual-copy" readonly rows="6">${esc(text)}</textarea>`;
    box.querySelector("textarea").focus();
    box.querySelector("textarea").select();
    notify("自動コピーを利用できません。手動でコピーできます。");
  }
}
async function share() {
  const c = diagnose(progress.answers).ranking[0].character;
  const text = `「ちいかわキャラマッチ」をやってみた！\n\n私に一番近いのは\n「${c.name}タイプ」でした！\n\nあなたにいちばん近いのは誰？\n\n#ちいかわキャラマッチ`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "ちいかわキャラマッチ",
        text,
        url: publicUrl(),
      });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyText(`${text}\n${publicUrl()}`, "共有用の文章をコピーしました！");
}
app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  if (button.hasAttribute("data-answer")) {
    answer(Number(button.dataset.answer));
    return;
  }
  if (busy && view === "question") return;
  switch (button.dataset.action) {
    case "fresh":
      fresh();
      break;
    case "resume":
      progress.answers.every((a) => a !== null)
        ? renderResult()
        : renderQuestion();
      break;
    case "back":
      if (progress.currentQuestion > 0) {
        progress.currentQuestion--;
        persist();
        renderQuestion();
      }
      break;
    case "home":
      persist();
      renderStart();
      window.scrollTo({ top: 0, behavior: "instant" });
      break;
    case "share":
      void share();
      break;
    case "copy":
      void copyText(publicUrl(), "URLをコピーしました！");
      break;
    case "simulation": {
      if (!debug) return;
      const rows = simulateDiagnoses(10000);
      console.table(rows);
      document.querySelector("#simulation-output").innerHTML =
        `<ul>${rows.map((r) => `<li>${r.Character}: ${r.Count}件 / ${r.Rate}%</li>`).join("")}</ul>`;
      break;
    }
  }
});
if (debug) {
  window.simulateDiagnoses = (count = 10000) => {
    const rows = simulateDiagnoses(count);
    console.table(rows);
    return rows;
  };
  window.runRandomSimulation = window.simulateDiagnoses;
}
if (progress && progress.answers.every((a) => a !== null)) renderResult();
else renderStart();
if (loaded.error) notify(loaded.error);
