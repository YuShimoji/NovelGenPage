# 開発進捗

## 実装済み機能

- **バックエンドAPI (FastAPI)**
  - **ステータス**: 実装済み
  - **詳細**: シナリオの生成、取得、更新、一覧取得のための基本的なAPIエンドポイントが実装されています。

- **AIによるシナリオ生成 (Google Gemini)**
  - **ステータス**: 実装済み
  - **詳細**: テーマとキーワードを元に、JSON形式のシナリオを生成する機能が実装されています。プロンプトは外部ファイル化されています。

- **シナリオのファイル保存**
  - **ステータス**: 実装済み
  - **詳細**: 生成・更新されたシナリオは `games/` ディレクトリにJSONファイルとして保存されます。また、`archive_list.json` でメタデータが管理されています。

- **シナリオエディタのUI骨格**
  - **ステータス**: UI骨格のみ実装済み
  - **詳細**: `scenario-editor.html` にて、シナリオ一覧と編集エリアの基本的なレイアウトが作成されています。実際の動的な処理は `scenario-editor.js` に依存しますが、こちらの実装はまだ不完全です。

- **基本的なWebページの提供**
  - **ステータス**: 実装済み
  - **詳細**: トップページ、遊び方、プライバシーポリシーなどの静的HTMLページが提供されています。

## 最近の進捗 (2025-08-16)

- **エディタの二重表示問題を修正**
  - `static/js/editor.js` をリファクタリングし、Quill 初期化を `initQuill()` に分離。
  - グローバル `initializeEditor()` を導入して単一初期化を保証。
  - 既存のツールバーDOM（`#editor-toolbar`, `#toolbar-container`, `#toolbar`）が存在する場合はそれを再利用し、Quill が新規ツールバーを生成しないように変更。
  - UI 参照のフォールバック（`showStatus`, `previewElement`）を追加し、未定義エラーを防止。
  - 予防クリーニング `cleanupEditorDom()` を追加し、重複 `.ql-toolbar` / `.ql-container` を排除してから初期化。
  - ボタン挿入の重複・未動作に対して、IDとクラスの両方にバインドし、さらに委譲イベントも追加。
  - `scenario-editor.html` に `scenario-editor.js`（ESM）を読み込むよう追記し、サイドバーやフォーム描画を有効化。

- **表示モードとZenモードの実装**
  - `static/js/editor.js`
    - ビュー切替を実装（`split`/`editor`/`preview`/`zen`）。`applyViewMode()` にて `.editor-panel`/`.preview-panel` の表示切替と `body.zen-mode` を制御。
    - コンテンツモード切替を実装（`visual`/`raw`）。`applyContentMode()` と同期関数（`syncFromQuillToRaw()`/`syncFromRawToQuill()`）で Quill と `#raw-markdown` の内容を相互同期。
    - `bindUiToggles()` で `.view-mode-btn`、`#zen-toggle`、`#toggle-visual`、`#toggle-raw` をバインド。
    - `updatePreview()` が Visual/Raw の現在値からプレビューを生成するように変更。
  - `templates/editor.html`
    - ヘッダ直下に表示モードのトグルUI（分割/エディタ/プレビュー/Zen）を追加（常時表示）。
    - ツールバーに Visual/Raw 切替ボタンと Raw 用の `#raw-markdown` テキストエリアを追加。
    - カスタムボタン（シーン/選択肢）をテキストラベル化し、アイコン依存を解消。
  - `static/css/editor.css`
    - `body.zen-mode` 時にヘッダ・ビュー切替・ツールバー・プレビューを非表示化し、エディタ全画面化（`.fullscreen`）するスタイルを追加。
    - アクセシビリティ用 `.sr-only` ユーティリティを追加。

- **旧URL互換**
  - `main.py`: `/scenario-editor.html` から `/editor` へ 307 リダイレクトする互換ルートを追加。

- **フォールバックの追加（HTML未更新やキャッシュ対策）**
  - `static/js/editor.js`
    - 旧カスタムボタンのクラス（`.ql-insert-scene`, `.ql-insert-choice`）を実行時に新クラス（`.insert-scene-btn`, `.insert-choice-btn`）へ置換する `sanitizeCustomToolbarButtons()` を追加し、Quill のツールバー警告を解消。
    - ビュー切替UI（`.view-mode-toggle`）が見つからない場合、ヘッダ直下へ動的生成する `ensureViewToggleUI()` を追加。プレビュー専用表示でも（Zenを除き）切替UIを常時利用可能に維持。

### ドキュメント/テスト更新
- `TESTING.md`
  - ポートを `8000` に統一。
  - 回帰テスト手順を更新（ツールバー/エディタ単一、ボタン挿入、ライブプレビュー、コンソールエラー無しの確認）。
  - 表示モード・コンテンツモード・Zen モードの確認手順を追記。
- `PROGRESS.md`
  - 本項に最新の修正点を追記。

## 次のタスク

- プレビューの安定化（`markdownToHtml` の例外ハンドリング拡充）
- 画像アップロードの本実装（現在はURL.createObjectURLによる暫定挿入）
- エディタ操作のE2Eテスト追加

## 最近の進捗 (2025-08-17)

- **エディタ初期化エラーの解消**
  - `static/js/editor.js` の `handleImageSelect()` 付近に他メソッドの断片が誤って混入し、構文エラー（Unexpected token '{'）で初期化が停止していた。
  - 当該断片を除去して関数を正しく閉じ、暫定の画像挿入処理（`URL.createObjectURL`）とステータスメッセージ表示を追加。

- **ツールバーアイコンの復旧**
  - `scenario-editor.html` の `<head>` に Font Awesome（CDN）を追加し、カスタムボタンのアイコン表示を可能にした。

- **favicon 404 の解消**
  - `static/favicon.svg` を新規作成し、`scenario-editor.html` から参照するように追加。

- **ドキュメント**
  - 本ファイルおよび `TESTING.md` に回帰テスト項目（アイコン表示、favicon 取得、エディタ入力可否）を追記。

### 追加修正（2025-08-17）

- **選択肢/シーン挿入機能の復旧**
  - `static/js/editor.js` に `insertScene()` と `insertChoice()` を実装し、ボタン（`#insert-scene`, `#insert-choice` および `.insert-scene-btn`/`.ql-insert-*`）から呼び出し可能にした。
  - 挿入後にプレビュー更新（`updatePreview()`）とビューモード再適用（`applyViewMode()`）を行い、UI の一貫性を担保。
  - 既存の `static/js/editor-fixed.js` による `insertChoice` 上書きは互換として維持。

- **Markdown 変換安定化**
  - `static/js/markdown-converter.js` にて `marked` の呼び出しを関数/`parse()` 両対応化。
    - `window.marked` が関数のときは従来通り実行。
    - オブジェクトの場合は `window.marked.parse()` を利用。
  - 変換時の例外は `simpleMarkdownToHtml` にフォールバック。

- **テスト/ドキュメント**
  - `TESTING.md` に「シーン/選択肢挿入」および「markdown 変換のエラー非発生」確認手順を追加。
  - 新規 `docs/EDITOR_TASKS.md` を作成（エディタ機能の分解、設計方針、期待結果、今後の拡張）。
