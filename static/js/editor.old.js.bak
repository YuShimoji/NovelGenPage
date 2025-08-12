// スクリプトが読み込まれたことを確認
console.log('editor.js が読み込まれました');

// 必要なモジュールをインポート
import { markdownToHtml, quillToMarkdown } from './markdown-converter.js';

// デバッグ用のログを表示する関数
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString();
  const logElement = document.getElementById('debug-info');
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage, data || '');
  
  if (logElement) {
    const logLine = document.createElement('div');
    logLine.textContent = logMessage;
    logLine.style.fontFamily = 'monospace';
    logLine.style.fontSize = '12px';
    logLine.style.padding = '4px 0';
    logLine.style.borderBottom = '1px solid #444';
    
    if (data) {
      const dataElement = document.createElement('pre');
      dataElement.textContent = JSON.stringify(data, null, 2);
      dataElement.style.margin = '5px 0 0 20px';
      dataElement.style.fontSize = '11px';
      dataElement.style.whiteSpace = 'pre-wrap';
      dataElement.style.color = '#ccc';
      logLine.appendChild(dataElement);
    }
    
    logElement.appendChild(logLine);
    logElement.scrollTop = logElement.scrollHeight;
    
    // デバッグパネルが非表示の場合は自動で表示する
    const debugPanel = document.querySelector('.debug-panel');
    if (debugPanel && debugPanel.style.display === 'none') {
      debugPanel.style.display = 'block';
    }
  }
}

// エラーメッセージを表示する関数
function showError(message, error = null) {
  console.error(message, error || '');
  debugLog(`[ERROR] ${message}`, error ? error.stack || error.message : null);
  
  const status = document.getElementById('editor-status');
  if (status) {
    status.textContent = message;
    status.className = 'status status-error';
  }
}

// 成功メッセージを表示する関数
function showSuccess(message) {
  console.log(message);
  debugLog(`[SUCCESS] ${message}`);
  
  const status = document.getElementById('editor-status');
  if (status) {
    status.textContent = message;
    status.className = 'status status-success';
  }
}

class ScenarioEditor {
  constructor() {
    this.textarea = document.getElementById('scenario-editor');
    this.preview = document.getElementById('scenario-preview');
    this.importButton = document.getElementById('import-button');
    this.saveButton = document.getElementById('save-button');
    this.status = document.getElementById('editor-status');
    
    debugLog('ScenarioEditor を初期化しています...');
    
    // Quillエディタを初期化
    this.initializeQuill();
    
    // イベントリスナーを設定
    this.initializeEventListeners();
  }
  
  // Quillエディタを初期化
  initializeQuill() {
    // カスタムボタンのスタイル
    const icons = Quill.import('ui/icons');
    icons['scene'] = '<i class="ql-scene">シーン</i>';
    icons['choice'] = '<i class="ql-choice">選択肢</i>';
    
    // ツールバーの設定
    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean'],
      [{ 'custom': ['scene', 'choice'] }]
    ];
    
    // エディタコンテナを作成
    const editorContainer = document.createElement('div');
    editorContainer.id = 'editor-container';
    editorContainer.style.height = '100%';
    this.textarea.parentNode.insertBefore(editorContainer, this.textarea);
    
