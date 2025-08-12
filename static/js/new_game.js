import api from './api.js';

// 新しいゲームページの初期化
function initNewGamePage() {
    const generateForm = document.getElementById('generate-form');
    const backButton = document.getElementById('back-button');
    const statusElement = document.getElementById('generation-status');
    const generatedContent = document.getElementById('generated-content');

    // 戻るボタンの処理
    backButton.addEventListener('click', function() {
        window.location.href = '/';
    });

    // フォーム送信の処理
    generateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const theme = document.getElementById('theme-input').value.trim();
        const keywords = document.getElementById('keywords-input').value.trim();
        
        if (!theme || !keywords) {
            showStatus('テーマとキーワードを入力してください', 'error');
            return;
        }
        
        try {
            showStatus('ゲームを生成中です...', 'info');
            
            // デモ用のダミーレスポンス
            const gameData = await mockGenerateGame(theme, keywords);
            
            showStatus('ゲームが生成されました！', 'success');
            
            // 生成されたゲームを表示
            showGeneratedGame(gameData);
            
        } catch (error) {
            console.error('ゲーム生成中にエラーが発生しました:', error);
            showStatus('ゲームの生成中にエラーが発生しました: ' + error.message, 'error');
        }
    });
}

// ダミーのゲーム生成関数（実際のAPI呼び出しに置き換えてください）
async function mockGenerateGame(theme, keywords) {
    // 実際のアプリでは、APIを呼び出す
    // 例: return await api.generateGame(theme, keywords);
    
    // ダミーのレスポンス
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 'game-' + Math.random().toString(36).substr(2, 9),
                title: theme || '新しいアドベンチャー',
                description: `これは「${theme}」をテーマにしたアドベンチャーゲームです。`,
                createdAt: new Date().toISOString(),
                author: 'あなた',
                tags: keywords ? keywords.split(/[,\s]+/) : [],
                content: {
                    scenes: [
                        {
                            id: 'scene-1',
                            title: 'はじまりの場所',
                            content: `# はじまりの場所\n\nあなたは${theme || '不思議な世界'}にやってきました。${keywords ? keywords + 'が' : ''}あなたの冒険を待っています。`,
                            choices: [
                                { text: '先に進む', nextSceneId: 'scene-2' },
                                { text: '周りを見渡す', nextSceneId: 'scene-3' }
                            ]
                        },
                        // 他のシーン...
                    ]
                }
            });
        }, 1500);
    });
}

// ステータスメッセージを表示
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('generation-status');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'status-message';
    statusElement.classList.add(`status-${type}`);
    
    // エラーの場合は5秒後に消す
    if (type === 'error' || type === 'success') {
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 5000);
    }
}

// 生成されたゲームを表示
function showGeneratedGame(gameData) {
    const generatedContent = document.getElementById('generated-content');
    if (!generatedContent) return;
    
    generatedContent.innerHTML = `
        <div class="generated-game">
            <h3>${gameData.title || '新しいゲーム'}</h3>
            <p>${gameData.description || '説明がありません'}</p>
            <div class="game-meta">
                <span class="author">作成者: ${gameData.author || '不明'}</span>
                <span class="date">作成日: ${gameData.createdAt ? new Date(gameData.createdAt).toLocaleDateString() : '不明'}</span>
            </div>
            <div class="game-actions">
                <a href="/editor/${gameData.id}" class="btn btn-primary">編集する</a>
                <a href="/play/${gameData.id}" class="btn btn-secondary">プレイする</a>
            </div>
        </div>
    `;
    
    // スクロールして表示
    generatedContent.scrollIntoView({ behavior: 'smooth' });
}

// DOMの読み込みが完了したら初期化を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewGamePage);
} else {
    initNewGamePage();
}
