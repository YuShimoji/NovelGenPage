import { gameState } from './gameState.js';
import { initializeUI, updateStepUI } from './ui.js';

export function initializeGame(gameData) {
    gameState.initialize(gameData);
    initializeUI(gameData);
    updateGameStep();
}

export function handleActionClick(nextStepId) {
    gameState.setCurrentStepId(nextStepId);
    updateGameStep();
}

function updateGameStep() {
    const currentStep = gameState.getCurrentStep();
    if (!currentStep) return;

    // --- actions_on_enterの処理 ---
    if (currentStep.actions_on_enter) {
        for (const action of currentStep.actions_on_enter) {
            if (action.type === "add_to_inventory") {
                gameState.addToInventory(action.item);
            } else if (action.type === "set_flag") {
                gameState.setFlag(action.flag_name, action.value);
            }
        }
    }

    updateStepUI();
}