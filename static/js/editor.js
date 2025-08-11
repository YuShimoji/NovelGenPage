// スクリプトが読み込まれたことを確認
console.log('editor.js が読み込まれました');

// グローバルなマークダウンコンバーターを参照
const Quill = window.Quill;

if (!Quill) {
  console.error('Quill が読み込まれていません');
  throw new Error('Quill エディタの読み込みに失敗しました');
}

// デバッグ用のログ関数
function debugLog(message, data) {
  if (window.debug && window.debug.log) {
    window.debug.log(message, data);
  } else if (console && console.log) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

// エラーメッセージを表示する関数
function showError(message, error) {
  console.error(message, error);
  
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.style.padding = '10px';
  errorElement.style.margin = '10px 0';
  errorElement.style.border = '1px solid #f5c6cb';
  errorElement.style.borderRadius = '4px';
  errorElement.style.backgroundColor = '#f8d7da';
  errorElement.style.color = '#721c24';
  
  errorElement.innerHTML = `
    <strong>エラーが発生しました:</strong>
    <p>${message}</p>
    ${error ? `<pre style="white-space: pre-wrap; font-size: 12px;">${error.stack || error}</pre>` : ''}
  `;
  
  const statusElement = document.getElementById('editor-status');
  if (statusElement) {
    statusElement.innerHTML = '';
    statusElement.appendChild(errorElement);
  } else {
    document.body.insertBefore(errorElement, document.body.firstChild);
  }
  
  return errorElement;
}

// カスタムブロックの定義
const BlockEmbed = Quill.import('blots/block/embed');

class SceneBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-scene', value);
    node.innerHTML = `[シーン: ${value}]`;
    return node;
  }

  static value(node) {
    return node.getAttribute('data-scene');
  }
}
SceneBlot.blotName = 'scene';
SceneBlot.tagName = 'div';
SceneBlot.className = 'scene-marker';

class ChoiceBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-choice', value);
    node.innerHTML = `[選択肢: ${value}]`;
    return node;
  }

  static value(node) {
    return node.getAttribute('data-choice');
  }
}
ChoiceBlot.blotName = 'choice';
ChoiceBlot.tagName = 'div';
ChoiceBlot.className = 'choice-marker';

// カスタムブロックを登録
Quill.register(SceneBlot);
Quill.register(ChoiceBlot);

// マークダウンをインポート
function importScenario(markdownText) {
  debugLog('シナリオのインポートを開始します...');
  
  if (!this.quill) {
    const error = new Error('Quill エディタが初期化されていません');
    console.error(error);
    this.showError(error.message);
    return false;
  }
  
  if (!markdownText || typeof markdownText !== 'string') {
    const error = new Error('無効なマークダウンテキストが指定されました');
    console.error(error);
    this.showError(error.message);
    return false;
  }
  
  // MarkdownConverter が利用可能か確認
  if (!window.MarkdownConverter || typeof window.MarkdownConverter.markdownToDelta !== 'function') {
    const error = new Error('Markdownコンバーターが利用できません');
    console.error('MarkdownConverter の状態:', window.MarkdownConverter);
    console.error('利用可能なメソッド:', Object.keys(window.MarkdownConverter || {}));
    this.showError(error.message);
    return false;
  }
  
  try {
    debugLog('マークダウンをデルタに変換します...');
    // マークダウンからデルタに変換
    const delta = window.MarkdownConverter.markdownToDelta(markdownText);
    
    if (!delta || !Array.isArray(delta.ops)) {
      throw new Error('マークダウンの変換に失敗しました: 無効なデルタ形式です');
    }
    
    debugLog('エディタにデルタを設定します...');
    // エディタにデルタを設定
    this.quill.setContents(delta);
    
    // プレビューを更新
    this.updatePreview();
    
    debugLog('シナリオのインポートが完了しました');
    return true;
    
  } catch (error) {
    console.error('シナリオのインポート中にエラーが発生しました:', error);
    this.showError(`シナリオのインポート中にエラーが発生しました: ${error.message}`);
    return false;
  }
}