    // Quillエディタの設定
    this.quill = new Quill(editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            'scene': () => this.insertScene(),
            'choice': () => this.insertChoice(),
            'image': () => this.handleImageUpload()
          }
        }
      },
      placeholder: 'ここにシナリオを入力...',
    });
    
    // 既存のマークダウンを読み込む
    const markdown = this.textarea.value;
    if (markdown) {
      const html = markdownToHtml(markdown);
      this.quill.clipboard.dangerouslyPasteHTML(html);
    }
    
    // テキストエリアを非表示
    this.textarea.style.display = 'none';
    
    // 変更を監視してプレビューを更新
    this.quill.on('text-change', () => this.updatePreview());
    
    debugLog('Quillエディタを初期化しました');
  }
  
  // シーンを挿入
  insertScene() {
    const range = this.quill.getSelection();
    if (range) {
      this.quill.insertText(range.index, '\n## 新しいシーン\n');
      this.quill.setSelection(range.index + 12, 0);
    }
  }
  
  // 選択肢を挿入
  insertChoice() {
    const range = this.quill.getSelection();
    if (range) {
      this.quill.insertText(range.index, '\n- [選択肢1](scene:1)\n- [選択肢2](scene:2)\n');
      this.quill.setSelection(range.index + 15, 0);
    }
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
  
  // イベントリスナーを初期化
  initializeEventListeners() {
    if (this.importButton) {
      this.importButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.importScenario();
      });
    }
    
    if (this.saveButton) {
      this.saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveScenario();
      });
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
      return '<p>ここにプレビューが表示されます</p>';
    }
    
    try {
      // シーンを処理
      let html = markdown
        .replace(/^##\s+(.*)$/gm, '<h2 id="scene-$1" class="scene">$1</h2>')
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
      
      // 選択肢を処理
      html = html.replace(
        /^-\s*\[(.*?)\]\((.*?)\)/gm,
        '<li class="choice"><a href="$2" class="action-button">$1</a></li>'
      );
      
      // その他のマークダウンを処理
      return html;
    } catch (error) {
      console.error('マークダウンの変換中にエラーが発生しました:', error);
      return `<div class="error">
        <p>マークダウンの解析中にエラーが発生しました:</p>
        <pre>${error.message}</pre>
      </div>`;
    }
  }
  
  // プレビューを更新
  updatePreview() {
    if (!this.quill || !this.preview) return;
    
    try {
      // Quillの内容をマークダウンに変換
      const delta = this.quill.getContents();
      const markdown = quillToMarkdown(delta);
      
      // マークダウンをHTMLに変換してプレビューに表示
      const html = this.convertMarkdownToHtml(markdown);
      this.preview.innerHTML = html;
      
      // テキストエリアも更新（フォーム送信用）
      this.textarea.value = markdown;
      
      // アクションボタンにイベントリスナーを設定
      this.setupActionButtons();
      
    } catch (error) {
      console.error('プレビューの更新中にエラーが発生しました:', error);
      this.showStatus('プレビューの更新に失敗しました', 'error');
    }
  }
  
  // アクションボタンにイベントリスナーを設定
  setupActionButtons() {
    const actionButtons = this.preview.querySelectorAll('.action-button');
    
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
  async importScenario() {
    const markdown = quillToMarkdown(this.quill.getContents());
    
    if (!markdown.trim()) {
      this.showStatus('エラー: インポートするテキストを入力してください', 'error');
      return null;
    }
    
    this.showStatus('シナリオを解析中...', 'info');
    
    try {
      const response = await fetch('/api/v1/scenarios/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '新しいシナリオ',
          content: markdown
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'インポートに失敗しました');
      }
      
      const data = await response.json();
      this.showStatus('シナリオを解析しました', 'success');
      return data;
      
    } catch (error) {
      console.error('シナリオのインポート中にエラーが発生しました:', error);
      this.showStatus(`エラー: ${error.message}`, 'error');
      return null;
    }
  }
  
  // シナリオを保存
  async saveScenario() {
    this.showStatus('シナリオを保存中...', 'info');
    
    try {
      // まずインポートして構文チェック
      const scenario = await this.importScenario();
      if (!scenario) return null;
      
      const response = await fetch('/api/v1/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '保存に失敗しました');
      }
      
      const savedScenario = await response.json();
      this.showStatus('シナリオを保存しました', 'success');
      return savedScenario;
      
    } catch (error) {
      console.error('シナリオの保存中にエラーが発生しました:', error);
      this.showStatus(`エラー: ${error.message}`, 'error');
      return null;
    }
  }
}

// エディタを初期化
function initializeEditor() {
  debugLog('ドキュメントの読み込みが完了しました');
  
  try {
    // 必要な要素を取得
    const editorElement = document.getElementById('scenario-editor');
    const previewElement = document.getElementById('scenario-preview');
    
    if (!editorElement || !previewElement) {
      throw new Error('必要な要素が見つかりませんでした');
    }
    
    // エディタを初期化
    debugLog('ScenarioEditor を初期化しています...');
    window.scenarioEditor = new ScenarioEditor();
    
    // 初期プレビューを更新
    window.scenarioEditor.updatePreview();
    debugLog('初期化が完了しました');
    
  } catch (error) {
    console.error('エディタの初期化中にエラーが発生しました:', error);
    
    // エラーメッセージを表示
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
      <h3>エラーが発生しました</h3>
      <p>${error.message}</p>
      <pre>${error.stack || 'スタックトレースは利用できません'}</pre>
      <p>ページをリロードしてやり直してください。</p>
    `;
    
    document.body.appendChild(errorContainer);
  }
}

// DOMの読み込みが完了したら初期化を開始
document.addEventListener('DOMContentLoaded', initializeEditor);
