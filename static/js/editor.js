console.log('editor.js loaded');

// グローバル名前空間の初期化
window.NovelGenPage = window.NovelGenPage || {};
window.NovelGenPage.debug = true; // デバッグモードを有効化

// 安全なデバッグログ
function debugLog(...args) {
  try {
    if (window.NovelGenPage?.debug) console.log(...args);
  } catch (_) {}
}

// シンプルなエディタクラス
class SimpleEditor {
  constructor() {
    console.log('SimpleEditor initialized');
    this.quill = null;
    this.viewMode = 'split'; // 'split' | 'editor' | 'preview' | 'zen'
    this.contentMode = 'visual'; // 'visual' | 'raw'
    // UI 参照の安全化
    this.ui = {
      showStatus: (msg, type) => {
        // ステータス表示要素があれば表示、なければコンソールに出力
        const el = document.getElementById('editor-status');
        if (el) {
          el.className = 'status-message ' + (type ? `status-${type}` : '');
          el.textContent = msg;
          el.style.display = 'block';
        } else {
          console[(type === 'error') ? 'error' : 'log'](msg);
        }
      },
      previewElement: document.getElementById('preview-content') || null,
      editorPanel: document.querySelector('.editor-panel') || null,
      previewPanel: document.querySelector('.preview-panel') || null,
      toolbarEl: document.querySelector('.ql-toolbar') || document.getElementById('toolbar') || document.getElementById('toolbar-container') || null,
      rawTextarea: document.getElementById('raw-markdown') || null,
    };
    
    // エディタの初期化は後で明示的に行う
  }

  // シーン挿入
  insertScene() {
    try {
      if (!this.quill) throw new Error('Quill が未初期化です');
      const range = this.quill.getSelection();
      const prefix = '\n## 新しいシーン\n';
      const body = 'ここに本文を書きます。\n';
      const choiceHeader = '### 選択肢\n';
      const choice = '- [次のシーン](scene:2)\n';
      const text = prefix + body + choiceHeader + choice;
      const insertAt = range ? range.index : this.quill.getLength();
      this.quill.insertText(insertAt, text, 'user');
      this.quill.setSelection(insertAt + text.length, 0, 'api');
      this.quill.focus();
      this.updatePreview();
      if (this.viewMode === 'preview' || this.viewMode === 'split') this.applyViewMode(this.viewMode);
    } catch (e) {
      console.error('シーン挿入でエラー:', e);
      this.ui?.showStatus?.('シーン挿入でエラー: ' + e.message, 'error');
    }
  }

  // 選択肢挿入（editor-fixed.js による上書きがある場合はそちらが優先されます）
  insertChoice() {
    try {
      if (!this.quill) throw new Error('Quill が未初期化です');
      const range = this.quill.getSelection();
      const prefix = '\n### 選択肢\n';
      const choice1 = '- [選択肢1](scene:1)';
      const choice2 = '- [選択肢2](scene:2)';
      const newline = '\n';
      const insertAt = range ? range.index : this.quill.getLength();
      const snippet = prefix + choice1 + newline + choice2 + newline;
      this.quill.insertText(insertAt, snippet, 'user');
      const newPos = insertAt + snippet.length;
      this.quill.setSelection(newPos, 0, 'api');
      this.quill.focus();
      this.updatePreview();
      if (this.viewMode === 'preview' || this.viewMode === 'split') this.applyViewMode(this.viewMode);
    } catch (e) {
      console.error('選択肢挿入でエラー:', e);
      this.ui?.showStatus?.('選択肢挿入でエラー: ' + e.message, 'error');
    }
  }

  // 互換: 旧カスタムボタンの ql- 接頭辞を除去して警告を回避
  sanitizeCustomToolbarButtons() {
    try {
      const tb = document.getElementById('toolbar') || document.getElementById('toolbar-container') || document.querySelector('.ql-toolbar');
      if (!tb) return;
      const mappings = [
        { sel: '.ql-insert-scene', add: 'insert-scene-btn' },
        { sel: '.ql-insert-choice', add: 'insert-choice-btn' },
      ];
      mappings.forEach(m => {
        tb.querySelectorAll(m.sel).forEach(btn => {
          btn.classList.remove('ql-insert-scene', 'ql-insert-choice');
          btn.classList.add(m.add);
          // ID 互換確保
          if (m.add === 'insert-scene-btn' && !btn.id) btn.id = 'insert-scene';
          if (m.add === 'insert-choice-btn' && !btn.id) btn.id = 'insert-choice';
        });
      });
    } catch (e) {
      console.warn('sanitizeCustomToolbarButtons failed', e);
    }
  }

