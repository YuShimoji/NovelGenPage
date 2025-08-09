import re
import json

class NovelGenScriptParser:
    """
    NovelGen-Script形式のテキストを解析し、JSON構造に変換するパーサー。
    """

    # 各種記法を解析するための正規表現
    COMMAND_RE = re.compile(r'\[(\w+):\s*(.+)\]')
    IMAGE_RE = re.compile(r'!\[(.*?)\]\((.*?)\)')
    ITEM_FLAG_COMMAND_RE = re.compile(r'(\w+)\((.+)\)')

    def _parse_line(self, line):
        """1行を解析して対応するオブジェクトを返す"""
        line = line.strip()

        if not line or line.startswith('#'):
            return None  # 空行やコメントは無視

        # 画像の解析
        image_match = self.IMAGE_RE.match(line)
        if image_match:
            return {"type": "image", "alt": image_match.group(1), "src": image_match.group(2)}

        # コマンドの解析
        command_match = self.COMMAND_RE.match(line)
        if command_match:
            command_type = command_match.group(1).lower()
            value = command_match.group(2).strip()

            if command_type == 'item' or command_type == 'flag':
                sub_match = self.ITEM_FLAG_COMMAND_RE.match(value)
                if sub_match:
                    action = sub_match.group(1).lower()
                    name = sub_match.group(2)
                    return {"type": command_type, "action": action, "value": name}
            elif command_type == 'action':
                return {"type": "action", "value": value}
            
            return None # 不明なコマンドは無視

        # テキストの装飾をHTMLタグに変換
        line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
        line = re.sub(r'\*(.*?)\*', r'<em>\1</em>', line)

        return {"type": "text", "value": line}

    def parse(self, script_text):
        """
        スクリプト全体を解析して、シーンのリストを含むJSON構造を返す
        """
        scenes_data = []
        # "---"でシーンを分割
        scenes_text = script_text.strip().split('\n---\n')

        for scene_text in scenes_text:
            scene_content = []
            lines = scene_text.strip().split('\n')
            for line in lines:
                parsed_obj = self._parse_line(line)
                if parsed_obj:
                    scene_content.append(parsed_obj)
            
            if scene_content:
                scenes_data.append({"content": scene_content})

        return {"scenes": scenes_data}

# テスト実行用のコード
if __name__ == '__main__':
    sample_script = """
# ゲーム開始
あなたは古い城の前に立っている。
目の前には、重厚な木の扉がある。

![城の扉](https://example.com/images/door.jpg)

[action: 扉を調べる]

---

# 扉のシーン
扉には鍵がかかっているようだ。よく見ると、**光る何か**が落ちている。

[item: get(古びた鍵)]

[action: 鍵を使って扉を開ける]

---

# 城の内部
城の中はひんやりとしていて、薄暗い。
*どこからか物音が聞こえる...*

[flag: set(城に侵入した)]

[action: 奥へ進む]
"""

    parser = NovelGenScriptParser()
    parsed_data = parser.parse(sample_script)
    print(json.dumps(parsed_data, indent=2, ensure_ascii=False))
