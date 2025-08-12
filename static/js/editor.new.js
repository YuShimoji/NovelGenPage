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

// 必要なライブラリが読み込まれているか確認する関数
function checkDependencies() {
  if (typeof Quill === 'undefined') {
    showError('Quill エディタが読み込まれていません');
    return false;
  }
  
  if (typeof markdownToHtml !== 'function') {
    showError('markdownToHtml 関数が見つかりません');
    return false;
  }
  
  return true;
}

// カスタムブロックの定義
const BlockEmbed = Quill.import('blots/block/embed');

class SceneBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-type', 'scene');
    node.innerHTML = `<div class="scene-marker">シーン: ${value || '新しいシーン'}</div>`;
    return node;
  }

  static value(node) {
    return node.querySelector('.scene-marker').textContent.replace('シーン: ', '');
  }
}
SceneBlot.blotName = 'scene';
SceneBlot.tagName = 'div';
SceneBlot.className = 'scene-marker';

class ChoiceBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-type', 'choice');
    node.innerHTML = `<div class="choice-marker">選択肢: ${value || '新しい選択肢'}</div>`;
    return node;
  }

  static value(node) {
    return node.querySelector('.choice-marker').textContent.replace('選択肢: ', '');
  }
}
ChoiceBlot.blotName = 'choice';
ChoiceBlot.tagName = 'div';
ChoiceBlot.className = 'choice-marker';

// カスタムブロックを登録
Quill.register(SceneBlot);
Quill.register(ChoiceBlot);

// シナリオエディタクラス
class ScenarioEditor {
  constructor() {
    try {
      debugLog('ScenarioEditor を初期化しています...');
      
      // 必要なライブラリが読み込まれているか確認
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
    this.editorElement = document.getElementById('editor');
    this.previewElement = document.getElementById('preview-content');
    this.statusElement = document.createElement('div');
    this.statusElement.className = 'status-message';
    document.body.appendChild(this.statusElement);
  }

  // Quill エディタを初期化
  initializeQuill() {
    debugLog('Quill エディタの初期化を開始します...');
    
    // ツールバーボタンの設定
    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ];
    
    // Quillエディタの初期化
    this.quill = new Quill(this.editorElement, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            'image': () => this.handleImageUpload()
          }
        }
      },
      placeholder: 'ここにテキストを入力...',
    });
    
    // エディタの変更を監視してプレビューを更新
    this.quill.on('text-change', () => this.updatePreview());
    
    debugLog('Quill エディタの初期化が完了しました');
  }

  // シーンを挿入
  insertScene() {
    const range = this.quill.getSelection();
    this.quill.insertEmbed(range.index, 'scene', '新しいシーン');
    this.quill.setSelection(range.index + 1, 0);
  }

  // 選択肢を挿入
  insertChoice() {
    const range = this.quill.getSelection();
    this.quill.insertEmbed(range.index, 'choice', '新しい選択肢');
    this.quill.setSelection(range.index + 1, 0);
  }

  // 画像アップロードを処理
  handleImageUpload() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      
      // ここで画像アップロード処理を実装
      console.log('画像をアップロード:', file.name);
      
      // 仮の画像URLを挿入
      const range = this.quill.getSelection();
      this.quill.insertEmbed(range.index, 'image', 'https://via.placeholder.com/400x200');
    };
  }

  // イベントリスナーを設定
  initializeEventListeners() {
    // シーン挿入ボタン
    const insertSceneBtn = document.getElementById('insert-scene');
    if (insertSceneBtn) {
      insertSceneBtn.addEventListener('click', () => this.insertScene());
    }
    
    // 選択肢挿入ボタン
    const insertChoiceBtn = document.getElementById('insert-choice');
    if (insertChoiceBtn) {
      insertChoiceBtn.addEventListener('click', () => this.insertChoice());
    }
    
    // 画像アップロードボタン
    const uploadImageBtn = document.getElementById('upload-image');
    if (uploadImageBtn) {
      uploadImageBtn.addEventListener('click', () => this.handleImageUpload());
    }
    
    // 保存ボタン
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveScenario());
    }
  }

  // マークダウンをHTMLに変換
  convertMarkdownToHtml(markdown) {
    try {
      if (typeof markdownToHtml !== 'function') {
        throw new Error('markdownToHtml 関数が見つかりません');
      }
      
      // マークダウンをHTMLに変換
      let html = markdownToHtml(markdown || '');
      
      // 空の場合はデフォルトのメッセージを表示
      if (!html || html.trim() === '') {
        return '<p>ここにプレビューが表示されます</p>';
      }
      
      return html;
    } catch (error) {
      const errorMessage = 'マークダウンの変換に失敗しました';
      console.error(errorMessage, error);
      return `<p>${errorMessage}: ${error.message}</p>`;
    }
  }

  // プレビューを更新
  updatePreview() {
    debugLog('updatePreview: プレビューの更新を開始します');
    
    if (!this.quill || !this.previewElement) {
      console.error('Quillエディタまたはプレビュー要素が初期化されていません');
      return;
    }
    
    try {
      // エディタの内容をマークダウンとして取得
      const delta = this.quill.getContents();
      const text = this.quill.getText();
      
      // マークダウンをHTMLに変換してプレビューに表示
      this.previewElement.innerHTML = this.convertMarkdownToHtml(text);
      
    } catch (error) {
      console.error('プレビューの更新中にエラーが発生しました:', error);
    }
  }

  // シナリオを保存
  async saveScenario() {
    try {
      const content = this.quill.getContents();
      const text = this.quill.getText();
      
      // ここでサーバーに保存する処理を実装
      console.log('シナリオを保存します:', { content, text });
      
      // 保存成功を通知
      this.showStatus('シナリオを保存しました', 'success');
      
      return true;
    } catch (error) {
      console.error('シナリオの保存中にエラーが発生しました:', error);
      this.showStatus('シナリオの保存に失敗しました', 'error');
      return false;
    }
  }

  // ステータスを表示
  showStatus(message, type = 'info') {
    if (!this.statusElement) return;
    
    this.statusElement.textContent = message;
    this.statusElement.className = `status-message ${type}`;
    
    // 5秒後にメッセージを非表示
    setTimeout(() => {
      this.statusElement.textContent = '';
      this.statusElement.className = 'status-message';
    }, 5000);
  }
}

// ドキュメントの読み込みが完了したら初期化
function initialize() {
  // 既に初期化済みの場合は何もしない
  if (window.NovelGenPage.editor) return;
  
  try {
    debugLog('ドキュメントの初期化を開始します');
    
    // エディタを初期化
    window.NovelGenPage.editor = new ScenarioEditor();
    
    debugLog('ドキュメントの初期化が完了しました');
  } catch (error) {
    console.error('初期化中にエラーが発生しました:', error);
    showError('初期化中にエラーが発生しました', error);
  }
}

// DOMの読み込みが完了したら初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOMContentLoaded が既に発生している場合は即時実行
  setTimeout(initialize, 0);
}
