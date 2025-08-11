from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import re
import uuid
import os
from pathlib import Path

app = FastAPI()

# テンプレートディレクトリの設定
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# 静的ファイルのマウント
static_dir = BASE_DIR / "static"
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# エディタページのルート（管理者用）
@app.get("/editor", response_class=HTMLResponse)
async def editor_page(request: Request):
    # ここに管理者認証を追加することをお勧めします
    # 例: セッションやトークンによる認証
    return templates.TemplateResponse("editor.html", {
        "request": request,
        "is_admin": True  # 認証が完了している場合
    })

# メインページ
# 全ストーリーを取得するAPIエンドポイント
@app.get("/api/v1/stories")
async def get_all_stories():
    # メモリから全シナリオを取得（本番ではデータベースから取得）
    all_stories = list(scenarios_db.values())
    # 最終更新日でソート（新しい順）
    all_stories.sort(key=lambda x: x.get('last_updated', ''), reverse=True)
    return {"stories": all_stories}

# 新着ストーリーを取得するAPIエンドポイント
@app.get("/api/v1/stories/latest")
async def get_latest_stories():
    # メモリから最新のシナリオを取得（本番ではデータベースから取得）
    all_stories = list(scenarios_db.values())
    # 最終更新日でソート（新しい順）
    all_stories.sort(key=lambda x: x.get('last_updated', ''), reverse=True)
    latest_stories = all_stories[:5]  # 最新5件を取得
    return {"stories": latest_stories}

