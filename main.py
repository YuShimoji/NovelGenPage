from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import os
import uuid
from gemini_client import generate_scenario_from_prompt
from scenario_handler import save_scenario, get_archive_list, update_archive_list

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/games", StaticFiles(directory="games"), name="games")

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# ルートディレクトリのHTMLファイルを提供するためのルートを個別に定義
@app.get("/game.html")
async def read_game_html():
    return FileResponse('static/game.html')

@app.get("/archive.html")
async def read_archive_html():
    return FileResponse('archive.html')

@app.get("/how-to-play.html")
async def read_how_to_play_html():
    return FileResponse('how-to-play.html')

@app.get("/privacy-policy.html")
async def read_privacy_policy_html():
    return FileResponse('privacy-policy.html')

@app.get("/scenario-editor.html")
async def read_scenario_editor_html():
    return FileResponse('scenario-editor.html')

class StoryPrompt(BaseModel):
    prompt: str

@app.post("/api/generate")
async def generate_story(prompt: StoryPrompt):
    try:
        # Gemini APIを使用してシナリオを生成
        game_data = generate_scenario_from_prompt(prompt.prompt)
        
        # ゲームIDが設定されていない場合は生成
        if not game_data.get("game_id"):
            game_data['game_id'] = str(uuid.uuid4())
        
        # シナリオを保存し、アーカイブリストを更新
        save_scenario(game_data)
        
        return JSONResponse(content=game_data, media_type="application/json; charset=utf-8")
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

class GameData(BaseModel):
    game_id: str
    title: str
    theme: str
    description: str
    published: bool = False
    characters: List[Dict[str, Any]] = Field(default_factory=list)
    inventory: List[Dict[str, Any]] = Field(default_factory=list)
    flags: Dict[str, Any] = Field(default_factory=dict)
    steps: List[Dict[str, Any]]

@app.post("/api/update_scenario")
async def update_scenario(game_data: GameData):
    game_id = game_data.game_id
    file_path = f"games/{game_id}.json"

    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "Game not found"}, status_code=404)

    try:
        # シナリオを保存し、アーカイブリストを更新
        save_scenario(game_data.dict())
        
        return JSONResponse(content={"message": "Scenario updated successfully"})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/stories")
async def get_stories():
    try:
        stories = get_archive_list()
        return JSONResponse(content=stories)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/scenario/{game_id}")
async def get_scenario(game_id: str):
    file_path = f"games/{game_id}.json"
    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "Game not found"}, status_code=404)
    return FileResponse(file_path, media_type="application/json; charset=utf-8")

# このキャッチオールルートは、他のどのルートにも一致しない場合にのみ機能させるため、最後に配置することが重要です。
# しかし、FastAPIでは定義順に評価されるため、意図しない動作を引き起こす可能性があります。
# 代わりに、必要なHTMLページのルートを明示的に定義する方が安全です。
# 以下のルートはコメントアウトまたは削除を推奨します。
# @app.get("/{file_path:path}")
# async def read_root_files(file_path: str):
#     file = os.path.join(os.getcwd(), file_path)
#     if os.path.exists(file) and file_path.endswith('.html'):
#         return FileResponse(file)
#     return JSONResponse(content={"error": "File not found"}, status_code=404)
@app.get("/{file_path:path}")
async def read_root_files(file_path: str):
    file = os.path.join(os.getcwd(), file_path)
    if os.path.exists(file) and file_path.endswith('.html'):
        return FileResponse(file)
    return JSONResponse(content={"error": "File not found"}, status_code=404)