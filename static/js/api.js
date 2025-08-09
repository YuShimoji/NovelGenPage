// static/js/api.js

/**
 * APIと通信するためのヘルパー関数群
 */
export const api = {
    // ベースURL
    baseUrl: '',
    
    /**
     * APIのベースURLを設定します
     * @param {string} url - ベースURL
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    },
    
    /**
     * 完全なURLを構築します
     * @private
     */
    _buildUrl(path) {
        // 絶対URLの場合はそのまま返す
        if (path.startsWith('http')) {
            return path;
        }
        // 相対パスの場合はベースURLと結合
        return `${this.baseUrl}${path}`;
    },

    /**
     * プロンプトを元に新しいゲームを生成します。
     * @param {string} theme - ゲームのテーマ
     * @param {string} keywords - ゲームのキーワード
     * @returns {Promise<object>} 生成されたゲームデータ
     */
    async generateGame(theme, keywords) {
        console.log(`Generating game with theme: ${theme}, keywords: ${keywords}`);
        try {
            const data = await this._post('/api/generate', { theme, keywords });
            console.log('Game generated successfully:', data);
            return data;
        } catch (error) {
            console.error('Game generation failed:', error);
            throw error;
        }
    },

    /**
     * シナリオを更新します。
     * @param {object} scenarioData - 更新するシナリオデータ
     * @returns {Promise<object>} 更新結果
     */
    async updateScenario(scenarioData) {
        console.log('Updating scenario:', scenarioData);
        try {
            const data = await this._post('/api/update_scenario', scenarioData);
            console.log('Scenario updated successfully');
            return data;
        } catch (error) {
            console.error('Failed to update scenario:', error);
            throw error;
        }
    },

    /**
     * 指定されたIDのシナリオデータを取得します。
     * @param {string} gameId - 取得するゲームのID
     * @returns {Promise<object>} シナリオデータ
     */
    async getScenario(gameId) {
        console.log(`Fetching scenario with ID: ${gameId}`);
        try {
            const data = await this._get(`/api/scenario/${gameId}`);
            console.log('Scenario data retrieved:', data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch scenario ${gameId}:`, error);
            throw error;
        }
    },

    /**
     * すべてのシナリオのリストを取得します。
     * @returns {Promise<Array>} シナリオのリスト
     */
    async getScenarioList() {
        console.log('Fetching scenario list');
        try {
            const data = await this._get('/api/stories');
            console.log(`Retrieved ${data.length} scenarios`);
            return data;
        } catch (error) {
            console.error('Failed to fetch scenario list:', error);
            // エラーが発生しても空の配列を返して処理を継続
            return [];
        }
    },

    /**
     * POSTリクエストを送信します。
     * @param {string} url - リクエスト先URL
     * @param {object} body - リクエストボディ
     * @param {object} options - 追加のオプション
     * @returns {Promise<object>} レスポンスデータ
     * @private
     */
    async _post(url, body, options = {}) {
        const fullUrl = this._buildUrl(url);
        console.log(`POST ${fullUrl}`, body);
        
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(body)
        };
        
        const response = await fetch(fullUrl, { ...defaultOptions, ...options });
        return this._handleResponse(response);
    },

    /**
     * GETリクエストを送信します。
     * @param {string} url - リクエスト先URL
     * @param {object} options - 追加のオプション
     * @returns {Promise<object>} レスポンスデータ
     * @private
     */
    async _get(url, options = {}) {
        const fullUrl = this._buildUrl(url);
        console.log(`GET ${fullUrl}`);
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        };
        
        const response = await fetch(fullUrl, { ...defaultOptions, ...options });
        return this._handleResponse(response);
    },

    /**
     * レスポンスを処理します。
     * @param {Response} response - Fetch APIのレスポンスオブジェクト
     * @returns {Promise<object>} パースされたJSONデータ
     * @private
     */
    async _handleResponse(response) {
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        // レスポンスのコピーを作成（ストリームを消費するため）
        const responseClone = response.clone();
        
        try {
            // まずJSONとしてパースを試みる
            const data = await response.json();
            
            if (!response.ok) {
                const error = new Error(data.message || `API request failed with status ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }
            
            return data;
        } catch (jsonError) {
            // JSONパースに失敗した場合、テキストとして取得を試みる
            try {
                const text = await responseClone.text();
                
                if (!response.ok) {
                    const error = new Error(text || `API request failed with status ${response.status}`);
                    error.status = response.status;
                    error.responseText = text;
                    throw error;
                }
                
                // 空のレスポンスの場合は空のオブジェクトを返す
                return text ? JSON.parse(text) : {};
            } catch (textError) {
                console.error('Failed to parse response as JSON or text:', textError);
                
                const error = new Error(`Failed to parse response: ${textError.message}`);
                error.originalError = textError;
                error.status = response.status;
                throw error;
            }
        }
    }
};

// ベースURLを現在のドメインに設定
api.setBaseUrl(window.location.origin);