  // 互換: ビュー切替UIが無い場合に動的生成
  ensureViewToggleUI() {
    let toggle = document.querySelector('.view-mode-toggle');
    // 既存トグルがエディタパネル内やツールバー内にのみ存在する場合、
    // プレビュー表示時にも残るグローバルトグルを別途生成する
    if (toggle) {
      const insideEditorPanel = !!toggle.closest('.editor-panel');
      const insideToolbar = !!toggle.closest('#toolbar, #toolbar-container');
      if (!(insideEditorPanel || insideToolbar)) {
        return toggle; // 既にグローバル配置
      }
      // グローバルが無ければ複製を作成
    }
    try {
      toggle = document.createElement('div');
      toggle.className = 'view-mode-toggle';
      toggle.style.marginTop = '10px';
      toggle.innerHTML = `
        <button class="view-mode-btn active" data-mode="split" title="分割表示">分割</button>
        <button class="view-mode-btn" data-mode="editor" title="エディタのみ">エディタ</button>
        <button class="view-mode-btn" data-mode="preview" title="プレビューのみ">プレビュー</button>
        <button class="view-mode-btn" id="zen-toggle" data-mode="zen" title="Zenモード (全画面/UI非表示)">Zen</button>
      `;
      // h1 のすぐ後 (説明文の後) に挿入
      const main = document.getElementById('main-content') || document.querySelector('.editor-container') || document.body;
      const insertAfter = main.querySelector('h1 + p') || main.querySelector('.admin-notice') || main.firstElementChild;
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(toggle, insertAfter.nextSibling);
      } else {
        main.prepend(toggle);
      }
    } catch (e) {
      console.warn('ensureViewToggleUI failed', e);
    }
    return toggle;
  }

  // Quill関連の重複DOMを除去し、エディタコンテナを初期化前のクリーンな状態にする
  cleanupEditorDom(container) {
    try {
      // 直下の既存内容を一度クリア（Quill生成残骸を除去）
      if (container && container.firstChild) {
        container.innerHTML = '';
      }
      // 画面内の重複した .ql-toolbar / .ql-container を除去（ただし現在のcontainer配下はクリア済み）
      document.querySelectorAll('.ql-toolbar, .ql-container').forEach((el) => {
        // 目視確認用: 編集パネル内のもの以外や重複生成されたものを削除
        if (!container.contains(el)) {
          el.remove();
        }
      });
    } catch (e) {
      console.warn('cleanupEditorDom failed', e);
    }
  }

  // Quill エディタを初期化
  initQuill() {
    console.log('Initializing editor...');
    
    // エディタコンテナを取得
    const container = document.getElementById('editor');
    if (!container) {
      throw new Error('Editor container not found');
    }

    // 既にQuillが存在し、.ql-container がある場合は再初期化しない
    if (window.NovelGenPage.editor && window.NovelGenPage.editor.quill) {
      const hasQuillDom = container.closest('body').querySelectorAll('.ql-container').length > 0;
      if (hasQuillDom) {
        console.log('Quill already initialized. Skipping re-init.');
        return;
      }
    }

    // 事前に重複生成されたQuill関連DOMをクリーンアップ（予防）
    this.cleanupEditorDom(container);
    // 旧クラスをサニタイズ（Quill 初期化前に実施して警告回避）
    this.sanitizeCustomToolbarButtons();
    // ビュー切替UIが無ければ生成
    this.ensureViewToggleUI();
    
    // Quillのツールバー設定（既存DOMがあればそれを使用）
    const toolbarDomSelector =
      (document.getElementById('editor-toolbar') && '#editor-toolbar') ||
      (document.getElementById('toolbar-container') && '#toolbar-container') ||
      (document.getElementById('toolbar') && '#toolbar') ||
      null;
    const toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ 'header': [1, 2, false] }],
      ['link', 'image']
    ];
    
    // Quillエディタを初期化
    this.quill = new Quill(container, {
      theme: 'snow',
      modules: {
        toolbar: toolbarDomSelector || toolbarOptions
      },
      placeholder: 'ここにテキストを入力してください...',
    });
    
    console.log('Quill editor initialized successfully');
    
    // 画像アップロードハンドラを設定
    this.setupImageHandler();

    // 入力変更でプレビュー更新
    try {
      this.quill.on('text-change', () => {
        // Visual -> Preview 更新
        if (this.contentMode === 'visual') {
          this.updatePreview();
          this.syncFromQuillToRaw();
        }
      });
    } catch (e) {
      console.warn('Failed to bind text-change for preview update', e);
    }

    // UI トグルのバインド
    this.bindUiToggles();
    // 初期描画
    this.applyViewMode(this.viewMode);
    this.applyContentMode(this.contentMode);
  }
  
  // 画像アップロードハンドラを設定
  setupImageHandler() {
    const toolbar = this.quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      this.handleImageSelect();
    });
  }
  
  // 画像選択ハンドラ
  handleImageSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // 仮の画像URLを挿入（実際のアップロード処理は後で実装）
      const range = this.quill.getSelection(true);
      const url = URL.createObjectURL(file);
      this.quill.insertEmbed(range.index, 'image', url, 'user');
      
      console.log('Image inserted:', file.name);
      this.ui.showStatus('画像を一時的に挿入しました（未アップロード）', 'info');
    };

    input.click();
  }

  // マークダウンをHTMLに変換
  convertMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    // グローバルな markdownToHtml 関数を使用
    if (typeof window.markdownToHtml === 'function') {
      try {
        return window.markdownToHtml(markdown);
      } catch (error) {
        console.error('マークダウンの変換中にエラーが発生しました:', error);
        return '<p>マークダウンの変換中にエラーが発生しました。</p>';
      }
    } else {
      console.error('markdownToHtml関数が見つかりません');
      return '<p>Markdownプレビューのレンダリングに失敗しました。</p>';
    }
  }

  // プレビューを更新
  updatePreview() {
    if (!this.ui.previewElement) {
      return;
    }
    try {
      const markdown = (this.contentMode === 'raw' && this.ui.rawTextarea)
        ? this.ui.rawTextarea.value
        : this.quill.getText();
      const html = this.convertMarkdownToHtml(markdown);
      this.ui.previewElement.innerHTML = html;
    } catch (error) {
      console.error('プレビューの更新に失敗しました', error);
      this.ui.previewElement.innerHTML = '<p>プレビューの生成中にエラーが発生しました。</p>';
    }
  }

  // Raw テキストエリアへ同期（Visual -> Raw）
  syncFromQuillToRaw() {
    try {
      if (!this.ui.rawTextarea) return;
      const text = this.quill ? this.quill.getText() : '';
      this.ui.rawTextarea.value = text;
    } catch (_) {}
  }

  // Quill へ同期（Raw -> Visual）
  syncFromRawToQuill() {
    try {
      if (!this.ui.rawTextarea || !this.quill) return;
      const text = this.ui.rawTextarea.value || '';
      this.quill.setText(text);
    } catch (_) {}
  }

  // ビュー切り替え適用
  applyViewMode(mode) {
    if (!mode) return;
    
    this.viewMode = mode;
    const { editorPanel, previewPanel } = this.ui;
    const body = document.body;
    if (!editorPanel || !previewPanel) return;

    // リセット
    editorPanel.classList.remove('fullscreen');
    previewPanel.classList.remove('fullscreen');
    body.classList.remove('zen-mode');
    editorPanel.style.display = '';
    previewPanel.style.display = '';

    // ビュー切替UIの表示制御
    const viewToggle = document.querySelector('.view-mode-toggle');
    const isZen = mode === 'zen';
    
    // ビュー切替UIは Zen モード以外で表示
    if (viewToggle) {
      viewToggle.style.display = isZen ? 'none' : '';
    }

    // 各モードの適用
    switch (mode) {
      case 'editor':
        editorPanel.style.display = '';
        previewPanel.style.display = 'none';
        break;
        
      case 'preview':
        editorPanel.style.display = 'none';
        previewPanel.style.display = '';
        this.updatePreview(); // プレビューを更新
        break;
        
      case 'zen':
        body.classList.add('zen-mode');
        editorPanel.classList.add('fullscreen');
        previewPanel.style.display = 'none';
        break;
        
      case 'split':
      default:
        // 両方表示
        editorPanel.style.display = '';
        previewPanel.style.display = '';
        this.updatePreview(); // プレビューを更新
        break;
    }
    
    // アクティブなボタンの更新
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      btn.classList.toggle('active', btnMode === mode || (isZen && btnMode === 'zen'));
    });
    
    // エディタにフォーカスを戻す（Zenモード以外）
    if (mode !== 'zen' && this.quill) {
      this.quill.focus();
    }
  }

  // コンテンツモード適用（Visual / Raw）
  applyContentMode(mode) {
    this.contentMode = mode;
    const toolbar = document.querySelector('.ql-toolbar') || document.getElementById('toolbar') || document.getElementById('toolbar-container');
    const editorContainer = document.getElementById('editor');
    const raw = this.ui.rawTextarea;
    if (!editorContainer || !raw) return;

    if (mode === 'raw') {
      // Visual -> Raw へ同期し、Quillを隠す
      this.syncFromQuillToRaw();
      if (toolbar) toolbar.style.display = 'none';
      editorContainer.style.display = 'none';
      raw.style.display = 'block';
      this.updatePreview();
    } else {
      // Raw -> Visual に同期し、Quillを見せる
      this.syncFromRawToQuill();
      if (toolbar) toolbar.style.display = '';
      editorContainer.style.display = '';
      raw.style.display = 'none';
      this.updatePreview();
    }
  }

  // UI トグルのイベントバインド
  bindUiToggles() {
    // ビュー切替
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.getAttribute('data-mode');
        if (!mode) return;
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyViewMode(mode);
      });
    });

    const zenBtn = document.getElementById('zen-toggle');
    if (zenBtn) {
      zenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // トグル挙動（zen <-> split）
        const isZen = document.body.classList.contains('zen-mode');
        this.applyViewMode(isZen ? 'split' : 'zen');
        // ボタンのアクティブ状態を更新
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
          btn.classList.toggle('active', !isZen && btn.getAttribute('data-mode') === 'zen');
        });
      });
    }

    // コンテンツモード切替
    const visualBtn = document.getElementById('toggle-visual');
    const rawBtn = document.getElementById('toggle-raw');
    visualBtn?.addEventListener('click', () => this.applyContentMode('visual'));
    rawBtn?.addEventListener('click', () => this.applyContentMode('raw'));

    // Raw 入力の変更で Visual/プレビューに反映
    if (this.ui.rawTextarea) {
      this.ui.rawTextarea.addEventListener('input', () => {
        if (this.contentMode === 'raw') {
          this.updatePreview();
        }
      });
      this.ui.rawTextarea.addEventListener('change', () => {
        if (this.contentMode === 'raw') {
          // モード切替時に同期されるが、明示的にも同期可能
          // this.syncFromRawToQuill();
          this.updatePreview();
        }
      });
    }
  }

  // シナリオをインポート
  async importScenario(markdown) {
    try {
      if (typeof markdown !== 'string') {
        const error = new Error('インポートするマークダウンが指定されていません');
        this.ui.showStatus('エラー: ' + error.message, 'error');
        return;
      }
      
      this.ui.showStatus('シナリオをインポート中...', 'info');
      
      if (!this.quill) {
        throw new Error('Quillエディタが初期化されていません');
      }
      
      this.quill.setText(markdown);
      this.updatePreview();
      this.ui.showStatus('シナリオをインポートしました。', 'success');
    } catch (error) {
      const errorMessage = 'シナリオのインポート中にエラーが発生しました: ' + error.message;
      console.error(errorMessage, error);
      this.ui.showStatus(errorMessage, 'error');
    }
  }

  // シナリオを保存
  async saveScenario() {
    try {
      const markdown = this.quill.getText();
      const response = await fetch('/api/save_scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.currentScenarioId,
          content: markdown
        })
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.statusText}`);
      }

      const responseData = await response.json();
      if (responseData.id) {
        this.currentScenarioId = responseData.id;
      }
      
      this.ui.showStatus('シナリオを保存しました。', 'success');
      return responseData;
    } catch (error) {
      console.error('Save failed:', error);
      this.ui.showStatus('シナリオの保存に失敗しました。', 'error');
    }
  }

}

// シーンナビゲーションハンドラ（markdown-converter.js から呼び出される）
// 仕様: (scene:<id>) の最初の出現位置へカーソル移動し、プレビュー領域を上部へスクロール
window.NovelGenPage.navigateToScene = function(sceneId, sceneName){
  try {
    const inst = window.NovelGenPage && window.NovelGenPage.editor;
    if (!inst) return;
    const q = inst.quill;
    // ステータスメッセージ
    inst.ui?.showStatus?.(`シーンに移動: ${sceneName || ''} (ID: ${sceneId})`, 'info');
    // Quill テキストから (scene:<id>) の位置を検索
    if (q && typeof q.getText === 'function') {
      const text = q.getText() || '';
      const marker = `(scene:${sceneId})`;
      const idx = text.indexOf(marker);
      if (idx >= 0) {
        try {
          q.setSelection(idx, 0, 'api');
          q.focus();
        } catch (_) {}
      }
    }
    // プレビュー領域へ軽くスクロール（将来的に h2 へのアンカー移動へ拡張予定）
    if (inst.ui && inst.ui.previewElement) {
      try {
        inst.ui.previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) {}
    }
  } catch (e) {
    console.warn('navigateToScene failed', e);
  }
}

// グローバル初期化関数
function initializeEditor() {
  console.log('Global initializeEditor called');
  try {
    if (window.NovelGenPage.__editorInitializing) {
      console.log('initializeEditor is already running. Skipping.');
      return;
    }
    window.NovelGenPage.__editorInitializing = true;
    // 既存のエディタがあれば再初期化せずに終了
    if (window.NovelGenPage.editor && window.NovelGenPage.editor.quill) {
      console.log('Existing editor detected. Abort re-initialization.');
      return;
    }

    // 新しいエディタインスタンスを作成して初期化
    const instance = new SimpleEditor();
    instance.initQuill();
    window.NovelGenPage.editor = instance;
    console.log('Editor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    // エラーメッセージを表示
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.style.padding = '10px';
    errorElement.style.margin = '10px 0';
    errorElement.style.border = '1px solid #ffcccc';
    errorElement.style.borderRadius = '4px';
    errorElement.style.backgroundColor = '#fff0f0';
    errorElement.textContent = 'エディタの初期化に失敗しました: ' + error.message;
    const editorContainer = document.getElementById('editor') || document.body;
    editorContainer.prepend(errorElement);
  }
  finally {
    window.NovelGenPage.__editorInitializing = false;
  }
}

// DOMの準備ができたらエディタを初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeEditor();
    setupEventListeners();
  });
} else {
  // DOMContentLoaded が既に発生している場合
  setTimeout(() => {
    initializeEditor();
    setupEventListeners();
  }, 0);
}

// イベントリスナーを設定
function setupEventListeners() {
  // シーン挿入ボタン
  const insertSceneBtn = document.getElementById('insert-scene');
  if (insertSceneBtn) {
    insertSceneBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.NovelGenPage.editor) {
        window.NovelGenPage.editor.insertScene();
      }
    });
  }
  // クラス指定のシーン挿入ボタン（互換 + 新クラス）
  document.querySelectorAll('.ql-insert-scene, .insert-scene-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.NovelGenPage.editor) {
          window.NovelGenPage.editor.insertScene();
        }
      });
    });

    // 選択肢挿入ボタン
    const insertChoiceBtn = document.getElementById('insert-choice');
    if (insertChoiceBtn) {
      insertChoiceBtn.addEventListener('click', () => {
        if (window.NovelGenPage.editor) {
          window.NovelGenPage.editor.insertChoice();
        }
      });
    }
  // クラス指定の選択肢挿入ボタン（互換 + 新クラス）
  document.querySelectorAll('.ql-insert-choice, .insert-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.NovelGenPage.editor) {
          window.NovelGenPage.editor.insertChoice();
        }
      });
    });

    // デリゲーション（将来的な動的挿入にも対応）
    document.addEventListener('click', (e) => {
    if (e.target.closest('#insert-scene') || e.target.closest('.ql-insert-scene') || e.target.closest('.insert-scene-btn')) {
      e.preventDefault();
      window.NovelGenPage.editor?.insertScene();
    }
    if (e.target.closest('#insert-choice') || e.target.closest('.ql-insert-choice') || e.target.closest('.insert-choice-btn')) {
      e.preventDefault();
      window.NovelGenPage.editor?.insertChoice();
    }
    });
  }