# トップページ - 新着ストーリーを表示
# ストーリー一覧ページ
@app.get("/stories", response_class=HTMLResponse)
async def stories_page(request: Request):
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>NovelGenPage - ストーリー一覧</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <header>
            <h1>NovelGenPage</h1>
            <nav>
                <a href="/">ホーム</a>
                <a href="/stories" class="active">ストーリー一覧</a>
                <a href="/editor" class="admin-link">エディタ（管理者用）</a>
            </nav>
        </header>
        <main>
            <h2>ストーリー一覧</h2>
            <div id="stories-list" class="stories-grid">
                <p>読み込み中...</p>
            </div>
        </main>
        <script>
            // ストーリー一覧を取得して表示
            async function loadStories() {
                try {
                    const response = await fetch('/api/v1/stories');
                    const data = await response.json();
                    const container = document.getElementById('stories-list');
                    
                    if (data.stories && data.stories.length > 0) {
                        container.innerHTML = data.stories.map(story => `
                            <div class="story-card">
                                <h3>${story.title || '無題のストーリー'}</h3>
                                <p>${story.description || '説明なし'}</p>
                                <p class="meta">最終更新: ${new Date(story.last_updated).toLocaleString()}</p>
                                <a href="/story/${story.id}" class="button">読む</a>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = '<p>ストーリーがありません</p>';
                    }
                } catch (error) {
                    console.error('ストーリーの読み込みに失敗しました:', error);
                    document.getElementById('stories-list').innerHTML = 
                        '<p>ストーリーの読み込みに失敗しました</p>';
                }
            }
            
            // ページ読み込み時にストーリーを読み込む
            document.addEventListener('DOMContentLoaded', loadStories);
        </script>
    </body>
    </html>
    """

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>NovelGenPage - 新着ストーリー</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <header>
            <h1>NovelGenPage</h1>
            <nav>
                <a href="/">ホーム</a>
                <a href="/stories">ストーリー一覧</a>
                <a href="/editor" class="admin-link">エディタ（管理者用）</a>
            </nav>
        </header>
        <main>
            <h2>新着ストーリー</h2>
            <div id="latest-stories" class="stories-grid">
                <p>読み込み中...</p>
            </div>
        </main>
        <script>
            // 新着ストーリーを取得して表示
            async function loadLatestStories() {
                try {
                    const response = await fetch('/api/v1/stories/latest');
                    const data = await response.json();
                    const container = document.getElementById('latest-stories');
                    
                    if (data.stories && data.stories.length > 0) {
                        container.innerHTML = data.stories.map(story => `
                            <div class="story-card">
                                <h3>${story.title || '無題のストーリー'}</h3>
                                <p>${story.scenes?.length || 0} シーン</p>
                                <a href="/story/${story.id}" class="button">読む</a>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = '<p>新着ストーリーはありません</p>';
                    }
                } catch (error) {
                    console.error('ストーリーの読み込みに失敗しました:', error);
                    document.getElementById('latest-stories').innerHTML = 
                        '<p>ストーリーの読み込みに失敗しました</p>';
                }
            }
            
            // ページ読み込み時にストーリーを読み込む
            document.addEventListener('DOMContentLoaded', loadLatestStories);
        </script>
    </body>
    </html>
    """

# データモデル
class ImportRequest(BaseModel):
    title: str
    content: str

class ContentItem(BaseModel):
    type: str
    value: str

class Action(BaseModel):
    text: str
    next_scene_id: str
    conditions: Optional[List[Dict]] = None

class Scene(BaseModel):
    id: str
    title: str
    content: List[ContentItem]
    is_final: bool = False
    actions: List[Action]

class ScenarioResponse(BaseModel):
    id: str
    title: str
    scenes: List[Scene]

# シナリオをメモリに保存（本番ではデータベースを使用）
scenarios_db = {}

@app.post("/api/v1/scenarios/import", response_model=ScenarioResponse)
async def import_scenario(request: ImportRequest):
    try:
        scenes = parse_markdown(request.content)
        if not scenes:
            raise ValueError("有効なシナリオが見つかりませんでした")
            
        scenario_id = f"scenario_{str(uuid.uuid4())[:8]}"
        
        scenario = {
            "id": scenario_id,
            "title": request.title or "無題のシナリオ",
            "scenes": [scene.dict() for scene in scenes]  # Pydanticモデルを辞書に変換
        }
        
        # メモリに保存（本番ではデータベースに保存）
        scenarios_db[scenario_id] = scenario
        
        return scenario
    except Exception as e:
        print(f"Error importing scenario: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/scenarios", response_model=ScenarioResponse)
async def create_scenario(scenario: ScenarioResponse):
    try:
        scenario_dict = scenario.dict()
        scenario_id = scenario_dict["id"]
        scenarios_db[scenario_id] = scenario_dict
        print(f"Scenario saved: {scenario_id}")
        return scenario_dict
    except Exception as e:
        print(f"Error saving scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save scenario: {str(e)}")

@app.get("/api/v1/scenarios/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: str):
    if scenario_id not in scenarios_db:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenarios_db[scenario_id]

# マークダウンパーサー
def parse_markdown(content: str) -> List[Scene]:
    scenes = []
    scene_blocks = re.split(r'\n##\s+', content.strip())
    
    if not scene_blocks:
        return []
        
    # 最初のブロックはタイトルとして処理
    first_block = scene_blocks[0].strip()
    if first_block:
        title = first_block.split('\n', 1)[0].strip('#').strip()
        # 最初のシーンを追加
        scenes.append(create_scene("1", title, first_block))
    
    # 残りのシーンを処理
    for i, block in enumerate(scene_blocks[1:], 2):
        scene_id = str(i)
        title = block.split('\n', 1)[0].strip()
        scenes.append(create_scene(scene_id, title, block))
    
    return scenes

def create_scene(scene_id: str, title: str, content: str) -> Scene:
    # 本文と選択肢を分離
    parts = re.split(r'\n###+\s+選択肢\s*\n', content, flags=re.IGNORECASE)
    body = parts[0].split('\n', 1)[1] if '\n' in parts[0] else ""
    
    # アクションを抽出
    actions = []
    if len(parts) > 1:
        action_lines = parts[1].strip().split('\n')
        for line in action_lines:
            match = re.match(r'-\s*\[(.*?)\]\(scene:(\d+)\)', line.strip())
            if match:
                text, next_scene = match.groups()
                actions.append({
                    "text": text,
                    "next_scene_id": f"scene_{next_scene}",
                    "conditions": []
                })
    
    return {
        "id": f"scene_{scene_id}",
        "title": title,
        "content": [{"type": "text", "value": body.strip()}],
        "is_final": not bool(actions),  # アクションがない場合は最終シーンとみなす
        "actions": actions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)