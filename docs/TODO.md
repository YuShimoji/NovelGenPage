# 未実装・既存の課題 (TODOリスト)

本リストはエディタ開発計画に準拠し、優先度/受け入れ基準を明確に管理します。

## マイルストーン

- [ ] M1: エディタ基盤の安定化（Quill/表示モード/marked 互換）
  - 受け入れ基準: プレビューが例外なく動作、挿入ボタンが即時反映、キャッシュ・後方互換の警告なし
- [ ] M2: スニペット/テンプレート拡張
  - 受け入れ基準: スニペットが設定可能（3/4行切替・テンプレート差替）、番号重複チェック
- [ ] M3: 画像アップロード本実装
  - 受け入れ基準: 一時URL→サーバ保存→最終URL差替が可能、失敗時のリトライ/エラー表示
- [ ] M4: 変数/フラグ管理UI
  - 受け入れ基準: 追加/削除/保存、プレビューへの反映が可能
- [ ] M5: テスト整備（ユニット/E2E/回帰）
  - 受け入れ基準: Jest の安定実行、主要機能の自動テストが緑

## スプリントバックログ（直近1-2スプリント）

- [ ] S1-1: favicon 404 恒久対策のテスト追加（/favicon.ico 200 & SVG MIME）
- [ ] S1-2: スニペット仕様の確定（3行/4行の要件定義とデフォルト設定）
- [ ] S1-3: `insertScene/insertChoice` のテンプレート化（設定値/データ属性から生成）
- [x] S1-4: Jest 実行環境の安定化（詳細出力、jsdom、CI 実行）
  - 完了: `jest.config.js` を `jest-environment-jsdom` に更新、`package.json` に `test:verbose` を追加、GitHub Actions（`.github/workflows/ci.yml`）で Node 20 + `npm ci` + `jest --runInBand --verbose` を実行するCIを追加。ローカル/CI ともにグリーン。
- [ ] S1-5: markdown-converter の単体テスト（marked 関数/parse 両対応）
  - 進捗: `__tests__/markdown-converter.test.js` を追加（関数API/parse API 両対応の互換確認、scene: リンクの `.scene-link` 変換検証）
- [x] S1-6: プレビューのクリックハンドラ（scene: のナビゲーション仕様設計）
  - 完了: `static/js/markdown-converter.js` の `handleSceneLinkClick()` を委譲イベント対応で堅牢化（`currentTarget/closest/this` の順に解決）。
  - 完了(追加): `static/js/editor.js` に `window.NovelGenPage.navigateToScene(sceneId, sceneName)` を実装し、クリック時の警告を解消。`TESTING.md` に検証手順を追加。`templates/editor.html` にて `editor.js?v=1.0.4` に更新しキャッシュ不整合を解消。
- [ ] S1-7: 画像アップロードのAPI設計（エンドポイント/認証/保存先）
- [ ] S1-8: ドキュメント更新（PROGRESS/TESTING/EDITOR_TASKS/TODO 一貫性チェック）
 - [x] S1-9: プレビュー別ポート時の editor.css フォールバック対応
  - 完了: `templates/editor.html` にフォールバック挿入を実装（onerror + styleSheets 遅延確認、`127.0.0.1:8000` からの再取得）。`TESTING.md` に確認手順を追記。

## フロントエンド

- [ ] シナリオ生成UIの実装（優先: 中）
  - `index.html` または `editor` のモーダルで生成フォームを提供
- [ ] シナリオエディタの機能改善（優先: 高）
  - API 連携表示、項目の動的追加/削除、保存
- [ ] テストプレイ画面 (`game.html`) の実装（優先: 中）
  - 指定 ID のシナリオを読み込みプレイ可能に

## バックエンド

- [ ] 設定値の外部化（優先: 中）
  - `scenario_handler.py` 等の定数を設定/環境変数化
- [ ] エラーハンドリングの強化（優先: 中）
  - 404/422/500 の明確化、詳細メッセージ
- [ ] バリデーションの強化（優先: 中）
  - Pydantic の厳格化、スキーマ整備

## テスト/CI

- [ ] テストコードの整備（優先: 高）
  - jsdom でのユニットテスト（挿入/変換/モード切替）
- [ ] E2E テスト導入（後日、Playwright 等）（優先: 中）
- [ ] CI での Jest 実行（優先: 中）
  - 進捗: GitHub Actions のワークフローを追加（`ci.yml`）。PR/Push で自動実行・バッジ表示を確認。

## ドキュメント

- [ ] README.md の更新（優先: 中）
  - セットアップ/使い方/トラブルシュートの最新化
- [ ] 開発ドキュメント同期（優先: 高）
  - PROGRESS / TESTING / EDITOR_TASKS / TODO の整合性維持

---

注: スニペットの現仕様は以下。
- insertScene: 4行（`## 新しいシーン` / `ここに本文…` / `### 選択肢` / `- [次のシーン]…`）
- insertChoice: 3行（`### 選択肢` + 2 行）
要求に応じて S1-2/S1-3 でテンプレート化・切替対応を行う。
