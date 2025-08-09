import { ViewManager } from './viewManager.js';
import { api } from './api.js';
import { initializeGame } from './gameLogic.js';

/**
 * ゲーム管理モジュール
 */
export const GameManager = {
    currentGameData: null,
    
    async loadGame(gameId) {
        try {
            console.log('Loading game:', gameId);
            
            const gameData = await api.getScenario(gameId);
            this.currentGameData = gameData;
            
            console.log('Game data loaded:', gameData);
            
            // ゲームビューに切り替え
            ViewManager.showGame();
            
            // DOMの更新が完了してからゲームを初期化する
            requestAnimationFrame(() => {
                // 2フレーム待つことで、より確実に描画更新後を狙う
                requestAnimationFrame(() => {
                    try {
                        initializeGame(gameData);
                        console.log('Game initialized successfully');
                    } catch (initError) {
                        console.error('Game initialization failed:', initError);
                        alert(`ゲームの初期化に失敗しました: ${initError.message}`);
                    }
                });
            });
            
        } catch (error) {
            console.error('ゲームの読み込みに失敗:', error);
            alert(`ゲームの読み込みに失敗しました: ${error.message}`);
        }
    }
};
