# API リファレンス

## 基本情報

- **ベースURL**: `/api/v1`
- **認証**: 現在は不要（必要に応じて実装予定）
- **レスポンス形式**: JSON

## エンドポイント一覧

### 1. シナリオの生成

新しいシナリオを生成します。

- **URL**: `/scenarios/generate`
- **メソッド**: `POST`
- **リクエストボディ**:
  ```json
  {
    "theme": "ファンタジー",
    "keywords": ["魔法", "冒険", "ドラゴン"],
    "length": 5
  }
  ```
  
  | パラメータ | 型 | 必須 | 説明 |
  |------------|----|------|------|
  | `theme` | string | はい | シナリオのテーマ |
  | `keywords` | string[] | いいえ | シナリオに含めるキーワード |
  | `length` | integer | いいえ | シナリオの長さ（デフォルト: 5） |

- **成功時のレスポンス (200 OK)**:
  ```json
  {
    "id": "scenario_123",
    "title": "魔法の冒険",
    "description": "ドラゴンを倒すための冒険が始まります...",
    "created_at": "2025-08-09T11:30:00Z",
    "scenes": [
      {
        "id": "scene_1",
        "title": "はじまりの村",
        "content": [
          {"type": "text", "value": "あなたは小さな村の住人です。"}
        ],
        "is_final": false,
        "actions": [
          {"text": "村を出る", "next_scene_id": "scene_2"},
          {"text": "村に残る", "next_scene_id": "scene_3"}
        ]
      }
    ]
  }
  ```

### 2. シナリオの取得

特定のシナリオを取得します。

- **URL**: `/scenarios/{scenario_id}`
- **メソッド**: `GET`
- **パスパラメータ**:
  - `scenario_id`: 取得するシナリオのID

- **成功時のレスポンス (200 OK)**:
  ```json
  {
    "id": "scenario_123",
    "title": "魔法の冒険",
    "description": "ドラゴンを倒すための冒険が始まります...",
    "created_at": "2025-08-09T11:30:00Z",
    "scenes": [...]
  }
  ```

### 3. シナリオの更新

シナリオの状態を更新します。

- **URL**: `/scenarios/{scenario_id}`
- **メソッド**: `PUT`
- **パスパラメータ**:
  - `scenario_id`: 更新するシナリオのID
- **リクエストボディ**:
  ```json
  {
    "current_scene_id": "scene_2",
    "inventory": ["剣", "盾"],
    "flags": {"hasMetWizard": true}
  }
  ```

- **成功時のレスポンス (200 OK)**:
  ```json
  {
    "next_scene": {
      "id": "scene_2",
      "title": "森の入り口",
      "content": [
        {"type": "text", "value": "森の入り口に着きました。"}
      ],
      "is_final": false,
      "actions": [...]
    }
  }
  ```

### 4. シナリオ一覧の取得

保存されているシナリオの一覧を取得します。

- **URL**: `/scenarios`
- **メソッド**: `GET`
- **クエリパラメータ**:
  - `limit`: 取得する最大数（デフォルト: 10）
  - `offset`: 取得開始位置（デフォルト: 0）

- **成功時のレスポンス (200 OK)**:
  ```json
  {
    "scenarios": [
      {
        "id": "scenario_123",
        "title": "魔法の冒険",
        "description": "ドラゴンを倒すための冒険が始まります...",
        "created_at": "2025-08-09T11:30:00Z"
      },
      ...
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
  ```

## エラーレスポンス

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 404 Not Found
```json
{
  "detail": "Scenario not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## データモデル

### Scenario
| フィールド | 型 | 説明 |
|------------|----|------|
| id | string | シナリオの一意識別子 |
| title | string | シナリオのタイトル |
| description | string | シナリオの説明 |
| created_at | string | 作成日時 (ISO 8601) |
| updated_at | string | 更新日時 (ISO 8601) |
| scenes | Scene[] | シーンの配列 |

### Scene
| フィールド | 型 | 説明 |
|------------|----|------|
| id | string | シーンの一意識別子 |
| title | string | シーンのタイトル |
| content | Content[] | コンテンツの配列 |
| is_final | boolean | 最終シーンかどうか |
| actions | Action[] | アクションの配列 |

### Content
| フィールド | 型 | 説明 |
|------------|----|------|
| type | enum | 'text' または 'image' |
| value | string | テキストまたは画像URL |

### Action
| フィールド | 型 | 説明 |
|------------|----|------|
| text | string | アクションの表示テキスト |
| next_scene_id | string | 遷移先のシーンID |
| conditions | Condition[] | 条件の配列（オプション） |

### Condition
| フィールド | 型 | 説明 |
|------------|----|------|
| type | string | 条件のタイプ |
| key | string | 条件のキー |
| value | any | 条件の値 |
