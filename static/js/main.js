import { ViewManager } from './viewManager.js';
import { GameManager } from './gameManager.js';
import { api } from './api.js';
import { CommonUI } from './commonUI.js';

/**
 * ホーム画面のUI管理
 */
class HomeUI {
    constructor() {
        // DOM要素のキャッシュ
        this.storyContainer = document.getElementById('story-container');
        this.generateButton = document.getElementById('generate-button');
        this.themeInput = document.getElementById('theme-input');
        this.keywordsInput = document.getElementById('keywords-input');
        this.gameListContainer = document.getElementById('game-list');
        this.backToHomeButton = document.getElementById('back-to-home');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // 状態管理
        this.isLoading = false;
        
        this.initializeEventListeners();
        this.initialize();
    }
    
    /**
     * イベントリスナーを初期化します
     */
    initializeEventListeners() {
        // ゲーム生成ボタン
        this.generateButton?.addEventListener('click', () => this.handleGenerateClick());
        
        // Enterキーでも送信できるようにする
        this.themeInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleGenerateClick();
            }
        });
        
        this.keywordsInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleGenerateClick();
            }
        });
        
        // ホームに戻るボタン
        this.backToHomeButton?.addEventListener('click', () => ViewManager.showHome());

        // イベントデリゲーションでゲームカードのクリックを処理
        this.gameListContainer?.addEventListener('click', (event) => {
            const gameCard = event.target.closest('.game-card');
            if (gameCard && gameCard.dataset.gameId) {
                this.handleGameCardClick(gameCard.dataset.gameId);
            }
        });

        // イベントデリゲーションで生成成功メッセージのボタンクリックを処理
        this.storyContainer?.addEventListener('click', (event) => {
            const playButton = event.target.closest('.play-now-button');
            if (playButton && playButton.dataset.gameId) {
                this.handlePlayButtonClick(playButton.dataset.gameId);
            }
        });
    }
    
    /**
     * 初期化処理
     */
    async initialize() {
        try {
            this.loadSavedGame();
            await this.loadGameList();
        } catch (error) {
            console.error('初期化中にエラーが発生しました:', error);
            CommonUI.showError(this.storyContainer, `初期化中にエラーが発生しました: ${error.message}`);
        }
    }
    
    /**
     * ゲーム生成ボタンのクリックイベント
     */
    async handleGenerateClick() {
        if (this.isLoading) return;
        
        const theme = this.themeInput?.value.trim() || '';
        const keywords = this.keywordsInput?.value.trim() || '';

        // バリデーション
        if (!theme) {
            CommonUI.showError(this.storyContainer, 'テーマを入力してください');
            this.themeInput?.focus();
            return;
        }

        this.setLoading(true);

        try {
            const data = await api.generateGame(theme, keywords);
            
            if (!data || !data.game_id) {
                throw new Error('無効なゲームデータが返されました');
            }
            
            this.displayGameLinks(data);
            
            // ローカルストレージに保存
            try {
                localStorage.setItem('generatedGame', JSON.stringify(data));
            } catch (e) {
                console.error('ゲームデータの保存に失敗しました:', e);
                // ストレージのエラーはユーザーに通知せずに続行
            }
            
            // 新しいゲームが生成されたらゲーム一覧を更新
            await this.loadGameList();
            
            // 入力フィールドをクリア
            if (this.themeInput) this.themeInput.value = '';
            if (this.keywordsInput) this.keywordsInput.value = '';
            
        } catch (error) {
            console.error('物語の生成に失敗しました:', error);
            CommonUI.showError(
                this.storyContainer, 
                `ゲームの生成に失敗しました: ${error.message || '不明なエラーが発生しました'}`
            );
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * ゲームカードのクリックイベント
     * @param {string} gameId - ゲームID
     */
    handleGameCardClick(gameId) {
        if (this.isLoading) return;
        this.setLoading(true);
        
        GameManager.loadGame(gameId)
            .catch(error => {
                console.error('ゲームの読み込みに失敗しました:', error);
                CommonUI.showError(
                    this.storyContainer,
                    `ゲームの読み込みに失敗しました: ${error.message || '不明なエラーが発生しました'}`
                );
            })
            .finally(() => {
                this.setLoading(false);
            });
    }
    
    /**
     * プレイボタンのクリックイベント
     * @param {string} gameId - ゲームID
     */
    handlePlayButtonClick(gameId) {
        this.handleGameCardClick(gameId);
    }
    
    /**
     * ゲームリンクを表示します
     * @param {Object} gameData - ゲームデータ
     */
    displayGameLinks(gameData) {
        if (!gameData || !gameData.game_id) {
            console.error('無効なゲームデータです:', gameData);
            return;
        }
        
        const { game_id, title = '無題のゲーム' } = gameData;
        
        CommonUI.showSuccess(
            this.storyContainer,
            `「${title}」が生成されました！`,
            '新しいゲームが作成されました。すぐにプレイできます。',
            '🎮 今すぐプレイ',
            game_id
        );
        
        // スクロールしてメッセージを表示
        this.storyContainer?.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * ゲーム一覧を表示します
     * @param {Array} games - ゲームの配列
     */
    displayGameList(games) {
        if (!this.gameListContainer) return;
        
        if (!games || !Array.isArray(games) || games.length === 0) {
            this.gameListContainer.innerHTML = `
                <div class="no-games-message">
                    <p>利用可能なゲームがありません。</p>
                    <p>上のフォームから新しいゲームを作成しましょう！</p>
                </div>`;
            return;
        }

        let html = '';
        games.forEach(game => {
            if (!game || !game.game_id) return;
            
            const title = game.title || '無題のゲーム';
            const description = game.description || '説明はありません';
            const date = game.created_at ? this.formatDate(game.created_at) : '';
            
            html += `
                <div class="game-card" data-game-id="${game.game_id}">
                    <div class="game-card-content">
                        <h3>${title}</h3>
                        <p class="game-description">${description}</p>
                        ${date ? `<p class="game-date">${date}</p>` : ''}
                    </div>
                    <button class="play-button">プレイする</button>
                </div>
            `;
        });
        
        this.gameListContainer.innerHTML = html || '<p class="no-games-message">利用可能なゲームがありません。</p>';
    }
    
    /**
     * 日付をフォーマットします
     * @param {string} dateString - 日付文字列
     * @returns {string} フォーマットされた日付
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('日付のフォーマットに失敗しました:', e);
            return '';
        }
    }
    
    /**
     * ゲーム一覧を読み込みます
     */
    async loadGameList() {
        if (!this.gameListContainer) return;
        
        this.setLoading(true);
        CommonUI.showLoading(this.gameListContainer);
        
        try {
            const games = await api.getScenarioList();
            this.displayGameList(games);
        } catch (error) {
            console.error('ゲーム一覧の読み込みに失敗しました:', error);
            CommonUI.showError(
                this.gameListContainer, 
                `ゲーム一覧の読み込みに失敗しました: ${error.message || '不明なエラーが発生しました'}`
            );
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * 保存されたゲームを読み込みます
     */
    loadSavedGame() {
        if (!this.storyContainer) return;
        
        try {
            const savedGameData = localStorage.getItem('generatedGame');
            if (savedGameData) {
                const gameData = JSON.parse(savedGameData);
                if (gameData && gameData.game_id) {
                    this.displayGameLinks(gameData);
                } else {
                    // 無効なデータは削除
                    localStorage.removeItem('generatedGame');
                }
            }
        } catch (e) {
            console.error('保存されたゲームデータの読み込みに失敗しました:', e);
            // エラーが発生した場合はデータを削除
            localStorage.removeItem('generatedGame');
        }
    }
    
    /**
     * ローディング状態を設定します
     * @param {boolean} isLoading - ローディング中かどうか
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        
        // ローディングインジケーターを表示/非表示
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
        
        // ボタンの無効/有効を切り替え
        if (this.generateButton) {
            this.generateButton.disabled = isLoading;
            this.generateButton.textContent = isLoading ? '生成中...' : 'ゲームを生成';
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        // グローバルに公開（HTMLから呼び出すため）
        window.GameManager = GameManager;
        window.ViewManager = ViewManager;
        
        // ホーム画面UI初期化
        new HomeUI();
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
        
        // エラーメッセージを表示
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = 'アプリケーションの初期化中にエラーが発生しました。ページをリロードしてください。';
        document.body.appendChild(errorContainer);
    }
});