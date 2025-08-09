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
    status.className = 'status status-error visible';
  }
}

// 成功メッセージを表示する関数
function showSuccess(message) {
  console.log(`[SUCCESS] ${message}`);
  debugLog(`[SUCCESS] ${message}`);
  
  const status = document.getElementById('editor-status');
  if (status) {
    status.textContent = message;
    status.className = 'status status-success visible';
  }
}

class ScenarioEditor {
    constructor() {
      this.editor = document.getElementById('scenario-editor');
      this.preview = document.getElementById('scenario-preview');
      this.importButton = document.getElementById('import-button');
      this.saveButton = document.getElementById('save-button');
      this.status = document.getElementById('editor-status');
      
      debugLog('ScenarioEditor を初期化しています...');
    }
  
    initializeEventListeners() {
      if (this.importButton) {
        this.importButton.addEventListener('click', () => this.importScenario());
      }
      
      if (this.saveButton) {
        this.saveButton.addEventListener('click', () => this.saveScenario());
      }
      
      if (this.editor) {
        this.editor.addEventListener('input', () => this.updatePreview());
      }
    }
  
    async importScenario() {
      const markdown = this.editor.value;
      debugLog('シナリオのインポートを開始します...');
      
      if (!markdown.trim()) {
        const errorMsg = 'エラー: インポートするテキストを入力してください';
        debugLog(errorMsg);
        this.showStatus(errorMsg, 'error');
        return null;
      }
  
      this.showStatus('シナリオを解析中...', 'info');
      
      try {
        debugLog('サーバーにリクエストを送信しています...', {
          url: '/api/v1/scenarios/import',
          method: 'POST',
          contentLength: markdown.length
        });
        
        const response = await fetch('/api/v1/scenarios/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '新しいシナリオ',
            content: markdown
          })
        });

        debugLog('サーバーからのレスポンスを受信しました', {
          status: response.status,
          statusText: response.statusText
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || `サーバーエラー: ${response.status} ${response.statusText}`;
          debugLog('インポートエラー:', errorData);
          throw new Error(errorMsg);
        }
  
        const data = await response.json();
        debugLog('シナリオの解析に成功しました', data);
        
        const successMsg = 'シナリオを解析しました。「保存する」をクリックして保存してください';
        this.showStatus(successMsg, 'success');
        
        // プレビューを更新
        this.updatePreview();
        
        return data;
      } catch (error) {
        console.error('Error importing scenario:', error);
        this.showStatus(`エラー: ${error.message}`, 'error');
        return null;
      }
    }
  
    async saveScenario() {
      debugLog('シナリオの保存を開始します...');
      this.showStatus('シナリオを保存中...', 'info');
      
      try {
        // まずインポートして構文チェック
        debugLog('構文チェックを実行します...');
        const scenario = await this.importScenario();
        
        if (!scenario) {
          debugLog('構文チェックに失敗しました。保存を中止します。');
          return null;
        }
        
        debugLog('サーバーに保存リクエストを送信します...', scenario);
        
        // 既存のシナリオを更新するか、新しいシナリオとして保存
        const response = await fetch('/api/v1/scenarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scenario)
        });
        
        debugLog('サーバーからの応答を受信しました', {
          status: response.status,
          statusText: response.statusText
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || `保存に失敗しました: ${response.status} ${response.statusText}`;
          debugLog('保存エラー:', errorData);
          throw new Error(errorMsg);
        }
  
        const savedScenario = await response.json();
        debugLog('シナリオの保存に成功しました', savedScenario);
        
        const successMsg = `シナリオを保存しました！ ID: ${savedScenario.id}`;
        this.showStatus(successMsg, 'success');
        
        // 5秒後にステータスを消す
        setTimeout(() => {
          if (this.status && this.status.textContent.includes('保存しました')) {
            this.status.textContent = '';
            this.status.className = 'status';
          }
        }, 5000);
        
        return savedScenario;
      } catch (error) {
        console.error('Error saving scenario:', error);
        this.showStatus(`エラー: ${error.message}`, 'error');
        return null;
      }
    }
  
    updatePreview() {
      console.log('updatePreview が呼び出されました');
      
      if (!this.editor || !this.preview) {
        console.error('エディタまたはプレビュー要素が見つかりません');
        return;
      }
      
      const markdown = this.editor.value;
      console.log('マークダウンを取得しました:', markdown.substring(0, 100) + '...');
      
      try {
        const html = this.convertMarkdownToHtml(markdown);
        console.log('HTMLに変換しました:', html.substring(0, 100) + '...');
        
        if (this.preview) {
          this.preview.innerHTML = html;
          console.log('プレビューを更新しました');
          
          // アクションボタンにイベントリスナーを追加
          const actionButtons = this.preview.querySelectorAll('.action-button');
          console.log(`アクションボタンを ${actionButtons.length} 個見つけました`);
          
          actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              const sceneId = button.getAttribute('data-scene-id');
              this.showStatus(`シーン ${sceneId} に移動します`, 'info');
              
              // 対応するシーンにスクロール
              const targetScene = document.getElementById(`scene-${sceneId}`);
              if (targetScene) {
                targetScene.scrollIntoView({ behavior: 'smooth' });
              }
            });
          });
        } else {
          console.error('プレビュー要素が見つかりません');
        }
      } catch (error) {
        console.error('プレビューの更新中にエラーが発生しました:', error);
        this.showStatus(`エラー: ${error.message}`, 'error');
      }
    }
  
    convertMarkdownToHtml(markdown) {
      console.log('convertMarkdownToHtml を実行中...');
      
      try {
        // シーンを分割（## で始まる見出しで分割）
        const scenes = markdown.split(/^##\s+/m).filter(Boolean);
        console.log(`シーンを ${scenes.length} 個検出しました`);
        
        let resultHtml = '';
        let sceneIndex = 0;
        
        for (const scene of scenes) {
          sceneIndex++;
          const lines = scene.split('\n');
          const title = lines[0] ? lines[0].trim() : `シーン ${sceneIndex}`;
          let content = [];
          const actions = [];
          let inChoicesSection = false;
          
          console.log(`シーン ${sceneIndex} の処理を開始: ${title}`);
          
          // コンテンツとアクションを分離
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('### 選択肢')) {
              inChoicesSection = true;
              continue;
            }
            
            if (inChoicesSection) {
              // 選択肢の行を処理
              const match = line.match(/^- \[(.*?)\]\(scene:(\d+)\)/);
              if (match) {
                actions.push({
                  text: match[1],
                  sceneId: match[2]
                });
                console.log(`選択肢を追加: ${match[1]} -> シーン ${match[2]}`);
              }
            } else if (line.trim()) {
              // 通常のコンテンツ行を追加
              content.push(line);
            }
          }
          
          // HTMLを生成
          let sceneHtml = `<div class="scene" id="scene-${sceneIndex}">\n`;
          sceneHtml += `  <h3>${title}</h3>\n`;
          
          // マークダウンをHTMLに変換（簡易的な変換）
          let sceneContent = content.join('\n')
            .replace(/^#+\s+(.*$)/gm, '<h4>$1</h4>')  // 見出し
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // 太字
            .replace(/\*(.*?)\*/g, '<em>$1</em>')  // 斜体
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')  // 画像
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')  // リンク
            .replace(/\n\n/g, '</p><p>')  // 段落
            .replace(/\n/g, '<br>');  // 改行
          
          sceneHtml += `  <div class="scene-content"><p>${sceneContent}</p></div>\n`;
          
          if (actions.length > 0) {
            sceneHtml += '  <div class="action-buttons">\n';
            for (const action of actions) {
              sceneHtml += `    <button class="action-button" data-scene-id="${action.sceneId}">${action.text}</button>\n`;
            }
            sceneHtml += '  </div>\n';
          }
          
          sceneHtml += '</div>\n\n';
          resultHtml += sceneHtml;
        }
        
        console.log('HTMLの生成が完了しました');
        return resultHtml || '<p>コンテンツがありません</p>';
        
      } catch (error) {
        console.error('マークダウンの変換中にエラーが発生しました:', error);
        return `<div class="error">エラー: マークダウンの解析中にエラーが発生しました: ${error.message}</div>`;
      }
      
      return resultHtml;
    }
  
    showStatus(message, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${message}`);
      
      // ステータスメッセージを表示
      if (this.status) {
        this.status.textContent = message;
        this.status.className = 'status';
        this.status.classList.add(`status-${type}`, 'visible');
        
        // 3秒後にメッセージを非表示にする
        clearTimeout(this.statusTimer);
        this.statusTimer = setTimeout(() => {
          if (this.status) {
            this.status.classList.remove('visible');
            // アニメーション終了後に完全に非表示にする
            setTimeout(() => {
              if (this.status) this.status.textContent = '';
            }, 300);
          }
        }, 3000);
      }
      
      // デバッグ情報を更新
      this.updateDebugInfo(`[${new Date().toISOString()}] [${type.toUpperCase()}] ${message}`);
    }
  
    updateDebugInfo(message) {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
      debugInfo.innerHTML += `<div>${message}</div>`;
      debugInfo.scrollTop = debugInfo.scrollHeight;
    }
  }
}

// グローバルに公開してデバッグ用に使用できるようにする
window.debugLog = debugLog;

// エディタの初期化
document.addEventListener('DOMContentLoaded', () => {
  debugLog('ドキュメントの読み込みが完了しました');
  
  try {
    // デバッグ情報を表示
    debugLog('シナリオエディタを初期化しています...');
  
    // エディタ要素を確認
    const editorElement = document.getElementById('scenario-editor');
    const previewElement = document.getElementById('scenario-preview');
    
    debugLog('エディタ要素を確認', { 
      editor: editorElement ? '見つかりました' : '見つかりません',
      preview: previewElement ? '見つかりました' : '見つかりません'
    });
    
    if (!editorElement || !previewElement) {
      throw new Error('必要な要素が見つかりませんでした');
    }
    
    // エディタを初期化
    window.scenarioEditor = new ScenarioEditor();
    debugLog('ScenarioEditor の初期化が完了しました');
    
    // イベントリスナーを手動で設定
    if (window.scenarioEditor) {
      // エディタの入力イベント
      editorElement.addEventListener('input', () => {
        debugLog('エディタの入力が変更されました');
        window.scenarioEditor.updatePreview();
      });
      
      // インポートボタン
      const importBtn = document.getElementById('import-button');
      if (importBtn) {
        importBtn.addEventListener('click', (e) => {
          e.preventDefault();
          debugLog('インポートボタンがクリックされました');
          window.scenarioEditor.importScenario();
        });
      } else {
        debugLog('警告: インポートボタンが見つかりません', { id: 'import-button' });
      }
      
      // 保存ボタン
      const saveBtn = document.getElementById('save-button');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.preventDefault();
          debugLog('保存ボタンがクリックされました');
          window.scenarioEditor.saveScenario();
        });
      } else {
        debugLog('警告: 保存ボタンが見つかりません', { id: 'save-button' });
      }
      
      // 初期プレビューを更新
      debugLog('初期プレビューを更新します...');
      window.scenarioEditor.updatePreview();
      debugLog('初期プレビューの更新が完了しました');
      
      // デバッグパネルの表示/非表示を切り替える
      const debugToggle = document.querySelector('.debug-toggle');
      const debugInfo = document.getElementById('debug-info');
      
      if (debugToggle && debugInfo) {
        debugToggle.addEventListener('click', () => {
          const isVisible = debugInfo.style.display === 'block';
          debugInfo.style.display = isVisible ? 'none' : 'block';
          debugToggle.textContent = isVisible ? 'デバッグ情報を表示' : 'デバッグ情報を非表示';
          debugLog(`デバッグパネルを${isVisible ? '非表示' : '表示'}にしました`);
        });
        
        // 初期状態でデバッグ情報を非表示に
        debugInfo.style.display = 'none';
        debugToggle.textContent = 'デバッグ情報を表示';
      } else {
        debugLog('警告: デバッグパネルの要素が見つかりません', { 
          toggle: debugToggle ? '見つかりました' : '見つかりません',
          info: debugInfo ? '見つかりました' : '見つかりません'
        });
      }
    }
    
    showSuccess('シナリオエディタの初期化が完了しました');
    
  } catch (error) {
    showError('初期化中にエラーが発生しました', error);
  }
});