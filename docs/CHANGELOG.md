# 開発履歴 (Changelog)

## 2025-08-21 (バグ修正 / ドキュメント)

- **シーンリンクの重複ナビゲーション修正**
  - `static/js/markdown-converter.js`: デリゲーション用クリックハンドラの重複登録を防止。
    - `removeEventListener('click', handler, true)` にキャプチャ指定を追加し、`addEventListener(..., true)` と一致させた。
    - `window.NovelGenPage._sceneHandlersAttached` フラグで多重セットアップを明示管理。
  - 症状: `.scene-link` クリック時の遷移ログが複数回出力される、`navigateToScene` が重複呼び出しされる。
  - 改善: クリック1回につき1回のみログとハンドラが発火。
- **スクリプトのバージョン統一（キャッシュバスティング）**
  - `templates/editor.html` / `scenario-editor.html` の参照を `markdown-converter.js?v=1.0.4` / `editor.js?v=1.0.4` に統一。
  - 旧版がキャッシュされていた場合に最新修正が反映されない問題を予防。

## 2025-08-16 (バグ修正 / リファクタリング)

- **エディタ重複表示の防止**
  - `static/js/editor.js`: Quill 初期化処理を `initQuill()` に分離し、グローバル `initializeEditor()` を新設。
  - 既存のツールバーDOM（`#editor-toolbar`, `#toolbar-container`, `#toolbar`）が存在する場合はそれを使用し、Quill が新規ツールバーを生成しないように変更。
  - 既存インスタンスがある場合は `#editor` の DOM をクリアしてから再初期化することで二重初期化を回避。
  - UI 参照の安全化（`showStatus` と `previewElement` のフォールバック）を追加。
- **Quill 警告の解消（カスタムボタンの互換）**
  - `static/js/editor.js`: `sanitizeCustomToolbarButtons()` の検出対象に `#toolbar-container` を追加。
  - 旧 `.ql-insert-scene` / `.ql-insert-choice` を `.insert-scene-btn` / `.insert-choice-btn` に自動置換し、ID を補完して互換動作を保証。
  - `applyContentMode()` と UI 参照で `#toolbar-container` をフォールバック対象に追加。
- **キャッシュ対策**
  - `templates/editor.html`: `editor.js` のクエリを `?v=1.0.3` に更新してキャッシュ破棄。
- **ドキュメント更新**
  - `docs/PROGRESS.md`, `CURRENT_ISSUES.md`, `TESTING.md` を本修正内容に合わせて更新。

- **ビュー切替UIの恒常化とZenボタン**
  - `templates/editor.html`: ヘッダ直下にグローバルな `.view-mode-toggle` を追加（分割/エディタ/プレビュー/Zen）。
  - `static/js/editor.js`: `ensureViewToggleUI()` を強化。既存トグルがツールバー/エディタ内のみの場合はヘッダ直下に複製を生成。
  - これによりプレビュー単独表示でもトグルが消えず、元の表示に戻れるようになった。

- **旧URLの互換対応**
  - `main.py`: `/scenario-editor.html` を `/editor` へ `307` リダイレクトする互換ルートを追加（404回避）。

## 2025-01-XX (リファクタリング)

- **コードベースの大規模リファクタリング**
    - **JavaScriptモジュール化**: `static/js/game.js`を4つのモジュールに分割
        - `main-game.js`: エントリーポイント、ゲームデータの読み込み
        - `gameLogic.js`: ゲームロジック、ステップ遷移処理
        - `gameState.js`: ゲーム状態管理（インベントリ、フラグ）
        - `ui.js`: UI操作、タイプライター効果、ボタンレンダリング
    - **Pythonモジュール化**: `main.py`から機能を分離
        - `gemini_client.py`: Gemini API通信処理
        - `scenario_handler.py`: シナリオファイル管理、アーカイブリスト更新
    - **循環参照の解決**: `ui.js`と`gameLogic.js`間の循環参照をコールバック関数で解決
    - **コードの保守性向上**: 関心の分離により、各モジュールの責務を明確化

## 2025-07-30

- **シナリオ管理機能の強化**
    - `scenario-editor.html`, `static/js/scenario-editor.js`: シナリオ管理画面に、登場キャラクター、アイテム、フラグの編集機能を追加。
    - `main.py`: シナリオ更新APIを拡張し、キャラクター、アイテム、フラグのデータも保存できるように修正。
    - `scenario-editor.html`, `static/js/scenario-editor.js`, `main.py`: シナリオの公開・非公開を設定できる機能を追加。
- **サイドバーの機能改善**
    - `static/js/scenario-editor.js`: シナリオ一覧をテーマごとに階層表示するように変更。
    - `scenario-editor.html`, `static/js/scenario-editor.js`: テーマによるシナリオのフィルタリング機能を追加。
- **ドキュメント更新**
    - `docs/README.md`: 追加された機能要件を反映。
    - `docs/CHANGELOG.md`: 開発履歴を更新。

## 2025-07-29 (修正)

- **シナリオ管理画面の実装**
    - `scenario-editor.html`: シナリオ管理画面の基本的なHTML構造を作成。
    - `static/js/scenario-editor.js`: シナリオ一覧の表示、シナリオ詳細の表示・編集フォームの生成、更新処理を実装。
    - `main.py`: シナリオ更新用のAPIエンドポイント (`/api/update_scenario`) を追加。
- **ゲームエンジン基盤の実装**
    - `game.html`, `static/js/game.js`: 条件分岐（アイテム所持、フラグ状態）、インベントリ表示、フラグ・アイテムの動的な状態変化に対応。
    - `main.py`: AIプロンプトを更新し、より複雑なゲームロジック（`conditions`, `actions_on_enter`）を生成できるように改善。
- **UI/UXの改善**
    - `static/js/main.js`: シナリオ生成後、JSONの代わりにゲームへのリンクを表示するように修正。
    - `static/js/game.js`: テキスト表示にタイプライター風アニメーションを追加。

## 2025-07-29

- **フロントエンド実装**
    - `index.html`: 物語生成用のUI（プロンプト入力欄、生成ボタン、結果表示エリア）を実装。
    - `js/main.js`: APIと連携し、物語を生成・表示するロジックを実装。
- **ドキュメント整備**
    - `docs`ディレクトリを作成。
    - `README.md`: プロジェクト概要、仕様、実装状況、TODOを記述。
    - `CHANGELOG.md`: 開発履歴を記述。

## 2025-07-28

- **バックエンド実装**
    - `main.py`: FastAPIとGoogle Gemini APIを使用して、物語生成APIを実装。
    - `requirements.txt`: 依存ライブラリを定義。
    - `.env`: APIキーを環境変数として管理。
- **APIテスト**
    - `curl`コマンドによるAPIの動作確認。
    - 文字化け対応、モデル名変更などのデバッグを実施。