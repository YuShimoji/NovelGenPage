// 必要なライブラリが読み込まれているか確認
if (typeof marked === 'undefined') {
  console.error('marked.js が読み込まれていません。');
}

if (typeof DOMPurify === 'undefined') {
  console.error('DOMPurify が読み込まれていません。');
}

// ブラウザで使用するためにマークダウン関連の関数を定義
const MarkdownConverter = {

  // マークダウンをHTMLに変換
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    try {
      // シーンの区切りを処理
      const withScenes = markdown
        .replace(/^##\s+(.*)$/gm, '<h2 class="scene">$1</h2>')
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
      
      // 選択肢を処理
      const withChoices = withScenes
        .replace(/^-\s+\[(.*?)\]\((.*?)\)/gm, '<li class="choice" data-target="$2">$1</li>');
      
      // その他のマークダウンを処理してサニタイズ
      return DOMPurify.sanitize(marked.parse(withChoices));
    } catch (error) {
      console.error('マークダウンからHTMLへの変換中にエラーが発生しました:', error);
      return '<p class="error">プレビューの表示中にエラーが発生しました</p>';
    }
  },
  
  // マークダウンをQuillのDelta形式に変換
  markdownToDelta(markdown) {
    if (!markdown) return { ops: [{ insert: '\n' }] };
    
    try {
      // シンプルなマークダウンからDeltaへの変換
      const ops = [];
      const lines = markdown.split('\n');
      
      for (const line of lines) {
        // 見出しの処理
        if (line.startsWith('## ')) {
          ops.push({
            insert: line.substring(3) + '\n',
            attributes: { header: 2 }
          });
        } else if (line.startsWith('### ')) {
          ops.push({
            insert: line.substring(4) + '\n',
            attributes: { header: 3 }
          });
        } else if (line.startsWith('- [')) {
          // 選択肢の処理
          const match = line.match(/^-\s+\[(.*?)\]\((.*?)\)/);
          if (match) {
            ops.push({
              insert: match[1] + '\n',
              attributes: { list: 'bullet' }
            });
          } else {
            ops.push({ insert: line + '\n' });
          }
        } else {
          // 通常のテキスト
          ops.push({ insert: line + '\n' });
        }
      }
      
      return { ops };
    } catch (error) {
      console.error('マークダウンからDeltaへの変換中にエラーが発生しました:', error);
      return { ops: [{ insert: markdown + '\n' }] };
    }
  },

  // QuillのDeltaをマークダウンに変換
  quillToMarkdown(delta) {
  if (!delta || !delta.ops) return '';
  
  let markdown = '';
  let inList = false;
  
  delta.ops.forEach((op, index) => {
    if (op.insert) {
      let text = op.insert;
      
      if (typeof text === 'string') {
        // 改行処理
        if (op.attributes) {
          if (op.attributes.header === 1) text = `# ${text}`;
          if (op.attributes.header === 2) text = `## ${text}`;
          if (op.attributes.bold) text = `**${text}**`;
          if (op.attributes.italic) text = `*${text}*`;
          if (op.attributes.underline) text = `__${text}__`;
          if (op.attributes.strike) text = `~~${text}~~`;
          
          // リスト処理
          if (op.attributes.list === 'ordered' || op.attributes.list === 'bullet') {
            const prefix = op.attributes.list === 'ordered' ? '1. ' : '- ';
            text = text.split('\n').map(line => `${prefix}${line}`).join('\n');
            inList = true;
          } else if (inList) {
            inList = false;
            text = '\n' + text;
          }
          
          if (op.attributes.blockquote) text = `> ${text}`;
          
          // リンクの処理
          if (op.attributes.link) {
            text = `[${text}](${op.attributes.link})`;
          }
          if (op.attributes.code) text = '`' + text + '`';
        }
        
        markdown += text;
      } else if (text.image) {
        markdown += `![画像](${text.image})`;
      }
    }
    
    // 改行を追加（最後の要素以外）
    if (index < delta.ops.length - 1) {
      markdown += '\n';
    }
  });
  
  return markdown.trim();
}

};

// グローバルスコープにエクスポート
if (typeof window !== 'undefined') {
  // 既存の実装を上書きせずにマージ
  if (!window.MarkdownConverter) {
    window.MarkdownConverter = {};
  }
  
  // 各メソッドを個別にエクスポート
  window.MarkdownConverter.markdownToHtml = MarkdownConverter.markdownToHtml;
  window.MarkdownConverter.markdownToDelta = MarkdownConverter.markdownToDelta;
  window.MarkdownConverter.quillToMarkdown = MarkdownConverter.quillToMarkdown;
  
  console.log('MarkdownConverter が初期化されました', window.MarkdownConverter);
}
