import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_scenario_from_prompt(prompt: str) -> dict:
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(f"""
あなたはプロのゲームシナリオライターです。以下のプロンプトに基づいて、JSON形式のアドベンチャーゲームのシナリオを作成してください。

**プロンプト:**
{prompt}

**JSONフォーマットの仕様:**
- `game_id`: ゲームの一意なID（例: "new_game"）。
- `title`: ゲームのタイトル。
- `theme`: ゲームのテーマ。
- `description`: ゲームの簡単な説明。
- `inventory`: (オプション) ゲーム開始時のプレイヤーの持ち物リスト。
- `flags`: (オプション) ゲームの状態を管理するフラグの初期値（キーと値のペア）。
- `steps`: ゲームの進行ステップを格納する配列。
  - `step_id`: 各ステップの一意なID（例: "step_1"）。
  - `text_content`: そのステップの状況説明。
  - `actions`: プレイヤーの選択肢を格納する配列。
    - `text`: 選択肢のテキスト。
    - `next_step_id`: その選択肢を選んだ場合の次のステップのID。
  - `conditions`: (オプション) この選択肢が表示されるための条件。
    - `inventory_has`: (オプション) プレイヤーが持っている必要があるアイテム。
    - `flag_is`: (オプション) 特定のフラグが特定の値である必要がある場合に指定（例: `{{\"flag_name\": \"door_unlocked\", \"value\": true}}`）。
  - `actions_on_enter`: (オプション) このステップに入った時に実行されるアクション。
    - `type`: アクションの種類（`add_to_inventory`または`set_flag`）。
    - `item`: (add_to_inventoryの場合) 追加するアイテム。
    - `flag_name`: (set_flagの場合) 設定するフラグの名前。
    - `value`: (set_flagの場合) 設定するフラグの値。
  - `is_final`: (オプション) このステップが最終ステップかどうかを示すブール値。
  - `clear_message`: (オプション) ゲームクリア時のメッセージ。

**出力例:**
```json
{{
    "game_id": "sample_game",
    "title": "書斎の謎",
    "theme": "脱出ゲーム",
    "description": "古い書斎からの脱出を目指す。",
    "steps": [
        {{
            "step_id": "step_1",
            "text_content": "あなたは書斎にいる。机の上にメモがある。",
            "actions": [
                {{
                    "text": "メモを読む",
                    "next_step_id": "step_2"
                }},
                {{
                    "text": "部屋を見渡す",
                    "next_step_id": "step_1_look_around"
                }}
            ]
        }},
        {{
            "step_id": "step_1_look_around",
            "text_content": "部屋は豪華な装飾で、壁には風景画が飾られている。机以外に特にめぼしいものはないようだ。",
            "actions": [
                {{
                    "text": "机の上のメモを読む",
                    "next_step_id": "step_2"
                }}
            ]
        }},
        {{
            "step_id": "step_2",
            "text_content": "メモには「壁の絵画を見よ」とある。",
            "actions": [
                {{
                    "text": "絵画を調べる",
                    "next_step_id": "step_3"
                }}
            ]
        }},
        {{
            "step_id": "step_3",
            "text_content": "絵画の裏に鍵があった。",
            "actions": [
                {{
                    "text": "鍵で引き出しを開ける",
                    "next_step_id": "step_4"
                }}
            ]
        }},
        {{
            "step_id": "step_4",
            "text_content": "引き出しからドライバーを見つけ、扉を開けて脱出した。",
            "actions": [],
            "is_final": true,
            "clear_message": "クリア！"
        }},
        {{
            "step_id": "final_step",
            "text_content": "引き出しからドライバーを見つけ、扉を開けて脱出した。",
            "actions": [],
            "is_final": true,
            "clear_message": "クリア！"
        }}
    ]
}}
```

**必ず上記のJSONフォーマットに従って出力してください。**
""")
        # The response from the model may contain markdown formatting, so we need to clean it up.
        cleaned_text = response.text.strip()
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith('```'):
            cleaned_text = cleaned_text[:-3]
        
        return json.loads(cleaned_text)
    except Exception as e:
        # It's better to log the error for debugging purposes.
        print(f"Error generating scenario: {e}")
        # Re-raise the exception to be handled by the caller.
        raise