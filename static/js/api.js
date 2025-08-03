// static/js/api.js

/**
 * APIと通信するためのヘルパー関数群
 */
export const api = {
    /**
     * プロンプトを元に新しいゲームを生成します。
     * @param {string} prompt
     * @returns {Promise<object>} 生成されたゲームデータ
     */
    async generateGame(prompt) {
        return this._post('/api/generate', { prompt });
    },

    /**
     * シナリオを更新します。
     * @param {object} scenarioData
     * @returns {Promise<object>} 更新結果
     */
    async updateScenario(scenarioData) {
        return this._post('/api/update_scenario', scenarioData);
    },

    /**
     * 指定されたIDのシナリオデータを取得します。
     * @param {string} gameId
     * @returns {Promise<object>} シナリオデータ
     */
    async getScenario(gameId) {
        return this._get(`/api/scenario/${gameId}`);
    },

    /**
     * すべてのシナリオのリストを取得します。
     * @returns {Promise<Array>} シナリオのリスト
     */
    async getScenarioList() {
        return this._get('/api/stories');
    },

    /**
     * POSTリクエストを送信します。
     * @private
     */
    async _post(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return this._handleResponse(response);
    },

    /**
     * GETリクエストを送信します。
     * @private
     */
    async _get(url) {
        const response = await fetch(url);
        return this._handleResponse(response);
    },

    /**
     * レスポンスを処理します。
     * @private
     */
    async _handleResponse(response) {
        if (!response.ok) {
            let errorMsg = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || JSON.stringify(errorData);
            } catch (e) {
                // JSONのパースに失敗した場合、テキストとしてエラーを取得
                try {
                    const textError = await response.text();
                    errorMsg = textError || errorMsg;
                } catch (textErr) { /* ignore */ }
            }
            console.error('API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        return response.json();
    }
};