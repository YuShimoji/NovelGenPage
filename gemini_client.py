import os
import google.generativeai as genai
import json
from dotenv import load_dotenv
import sys

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# カレントディレクトリをモジュール検索パスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 相対パスでインポート
from app.novelgenscript_parser import NovelGenScriptParser

def generate_scenario_from_prompt(theme: str, keywords: str) -> dict:
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        with open("docs/prompt_template.md", "r", encoding="utf-8") as f:
            prompt_template = f.read()
        
        prompt = prompt_template.replace("{{theme}}", theme).replace("{{keywords}}", keywords)
        
        response = model.generate_content(prompt)

        # モデルからの応答を取得
        script_content = response.text.strip()
        
        # コードブロックがあれば除去（```で囲まれた部分）
        if script_content.startswith('```'):
            script_content = '\n'.join(script_content.split('\n')[1:-1])
        
        # NovelGenScriptパーサーでスクリプトを解析
        parser = NovelGenScriptParser()
        parsed_data = parser.parse(script_content)
        
        # メタデータを追加
        parsed_data['title'] = f"{theme} - {keywords}"
        parsed_data['theme'] = theme
        parsed_data['keywords'] = keywords
        
        return parsed_data
        
    except Exception as e:
        # エラーをログに記録
        print(f"Error generating scenario: {e}")
        # 呼び出し元で処理できるように例外を再送出
        raise