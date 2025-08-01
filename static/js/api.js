// static/js/api.js

/**
 * APIと通信するためのヘルパー関数群
 */

const api = {
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
        return this._get(`/games/${gameId}.json`);
    },

    /**
     * すべてのシナリオのリストを取得します。
     * @returns {Promise<Array>} シナリオのリスト
     */
    async getScenarioList() {
        return this._get('/games/archive_list.json');
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
            const errorData = await response.json().catch(() => ({ error: 'Server error with no JSON response' }));
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        return response.json();
    }
};