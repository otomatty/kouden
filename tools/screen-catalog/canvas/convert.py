"""画面カタログ（dist/）を Claude のデザインキャンバスのアートボードに変換する。

使い方（tools/screen-catalog で）:
    python3 -I canvas/convert.py --dist dist --heights canvas/.work/heights.json \
        --assets canvas/assets.json --out canvas/.work/project [--canvas <今の canvas.json>]

- 1 状態につき PC（1280px）とスマホ（390px）の 2 枚の .dc.html を --out に書く
- --out/canvas.json（キャンバスの索引）を書く。--canvas を渡すと createdOnFiles をそこから引き継ぐ
- 画面構成（Main.dc.html）は書かない。canvas/Main.dc.html を --out に写し、状態の数を手で直す

必要なもの: Python 3、beautifulsoup4
"""

import argparse
import base64
import datetime
import json
import os
import re

from bs4 import BeautifulSoup

ap = argparse.ArgumentParser()
ap.add_argument("--dist", required=True, help="bun run catalog の出力（index.html と screens/）")
ap.add_argument("--heights", required=True, help="canvas/measure.mjs の出力")
ap.add_argument("--assets", required=True, help="アップロード済みの CSS・画像の /_blob/ の URL（canvas/assets.json）")
ap.add_argument("--out", required=True, help="キャンバスの project/ にあたるフォルダ")
ap.add_argument("--canvas", help="今のキャンバスの canvas.json（createdOnFiles を引き継ぐ）")
args = ap.parse_args()

heights = json.load(open(args.heights))
assets = json.load(open(args.assets))
idx = open(os.path.join(args.dist, "index.html")).read()
data = json.loads(re.search(r'type="application/json">\s*(.*?)\s*</script>', idx, re.S).group(1))
os.makedirs(args.out, exist_ok=True)

CSS = {"app": assets["app.css"], "admin": assets["admin.css"]}
FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&amp;display=swap">'
# 中身のない真偽の属性（checked="" など）は、キャンバスの実行環境で偽と読まれるので名前を値にする
BOOL = {"checked", "selected", "disabled", "open", "required", "readonly", "multiple", "novalidate"}
# 画面の動き（htmx・リアルタイム更新）のための属性。キャンバスでは使わない
DROP = {
    "data-live", "data-live-url", "data-editing-entity", "data-editing-id", "data-editing-target",
    "data-live-watch", "data-requires-online", "data-connection", "data-presence",
}
DEV = {"pc": ("PC", 1280), "sp": ("スマホ", 390)}


def board_name(screen, state, dev):
    return f"{screen}--{state}.{dev}.dc.html"


def convert(file, dev, title, app):
    soup = BeautifulSoup(open(os.path.join(args.dist, "screens", file)).read(), "html.parser")
    body = soup.body
    for t in body.find_all("script"):
        t.decompose()
    # 開いた時点で隠れているもの（通信が切れたときの表示など）は出さない
    for t in body.find_all(attrs={"hidden": True}):
        t.decompose()
    for t in body.find_all(True):
        for a in list(t.attrs):
            if a.startswith("hx-") or a in DROP:
                del t[a]
            elif a in BOOL and t[a] == "":
                t[a] = a
        if t.name == "a":
            # 画面カタログが張り替えたリンクを、キャンバスのアートボードへのリンクにする（Play で移れる）
            if t.has_attr("data-kc-screen"):
                t["href"] = board_name(t["data-kc-screen"], t["data-kc-state"], dev)
                del t["data-kc-screen"], t["data-kc-state"]
            elif t.has_attr("data-kc-dead"):
                t["href"] = "#"
                del t["data-kc-dead"]
        if t.name == "img" and t.get("src", "").startswith("data:"):
            svg = base64.b64decode(t["src"].split(",", 1)[1]).decode()
            t["src"] = assets["qr.svg"] if "29 29" in svg else assets["photo-placeholder.svg"]
        if t.name == "form":
            t.attrs.pop("action", None)
            t["onSubmit"] = "{{ prevent }}"
    cls = " ".join(body.get("class", []))
    inner = "".join(str(c) for c in body.contents).strip()
    assert "{{" not in inner.replace("{{ prevent }}", ""), file
    assert "data:" not in inner, file
    h = max(heights[file][dev], 200)
    label, w = DEV[dev]
    return h, f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>{title}（{label}）</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="{CSS[app]}">
</head>
<body>
<x-dc>
<helmet>
{FONT}
<style>
body{{margin:0}}
</style>
</helmet>
<div class="{cls}">
{inner}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{ prevent: (e) => e.preventDefault() }};
}}
}}
</script>
</body>
</html>
"""


# 区分ごとにページを分け、1 行 = 1 画面、状態を左から PC・スマホの順に並べる
GAP, ROWGAP, NOTE = 80, 120, 300
boards = {
    "Main.dc.html": {"x": 0, "y": 0, "w": 1600, "h": 1440, "title": "画面構成", "page": "overview", "is_interactive": True}
}
order = ["Main.dc.html"]
notes = {}
pages = [{"id": "overview", "name": "画面構成"}]
for g in data["groups"]:
    pages.append({"id": g["id"], "name": g["title"]})
    y = NOTE
    for s in g["screens"]:
        x = 0
        row_h = 0
        for st in s["states"]:
            file = os.path.basename(st["file"])
            for dev in ("pc", "sp"):
                name = board_name(s["id"], st["id"], dev)
                h, html = convert(file, dev, f'{s["title"]}・{st["label"]}', s["app"])
                open(os.path.join(args.out, name), "w").write(html)
                w = DEV[dev][1]
                boards[name] = {
                    "x": x, "y": y, "w": w, "h": h, "title": f'{st["label"]}（{DEV[dev][0]}）',
                    "page": g["id"], "expand": "fill", "is_interactive": True,
                }
                order.append(name)
                x += w + GAP
                row_h = max(row_h, h)
        path = ("admin.kouden.app " if s["app"] == "admin" else "") + s["path"]
        notes[f't-{s["id"]}'] = {
            "x": 0, "y": y - 250, "text": f'{s["title"]}　{path}', "kind": "title1",
            "maxW": max(x - GAP, 1750), "page": g["id"],
        }
        lines = [s["description"], "", f'見られる人: {s["access"]}', "", "状態:"]
        lines += [f'・{st["label"]}' + (f'：{st["note"]}' if st["note"] else "") for st in s["states"]]
        notes[f'n-{s["id"]}'] = {"x": -560, "y": y, "w": 460, "text": "\n".join(lines), "page": g["id"], "color": "gray"}
        y += row_h + ROWGAP + NOTE

created = (
    json.load(open(args.canvas))["createdOnFiles"]
    if args.canvas
    else {"v": 1, "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
)
canvas = {
    "v": 3,
    "createdOnFiles": created,
    "title": "香典帳 画面一覧",
    "launch": {"view": "canvas", "page": "overview"},
    "pages": pages,
    "boards": boards,
    "order": order,
    "notes": notes,
    "designSystems": [],
}
json.dump(canvas, open(os.path.join(args.out, "canvas.json"), "w"), ensure_ascii=False, indent=1)
print(f"{len(boards)} boards, {len(notes)} notes -> {args.out}")
