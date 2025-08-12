// スクリプトが読み込まれたことを確認
console.log('editor.js が読み込まれました');

// グローバルスコープにエディタを登録
window.NovelGenPage = window.NovelGenPage || {};

// デバッグ用のログ関数
function debugLog(message, data = null) {
  if (window.NovelGenPage.debug) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

// エラーメッセージを表示する関数
function showError(message, error = null) {
  console.error(message, error || '');
  
  // エラーを画面上に表示
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px;
    background-color: #ffebee;
    border: 1px solid #ef9a9a;
    border-radius: 4px;
    color: #c62828;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  errorDiv.textContent = message;
  
  if (error) {
    const details = document.createElement('div');
    details.style.marginTop = '10px';
    details.style.fontSize = '0.9em';
    details.textContent = error.toString();
    errorDiv.appendChild(details);
  }
  
  document.body.appendChild(errorDiv);
  
  // 5秒後にエラーメッセージを削除
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300);
  }, 5000);
}

// 必要なライブラリが読み込まれているか確認
function checkDependencies() {
  const required = {
    'Quill': () => typeof Quill !== 'undefined',
    'markdownToHtml': () => typeof markdownToHtml === 'function'
  };
  
  const missing = [];
  
  // 不足している依存関係をチェック
  for (const [name, check] of Object.entries(required)) {
    if (!check()) {
      console.error(`必要なライブラリが読み込まれていません: ${name}`);
      missing.push(name);
    }
  }
  
  // 不足している依存関係がある場合はエラーを表示
  if (missing.length > 0) {
    showError(`次の必要なライブラリが読み込まれていません: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// エディタを初期化する関数
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
    
    // 必要なライブラリが読み込まれているか確認
    if (!checkDependencies()) {
      throw new Error('必要なライブラリが読み込まれていません');
    }
    
    // エディタのインスタンスを作成
    const editor = new ScenarioEditor();
    
    // グローバルに公開（デバッグ用）
    window.NovelGenPage = window.NovelGenPage || {};
    window.NovelGenPage.editor = editor;
    window.editor = editor; // 後方互換性のため
    
    // 初期コンテンツを読み込む
    const initialContent = document.getElementById('initial-content');
    if (initialContent && initialContent.value.trim()) {
      console.log('初期コンテンツを読み込みます...');
      editor.importScenario(initialContent.value);
    } else if (editor.textarea && editor.textarea.value.trim()) {
      console.log('テキストエリアからコンテンツを読み込みます...');
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
    } else {
      // ステータス要素がなければアラートで表示
      alert(`エディタの初期化中にエラーが発生しました: ${error.message}`);
    }
    
    throw error;
  }
}

// ドキュメントの読み込みが完了したら初期化を実行
function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.NovelGenPage.editor = initializeEditor();
    });
  } else {
    window.NovelGenPage.editor = initializeEditor();
  }
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
      debugLog('ScenarioEditor を初期化しています...');
      
      // 必要なライブラリが読み込まれているか確認（グローバルスコープの関数を呼び出す）
      if (!checkDependencies()) {
        throw new Error('必要なライブラリが読み込まれていません');
      }
      
      // 要素の初期化
      this.initializeElements();
      
      // Quillの初期化
      this.initializeQuill();
      
      // イベントリスナーの設定
      this.initializeEventListeners();
      
      // 初期プレビューを更新
      setTimeout(() => this.updatePreview(), 100);
      
      debugLog('ScenarioEditor の初期化が完了しました');
    } catch (error) {
      const errorMessage = 'エディタの初期化中にエラーが発生しました';
      console.error(errorMessage, error);
      showError(errorMessage, error);
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

      // カスタムツールバーボタンのアイコンを設定
      const icons = Quill.import('ui/icons');
      icons['insert-scene'] = '<i class="fas fa-scroll"></i>';
      icons['insert-choice'] = '<i class="fas fa-list-ul"></i>';
      
      // エディタのオプション
      const options = {
        theme: 'snow',
        modules: {
          toolbar: {
            container: '#toolbar-container',
            handlers: {
              'insert-scene': this.insertScene.bind(this),
              'insert-choice': this.insertChoice.bind(this),
              'image': this.handleImageUpload.bind(this)
            }
          },
          clipboard: {
            matchVisual: false
          },
          keyboard: {
            bindings: {
              // カスタムキーバインディング
              'bold': {
                key: 'b',
                shortKey: true,
                handler: (range, context) => {
                  this.quill.format('bold', !this.quill.getFormat(range.index, range.length).bold);
                }
              },
              'italic': {
                key: 'i',
                shortKey: true,
                handler: (range, context) => {
                  this.quill.format('italic', !this.quill.getFormat(range.index, range.length).italic);
                }
              },
              'underline': {
                key: 'u',
                shortKey: true,
                handler: (range, context) => {
                  this.quill.format('underline', !this.quill.getFormat(range.index, range.length).underline);
                }
              }
            }
          }
        },
        placeholder: 'ここにシナリオを入力してください...',
        formats: [
          'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
          'list', 'bullet', 'indent', 'link', 'image', 'code-block',
          'scene', 'choice'
        ]
      };
      
      // エディタを初期化
      this.quill = new Quill(container, options);
      
      // 初期表示モードを設定
      this.initializeViewMode();
      
      // 初期コンテンツがあれば読み込む
      if (this.textarea && this.textarea.value) {
        this.importScenario(this.textarea.value);
      }
      
      // 変更を監視してテキストエリアを更新
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
            
          } catch (error) {
            console.error('テキストの変換中にエラーが発生しました:', error);
            this.showError('テキストの更新中にエラーが発生しました');
          }
        }
      });
      
      // 初期プレビューを更新
      this.updatePreview();
      
      debugLog('Quill エディタの初期化が完了しました');
      return this.quill;
      
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
    // 保存ボタン
    document.getElementById('save-button')?.addEventListener('click', () => this.saveScenario());
    
    // インポートボタン
    document.getElementById('import-button')?.addEventListener('click', async () => {
      const textarea = document.getElementById('scenario-editor');
      if (textarea) {
        await this.importScenario(textarea.value);
      }
    });
    
    // エディタの変更を監視してプレビューを更新
    if (this.quill) {
      this.quill.on('text-change', () => {
        this.updatePreview();
      });
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
    
    // 表示モード切り替えボタン
    document.querySelectorAll('.view-mode-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setViewMode(mode);
      });
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // Ctrl+1: 分割表示
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        this.setViewMode('split');
      }
      // Ctrl+2: エディタのみ
      else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        this.setViewMode('editor');
      }
      // Ctrl+3: プレビューのみ
      else if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        this.setViewMode('preview');
      }
    });
    
    // ローカルストレージから前回の表示モードを復元
    const savedViewMode = localStorage.getItem('editorViewMode') || 'split';
    this.setViewMode(savedViewMode);
  }
  
  // 表示モードを設定
  setViewMode(mode) {
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');
    const buttons = document.querySelectorAll('.view-mode-btn');
    
    // すべてのボタンからactiveクラスを削除
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 選択されたボタンにactiveクラスを追加
    const activeButton = document.querySelector(`.view-mode-btn[data-mode="${mode}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // 表示モードに応じてパネルの表示を切り替え
    switch (mode) {
      case 'editor':
        editorPanel.style.display = 'block';
        previewPanel.style.display = 'none';
        break;
      case 'preview':
        editorPanel.style.display = 'none';
        previewPanel.style.display = 'block';
        break;
      case 'split':
      default:
        editorPanel.style.display = 'block';
        previewPanel.style.display = 'block';
        editorPanel.style.flex = '1';
        previewPanel.style.flex = '1';
        break;
    }
    
    // リサイズイベントを発火してレイアウトを更新
    window.dispatchEvent(new Event('resize'));
    
    // ローカルストレージに表示モードを保存
    localStorage.setItem('editorViewMode', mode);
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
      // 特殊なマークダウン記法を処理
      let processedMarkdown = markdown
        // 見出し1
        .replace(/^#\s+(.*?)(\n|$)/gm, '# $1\n')
        // 見出し2（シーン）
        .replace(/^##\s+(.*?)(\n|$)/gm, '## $1\n')
        // 見出し3（セクション）
        .replace(/^###\s+(.*?)(\n|$)/gm, '### $1\n')
        // 見出し4（サブセクション）
        .replace(/^####\s+(.*?)(\n|$)/gm, '#### $1\n');
      
      // マークダウンをHTMLに変換
      let html = markdownToHtml(processedMarkdown);
      
      // 空の場合はデフォルトのメッセージを表示
      if (!html || html.trim() === '') {
        return '<div class="empty-preview">ここにプレビューが表示されます</div>';
      }
      
      return html;
    } catch (error) {
      const errorMessage = 'マークダウンの変換に失敗しました';
      console.error(errorMessage, error);
      this.showError(errorMessage, error);
      return `<div class="error-message">${errorMessage}: ${error.message}</div>`;
    }
  }

  // 表示モードを初期化
  initializeViewMode() {
    // 保存された表示モードを取得（デフォルトは分割表示）
    const savedViewMode = localStorage.getItem('editorViewMode') || 'split';
    this.setViewMode(savedViewMode);
    
    // 表示モード切り替えボタンのイベントリスナーを設定
    document.querySelectorAll('.view-mode-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setViewMode(mode);
      });
    });
    
    // キーボードショートカットの設定
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case '1':
            this.setViewMode('split');
            e.preventDefault();
            break;
          case '2':
            this.setViewMode('editor');
            e.preventDefault();
            break;
          case '3':
            this.setViewMode('preview');
            e.preventDefault();
            break;
        }
      }
    });
  }
  
  // プレビューを更新
  updatePreview() {
    debugLog('updatePreview: プレビューの更新を開始します');
    
    // プレビュー要素を取得
    const previewElement = document.getElementById('preview-content');
    
    if (!this.quill || !previewElement) {
      debugLog('エラー: Quillエディタまたはプレビュー要素が見つかりません');
      return;
    }
    
    // markdownToHtml 関数が利用可能か確認
    if (typeof window.markdownToHtml !== 'function') {
      console.error('markdownToHtml 関数が正しく読み込まれていません');
      previewElement.innerHTML = '<p class="error-message">マークダウンコンバーターの読み込みに失敗しました。ページを再読み込みしてください。</p>';
      return;
    }
    
    try {
      // エディタの内容をマークダウンに変換
      const delta = this.quill.getContents();
      const markdown = this.quill.getText();
      debugLog('updatePreview: マークダウンを取得しました', markdown);
      
      // マークダウンをHTMLに変換
      const html = window.markdownToHtml(markdown);
      debugLog('updatePreview: HTMLに変換しました', html);
      
      // プレビューを更新
      previewElement.innerHTML = html || '<p class="empty-preview">プレビューが表示されます</p>';
      
      // プレビュー内のリンクにイベントリスナーを設定
      if (typeof this.setupPreviewLinks === 'function') {
        this.setupPreviewLinks();
      }
      
      // プレビュー内のアクションボタンにイベントリスナーを設定
      if (typeof this.setupActionButtons === 'function') {
        this.setupActionButtons();
      }
      
      // アクションボタンの設定
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
      
    } catch (error) {
      console.error('プレビューの更新中にエラーが発生しました:', error);
      if (this.preview) {
        this.preview.innerHTML = '<p class="error-message">プレビューの表示中にエラーが発生しました。ページを再読み込みしてください。</p>';
      }
    }
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
        throw new Error('Quillエディタが初期化されていません');
      }
      
      // markdownToHtml 関数が利用可能か確認
      if (typeof window.markdownToHtml !== 'function') {
        throw new Error('マークダウンコンバーターが利用できません');
      }
      
      // マークダウンをHTMLに変換
      const html = window.markdownToHtml(markdown);
      
      // エディタにHTMLを設定
      const delta = this.quill.clipboard.convert(html);
      this.quill.setContents(delta, 'silent');
      
      // プレビューを更新
      this.updatePreview();
      
      debugLog('シナリオのインポートが完了しました');
    } catch (error) {
      const errorMessage = 'シナリオのインポート中にエラーが発生しました: ' + error.message;
      console.error(errorMessage, error);
      this.showStatus(errorMessage, 'error');
      
      // スタックトレースをコンソールに出力
      console.error('スタックトレース:', error);
      
      throw error;
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

// ドキュメントの読み込みが完了したら初期化
function initialize() {
  debugLog('ドキュメントの読み込みが完了しました');
  
  // エディタを初期化
  try {
    initializeEditor();
  } catch (error) {
    console.error('初期化中にエラーが発生しました:', error);
  }
}

// DOMの読み込みが完了したら初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOMContentLoaded が既に発生している場合
  setTimeout(initialize, 100);
}
