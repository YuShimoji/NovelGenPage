import { ViewManager } from './viewManager.js';

/**
 * ゲーム管理モジュール
 */
export const GameManager = {
    currentGameData: null,
    
    async loadGame(gameId) {
        try {
            // 動的インポートでAPIモジュールを読み込み
            const { api } = await import('./api.js');
            const gameData = await api.getScenario(gameId);
            this.currentGameData = gameData;
            
            // ゲームビューに切り替え
            ViewManager.showGame();
            
            // ゲームを初期化（動的インポート）
            const { initializeGame } = await import('./gameLogic.js');
            initializeGame(gameData);
            
        } catch (error) {
            console.error('ゲームの読み込みに失敗:', error);
            alert(`ゲームの読み込みに失敗しました: ${error.message}`);
        }
    }
};