# 開発履歴 (Changelog)

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