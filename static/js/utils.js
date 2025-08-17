// デバッグ用のログ関数
window.debugLog = function(message, data = null) {
  if (window.NovelGenPage.debug) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

// エラーメッセージを表示する関数
window.showError = function(message, error = null) {
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
window.checkDependencies = function() {
  console.log('依存関係のチェックを開始します');
  
  const required = {
    'Quill': () => {
      const loaded = typeof Quill !== 'undefined';
      console.log(`Quill の読み込み状態: ${loaded ? '成功' : '失敗'}`);
      return loaded;
    },
    'markdownToHtml': () => {
      const loaded = typeof window.markdownToHtml === 'function';
      console.log(`markdownToHtml の読み込み状態: ${loaded ? '成功' : '失敗'}`);
      return loaded;
    },
    'showError': () => {
      const loaded = typeof window.showError === 'function';
      console.log(`showError の読み込み状態: ${loaded ? '成功' : '失敗'}`);
      return loaded;
    },
    'debugLog': () => {
      const loaded = typeof window.debugLog === 'function';
      console.log(`debugLog の読み込み状態: ${loaded ? '成功' : '失敗'}`);
      return loaded;
    }
  };
  
  const results = {};
  const missing = [];
  
  for (const [name, check] of Object.entries(required)) {
    const isAvailable = check();
    results[name] = isAvailable;
    if (!isAvailable) {
      missing.push(name);
    }
  }
  
  console.log('依存関係のチェック結果:', results);
  
  if (missing.length > 0) {
    const errorMsg = `次の必要なライブラリが読み込まれていません: ${missing.join(', ')}`;
    console.error(errorMsg);
    if (typeof window.showError === 'function') {
      window.showError(errorMsg);
    } else {
      console.error('showError 関数が利用できないため、エラーメッセージを表示できません');
    }
    return false;
  }
  
  console.log('すべての依存関係が正しく読み込まれています');
  return true;
};
