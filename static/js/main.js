document.addEventListener('DOMContentLoaded', () => {
    const storyContainer = document.getElementById('story-container');
    const generateButton = document.getElementById('generate-button');
    const promptInput = document.getElementById('prompt-input');

    // UI操作とロジックを分離
    const ui = {
        showLoading() {
            storyContainer.innerHTML = '<p>物語を生成中...</p>';
        },
        showError(message) {
            storyContainer.innerHTML = `<p>エラーが発生しました: ${message}</p>`;
        },
        displayGameLinks(gameData) {
            const { game_id, title } = gameData;
            storyContainer.innerHTML = `
                <h3>「${title}」が生成されました！</h3>
                <p>以下のリンクからゲームを開始できます。</p>
                <a href="/game.html?gameId=${game_id}" class="button">ゲームをプレイ</a>
                <a href="/archive.html" class="button">ゲーム一覧を見る</a>
            `;
        },
        loadSavedGame() {
            const savedGameData = localStorage.getItem('generatedGame');
            if (savedGameData) {
                try {
                    const gameData = JSON.parse(savedGameData);
                    this.displayGameLinks(gameData);
                } catch (e) {
                    console.error("Error parsing saved game data:", e);
                    localStorage.removeItem('generatedGame'); // 不正なデータは削除
                }
            }
        }
    };

    // イベントリスナー
    generateButton.addEventListener('click', async () => {
        const prompt = promptInput.value;
        if (!prompt) {
            alert('プロンプトを入力してください。');
            return;
        }

        ui.showLoading();

        try {
            const data = await api.generateGame(prompt);
            ui.displayGameLinks(data);
            localStorage.setItem('generatedGame', JSON.stringify(data));
        } catch (error) {
            console.error('物語の生成に失敗しました:', error);
            ui.showError(error.message);
        }
    });

    // 初期化
    ui.loadSavedGame();
});