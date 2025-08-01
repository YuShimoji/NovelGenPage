import json
import os
from datetime import datetime

GAMES_DIR = "games"
ARCHIVE_LIST_PATH = os.path.join(GAMES_DIR, "archive_list.json")

def get_archive_list():
    if not os.path.exists(ARCHIVE_LIST_PATH):
        return []
    with open(ARCHIVE_LIST_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_scenario(game_data: dict):
    game_id = game_data.get("game_id", "default_game_id")
    file_path = os.path.join(GAMES_DIR, f"{game_id}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(game_data, f, ensure_ascii=False, indent=4)
    update_archive_list(game_data)

def update_archive_list(game_data: dict):
    archive_list = get_archive_list()
    game_id = game_data.get("game_id")
    title = game_data.get("title")
    description = game_data.get("description")
    
    # Check if game_id already exists and update it
    for item in archive_list:
        if item.get("game_id") == game_id:
            item["title"] = title
            item["description"] = description
            item["last_updated"] = datetime.now().isoformat()
            break
    else: # If not found, add a new entry
        archive_list.append({
            "game_id": game_id,
            "title": title,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        })

    with open(ARCHIVE_LIST_PATH, 'w', encoding='utf-8') as f:
        json.dump(archive_list, f, ensure_ascii=False, indent=4)