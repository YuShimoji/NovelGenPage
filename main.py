from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, FileResponse
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
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# テンプレートディレクトリの設定
templates_dir = BASE_DIR / "templates"

# favicon.ico 互換: ブラウザが自動取得する /favicon.ico に対し、既存の SVG を返す
@app.get("/favicon.ico")
async def favicon_ico():
    svg_path = static_dir / "favicon.svg"
    if svg_path.exists():
        return FileResponse(path=str(svg_path), media_type="image/svg+xml")
    # 予備: 見つからない場合は 204 を返す
    return HTMLResponse(status_code=204, content="")

# ルートパス（/）のハンドラ
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "page_title": "NovelGenPage - ホーム"
    })

# 互換ルート: 旧URLを新URLにリダイレクト
@app.get("/scenario-editor.html")
async def legacy_scenario_editor():
    return RedirectResponse(url="/editor", status_code=307)

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
@app.get("/index.html", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "page_title": "NovelGenPage - 新着ストーリー"
    })

# 新しいゲーム作成ページ
@app.get("/new-game", response_class=HTMLResponse)
async def new_game_page(request: Request):
    return templates.TemplateResponse("new_game.html", {
        "request": request
    })

# ストーリー一覧ページ
@app.get("/stories", response_class=HTMLResponse)
async def stories_page(request: Request):
    return templates.TemplateResponse("stories.html", {
        "request": request
    })

# ストーリーモデル
class Story(BaseModel):
    id: str
    title: str
    description: str
    author: str
    created_at: str
    tags: List[str] = []
    play_count: int = 0
    rating: float = 0.0

# ダミーのストーリーデータ
DUMMY_STORIES = [
    Story(
        id="1",
        title="魔法の森の冒険",
        description="魔法の森に迷い込んだ主人公が、不思議な生き物たちと出会いながら元の世界に戻るための冒険を繰り広げます。",
        author="AIクリエイター",
        created_at="2023-01-01T12:00:00Z",
        tags=["ファンタジー", "冒険"],
        play_count=1245,
        rating=4.5
    ),
    Story(
        id="2",
        title="廃病院の謎",
        description="閉鎖された病院を探索中に起きた不可解な現象の謎を解き明かすホラーアドベンチャー。",
        author="AIクリエイター",
        created_at="2023-01-02T15:30:00Z",
        tags=["ホラー", "ミステリー"],
        play_count=987,
        rating=4.2
    ),
    Story(
        id="3",
        title="時をかける探偵",
        description="過去にタイムスリップした探偵が、未解決事件の真相に迫るタイムトラベルミステリー。",
        author="AIクリエイター",
        created_at="2023-01-03T09:15:00Z",
        tags=["ミステリー", "SF"],
        play_count=1567,
        rating=4.7
    )
]

# 全ストーリーを取得するAPIエンドポイント
@app.get("/api/v1/stories", response_model=List[Dict])
async def get_all_stories():
    # 実際のアプリではデータベースから取得
    return [story.dict() for story in DUMMY_STORIES]

# 新着ストーリーを取得するAPIエンドポイント
@app.get("/api/v1/stories/latest", response_model=Dict)
async def get_latest_stories(limit: int = 5):
    # 実際のアプリではデータベースから取得し、作成日でソート
    latest_stories = sorted(DUMMY_STORIES, key=lambda x: x.created_at, reverse=True)[:limit]
    return {"stories": [story.dict() for story in latest_stories]}

# ストーリーIDで取得するAPIエンドポイント
@app.get("/api/v1/stories/{story_id}", response_model=Dict)
async def get_story(story_id: str):
    # 実際のアプリではデータベースから取得
    for story in DUMMY_STORIES:
        if story.id == story_id:
            return story.dict()
    raise HTTPException(status_code=404, detail="Story not found")

# ゲーム生成APIエンドポイント
class GameGenerationRequest(BaseModel):
    theme: str
    keywords: str

@app.post("/api/v1/games/generate")
async def generate_game(request: GameGenerationRequest):
    # 実際のアプリではAIモデルを呼び出してゲームを生成
    # ここではダミーのレスポンスを返す
    import time
    time.sleep(1)  # 処理をシミュレート
    
    new_story = Story(
        id=str(len(DUMMY_STORIES) + 1),
        title=request.theme,
        description=f"これは「{request.theme}」をテーマにしたアドベンチャーゲームです。キーワード: {request.keywords}",
        author="あなた",
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        tags=[tag.strip() for tag in request.keywords.split(",") if tag.strip()],
        play_count=0,
        rating=0.0
    )
    
    # 実際のアプリではデータベースに保存
    DUMMY_STORIES.append(new_story)
    
    return {
        "success": True,
        "story_id": new_story.id,
        "message": "ゲームが正常に生成されました"
    }



# ストーリー一覧ページのルートは既に上で定義済みのため、この重複した定義を削除します

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