// スクリプトが読み込まれたことを確認
console.log('markdown-converter.js が読み込まれました');

// グローバル名前空間を初期化
window.NovelGenPage = window.NovelGenPage || {};

// 即時関数でスコープを分離
(function() {
    // シーンリンクのクリックハンドラ
  function handleSceneLinkClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const sceneLink = e.currentTarget;
    const sceneId = sceneLink.getAttribute('data-scene-id');
    const sceneName = sceneLink.textContent || `シーン ${sceneId}`;
    
    console.log(`シーンに移動: ${sceneName} (ID: ${sceneId})`);
    
    // アクティブなリンクのスタイルを更新
    document.querySelectorAll('.scene-link').forEach(link => {
      link.classList.remove('active');
    });
    sceneLink.classList.add('active');
    
    // グローバルなハンドラが設定されていれば呼び出す
    if (window.NovelGenPage && typeof window.NovelGenPage.navigateToScene === 'function') {
      window.NovelGenPage.navigateToScene(sceneId, sceneName);
    } else {
      console.warn('navigateToScene ハンドラが設定されていません');
      // フォールバック: スクロールしてハイライト
      const targetElement = document.getElementById(`scene-${sceneId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetElement.classList.add('highlight');
        setTimeout(() => targetElement.classList.remove('highlight'), 2000);
      }
    }
  }

  // マークダウン変換関数
  function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = '';
    
    // marked.jsが利用可能な場合はそれを使用
    if (window.marked) {
      try {
        // カスタムレンダラーを設定してシーンリンクを処理
        const renderer = new (window.marked.Renderer || window.marked.renderer || function(){})();
        const linkRenderer = renderer.link.bind(renderer);
        
        renderer.link = (href, title, text) => {
          // シーンリンクの処理
          const sceneMatch = href.match(/^scene:(\d+)$/);
          if (sceneMatch) {
            return `<a href="#" class="scene-link" data-scene-id="${sceneMatch[1]}">${text}</a>`;
          }
          // 通常のリンクはデフォルトのレンダラーを使用
          return linkRenderer(href, title, text);
        };
        // marked の呼び出し形に対応（関数 or オブジェクト.parse）
        const markedApi = (typeof window.marked === 'function')
          ? window.marked
          : (typeof window.marked.parse === 'function' ? window.marked.parse : null);
        if (!markedApi) throw new Error('marked API not available');
        html = markedApi(markdown, { renderer });
      } catch (error) {
        console.error('マークダウンの変換中にエラーが発生しました:', error);
        // フォールバック処理
        html = simpleMarkdownToHtml(markdown);
      }
    } else {
      // marked.jsが利用できない場合は簡易変換を使用
      html = simpleMarkdownToHtml(markdown);
    }
    
    return html;
  }
  
  // 簡易的なマークダウン変換（フォールバック）
  function simpleMarkdownToHtml(markdown) {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\[([^\]]+)\]\(scene:(\d+)\)/g, '<a href="#" class="scene-link" data-scene-id="$2">$1</a>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>');
  }

  // グローバルに公開
  window.markdownToHtml = markdownToHtml;
  window.NovelGenPage.handleSceneLinkClick = handleSceneLinkClick;
  
  // シーンリンクのクリックイベントを委譲
  function setupSceneLinkHandlers() {
    // 既存のイベントリスナーを削除（重複防止）
    document.body.removeEventListener('click', handleSceneLinkDelegation);
    
    // 新しいイベントリスナーを追加
    document.body.addEventListener('click', handleSceneLinkDelegation, true);
    
    console.log('シーンリンクハンドラをセットアップしました');
  }
  
  function handleSceneLinkDelegation(e) {
    const sceneLink = e.target.closest('.scene-link');
    if (sceneLink) {
      handleSceneLinkClick.call(sceneLink, e);
    }
  }
  
  // DOMの準備ができたらハンドラをセットアップ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSceneLinkHandlers);
  } else {
    setupSceneLinkHandlers();
  }
  
  // デバッグ用
  console.log('markdownToHtml 関数が定義されました:', typeof window.markdownToHtml);
})();
