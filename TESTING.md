# Testing Guide

This document provides instructions for testing the Adventure Game AI project.

## 1. Running the Application

1.  **Start the backend server:**
    Open a terminal in the project root directory and run the following command:
    ```bash
    python main.py
    ```
    The server will start on `http://localhost:8765` by default.

2.  **Access the application:**
    Open your web browser and navigate to one of the following URLs:
    *   **Main Page:** [http://localhost:8765](http://localhost:8765)
    *   **Scenario Editor:** [http://localhost:8765/scenario-editor.html](http://localhost:8765/scenario-editor.html)

## 2. How to Test

### Scenario Editor Testing

1.  Navigate to the [Scenario Editor](http://localhost:8765/scenario-editor.html).
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

### Game Play Testing

1.  Open a game by either starting a test play from the editor or selecting a game from the main page.
2.  **Initial State:**
    *   Verify that the initial scene, character status, and inventory are displayed correctly based on the scenario data.
3.  **Player Interaction:**
    *   Enter a command in the input field and press Enter or click the send button.
    *   The story should progress based on your input.
    *   Check if the game state (flags, inventory) updates as expected.

---

以上の修正を適用し、再度動作確認をお願いいたします。特に、トップページの表示と、シナリオエディタでのシナリオ一覧・詳細の表示が正しく行われるかをご確認ください。