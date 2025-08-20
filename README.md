# NovelGenPage

![CI](https://github.com/your-username/NovelGenPage/actions/workflows/ci.yml/badge.svg)

インタラクティブな物語生成・プレイプラットフォームです。AIを活用して動的な物語を生成し、ユーザーは選択肢を通じて物語の進行に影響を与えることができます。

## 特徴

- 🎭 AIを活用した動的な物語生成
- 🎮 インタラクティブな物語体験
- 📱 レスポンシブデザイン
- 💾 進行状況の自動保存
- 🎨 カスタマイズ可能なキャラクターと設定

## ドキュメント

- [アーキテクチャ概要](./ARCHITECTURE.md) - システムのアーキテクチャとデータフロー
- [開発ガイド](./DEVELOPMENT.md) - 開発環境のセットアップと実行方法
- [APIリファレンス](./API_REFERENCE.md) - APIの詳細な仕様

## システム要件

- Python 3.8+
- Node.js 16+
- Google Gemini API キー

## クイックスタート

1. リポジトリをクローン
   ```bash
   git clone https://github.com/your-username/NovelGenPage.git
   cd NovelGenPage
   ```

2. バックエンドのセットアップ
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # .env を編集して API キーを設定
   ```

3. フロントエンドのセットアップ
   ```bash
   cd static
   npm install
   cd ..
   ```

4. アプリケーションの起動
   ```bash
   # バックエンドサーバー
   uvicorn main:app --reload
   
   # 別のターミナルでフロントエンド
   cd static
   npm run dev
   ```

5. ブラウザでアプリケーションにアクセス:
   - バックエンドのみの場合は: `http://localhost:8000`
   - フロントエンド開発サーバーを使用する場合は: `http://localhost:3000` (APIリクエストは8000番ポートにプロキシされます)


## CI（GitHub Actions）

- このリポジトリには GitHub Actions による CI が設定されています（`.github/workflows/ci.yml`）。
- Node.js 20 上で `npm ci` を実行し、Jest テスト（`npm test -- --runInBand --verbose`）を自動で実行します。
- プルリクエスト/プッシュで自動的に起動し、テスト結果がバッジとチェックとして表示されます。

