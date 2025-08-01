export const gameState = {
    currentStepId: null,
    inventory: [],
    flags: {},
    gameData: null,

    initialize(data) {
        this.gameData = data;
        this.currentStepId = data.steps[0].step_id;
        this.inventory = [];
        this.flags = {};
    },

    addToInventory(item) {
        if (!this.inventory.includes(item)) {
            this.inventory.push(item);
        }
    },

    setFlag(name, value) {
        this.flags[name] = value;
    },

    setCurrentStepId(stepId) {
        this.currentStepId = stepId;
    },

    getCurrentStep() {
        return this.gameData.steps.find(step => step.step_id === this.currentStepId);
    }
};