// editor-fixed.js - 選択肢挿入機能を修正したバージョン

// SimpleEditor クラスが定義されていることを確認
if (typeof SimpleEditor !== 'undefined') {
  // 選択肢を挿入するメソッドを上書き
  SimpleEditor.prototype.insertChoice = function() {
    try {
      if (!this.quill) {
        console.error('Quill エディタが初期化されていません');
        return;
      }

      const range = this.quill.getSelection();
      const prefix = '\n### 選択肢\n';
      const choice1 = '- [選択肢1](scene:1)';
      const choice2 = '- [選択肢2](scene:2)';
      const newline = '\n';
      
      // 現在の選択範囲を保存
      const savedRange = range || { index: this.quill.getLength(), length: 0 };
      
      // テキストを挿入
      this.quill.insertText(savedRange.index, prefix + choice1 + newline + choice2 + newline);
      
      // 選択範囲を更新してフォーカスを設定
      const newPosition = savedRange.index + prefix.length + choice1.length + newline.length + choice2.length + newline.length;
      this.quill.setSelection(newPosition, 0, 'api');
      this.quill.focus();
      
      // プレビューを更新
      if (typeof this.updatePreview === 'function') {
        this.updatePreview();
      }
      
      // ビューモードがプレビューの場合は確実に表示を更新
      if ((this.viewMode === 'preview' || this.viewMode === 'split') && typeof this.applyViewMode === 'function') {
        this.applyViewMode(this.viewMode);
      }
    } catch (error) {
      console.error('選択肢の挿入中にエラーが発生しました:', error);
      if (this.ui && typeof this.ui.showStatus === 'function') {
        this.ui.showStatus('選択肢の挿入中にエラーが発生しました: ' + error.message, 'error');
      }
    }
  };

  console.log('editor-fixed.js: 選択肢挿入機能を更新しました');
} else {
  console.warn('editor-fixed.js: SimpleEditor クラスが見つかりませんでした');
}

// 既存のイベントリスナーを更新
document.addEventListener('DOMContentLoaded', function() {
  console.log('editor-fixed.js: DOMContentLoaded イベントを処理中');
  
  // 既存のイベントリスナーを削除
  const oldScripts = document.querySelectorAll('script[src*="editor.js"]');
  oldScripts.forEach(oldScript => {
    if (oldScript && oldScript.src.includes('editor.js') && !oldScript.src.includes('editor-fixed.js')) {
      console.log('editor-fixed.js: 古い editor.js スクリプトを検出しましたが、既に読み込まれているためスキップします');
    }
  });
});
