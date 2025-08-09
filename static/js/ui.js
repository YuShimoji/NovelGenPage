import { gameState } from './gameState.js';

// DOM要素のキャッシュ
const gameTitleElement = document.getElementById('game-title');
const gameDescriptionElement = document.getElementById('game-description');
const stepTextElement = document.getElementById('step-text');
const actionButtonsContainer = document.getElementById('action-buttons');
const gameContentElement = document.querySelector('.game-content');
const clearMessageElement = document.getElementById('clear-message');
const errorContainer = document.createElement('div');
errorContainer.className = 'error-message';
document.body.appendChild(errorContainer);

/**
 * UIを初期化します
 * @param {Object} gameData - ゲームデータ
 */
export function initializeUI(gameData) {
    try {
        console.log('Initializing UI with game data:', gameData);
        
        if (!gameData) {
            throw new Error('ゲームデータが提供されていません');
        }

        if (gameTitleElement) {
            gameTitleElement.textContent = gameData.title || '無題のゲーム';
        }
        
        if (gameDescriptionElement) {
            gameDescriptionElement.textContent = gameData.description || '';
        }
        
        // エラーメッセージをクリア
        hideError();
        
    } catch (error) {
        console.error('UIの初期化中にエラーが発生しました:', error);
        showError('UIの初期化中にエラーが発生しました: ' + error.message);
    }
}

/**
 * ステップUIを更新します
 * @param {Object} currentStep - 現在のステップデータ
 * @param {Function} actionCallback - アクションがクリックされたときのコールバック関数
 */
export function updateStepUI(currentStep, actionCallback) {
    try {
        console.log('Updating step UI:', currentStep);
        
        if (!currentStep) {
            throw new Error('ステップデータが提供されていません');
        }
        
        // クリアメッセージを非表示
        if (clearMessageElement) {
            clearMessageElement.style.display = 'none';
        }
        
        // コンテンツを表示
        if (gameContentElement) {
            gameContentElement.style.display = 'block';
        }
        
        // テキストを表示（タイプライター効果付き）
        const textContent = currentStep.text_content || currentStep.text || 'テキストがありません';
        typeWriter(textContent, () => {
            // アクションボタンを表示（最終ステップでない場合）
            if (!currentStep.is_final) {
                renderActionButtons(currentStep, actionCallback);
            }
        });
        
        // ゲームクリア時の処理
        if (currentStep.is_final || !currentStep.actions || currentStep.actions.length === 0) {
            showClearMessage(currentStep.clear_message || 'ゲームクリア！');
        }
        
    } catch (error) {
        console.error('ステップUIの更新中にエラーが発生しました:', error);
        showError('ゲームの表示中にエラーが発生しました: ' + error.message);
    }
}

/**
 * タイプライター効果でテキストを表示します
 * @param {string} text - 表示するテキスト
 * @param {Function} callback - 表示完了時のコールバック関数
 */
function typeWriter(text, callback) {
    try {
        if (!stepTextElement) {
            throw new Error('ステップテキスト要素が見つかりません');
        }
        
        let i = 0;
        stepTextElement.textContent = '';
        
        // アクションボタンを非表示
        if (actionButtonsContainer) {
            actionButtonsContainer.style.display = 'none';
        }
        
        // テキストが空の場合は即座にコールバックを実行
        if (!text || text.length === 0) {
            if (callback) callback();
            return;
        }
        
        // タイプライター効果でテキストを表示
        function type() {
            try {
                if (i < text.length) {
                    stepTextElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 30); // タイピング速度を調整
                } else {
                    // テキスト表示完了後にアクションボタンを表示
                    if (actionButtonsContainer) {
                        actionButtonsContainer.style.display = 'block';
                    }
                    
                    // コールバックを実行
                    if (callback) {
                        callback();
                    }
                }
            } catch (error) {
                console.error('タイプライター効果の実行中にエラーが発生しました:', error);
                if (callback) callback();
            }
        }
        
        // タイピングを開始
        type();
        
    } catch (error) {
        console.error('タイプライター効果の初期化中にエラーが発生しました:', error);
        if (callback) callback();
    }
}

function renderActionButtons(currentStep, actionCallback) {
    if (!actionButtonsContainer) return;
    
    actionButtonsContainer.innerHTML = '';
    const availableActions = getAvailableActions(currentStep);

    availableActions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.className = 'action-button';
        button.onclick = () => actionCallback(action.next_step_id);
        actionButtonsContainer.appendChild(button);
    });
}

function getAvailableActions(currentStep) {
    if (!currentStep.actions) return [];

    return currentStep.actions.filter(action => {
        if (!action.conditions) return true;

        if (action.conditions.inventory_has) {
            if (!gameState.inventory.includes(action.conditions.inventory_has)) {
                return false;
            }
        }

        if (action.conditions.flag_is) {
            const { flag_name, value } = action.conditions.flag_is;
            if (gameState.flags[flag_name] !== value) {
                return false;
            }
        }
        return true;
    });
}

/**
 * エラーメッセージを表示します
 * @param {string} message - 表示するエラーメッセージ
 */
export function showError(message) {
    console.error('UI Error:', message);
    
    if (!errorContainer) return;
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // 5秒後にエラーメッセージを非表示にする
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * エラーメッセージを非表示にします
 */
function hideError() {
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.textContent = '';
    }
}

/**
 * クリアメッセージを表示します
 * @param {string} message - 表示するメッセージ
 */
function showClearMessage(message) {
    try {
        console.log('Showing clear message:', message);
        
        if (gameContentElement) {
            gameContentElement.style.display = 'none';
        }
        
        if (clearMessageElement) {
            clearMessageElement.textContent = message || 'ゲームクリア！';
            clearMessageElement.style.display = 'block';
            
            // ホームに戻るボタンを追加
            const homeButton = document.createElement('button');
            homeButton.textContent = 'ホームに戻る';
            homeButton.className = 'button';
            homeButton.onclick = () => window.location.href = '/';
            
            clearMessageElement.appendChild(document.createElement('br'));
            clearMessageElement.appendChild(homeButton);
        }
        
    } catch (error) {
        console.error('クリアメッセージの表示中にエラーが発生しました:', error);
    }
}