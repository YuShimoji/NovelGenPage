import { fetchLatestStories } from './api.js';

// ストーリー一覧ページの初期化
async function initStoriesPage() {
    try {
        // ローディング表示
        const storiesGrid = document.getElementById('stories-grid');
        if (storiesGrid) {
            storiesGrid.innerHTML = '<div class="loading-message">読み込み中...</div>';
        }
        
        // APIからストーリーを取得
        const stories = await fetchLatestStories();
        
        // ストーリーを表示
        if (stories && stories.length > 0) {
            displayStories(stories);
        } else {
            // ストーリーがない場合の表示
            if (storiesGrid) {
                storiesGrid.innerHTML = '<div class="no-stories">表示できるストーリーがありません</div>';
            }
        }
    } catch (error) {
        console.error('ストーリーの読み込み中にエラーが発生しました:', error);
        const storiesGrid = document.getElementById('stories-grid');
        if (storiesGrid) {
            storiesGrid.innerHTML = `
                <div class="error-message">
                    ストーリーの読み込み中にエラーが発生しました。
                    <button onclick="window.location.reload()">再読み込み</button>
                </div>
            `;
        }
    }
    
    // 検索機能の初期化
    initSearch();
    
    // フィルター機能の初期化
    initFilters();
}

/**
 * ストーリーを表示します
 * @param {Array} stories - 表示するストーリーの配列
 */
function displayStories(stories) {
    const storiesGrid = document.getElementById('stories-grid');
    if (!storiesGrid) return;
    
    if (stories.length === 0) {
        storiesGrid.innerHTML = '<div class="no-stories">表示できるストーリーがありません</div>';
        return;
    }
    
    // ストーリーカードを生成
    const storiesHTML = stories.map(story => createStoryCard(story)).join('');
    storiesGrid.innerHTML = storiesHTML;
    
    // イベントリスナーを設定
    document.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
            const storyId = card.dataset.storyId;
            if (storyId) {
                window.location.href = `/story/${storyId}`;
            }
        });
    });
}

/**
 * ストーリーカードのHTMLを生成します
 * @param {Object} story - ストーリーデータ
 * @returns {string} ストーリーカードのHTML
 */
function createStoryCard(story) {
    const imageUrl = story.image || 'https://source.unsplash.com/random/400x200?story';
    const tags = story.tags || [];
    const tagHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    return `
        <div class="story-card" data-story-id="${story.id}">
            <div class="story-image">
                <img src="${imageUrl}" alt="${story.title}">
            </div>
            <div class="story-content">
                <h3>${story.title || '無題のストーリー'}</h3>
                <p class="description">${story.description || ''}</p>
                <div class="story-meta">
                    <span class="author">${story.author || 'AIクリエイター'}</span>
                    <span class="play-count">${story.playCount || 0} プレイ</span>
                    <span class="rating">★ ${story.rating || '0.0'}</span>
                </div>
                <div class="tags">${tagHTML}</div>
            </div>
        </div>
    `;
}

/**
 * 検索機能を初期化します
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput ? searchInput.value.trim() : '';
            searchStories(query);
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                searchStories(query);
            }
        });
    }
}

/**
 * ストーリーを検索します
 * @param {string} query - 検索クエリ
 */
async function searchStories(query) {
    try {
        // ここでAPIに検索リクエストを送信
        // この例では、フロントエンドでフィルタリングを行います
        const response = await fetch('/api/v1/stories');
        const data = await response.json();
        
        if (data.stories && data.stories.length > 0) {
            const filteredStories = data.stories.filter(story => {
                if (!query) return true;
                const searchStr = `${story.title || ''} ${story.description || ''} ${(story.tags || []).join(' ')}`.toLowerCase();
                return searchStr.includes(query.toLowerCase());
            });
            displayStories(filteredStories);
        }
    } catch (error) {
        console.error('検索中にエラーが発生しました:', error);
    }
}

/**
 * フィルター機能を初期化します
 */
function initFilters() {
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // アクティブ状態を切り替え
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            // フィルターを適用
            const filter = tag.textContent.trim();
            applyFilter(filter);
        });
    });
}

/**
 * フィルターを適用します
 * @param {string} filter - フィルター条件
 */
async function applyFilter(filter) {
    if (filter === 'すべて') {
        // すべてのストーリーを表示
        const response = await fetch('/api/v1/stories');
        const data = await response.json();
        if (data.stories) {
            displayStories(data.stories);
        }
    } else {
        // タグでフィルタリング
        const response = await fetch('/api/v1/stories');
        const data = await response.json();
        
        if (data.stories) {
            const filteredStories = data.stories.filter(story => 
                (story.tags || []).includes(filter)
            );
            displayStories(filteredStories);
        }
    }
}

// グローバルに公開（HTMLから直接呼び出すため）
window.searchStories = searchStories;

// DOMの読み込みが完了したら初期化を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoriesPage);
} else {
    initStoriesPage();
}
