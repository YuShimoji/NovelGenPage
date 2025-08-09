# 開発ガイド

## 環境構築

### 必要なツール
- Python 3.8+
- Node.js 16+
- npm または yarn
- Git

### セットアップ手順

1. リポジトリのクローン
   ```bash
   git clone https://github.com/your-username/NovelGenPage.git
   cd NovelGenPage
   ```

2. バックエンドのセットアップ
   ```bash
   # 仮想環境の作成と有効化
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   
   # 依存関係のインストール
   pip install -r requirements.txt
   
   # 環境変数の設定 (.env ファイルを作成)
   cp .env.example .env
   # .env を編集して必要な設定を追加
   ```

3. フロントエンドのセットアップ
   ```bash
   cd static
   npm install
   cd ..
   ```

## 開発サーバーの起動

### バックエンドサーバー
```bash
# 仮想環境が有効になっていることを確認
uvicorn main:app --reload
```

### フロントエンド開発サーバー
```bash
cd static
npm run dev
```

## テストの実行

### バックエンドテスト
```bash
pytest
```

### フロントエンドテスト
```bash
cd static
npm test
```

## コーディング規約

### コードスタイル
- Python: PEP 8 に準拠
- JavaScript: ESLint + Prettier を使用
- コミット前の自動フォーマットを推奨

### ブランチ戦略
- `main`: 本番環境用
- `develop`: 開発用メインブランチ
- `feature/*`: 新機能開発
- `bugfix/*`: バグ修正
- `hotfix/*`: 緊急修正

### コミットメッセージ
以下の形式に従ってください：
```
<type>(<scope>): <subject>
<空行>
[optional body]
<空行>
[optional footer(s)]
```

**タイプ一覧**:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメントの変更
- style: コードの意味に影響を与えない変更（フォーマットなど）
- refactor: バグ修正や機能の追加を行わないコードの変更
- perf: パフォーマンスを向上させるコード変更
- test: 不足しているテストの追加や既存のテストの修正
- chore: ビルドプロセスやドキュメント生成などの補助ツールやライブラリの変更

## デプロイ

### 本番環境
```bash
# 本番用ビルド
cd static
npm run build
cd ..

# 本番サーバー起動
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 環境変数
| 変数名 | 説明 | 必須 | デフォルト |
|--------|------|------|------------|
| `GEMINI_API_KEY` | Google Gemini APIキー | はい | - |
| `DATABASE_URL` | データベース接続URL | いいえ | sqlite:///./test.db |
| `DEBUG` | デバッグモード | いいえ | False |

## トラブルシューティング

### バックエンドが起動しない
- 仮想環境が有効になっているか確認
- 必要な環境変数が設定されているか確認
- ポートが使用中でないか確認

### フロントエンドでエラーが発生する
- 依存関係が正しくインストールされているか確認
- ブラウザの開発者ツールでエラーを確認
- キャッシュをクリアして再読み込み

## 貢献方法
1. イシューを作成して変更の提案
2. 機能ブランチを作成 (`feature/your-feature`)
3. 変更をコミットしてプッシュ
4. プルリクエストを作成
