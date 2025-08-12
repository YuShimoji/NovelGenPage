# 開発ガイドライン

## 目次
1. [FastAPI の基本的な構成](#fastapi-の基本的な構成)
2. [フロントエンド開発の注意点](#フロントエンド開発の注意点)
3. [エラーハンドリング](#エラーハンドリング)
4. [状態管理](#状態管理)
5. [デバッグ方法](#デバッグ方法)
6. [よくある問題と解決策](#よくある問題と解決策)

## FastAPI の基本的な構成

### テンプレートと静的ファイルの取り扱い

#### 正しい構成
```
project/
├── main.py
├── static/
│   ├── css/
│   ├── js/
│   └── images/
└── templates/
    ├── index.html
    └── editor.html
```

#### 静的ファイルのマウント
```python
from fastapi.staticfiles import StaticFiles

# 静的ファイルのマウント
app.mount("/static", StaticFiles(directory="static"), name="static")
```

#### テンプレート内での静的ファイルの参照
```html
<!-- 正しい方法 -->
<link rel="stylesheet" href="{{ url_for('static', path='/css/style.css') }}">

<!-- 間違った方法 -->
<link rel="stylesheet" href="/static/css/style.css">
```

## エディタの初期化と依存関係管理

### 初期化の流れ

1. **依存関係のチェック**
   - `checkDependencies()` 関数で必要なライブラリが読み込まれているか確認
   - 不足している依存関係がある場合はエラーメッセージを表示

2. **エディタの初期化**
   - `ScenarioEditor` クラスのインスタンスを作成
   - グローバルスコープに `window.NovelGenPage.editor` として登録
   - 後方互換性のため `window.editor` にも登録

3. **初期コンテンツの読み込み**
   - `initial-content` 要素があればその内容を読み込み
   - テキストエリアに初期値があればそれを読み込み
   - どちらもない場合は空の状態で初期化

### 依存関係の管理

```javascript
// 依存関係のチェック例
function checkDependencies() {
  const required = {
    'Quill': () => typeof Quill !== 'undefined',
    'markdownToHtml': () => typeof markdownToHtml === 'function'
  };
  
  const missing = [];
  
  for (const [name, check] of Object.entries(required)) {
    if (!check()) {
      console.error(`必要なライブラリが読み込まれていません: ${name}`);
      missing.push(name);
    }
  }
  
  if (missing.length > 0) {
    showError(`次の必要なライブラリが読み込まれていません: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}
```

### エラーハンドリング

- 初期化エラーはコンソールに出力
- ユーザーには分かりやすいエラーメッセージを表示
- エラー状態からの復旧を可能に

## フロントエンド開発の注意点

### イベントリスナーの管理

#### 問題点
- イベントリスナーが重複して登録される
- 動的に追加される要素にイベントリスナーが設定されない

#### 解決策
```javascript
// イベントデリゲーションの使用
document.addEventListener('click', (e) => {
  if (e.target.matches('.dynamic-button')) {
    // ボタンがクリックされたときの処理
  }
});
```

## エラーハンドリング

### 非同期処理のエラーハンドリング

```javascript
// async/await を使用する場合
try {
  const data = await fetchData();
  // 処理
} catch (error) {
  console.error('エラーが発生しました:', error);
  showErrorToUser('処理に失敗しました');
}

// プロミスチェーンの場合
fetchData()
  .then(data => processData(data))
  .catch(error => {
    console.error('Error:', error);
    showErrorToUser('処理中にエラーが発生しました');
  });
```

## 状態管理

### 推奨パターン

```javascript
class AppState {
  constructor() {
    this._state = {};
    this._listeners = [];
  }

  getState() {
    return {...this._state};
  }

  setState(newState) {
    this._state = { ...this._state, ...newState };
    this._notifyListeners();
  }

  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._state));
  }
}
```

## デバッグ方法

### コンソールログの活用
```javascript
// デバッグ用のログ関数
function debugLog(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG]', ...args);
  }
}

// 使用例
debugLog('Current state:', appState.getState());
```

## よくある問題と解決策

### 問題: 静的ファイルが読み込めない

**原因**:
- パスが間違っている
- 静的ファイルが適切なディレクトリに配置されていない

**解決策**:
1. ブラウザの開発者ツールで404エラーを確認
2. 静的ファイルが `static` ディレクトリに正しく配置されているか確認
3. テンプレート内のパスが正しいか確認

### 問題: イベントが複数回発火する

**原因**:
- イベントリスナーが複数回登録されている

**解決策**:
```javascript
// 間違った例（複数回登録される）
function setupButton() {
  document.getElementById('myButton').addEventListener('click', handleClick);
}

// 正しい例
let isButtonSetup = false;
function setupButton() {
  if (isButtonSetup) return;
  document.getElementById('myButton').addEventListener('click', handleClick);
  isButtonSetup = true;
}

// またはイベントデリゲーションを使用
document.addEventListener('click', (e) => {
  if (e.target.matches('#myButton')) {
    handleClick(e);
  }
});
```

### 問題: 状態が予期せず変更される

**原因**:
- オブジェクトや配列の参照が共有されている

**解決策**:
```javascript
// 間違った例
const newState = this._state;
newState.someProperty = 'new value'; // 元の状態も変更される

// 正しい例
const newState = { ...this._state };
newState.someProperty = 'new value'; // 元の状態は変更されない

// ネストされたオブジェクトの場合
const newState = JSON.parse(JSON.stringify(this._state)); // ディープコピー
```
