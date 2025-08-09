export const gameState = {
    currentStepId: null,
    inventory: [],
    flags: {},
    gameData: null,

    initialize(data) {
        this.gameData = data;
        // バックエンドのデータ構造に合わせてステップを処理
        if (data.scenes && data.scenes.length > 0) {
            this.currentStepId = 0; // 最初のシーンのインデックス
        } else if (data.steps && data.steps.length > 0) {
            // 旧形式のデータ構造のサポート
            this.currentStepId = data.steps[0].step_id || 0;
        }
        this.inventory = [];
        this.flags = {};
        
        // デバッグ用
        console.log('Game data initialized:', this.gameData);
    },

    addToInventory(item) {
        if (!this.inventory.includes(item)) {
            this.inventory.push(item);
            console.log('Added to inventory:', item);
        }
    },

    setFlag(name, value) {
        this.flags[name] = value;
        console.log(`Flag set: ${name} = ${value}`);
    },

    setCurrentStepId(stepId) {
        this.currentStepId = stepId;
        console.log('Current step set to:', stepId);
    },

    getCurrentStep() {
        if (!this.gameData) {
            console.error('Game data is not initialized');
            return null;
        }
        
        // 新しいデータ構造（scenes配列）をサポート
        if (this.gameData.scenes && this.gameData.scenes.length > 0) {
            const scene = this.gameData.scenes[this.currentStepId];
            if (!scene) {
                console.error(`Scene with index ${this.currentStepId} not found`);
                return null;
            }
            // フロントエンドが期待する形式に変換
            return {
                step_id: this.currentStepId,
                text_content: scene.content.map(item => item.value).join('\n'),
                actions: this._extractActions(scene.content)
            };
        }
        
        // 旧形式のデータ構造をサポート
        if (this.gameData.steps) {
            return this.gameData.steps.find(step => 
                step.step_id === this.currentStepId || step.id === this.currentStepId
            );
        }
        
        console.error('No valid steps or scenes found in game data');
        return null;
    },
    
    _extractActions(content) {
        if (!content) return [];
        return content
            .filter(item => item.type === 'action')
            .map((action, index) => ({
                text: action.value,
                next_step_id: this.currentStepId + 1 + index // 簡易的な実装
            }));
    }
};