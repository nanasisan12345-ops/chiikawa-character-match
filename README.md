# ちいかわキャラマッチ

**あなたにいちばん近いのは誰？**

**公開URL：[ちいかわキャラマッチを開く](https://nanasisan12345-ops.github.io/chiikawa-character-match/)**

28の質問から性格を分析し、20種類のキャラクタータイプの中から、あなたに近いTOP3を診断する非公式ファンサイトです。所要時間は約3〜4分。登録は不要です。

## Windowsで開く

1. Node.js 22以降とMicrosoft Edgeが入っているPCで、このフォルダの `run.bat` をダブルクリックします。
2. 専用のブラウザ画面が開きます。「診断をはじめる」を押してください。
3. 終了する時はブラウザと起動用ウィンドウを閉じます。

この環境ではNode.js 24・Windows Edgeで確認しています。Node.js自体は同梱していません。`index.html` の直接ダブルクリックではES Modulesを読み込めないため、必ず `run.bat` を使用してください。

通常は `http://127.0.0.1:4173/` で開きます。ポート使用中のエラーが出た場合は、先に起動したウィンドウを閉じてからやり直してください。ネットワーク上の他のPCには公開しません。

## 使い方

- 各問の4つの回答から選ぶと次へ進みます。
- 「前の質問」で戻ると、以前の回答が選択状態になり、変更できます。
- 途中で閉じた場合は、同じ起動方法で開いて「続きから」を押します。
- 28問の後にTOP3、1位の説明、6軸のチャートを表示します。
- 「結果をシェアする」は端末の共有機能を優先し、使えない場合は共有文章のコピーに切り替わります。コピーも使えない場合は手動コピー欄が出ます。
- 共有URLはトップページへのリンクです。個人の回答や結果はURLに入りません。ローカルURLは他の端末から開けないため、友達へのURL共有は公開後に利用してください。
- 「もう一度診断する」で保存回答を削除し、Q1からやり直せます。

## 保存先と削除

回答の保存はブラウザのlocalStorageです。`run.bat` はブラウザプロファイルを **このフォルダ内の `Data/browser/`** に指定します。アプリ独自の設定、DB、キャッシュをAppDataへ保存する実装はありません。アプリ削除時は関連ウィンドウを閉じ、このフォルダを削除してください。

通常のブラウザや公開サイトを直接開いた場合は、そのブラウザの保存先に従います。ブラウザ、プロファイル、URLのポートを変えると保存内容は別扱いになります。保存禁止・容量不足の場合でも、画面を閉じなければ診断を続行できます。

## 診断の仕組み

質問文・性格モデル・テーマカラー・結果文章は `data.js` にまとめています。

1. 各問は2〜3軸に影響します。肯定・逆転質問の総重みを各軸で均等化し、16軸を0〜100に正規化します。
2. キャラの性格値は公式の数値ではなく独自解釈です。全員に同じ尺度（中心50、RMS20）を適用し、特徴の強さだけで順位が偏らないよう調整しています。数値は0〜100に収めます。
3. 全キャラ共通の軸重みを使ったユークリッド距離で20位まで並べます。同距離なら主要3軸、さらに同点ならデータの固定順です。診断本体に乱数は使いません。
4. 類似度は `100 − 距離 / √16 × 1.7` を0〜100に収めた値です。確率や医学的な評価ではありません。

すべて同じ選択肢の場合は全軸が中立になります。その時の順位は比較情報が少ない参考結果です。正確な自己分析の保証をするものではありません。

## 開発用コマンド

以下は `package.json` と `tests/` のある開発フォルダで実行します。アプリ本体にnpm依存パッケージはありません。

```sh
npm start
npm test
npm run simulate
node tools/personas.mjs
node tools/verify-model.mjs
npm run build
```

`?debug=1` の場合だけ結果画面下部に16軸、距離、TOP20を表示します。開発コンソールの `simulateDiagnoses(10000)` / `runRandomSimulation(10000)` で分布表も確認できます。通常画面には表示しません。

ブラウザ検証はPlaywrightとWindows Edgeを使用します。Playwrightは開発用の任意ツールです。インストール済みのモジュールを `PLAYWRIGHT_PATH` で指定するか、開発環境に用意してから `node tools/browser-check.mjs` と `node tools/browser-extended.mjs` を実行します。先に `node tools/serve.mjs` と `node tools/verify-model.mjs` を実行してください。テスト用プロファイルとキャッシュも `Data/` 以下です。

## 公開用ビルド

`npm run build` は `.build/pages_日時/` にGitHub Pages用のサイトファイルだけを作成します。Data、回答、ブラウザ状態、検証画像は含めません。配布パッケージ、exe、ZIPは作成しません。

## GitHub Pages

公開用ワークフロー `.github/workflows/pages.yml` で、`main` へのpush後にテストとデプロイを行います。

1. GitHubに `chiikawa-character-match` リポジトリを作り、開発ファイルを `main` にpushします。
2. リポジトリの Settings → Pages で SourceをGitHub Actionsにします。
3. Actionsの `Deploy GitHub Pages` を実行します。テスト成功後、サイト専用フォルダを公開します。
4. ワークフローが公開URLをビルドへ渡すので、OGPのURLと画像URLが絶対URLに変わります。公開URLはこのREADMEの先頭に記載しています。

CSS・JavaScript・画像の読み込みは相対パスです。公開先が決まる前の `index.html` のOGP URLは相対値です。手動ビルドでは環境変数 `SITE_URL` にHTTPSの公開URLを設定してください。公開後のSNSプレビューは実際のURLで別途確認します。

[GitHub公式のカスタムワークフロー説明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Technology

HTML / CSS / JavaScript (ES Modules) / GitHub Pages。開発・ローカル起動はNode.js。外部フォント、分析サービス、外部APIは使用していません。

## Character Images

公式画像、漫画のコマ、アニメ・グッズ・SNSの画像、トレース、AIでキャラクターを再現した画像は使用していません。faviconとOGPは文字・独自の図形のみです。

## Disclaimer

本サイトは「ちいかわ」を題材にした非公式ファン企画です。公式・原作者・出版社・関連企業とは関係ありません。

本サイト内の性格分類・診断結果は、作品を参考に独自に作成した診断用の解釈です。この表記は著作物の使用許諾を意味するものではありません。

## 確認範囲

Windows Edgeで一連の操作、320〜3840px幅、全20結果、保存・共有の異常系を検証しています。iPhone Safari、Android Chrome、Mac Safari、iPad Safariの実機確認と、公開先の動作・SNS共有は未実施です。共有APIの検証はモックによる呼び出し確認であり、実際のSNS投稿は行っていません。詳細は開発フォルダの `VERIFICATION.md` を参照してください。
