// スクリプトが読み込まれたことを確認
console.log('markdown-converter.js が読み込まれました');

// マークダウン変換関数をグローバルに公開
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // marked.jsが利用可能な場合はそれを使用
  if (window.marked) {
    try {
      return window.marked.parse(markdown);
    } catch (error) {
      console.error('マークダウンの変換中にエラーが発生しました:', error);
    }
  }
  
  // 簡易的なマークダウン変換（フォールバック）
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>');
}

// グローバルに公開
window.markdownToHtml = markdownToHtml;

// デバッグ用
console.log('markdownToHtml 関数が定義されました:', typeof window.markdownToHtml);
