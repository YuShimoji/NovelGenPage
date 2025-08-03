import { ViewManager } from './viewManager.js';
import { GameManager } from './gameManager.js';
import { api } from './api.js';
import { CommonUI } from './commonUI.js';

/**
 * ホーム画面のUI管理
 */
class HomeUI {
    constructor() {
        this.storyContainer = document.getElementById('story-container');
        this.generateButton = document.getElementById('generate-button');
        this.promptInput = document.getElementById('prompt-input');
        this.gameListContainer = document.getElementById('game-list');
        this.backToHomeButton = document.getElementById('back-to-home');
        
        this.initializeEventListeners();
        this.initialize();
    }
    
    initializeEventListeners() {
        this.generateButton.addEventListener('click', () => this.handleGenerateClick());
        this.backToHomeButton.addEventListener('click', () => ViewManager.showHome());
    }
    
    async initialize() {
        this.loadSavedGame();
        await this.loadGameList();
    }
    
    async handleGenerateClick() {
        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            alert('プロンプトを入力してください。');
            return;
        }

        CommonUI.showLoading(this.storyContainer);

        try {
            const data = await api.generateGame(prompt);
            this.displayGameLinks(data);
            localStorage.setItem('generatedGame', JSON.stringify(data));
            // 新しいゲームが生成されたらゲーム一覧を更新
            await this.loadGameList();
            // プロンプト入力をクリア
            this.promptInput.value = '';
        } catch (error) {
            console.error('物語の生成に失敗しました:', error);
            CommonUI.showError(this.storyContainer, error.message);
        }
    }
    
    displayGameLinks(gameData) {
        const { game_id, title } = gameData;
        CommonUI.showSuccess(
            this.storyContainer,
            `「${title}」が生成されました！`,
            '新しいゲームが作成されました。すぐにプレイできます。',
            '🎮 今すぐプレイ',
            `GameManager.loadGame('${game_id}')`
        );
    }
    
    displayGameList(games) {
        if (!games || games.length === 0) {
            this.gameListContainer.innerHTML = '<p class="no-games-message">利用可能なゲームがありません。</p>';
            return;
        }

        let html = '';
        games.forEach(game => {
            html += `
                <div class="game-card" onclick="GameManager.loadGame('${game.game_id}')">
                    <h3>${game.title}</h3>
                    <p>${game.description}</p>
                </div>
            `;
        });
        this.gameListContainer.innerHTML = html;
    }
    
    async loadGameList() {
        CommonUI.showLoading(this.gameListContainer);
        try {
            const games = await api.getScenarioList();
            this.displayGameList(games);
        } catch (error) {
            CommonUI.showError(this.gameListContainer, `ゲーム一覧の読み込みに失敗しました: ${error.message}`);
        }
    }
    
    loadSavedGame() {
        const savedGameData = localStorage.getItem('generatedGame');
        if (savedGameData) {
            try {
                const gameData = JSON.parse(savedGameData);
                this.displayGameLinks(gameData);
            } catch (e) {
                console.error("Error parsing saved game data:", e);
                localStorage.removeItem('generatedGame');
            }
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    // グローバルに公開（HTMLから呼び出すため）
    window.GameManager = GameManager;
    window.ViewManager = ViewManager;
    
    // ホーム画面UI初期化
    new HomeUI();
});