import { chromium } from "./browser-runtime.mjs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
await mkdir("images", { recursive: true });
const context = await chromium.launchPersistentContext(
  resolve("Data/ogp-browser"),
  {
    channel: "msedge",
    headless: true,
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  },
);
const page = await context.newPage();
await page.setContent(
  `<!doctype html><html lang="ja"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#fffdf7;color:#433d38;font-family:'Yu Gothic UI',Meiryo,sans-serif;border:20px solid #f4ece2}.wrap{padding:54px 68px;position:relative;height:100%}.label{font-size:18px;letter-spacing:4px;color:#876b5a}.name{font-size:27px;margin:32px 0 18px;letter-spacing:3px}h1{font-size:60px;line-height:1.5;margin:0;position:relative;z-index:1}.line{background:linear-gradient(transparent 74%,#f6cbd8 74%);padding-bottom:4px}.bottom{position:absolute;bottom:42px;font-size:20px;color:#746659;letter-spacing:2px}.circle{position:absolute;width:190px;height:190px;border-radius:50%;right:92px;top:141px;background:#cce8ee}.pink{background:#f6cbd8;right:178px;top:230px;width:160px;height:160px}.yellow{background:#f9e8ac;right:42px;top:296px;width:130px;height:130px}.cm{position:absolute;right:104px;top:237px;font:italic 48px Georgia;color:#6b5547;z-index:2}.fan{position:absolute;right:68px;top:58px;font-size:15px;color:#746659}</style><div class="wrap"><div class="label">CHIIKAWA CHARACTER MATCH</div><span class="fan">非公式ファン診断</span><p class="name">ちいかわキャラマッチ</p><h1>あなたにいちばん<br><span class="line">近いのは誰？</span></h1><i class="circle"></i><i class="circle pink"></i><i class="circle yellow"></i><span class="cm">CM</span><p class="bottom">28の質問 / 20のタイプ / あなたらしさを見つけよう。</p></div></html>`,
);
await page.screenshot({ path: "images/ogp.png" });
await context.close();
console.log(
  "Generated images/ogp.png (1200 x 630), text and original geometry only.",
);
