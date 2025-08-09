import { gameState } from './gameState.js';
import { initializeUI, updateStepUI, showError } from './ui.js';

/**
 * ゲームを初期化します
 * @param {Object} gameData - ゲームデータ
 */
export function initializeGame(gameData) {
    try {
        if (!gameData) {
            throw new Error('ゲームデータが提供されていません');
        }
        
        console.log('Initializing game with data:', gameData);
        gameState.initialize(gameData);
        
        // UIの初期化
        initializeUI(gameData);
        
        // 最初のステップを表示
        updateGameStep();
        
    } catch (error) {
        console.error('ゲームの初期化中にエラーが発生しました:', error);
        showError('ゲームの初期化中にエラーが発生しました: ' + error.message);
    }
}

/**
 * アクションがクリックされたときの処理
 * @param {string|number} nextStepId - 次のステップのID
 */
export function handleActionClick(nextStepId) {
    try {
        console.log('Action clicked, next step:', nextStepId);
        gameState.setCurrentStepId(nextStepId);
        updateGameStep();
    } catch (error) {
        console.error('アクションの処理中にエラーが発生しました:', error);
        showError('アクションの処理中にエラーが発生しました: ' + error.message);
    }
}

/**
 * 現在のゲームステップを更新します
 */
function updateGameStep() {
    try {
        const currentStep = gameState.getCurrentStep();
        
        if (!currentStep) {
            throw new Error('現在のステップを取得できませんでした');
        }

        console.log('Updating game step:', currentStep);

        // --- actions_on_enterの処理 ---
        if (currentStep.actions_on_enter) {
            console.log('Processing actions_on_enter:', currentStep.actions_on_enter);
            for (const action of currentStep.actions_on_enter) {
                if (action.type === "add_to_inventory") {
                    gameState.addToInventory(action.item);
                } else if (action.type === "set_flag") {
                    gameState.setFlag(action.flag_name, action.value);
                }
            }
        }

        // UIを更新
        updateStepUI(currentStep, handleActionClick);
        
    } catch (error) {
        console.error('ゲームステップの更新中にエラーが発生しました:', error);
        showError('ゲームの進行中にエラーが発生しました: ' + error.message);
    }
}