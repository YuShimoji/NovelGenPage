document.addEventListener('DOMContentLoaded', async () => {
    // DOM要素の取得
    const scenarioListElement = document.getElementById('scenario-list');
    const filterContainerElement = document.getElementById('filter-container');
    const mainContentElement = document.getElementById('main-content');
    const formContainerElement = document.getElementById('form-container');
    const formActionsElement = document.getElementById('form-actions');

    let allScenarios = []; // すべてのシナリオをキャッシュ
    let originalData = {}; // 現在編集中のシナリオのオリジナルデータ

    // --- UI関連の処理 --- //
    const ui = {
        showLoading(element) {
            element.innerHTML = '<p>読み込み中...</p>';
        },
        showError(element, message) {
            element.innerHTML = `<p>${message}</p>`;
            console.error(message);
        },
        renderScenarioList(scenarios) {
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
        renderThemeFilter(themes) {
            let filterHtml = '<h3>テーマで絞り込み</h3>';
            themes.forEach(theme => {
                filterHtml += `<label><input type="checkbox" class="theme-filter" value="${theme}" checked> ${theme}</label>`;
            });
            filterContainerElement.innerHTML = filterHtml;
        },
        updateSidebarTitle(gameId, newTitle) {
            const link = scenarioListElement.querySelector(`a[data-game-id="${gameId}"]`);
            if (link) link.textContent = newTitle;
        }
    };

    // --- フォーム関連の処理 --- //
    const formHandler = {
        createScenarioForm(data) { /* ... createScenarioFormの実装 ... */ },
        setupDynamicFormElements(data) { /* ... setupDynamicFormElementsの実装 ... */ },
        collectFormData(form) {
            const formData = new FormData(form);
            const data = { ...originalData }; // オリジナルデータをコピー

            data.title = formData.get('title');
            data.description = formData.get('description');
            data.published = form.querySelector('#published').checked;

            data.characters = Array.from(document.querySelectorAll('#characters-container > div')).map(div => ({
                name: div.querySelector('input[name$="[name]"]').value,
                description: div.querySelector('input[name$="[description]"]').value
            }));

            data.flags = Array.from(document.querySelectorAll('#flags-container > div')).reduce((acc, div) => {
                const key = div.querySelector('input[name$="[key]"]').value;
                if (key) acc[key] = div.querySelector('input[name$="[value]"]').checked;
                return acc;
            }, {});

            data.inventory = Array.from(document.querySelectorAll('#items-container > div')).map(div => ({
                name: div.querySelector('input[name$="[name]"]').value,
                description: div.querySelector('input[name$="[description]"]').value
            }));

            return data;
        }
    };

    // --- イベントハンドラ --- //
    async function handleScenarioLinkClick(event) {
        if (event.target.tagName !== 'A') return;
        event.preventDefault();
        const gameId = event.target.dataset.gameId;
        loadScenarioDetails(gameId);
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const updatedData = formHandler.collectFormData(event.target);
        try {
            await api.updateScenario(updatedData);
            alert('シナリオを更新しました。');
            originalData = updatedData; // 保存成功後にオリジナルデータを更新
            ui.updateSidebarTitle(updatedData.game_id, updatedData.title);
        } catch (error) {
            ui.showError(mainContentElement, `更新に失敗しました: ${error.message}`);
        }
    }

    function handleTestPlayClick() {
        const currentData = formHandler.collectFormData(document.getElementById('scenario-form'));
        sessionStorage.setItem('testPlayScenario', JSON.stringify(currentData));
        window.open('game.html', '_blank');
    }

    function handleFilterChange() {
        const checkedThemes = Array.from(document.querySelectorAll('.theme-filter:checked')).map(cb => cb.value);
        const filteredScenarios = allScenarios.filter(s => checkedThemes.includes(s.theme || 'その他'));
        ui.renderScenarioList(filteredScenarios);
    }

    // --- データロードと初期化 --- //
    async function loadScenarioList() {
        try {
            allScenarios = await api.getScenarioList();
            ui.renderScenarioList(allScenarios);
            const themes = [...new Set(allScenarios.map(s => s.theme || 'その他'))];
            ui.renderThemeFilter(themes);
        } catch (error) {
            ui.showError(scenarioListElement, `シナリオ一覧の取得に失敗しました: ${error.message}`);
        }
    }

    async function loadScenarioDetails(gameId) {
        ui.showLoading(mainContentElement);
        try {
            const scenarioData = await api.getScenario(gameId);
            originalData = JSON.parse(JSON.stringify(scenarioData)); // ディープコピー

            formContainerElement.innerHTML = formHandler.createScenarioForm(originalData);
            formActionsElement.style.display = 'block';
            formHandler.setupDynamicFormElements(originalData);

            // イベントリスナーを再設定
            const form = document.getElementById('scenario-form');
            form.addEventListener('submit', handleFormSubmit);
            document.getElementById('test-play-button').addEventListener('click', handleTestPlayClick);

        } catch (error) {
            ui.showError(mainContentElement, `シナリオ詳細の取得に失敗しました: ${error.message}`);
        }
    }

    // 初期化処理
    scenarioListElement.addEventListener('click', handleScenarioLinkClick);
    filterContainerElement.addEventListener('change', handleFilterChange);
    loadScenarioList();

    // フォーム関連の関数をformHandlerに移動
    formHandler.createScenarioForm = function(data) {
        // メインコンテンツの初期メッセージを隠す
        const initialMessage = document.querySelector('#main-content > p');
        if(initialMessage) initialMessage.style.display = 'none';

        return `
            <form id="scenario-form">
                <h2>シナリオ編集: ${data.title}</h2>
                <input type="hidden" name="game_id" value="${data.game_id}">
                
                <label for="title">タイトル:</label>
                <input type="text" id="title" name="title" value="${data.title}" required>
                
                <label for="description">AIプロンプト:</label>
                <textarea id="description" name="description" rows="4" required>${data.description}</textarea>

                <div>
                    <label for="published">公開する:</label>
                    <input type="checkbox" id="published" name="published" ${data.published ? 'checked' : ''}>
                </div>

                <details class="accordion">
                    <summary>キャラクター</summary>
                    <div id="characters-container"></div>
                    <button type="button" id="add-character">キャラクター追加</button>
                </details>

                <details class="accordion">
                    <summary>フラグ</summary>
                    <div id="flags-container"></div>
                    <button type="button" id="add-flag">フラグ追加</button>
                </details>

                <details class="accordion">
                    <summary>アイテム</summary>
                    <div id="items-container"></div>
                    <button type="button" id="add-item">アイテム追加</button>
                </details>
                
                <details class="accordion">
                    <summary>詳細データ (JSON)</summary>
                     <pre>${JSON.stringify(data, null, 2)}</pre>
                </details>
            </form>
        `;
    };
    formHandler.setupDynamicFormElements = function(data) {
        const characterContainer = document.getElementById('characters-container');
        const flagContainer = document.getElementById('flags-container');
        const itemContainer = document.getElementById('items-container');

        // --- キャラクター --- 
        let charIndex = 0;
        if (data.characters) {
            data.characters.forEach(char => {
                addCharacterInput(char.name, char.description, charIndex++);
            });
        }
        document.getElementById('add-character').addEventListener('click', () => {
            addCharacterInput('', '', charIndex++);
        });

        function addCharacterInput(name, description, index) {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="text" name="characters[${index}][name]" placeholder="名前" value="${name}">
                <input type="text" name="characters[${index}][description]" placeholder="説明" value="${description}">
                <button type="button" class="remove-btn">削除</button>
            `;
            characterContainer.appendChild(div);
        }

        // --- フラグ --- 
        let flagIndex = 0;
        if (data.flags) {
            Object.entries(data.flags).forEach(([key, value]) => {
                addFlagInput(key, value, flagIndex++);
            });
        }
        document.getElementById('add-flag').addEventListener('click', () => {
            addFlagInput('', false, flagIndex++);
        });

        function addFlagInput(key, value, index) {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="text" name="flags[${index}][key]" placeholder="フラグ名" value="${key}">
                <input type="checkbox" name="flags[${index}][value]" ${value ? 'checked' : ''}>
                <button type="button" class="remove-btn">削除</button>
            `;
            flagContainer.appendChild(div);
        }

        // --- アイテム --- 
        let itemIndex = 0;
        if (data.inventory) {
            data.inventory.forEach(item => {
                addItemInput(item.name, item.description, itemIndex++);
            });
        }
        document.getElementById('add-item').addEventListener('click', () => {
            addItemInput('', '', itemIndex++);
        });

        function addItemInput(name, description, index) {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="text" name="items[${index}][name]" placeholder="名前" value="${name}">
                <input type="text" name="items[${index}][description]" placeholder="説明" value="${description}">
                <button type="button" class="remove-btn">削除</button>
            `;
            itemContainer.appendChild(div);
        }

        // 削除ボタンの処理
        document.getElementById('main-content').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                e.target.parentElement.remove();
            }
        });
    };
});