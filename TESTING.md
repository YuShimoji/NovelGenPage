# Testing Guide

This document provides instructions for testing the Adventure Game AI project.

## 1. Running the Application

1.  **Start the backend server:**
    Open a terminal in the project root directory and run the following command:
    ```bash
    python main.py
    ```
    The server will start on `http://localhost:8000` by default.

2.  **Access the application:**
    Open your web browser and navigate to one of the following URLs:
    *   **Main Page:** [http://localhost:8000](http://localhost:8000)
    *   **Scenario Editor:** [http://localhost:8000/editor](http://localhost:8000/editor)
    *   (Legacy) `/scenario-editor.html` は `/editor` に自動リダイレクトされます。

## 2. How to Test

### Scenario Editor Testing

1.  Navigate to the [Scenario Editor](http://localhost:8000/editor).
2.  **Verify Scenario List:**
    *   Check if the list of scenarios is displayed correctly on the left sidebar.
    *   If the list doesn't load, check the browser's developer console (F12) for any error messages.
3.  **Verify Scenario Loading:**
    *   Click on a scenario title from the list.
    *   The scenario details should appear in the main content area.
    *   Check the developer console for errors if it fails to load.
4.  **Editing a Scenario:**
    *   Modify fields such as Title, AI Prompt, Characters, Flags, and Items.
    *   Click the "保存" (Save) button.
    *   An alert message "シナリオを更新しました。" should appear.
    *   Refresh the page and select the same scenario again to verify that the changes have been saved.
5.  **Test Play:**
    *   After loading a scenario, click the "テストプレイ" (Test Play) button.
    *   A new browser tab should open with the game screen (`game.html`).
    *   The game should start with the data from the scenario you were editing.

#### 表示モード・コンテンツモード 回帰テスト

6.  **Visual / Raw 切替**
    *   ツールバーの「Visual」「Raw」ボタン（`#toggle-visual`, `#toggle-raw`）をクリックして切り替え。
    *   Visual → Raw に切り替えると、Quill 本体とツールバーが非表示になり、`#raw-markdown` が表示される。
    *   Raw テキストの変更が即座にプレビュー（`#preview-content`）に反映される。
    *   Raw → Visual に戻すと、Raw の内容が Quill に同期される。

7.  **ビュー切替（分割/エディタ/プレビュー）**
    *   画面上部のビュー切替（`.view-mode-btn[data-mode]`）で `split` / `editor` / `preview` を切り替え。
    *   `editor` では `.preview-panel` が非表示、`preview` では `.editor-panel` が非表示、`split` では両方が表示される。
    *   `preview`（プレビューのみ）でも、上部の `div.view-mode-toggle` は表示され続け、`split` か `editor` に戻せること。

8.  **Zen モード**
    *   「Zen」ボタン（`#zen-toggle`）をクリック。
    *   ページ `body` に `zen-mode` クラスが付与され、ヘッダ・ビュー切替・ツールバー・プレビュー等が非表示になる。
    *   `.editor-panel` が全画面化（`.fullscreen`）し、編集に集中できる状態になる。
    *   もう一度「Zen」をクリックすると通常表示（`split`）に戻る。

9.  **フォールバック挙動（HTML未更新・キャッシュ時の互換）**
    *   旧クラスのままのカスタムボタンでも警告が出ないこと。
        - `console` に Quill の `quill:toolbar ignoring attaching to nonexistent format insert-scene/insert-choice` が出力されない。
        - 旧 `.ql-insert-scene` / `.ql-insert-choice` が自動的に `.insert-scene-btn` / `.insert-choice-btn` に置換され、クリックで挿入できる。
    *   `.view-mode-toggle` がテンプレートに無くても、ページロード時にヘッダ直下へ自動生成されること。
        - `preview` 表示でも（Zen 以外では）切替UIが常に表示され、`split/editor` に戻せる。

#### キャッシュ対策と警告消失の確認

10. **キャッシュクリア / バージョン確認**
    * ブラウザでハードリロード（Ctrl+F5 / Cmd+Shift+R）を実行。
    * DevTools > Network で `editor.js?v=1.0.3` が読み込まれていることを確認。

11. **Quill 警告が出ないこと**
    * Console に以下の警告が表示されないことを確認。
      - `quill:toolbar ignoring attaching to nonexistent format insert-scene`
      - `quill:toolbar ignoring attaching to nonexistent format insert-choice`
    * 旧 `.ql-insert-scene` / `.ql-insert-choice` は自動でクラス置換され、クリックで挿入できる。

#### アイコン表示・favicon・入力可否の回帰テスト（2025-08-17）

12. **ツールバーのアイコン表示**
    * `quill.snow.css` が適用され、既定アイコン（太字/斜体/下線/引用/リンク/画像 等）がボックスや文字化けにならず表示される。
    * カスタムボタン（「シーン」「選択肢」）はテキストラベルで表示される。

13. **favicon**
    * ブラウザの Network タブで `/static/favicon.svg` が 200 で取得されること。
    * アドレスバーのアイコンが表示されること。

14. **エディタ入力が可能**
    * 画面ロード時、Console に syntax error が出ていないこと。
    * エディタ内をクリックして文字入力ができること（`editor.js` の構文エラーが解消されている）。
    * 画像ボタンでローカル画像選択時、サムネイルが挿入され、ステータスに情報メッセージが表示される。

#### シーン/選択肢挿入・Markdown 変換の回帰テスト（2025-08-17 追加）

15. **シーン挿入ボタンの動作**
    * `#insert-scene` または `.insert-scene-btn`（旧 `.ql-insert-scene` でも可）をクリック。
    * エディタに以下のスニペットが挿入されること。
      - `## 新しいシーン` ヘッダ
      - `### 選択肢` と `- [次のシーン](scene:2)` の行
    * 挿入直後にプレビューが更新されること（`#preview-content`）。

16. **選択肢挿入ボタンの動作**
    * `#insert-choice` または `.insert-choice-btn`（旧 `.ql-insert-choice` でも可）をクリック。
    * エディタに以下のスニペットが挿入されること。
      - `### 選択肢`
      - `- [選択肢1](scene:1)` および `- [選択肢2](scene:2)`
    * 挿入直後にプレビューが更新されること。

17. **markdown 変換でエラーが出ない**
    * コンソールに `window.marked is not a function` を含むエラーが出ないこと。
    * `scene:1` などのリンクは、プレビューでは `<a class="scene-link" data-scene-id="1">...</a>` に変換されていること。
    * `marked` の実装差異（関数/`parse`）どちらでもプレビューが生成されること。

### Game Play Testing

1.  Open a game by either starting a test play from the editor or selecting a game from the main page.
2.  **Initial State:**
    *   Verify that the initial scene, character status, and inventory are displayed correctly based on the scenario data.
3.  **Player Interaction:**
    *   Enter a command in the input field and press Enter or click the send button.
    *   The story should progress based on your input.
    *   Check if the game state (flags, inventory) updates as expected.

## 3. 回帰テスト（エディタ重複表示の修正）

以下の手順で、シナリオエディタ画面にエディタが二重表示されないことを確認します。

1. サーバを起動します。
   ```bash
   python main.py
   ```
2. ブラウザで `http://localhost:8000/editor` を開きます。（旧 `/scenario-editor.html` からもリダイレクトされます）
3. 以下を確認します（すべて満たすこと）。
   - ツールバーが1つだけ表示されている（`太字/斜体/下線` などが1セットのみ）。
   - エディタ本体（入力エリア）が1つだけ存在する（`.ql-container` が1つ）。
   - ボタン `#insert-scene` / `#insert-choice` または `.ql-insert-scene` / `.ql-insert-choice` がクリック時にそれぞれのスニペットを挿入する。
   - 入力に応じてプレビュー（`#preview-content`）が即座に更新される。
   - ブラウザのコンソールにエラーが出ていない。
4. `画像` ボタンでローカル画像を選択し、エディタにサムネイルが挿入されることを確認します（暫定：URL.createObjectURL）。

補足:
- 本修正により、既存のツールバーDOM（`#editor-toolbar`, `#toolbar-container`, `#toolbar`）が存在する場合、それを再利用し新規ツールバーが生成されない仕様です。
- `initializeEditor()` は単一初期化を保証し、既存インスタンスがある場合は再初期化をスキップします。
- 予防的に `cleanupEditorDom()` が重複した `.ql-toolbar` や `.ql-container` を除去し、`#editor` の内部をクリアしてから初期化します。

---

以上の修正を適用し、再度動作確認をお願いいたします。特に、トップページの表示と、シナリオエディタでのシナリオ一覧・詳細の表示が正しく行われるかをご確認ください。