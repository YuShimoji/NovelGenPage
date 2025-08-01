import { gameState } from './gameState.js';
// import { handleActionClick } from './gameLogic.js'; // この行を削除

const gameTitleElement = document.getElementById('game-title');
const gameDescriptionElement = document.getElementById('game-description');
const stepTextElement = document.getElementById('step-text');
const actionButtonsContainer = document.getElementById('action-buttons');
const gameArea = document.getElementById('game-area');
const clearMessageElement = document.getElementById('clear-message');

export function initializeUI(gameData) {
    gameTitleElement.textContent = gameData.title;
    gameDescriptionElement.textContent = gameData.description;
}

export function updateStepUI(actionCallback) { // actionCallbackを引数に追加
    const currentStep = gameState.getCurrentStep();

    if (!currentStep) {
        stepTextElement.textContent = 'エラー: 次のステップが見つかりません。';
        actionButtonsContainer.style.display = 'none';
        return;
    }

    typeWriter(currentStep.text_content, () => {
        renderActionButtons(currentStep, actionCallback); // actionCallbackを渡す
    });

    if (currentStep.is_final || !currentStep.actions || currentStep.actions.length === 0) {
        showClearMessage(currentStep.clear_message || 'ゲームクリア！');
    } 
}

function typeWriter(text, callback) {
    let i = 0;
    stepTextElement.textContent = '';
    actionButtonsContainer.style.display = 'none';

    function type() {
        if (i < text.length) {
            stepTextElement.textContent += text.charAt(i);
            i++;
            setTimeout(type, 50);
        } else {
            actionButtonsContainer.style.display = 'block';
            if (callback) callback();
        }
    }
    type();
}

function renderActionButtons(currentStep, actionCallback) { // actionCallbackを引数に追加
    actionButtonsContainer.innerHTML = '';
    const availableActions = getAvailableActions(currentStep);

    availableActions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.onclick = () => actionCallback(action.next_step_id); // コールバックを実行
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

function showClearMessage(message) {
    gameArea.style.display = 'none';
    clearMessageElement.textContent = message;
    clearMessageElement.style.display = 'block';
}