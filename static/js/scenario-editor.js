document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM要素のキャッシュ ---
    const scenarioListElement = document.getElementById('scenario-list');
    const filterContainerElement = document.getElementById('filter-container');
    const mainContentElement = document.getElementById('main-content');
    const formContainerElement = document.getElementById('form-container');
    const formActionsElement = document.getElementById('form-actions');

    // --- 状態管理 ---
    let allScenarios = [];
    let currentScenario = {};

    // --- UI処理 ---
    const ui = {
        showLoading: (element) => element.innerHTML = '<p>読み込み中...</p>',
        showError: (element, message) => {
            element.innerHTML = `<p class="error">${message}</p>`;
            console.error(message);
        },
        renderScenarioList: (scenarios) => {
            const scenariosByTheme = scenarios.reduce((acc, scenario) => {
                const theme = scenario.theme || 'その他';
                if (!acc[theme]) acc[theme] = [];
                acc[theme].push(scenario);
                return acc;
            }, {});

            let listHtml = '<ul>';
            for (const theme in scenariosByTheme) {
                listHtml += `<li><strong>${theme}</strong><ul>`;
                scenariosByTheme[theme].forEach(scenario => {
                    listHtml += `<li><a href="#" data-game-id="${scenario.game_id}">${scenario.title}</a></li>`;
                });
                listHtml += '</ul></li>';
            }
            listHtml += '</ul>';
            scenarioListElement.innerHTML = listHtml;
        },
        renderThemeFilter: (themes) => {
            let filterHtml = '<h3>テーマで絞り込み</h3>';
            themes.forEach(theme => {
                filterHtml += `<label><input type="checkbox" class="theme-filter" value="${theme}" checked> ${theme}</label>`;
            });
            filterContainerElement.innerHTML = filterHtml;
        },
        updateSidebarTitle: (gameId, newTitle) => {
            const link = scenarioListElement.querySelector(`a[data-game-id="${gameId}"]`);
            if (link) link.textContent = newTitle;
        },
        renderScenarioForm: (data) => {
            const initialMessage = document.querySelector('#main-content > p');
            if (initialMessage) initialMessage.style.display = 'none';

            formContainerElement.innerHTML = `
                <form id="scenario-form">
                    <h2>シナリオ編集: ${data.title}</h2>
                    <input type="hidden" name="game_id" value="${data.game_id}">
                    
                    <label for="title">タイトル:</label>
                    <input type="text" id="title" name="title" value="${data.title || ''}" required>
                    
                    <label for="description">AIプロンプト:</label>
                    <textarea id="description" name="description" rows="4" required>${data.description || ''}</textarea>

                    <div>
                        <label for="published">公開する:</label>
                        <input type="checkbox" id="published" name="published" ${data.published ? 'checked' : ''}>
                    </div>

                    <details class="accordion" open>
                        <summary>キャラクター</summary>
                        <div id="characters-container"></div>
                        <button type="button" class="add-btn" data-type="character">キャラクター追加</button>
                    </details>

                    <details class="accordion" open>
                        <summary>フラグ</summary>
                        <div id="flags-container"></div>
                        <button type="button" class="add-btn" data-type="flag">フラグ追加</button>
                    </details>

                    <details class="accordion" open>
                        <summary>アイテム</summary>
                        <div id="items-container"></div>
                        <button type="button" class="add-btn" data-type="item">アイテム追加</button>
                    </details>
                </form>
            `;
            formActionsElement.style.display = 'block';
        },
        renderDynamicElements: (data) => {
            const charContainer = document.getElementById('characters-container');
            const flagContainer = document.getElementById('flags-container');
            const itemContainer = document.getElementById('items-container');
            
            charContainer.innerHTML = '';
            (data.characters || []).forEach(c => dynamicElementHandler.addCharacterInput(c.name, c.description));

            flagContainer.innerHTML = '';
            if(data.flags) Object.entries(data.flags).forEach(([k, v]) => dynamicElementHandler.addFlagInput(k, v));
            
            itemContainer.innerHTML = '';
            (data.inventory || []).forEach(i => dynamicElementHandler.addItemInput(i.name, i.description));
        }
    };

    // --- 動的要素の生成 ---
    const dynamicElementHandler = {
        addCharacterInput: (name = '', description = '') => {
            const div = document.createElement('div');
            div.className = 'dynamic-item';
            div.innerHTML = `
                <input type="text" name="char_name" placeholder="名前" value="${name}">
                <input type="text" name="char_desc" placeholder="説明" value="${description}">
                <button type="button" class="remove-btn">削除</button>
            `;
            document.getElementById('characters-container').appendChild(div);
        },
        addFlagInput: (key = '', value = false) => {
            const div = document.createElement('div');
            div.className = 'dynamic-item';
            div.innerHTML = `
                <input type="text" name="flag_key" placeholder="フラグ名" value="${key}">
                <input type="checkbox" name="flag_value" ${value ? 'checked' : ''}>
                <button type="button" class="remove-btn">削除</button>
            `;
            document.getElementById('flags-container').appendChild(div);
        },
        addItemInput: (name = '', description = '') => {
            const div = document.createElement('div');
            div.className = 'dynamic-item';
            div.innerHTML = `
                <input type="text" name="item_name" placeholder="名前" value="${name}">
                <input type="text" name="item_desc" placeholder="説明" value="${description}">
                <button type="button" class="remove-btn">削除</button>
            `;
            document.getElementById('items-container').appendChild(div);
        }
    };

    // --- データ収集 ---
    const collectFormData = () => {
        const form = document.getElementById('scenario-form');
        if (!form) return null;

        const data = { ...currentScenario };
        data.title = form.querySelector('#title').value;
        data.description = form.querySelector('#description').value;
        data.published = form.querySelector('#published').checked;

        data.characters = Array.from(document.querySelectorAll('#characters-container .dynamic-item')).map(div => ({
            name: div.querySelector('input[name="char_name"]').value,
            description: div.querySelector('input[name="char_desc"]').value
        }));

        data.flags = Array.from(document.querySelectorAll('#flags-container .dynamic-item')).reduce((acc, div) => {
            const key = div.querySelector('input[name="flag_key"]').value;
            if (key) acc[key] = div.querySelector('input[name="flag_value"]').checked;
            return acc;
        }, {});

        data.inventory = Array.from(document.querySelectorAll('#items-container .dynamic-item')).map(div => ({
            name: div.querySelector('input[name="item_name"]').value,
            description: div.querySelector('input[name="item_desc"]').value
        }));

        return data;
    };

    // --- イベントハンドラ ---
    const eventHandlers = {
        handleScenarioLinkClick: async (e) => {
            if (e.target.tagName !== 'A') return;
            e.preventDefault();
            const gameId = e.target.dataset.gameId;
            
            // メインコンテンツをクリア
            mainContentElement.innerHTML = '';
            formContainerElement.innerHTML = '';
            formActionsElement.style.display = 'none';
            
            ui.showLoading(mainContentElement);
            try {
                const scenarioData = await api.getScenario(gameId);
                currentScenario = JSON.parse(JSON.stringify(scenarioData)); // Deep copy
                ui.renderScenarioForm(currentScenario);
                ui.renderDynamicElements(currentScenario);
            } catch (error) {
                ui.showError(mainContentElement, `シナリオ詳細の取得に失敗しました: ${error.message}`);
            }
        },
        handleFormSubmit: async (e) => {
            e.preventDefault();
            const updatedData = collectFormData();
            if (!updatedData) return;

            try {
                await api.updateScenario(updatedData);
                alert('シナリオを更新しました。');
                currentScenario = updatedData;
                ui.updateSidebarTitle(updatedData.game_id, updatedData.title);
            } catch (error) {
                ui.showError(mainContentElement, `更新に失敗しました: ${error.message}`);
            }
        },
        handleTestPlayClick: () => {
            const currentData = collectFormData();
            if (!currentData) {
                alert('シナリオを読み込んでからテストプレイを開始してください。');
                return;
            }
            sessionStorage.setItem('testPlayScenario', JSON.stringify(currentData));
            window.open('game.html', '_blank');
        },
        handleFilterChange: () => {
            const checkedThemes = Array.from(document.querySelectorAll('.theme-filter:checked')).map(cb => cb.value);
            const filteredScenarios = allScenarios.filter(s => checkedThemes.includes(s.theme || 'その他'));
            ui.renderScenarioList(filteredScenarios);
        },
        handleDynamicElementClick: (e) => {
            if (e.target.classList.contains('add-btn')) {
                const type = e.target.dataset.type;
                if (type === 'character') dynamicElementHandler.addCharacterInput();
                if (type === 'flag') dynamicElementHandler.addFlagInput();
                if (type === 'item') dynamicElementHandler.addItemInput();
            }
            if (e.target.classList.contains('remove-btn')) {
                e.target.closest('.dynamic-item').remove();
            }
        },
        handleFormActionsClick: (e) => {
            if (e.target.id === 'test-play-button') {
                eventHandlers.handleTestPlayClick();
            }
        }
    };

    // --- 初期化処理 ---
    const init = async () => {
        // 静的イベントリスナー
        scenarioListElement.addEventListener('click', eventHandlers.handleScenarioLinkClick);
        filterContainerElement.addEventListener('change', eventHandlers.handleFilterChange);
        
        // form-actionsにイベントデリゲーションを使用
        formActionsElement.addEventListener('click', eventHandlers.handleFormActionsClick);

        // 動的要素のためのイベントデリゲーション
        formContainerElement.addEventListener('submit', eventHandlers.handleFormSubmit);
        formContainerElement.addEventListener('click', eventHandlers.handleDynamicElementClick);

        // 初期データロード
        ui.showLoading(scenarioListElement);
        try {
            allScenarios = await api.getScenarioList();
            ui.renderScenarioList(allScenarios);
            const themes = [...new Set(allScenarios.map(s => s.theme || 'その他'))];
            ui.renderThemeFilter(themes);
        } catch (error) {
            ui.showError(scenarioListElement, `シナリオ一覧の取得に失敗しました: ${error.message}`);
        }
    };

    init();
});