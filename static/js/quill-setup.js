/**
 * Quillエディタの初期化を行います
 * @param {Object} editorInstance - エディタインスタンス
 * @returns {boolean} 初期化が成功したかどうか
 */
function setupQuill(editorInstance) {
  debugLog('Quill エディタの初期化を開始します...');
  
  try {
    // 必要な要素が存在するか確認
    const editorElement = document.getElementById('editor');
    if (!editorElement) {
      throw new Error('エディタ要素 (#editor) が見つかりません');
    }

    // ツールバーの設定
    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ];

    // キーボードショートカットの設定
    const keyboardBindings = {
      // カスタムキーバインディングを追加可能
    };

    // Quillの設定
    const quill = new Quill(editorElement, {
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            // 画像アップロードハンドラ
            image: () => {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();
              
              input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;
                await editorInstance.handleImageUpload(file);
              };
            }
          }
        },
        keyboard: {
          bindings: keyboardBindings
        }
      },
      theme: 'snow',
      placeholder: 'ここにシナリオを入力してください...',
      formats: [
        'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent', 'script', 'color', 'background',
        'font', 'align', 'code-block'
      ]
    });

    // エディタインスタンスを保存
    editorInstance.quill = quill;
    debugLog('Quill エディタの初期化に成功しました');
    
    // エディタの変更を監視
    quill.on('text-change', () => {
      if (editorInstance.updatePreview) {
        editorInstance.updatePreview();
      }
    });
    
    return true;

  } catch (error) {
    console.error('エディタの初期化に失敗しました:', error);
    
    // エラーメッセージを表示
    const errorMessage = `エディタの初期化に失敗しました: ${error.message}`;
    showError(errorMessage);
    
    // エディタコンテナにエラーメッセージを表示
    const container = document.getElementById('editor-container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.style.margin = '20px';
    errorDiv.innerHTML = `
      <strong>エラー:</strong> エディタの初期化に失敗しました。<br>
      詳細: ${error.message}<br>
      ページを再読み込みしてください。
    `;
    container.appendChild(errorDiv);
    
    return false;
  }
}