// シナリオエディタクラス
class ScenarioEditor {
  constructor() {
    try {
      // 要素の初期化
      this.initializeElements();
      
      // Quillの初期化
      this.initializeQuill();
      
      // イベントリスナーの設定
      this.initializeEventListeners();
      
      // 初期プレビューを更新
      setTimeout(() => this.updatePreview(), 100);
    } catch (error) {
      showError('エディタの初期化中にエラーが発生しました', error);
      throw error;
    }
  }

  // 要素の初期化
  initializeElements() {
    this.textarea = document.getElementById('scenario-editor');
    this.preview = document.getElementById('scenario-preview');
    this.importButton = document.getElementById('import-button');
    this.saveButton = document.getElementById('save-button');
    this.status = document.getElementById('editor-status');
    
    debugLog('ScenarioEditor を初期化しています...');
    
    // Quillエディタを初期化
  }
  
  // Quill エディタを初期化
  initializeQuill() {
    try {
      debugLog('Quill エディタの初期化を開始します...');
      
      const container = document.getElementById('editor-container');
      if (!container) {
        throw new Error('エディタのコンテナが見つかりません');
      }
      
      // Quill が正しくロードされているか確認
      if (typeof Quill === 'undefined') {
        throw new Error('Quill ライブラリが正しくロードされていません');
      }

      // ツールバーのカスタマイズ
      const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['insert-scene', 'insert-choice']
      ];
      
      // Quill エディタのオプション
      const options = {
        theme: 'snow',
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              'insert-scene': () => this.insertScene(),
              'insert-choice': () => this.insertChoice(),
              'image': this.handleImageUpload.bind(this)
            }
          },
          clipboard: {
            matchVisual: false
          }
        },
        placeholder: 'ここにシナリオを入力してください...',
        formats: [
          'bold', 'italic', 'underline', 'strike',
          'blockquote', 'code-block',
          'header', 'list',
          'link', 'image',
          'scene', 'choice'
        ]
      };
      
      // エディタを初期化
      try {
        this.quill = new Quill(container, options);
        
        // カスタムボタンのスタイルを設定
        try {
          const icons = Quill.import('ui/icons');
          if (icons) {
            icons['insert-scene'] = 'シーン';
            icons['insert-choice'] = '選択肢';
          }
        } catch (iconError) {
          console.warn('カスタムアイコンの設定に失敗しました:', iconError);
        }
      
      } catch (quillError) {
        console.error('Quill エディタの初期化に失敗しました:', quillError);
        throw new Error('エディタの初期化に失敗しました: ' + quillError.message);
      }
      
      // 初期コンテンツがあれば読み込む
      try {
        if (this.textarea && this.textarea.value) {
          this.importScenario(this.textarea.value);
        } else if (container.querySelector('.ql-editor')) {
          // 初期コンテンツが空の場合はプレースホルダーを表示
          container.querySelector('.ql-editor').setAttribute('data-placeholder', 'ここにシナリオを入力してください...');
        }
      } catch (contentError) {
        console.error('初期コンテンツの読み込みに失敗しました:', contentError);
        // エラーがあっても処理は続行
      }
      
      // 変更を監視してテキストエリアを更新
      try {
        this.quill.on('text-change', () => {
          if (this.textarea && this.quill) {
            try {
              // MarkdownConverter が利用可能か確認
              if (!window.MarkdownConverter || typeof window.MarkdownConverter.quillToMarkdown !== 'function') {
                console.warn('MarkdownConverter が利用できません。更新をスキップします。');
                return;
              }
              
              const delta = this.quill.getContents();
              const markdown = window.MarkdownConverter.quillToMarkdown(delta);
              this.textarea.value = markdown;
              
              // プレビューを更新
              this.updatePreview();
            } catch (updateError) {
              console.error('コンテンツの更新中にエラーが発生しました:', updateError);
            }
          }
        });
        
        debugLog('Quill エディタの初期化が完了しました');
        
      } catch (eventError) {
        console.error('イベントリスナーの設定中にエラーが発生しました:', eventError);
        // イベントリスナーのエラーは致命的ではないので処理を続行
      }
      
    } catch (error) {
      const errorMessage = 'Quill エディタの初期化中にエラーが発生しました: ' + error.message;
      console.error(errorMessage, error);
      
      // エラーメッセージを表示
      if (this.status) {
        this.status.textContent = errorMessage;
        this.status.className = 'error';
      }
      
      // エディタコンテナにエラーメッセージを表示
      const container = document.getElementById('editor-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger">
            <strong>エラー:</strong> エディタの初期化に失敗しました。ページを再読み込みしてください。<br>
            問題が解決しない場合は、コンソールのエラーを確認してください。
          </div>
        `;
      }
      showError('エディタの初期化に失敗しました', error);
      throw error;
    }
  }
  
  // シーンを挿入
  insertScene() {
    const range = this.quill.getSelection();
    const text = '\n## 新しいシーン\n\nここにシーンの内容を記述してください。\n';
    
    if (range) {
      this.quill.insertText(range.index, text);
      this.quill.setSelection(range.index + text.length - 1, 0);
    } else {
      const length = this.quill.getLength();
      this.quill.insertText(length, text);
      this.quill.setSelection(length + text.length - 1, 0);
    }
    
    this.quill.focus();
  }
  
  // 選択肢を挿入
  insertChoice() {
    const range = this.quill.getSelection();
    const text = '\n### 選択肢\n- [選択肢1](scene:1)\n- [選択肢2](scene:2)\n';
    
    if (range) {
      this.quill.insertText(range.index, text);
      this.quill.setSelection(range.index + text.length - 1, 0);
    } else {
      const length = this.quill.getLength();
      this.quill.insertText(length, text);
      this.quill.setSelection(length + text.length - 1, 0);
    }
    
    this.quill.focus();
  }
  
  // 画像アップロードを処理
  handleImageUpload() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        this.showStatus('画像をアップロード中...', 'info');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('アップロードに失敗しました');
        
        const result = await response.json();
        
        if (result.success) {
          const range = this.quill.getSelection();
          if (range) {
            this.quill.insertEmbed(range.index, 'image', result.url);
          }
          this.showStatus('画像をアップロードしました', 'success');
        } else {
          throw new Error(result.message || 'アップロードに失敗しました');
        }
      } catch (error) {
        console.error('画像アップロードエラー:', error);
        this.showStatus(`エラー: ${error.message}`, 'error');
      }
    };
  }
  
  // イベントリスナーを設定
  initializeEventListeners() {
    // エディタの変更を監視してプレビューを更新
    if (this.quill) {
      this.quill.on('text-change', () => {
        this.updatePreview();
      });
      
      // 初期プレビューを更新
      setTimeout(() => this.updatePreview(), 100);
    } else {
      console.error('Quill エディタが初期化されていません');
      this.showError('エディタの初期化に失敗しました。ページを再読み込みしてください。');
    }
    
    // 保存ボタン
    if (this.saveButton) {
      this.saveButton.addEventListener('click', () => this.saveScenario());
    } else {
      console.warn('保存ボタンが見つかりません');
    }
    
    // インポートボタン
    if (this.importButton) {
      this.importButton.addEventListener('click', () => this.importScenario());
    } else {
      console.warn('インポートボタンが見つかりません');
    }
  }
  
  // ステータスを表示
  showStatus(message, type = 'info') {
    if (!this.status) return;
    
    this.status.textContent = message;
    this.status.className = `status status-${type}`;
    
    // エラーでない場合は3秒後に消す
    if (type !== 'error') {
      setTimeout(() => {
        if (this.status.textContent === message) {
          this.status.textContent = '';
          this.status.className = 'status';
        }
      }, 3000);
    }
  }
  
  // マークダウンをHTMLに変換
  convertMarkdownToHtml(markdown) {
    if (!markdown || markdown.trim() === '') {
      return '<div class="empty-preview">ここにプレビューが表示されます</div>';
    }
    
    try {
      // シーンを処理
      let html = markdown
        // 見出し1
        .replace(/^#\s+(.*?)(\n|$)/gm, '<h1 class="scene-title">$1</h1>')
        // 見出し2（シーン）
        .replace(/^##\s+(.*?)(\n|$)/gm, '<h2 class="scene" id="scene-$1">$1</h2>')
        // 見出し3（セクション）
        .replace(/^###\s+(.*?)(\n|$)/gm, '<h3 class="section">$1</h3>')
        // 見出し4（サブセクション）
        .replace(/^####\s+(.*?)(\n|$)/gm, '<h4 class="subsection">$1</h4>');
      
      // 選択肢を処理
      html = html.replace(
        /^-\s*\[(.*?)\]\((.*?)\)/gm,
        '<li class="choice"><a href="$2" class="action-button">$1</a></li>'
      );
      
      // 箇条書きを処理
      html = html.replace(
        /^\s*\*\s+(.*?)(?=\n|$)/gm,
        '<li class="bullet">$1</li>'
      );
      
      // 番号付きリストを処理
      html = html.replace(
        /^\s*\d+\.\s+(.*?)(?=\n|$)/gm,
        '<li class="ordered">$1</li>'
      );
      
      // 太字を処理
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 斜体を処理
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // 取り消し線を処理
      html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
      
      // インラインコードを処理
      html = html.replace(/`(.*?)`/g, '<code>$1</code>');
      
      // コードブロックを処理
      html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
      
      // 引用を処理
      html = html.replace(/^>\s*(.*?)(?=\n|$)/gm, '<blockquote>$1</blockquote>');
      
      // リンクを処理
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
      
      // 画像を処理
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="preview-image">');
      
      // 改行を処理
      html = html.replace(/\n/g, '<br>');
      
      // 連続した改行を段落に変換
      html = html.replace(/(<br>\s*){2,}/g, '</p><p>');
      
      // 段落で囲む
      if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
        html = '<p>' + html + '</p>';
      }
      
      // 空の段落を削除
      html = html.replace(/<p>\s*<\/p>/g, '');
      
      return html;
      
    } catch (error) {
      console.error('マークダウンの変換中にエラーが発生しました:', error);
      return `
        <div class="error">
          <p>マークダウンの解析中にエラーが発生しました:</p>
          <pre>${error.message}</pre>
        </div>
      `;
    }
  }

  // プレビューを更新
  updatePreview() {
    debugLog('updatePreview: プレビューの更新を開始します');
    
    if (!this.quill || !this.preview) {
      debugLog('エラー: Quillエディタまたはプレビュー要素が初期化されていません');
      return;
    }
    
    // MarkdownConverter が利用可能か確認
    if (!window.MarkdownConverter || typeof window.MarkdownConverter.quillToMarkdown !== 'function') {
      console.error('MarkdownConverter が正しく読み込まれていません');
      this.preview.innerHTML = '<p class="error-message">Markdownコンバーターの読み込みに失敗しました。ページを再読み込みしてください。</p>';
      return;
    }
    
    try {
      // エディタの内容をマークダウンに変換
      const delta = this.quill.getContents();
      const markdown = window.MarkdownConverter.quillToMarkdown(delta);
      debugLog('updatePreview: マークダウンに変換しました', markdown);
      
      // マークダウンをHTMLに変換
      const html = window.MarkdownConverter.markdownToHtml(markdown);
      debugLog('updatePreview: HTMLに変換しました', html);
      
      // プレビューを更新
      this.preview.innerHTML = html || '<p class="empty-preview">プレビューが表示されます</p>';
      
      // プレビュー内のリンクにイベントリスナーを設定
      if (typeof this.setupPreviewLinks === 'function') {
        this.setupPreviewLinks();
      }
      
      // プレビュー内のアクションボタンにイベントリスナーを設定
      if (typeof this.setupActionButtons === 'function') {
        this.setupActionButtons();
      }
    } catch (error) {
      console.error('プレビューの更新中にエラーが発生しました:', error);
      if (this.preview) {
        this.preview.innerHTML = '<p class="error-message">プレビューの表示中にエラーが発生しました。ページを再読み込みしてください。</p>';
      }
    }
    const actionButtons = this.preview ? this.preview.querySelectorAll('.action-button') : [];
    
    actionButtons.forEach(button => {
      // 既存のイベントリスナーを削除
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // 新しいイベントリスナーを追加
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScene = newButton.getAttribute('href');
        
        if (targetScene && targetScene.startsWith('#')) {
          const targetElement = document.querySelector(targetScene);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
            targetElement.classList.add('highlight');
            setTimeout(() => {
              targetElement.classList.remove('highlight');
            }, 2000);
          }
        }
      });
    });
  }
  
  // シナリオをインポート
  async importScenario(markdown) {
    debugLog('シナリオのインポートを開始します...');
    
    try {
      // マークダウンが指定されていない場合はテキストエリアから取得
      if (!markdown || typeof markdown !== 'string') {
        const textarea = document.getElementById('scenario-editor');
        if (textarea && textarea.value) {
          markdown = textarea.value;
          debugLog('テキストエリアからマークダウンを取得しました');
        } else {
          const error = new Error('インポートするマークダウンが指定されていません');
          this.showStatus('エラー: ' + error.message, 'error');
          console.warn('無効なマークダウンが指定されました:', markdown);
          return null;
        }
      }
      
      // 空のマークダウンの場合はクリア
      if (!markdown.trim()) {
        debugLog('空のマークダウンが指定されました。エディタをクリアします。');
        if (this.quill) {
          this.quill.setContents([]);
          this.quill.setSelection(0);
        }
        this.showStatus('エディタをクリアしました', 'info');
        return null;
      }
      
      this.showStatus('シナリオをインポート中...', 'info');
      
      // Quillが初期化されているか確認
      if (!this.quill) {
        throw new Error('エディタが初期化されていません');
      }
      
      // MarkdownConverter が利用可能か確認
      if (!window.MarkdownConverter || typeof window.MarkdownConverter.markdownToDelta !== 'function') {
        throw new Error('Markdownコンバーターが利用できません');
      }
      
      // マークダウンをQuillのDelta形式に変換
      debugLog('マークダウンをDelta形式に変換します...');
      const delta = window.MarkdownConverter.markdownToDelta(markdown);
      
      // エディタにコンテンツを設定
      debugLog('エディタにコンテンツを設定します...');
      this.quill.setContents(delta);
      
      // プレビューを更新
      this.updatePreview();
      
      this.showStatus('シナリオをインポートしました', 'success');
      debugLog('シナリオのインポートが完了しました');
      
      return delta;
      
    } catch (error) {
      const errorMessage = 'シナリオのインポート中にエラーが発生しました: ' + error.message;
      console.error(errorMessage, error);
      this.showStatus('エラー: ' + error.message, 'error');
      
      // エラーの詳細をコンソールに出力
      if (error.stack) {
        console.error('スタックトレース:', error.stack);
      }
      
      return null;
    }
  }
  
  // シナリオを保存
  async saveScenario() {
    try {
      const delta = this.quill.getContents();
      const markdown = window.MarkdownConverter.quillToMarkdown(delta);
      
      // タイトルを最初の見出しから抽出（見つからない場合はデフォルトタイトルを使用）
      const titleMatch = markdown.match(/^#\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : '無題のシナリオ';
      
      // ゲームIDを生成（既存のシナリオがあればそれを使用）
      const scenarioId = this.currentScenarioId || `scenario_${Date.now()}`;
      
      console.log('Saving scenario:', { title, id: scenarioId });
      
      const response = await fetch('/api/v1/scenarios', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: scenarioId,
          title: title,
          content: markdown,
          description: markdown.split('\n').slice(0, 3).join('\n'), // 先頭3行を説明文として使用
          last_updated: new Date().toISOString()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save failed:', { status: response.status, error: errorData });
        throw new Error(errorData.detail || `保存に失敗しました (${response.status})`);
      }
  
      const responseData = await response.json();
      console.log('Save successful:', responseData);
      
      // 現在のシナリオIDを更新
      if (responseData.id) {
        this.currentScenarioId = responseData.id;
      }
      
      this.showStatus('シナリオを保存しました', 'success');
      return responseData;
    } catch (error) {
      console.error('Save failed:', error);
      alert(`保存に失敗しました: ${error.message}`);
      throw error;
    }
  }
}
// エディタを初期化
function initializeEditor() {
  try {
    console.log('エディタの初期化を開始します...');
    
    // 必要な要素が存在するか確認
    const editorContainer = document.getElementById('editor-container');
    const previewElement = document.getElementById('scenario-preview');
    
    if (!editorContainer) {
      throw new Error('エディタのコンテナが見つかりません');
    }
    
    if (!previewElement) {
      console.warn('プレビュー要素が見つかりません。プレビュー機能は無効になります。');
    }
    
    // エディタのインスタンスを作成
    const editor = new ScenarioEditor();
    
    // グローバルに公開（デバッグ用）
    window.editor = editor;
    
    // 初期コンテンツを読み込む
    if (editor.textarea && editor.textarea.value.trim()) {
      console.log('初期コンテンツを読み込みます...');
      editor.importScenario(editor.textarea.value);
    } else {
      console.log('初期コンテンツが空です');
      // 空のコンテンツでプレビューを更新
      if (previewElement) {
        previewElement.innerHTML = '<p class="empty-preview">プレビューが表示されます</p>';
      }
    }
    
    console.log('エディタの初期化が完了しました');
    return editor;
  } catch (error) {
    console.error('エディタの初期化中にエラーが発生しました:', error);
    
    // エラーメッセージを表示
    const statusElement = document.getElementById('editor-status');
    if (statusElement) {
      statusElement.textContent = `エラー: ${error.message}`;
      statusElement.className = 'status-message status-error';
    }
    
    return null;
  }
}

// 必要なライブラリが読み込まれているか確認する関数
function checkDependencies() {
  const dependencies = {
    'Quill': typeof window.Quill !== 'undefined',
    'marked': typeof marked !== 'undefined',
    'DOMPurify': typeof DOMPurify !== 'undefined',
    'MarkdownConverter': typeof window.MarkdownConverter !== 'undefined'
  };

  const missingDeps = Object.entries(dependencies)
    .filter(([_, loaded]) => !loaded)
    .map(([name]) => name);

  if (missingDeps.length > 0) {
    const errorMsg = `以下の必要なライブラリが読み込まれていません: ${missingDeps.join(', ')}`;
    console.error(errorMsg);
    showError(errorMsg);
    return false;
  }
  
  return true;
}

// ドキュメントの読み込みが完了したら初期化
function initialize() {
  console.log('DOMの読み込みが完了しました');
  
  // 依存関係のチェック
  if (!checkDependencies()) {
    return;
  }
  
  try {
    // エディタを初期化
    window.scenarioEditor = new ScenarioEditor();
    console.log('シナリオエディタの初期化が完了しました');
    
    // 初期コンテンツがあれば読み込む
    const textarea = document.getElementById('scenario-editor');
    if (textarea && textarea.value) {
      window.scenarioEditor.importScenario(textarea.value);
    }
    
  } catch (error) {
    console.error('エディタの初期化中にエラーが発生しました:', error);
    showError('エディタの初期化中にエラーが発生しました: ' + error.message);
  }
}

// DOMの読み込みが完了したら初期化を開始
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOMContentLoaded が既に発生している場合
  setTimeout(initialize, 100);
}
