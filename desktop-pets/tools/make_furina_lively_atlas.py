from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(r"C:\Users\Administrator\Documents\PPT\furina-chibi-pet")
BASE_CELL = ROOT / "qa" / "v6-no-weapon" / "furina-v6-cell.png"
CELL_W = 192
CELL_H = 208
COLS = 8
ROWS = 9

ROW_SPECS = [
    ("idle", 6),
    ("running-right", 8),
    ("running-left", 8),
    ("waving", 4),
    ("jumping", 5),
    ("failed", 8),
    ("waiting", 6),
    ("running", 6),
    ("review", 6),
]


def clear_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for i in range(0, len(data), 4):
        if data[i + 3] == 0:
            data[i] = data[i + 1] = data[i + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def make_layers(base: Image.Image) -> tuple[Image.Image, Image.Image]:
    head = Image.new("RGBA", base.size, (0, 0, 0, 0))
    body = Image.new("RGBA", base.size, (0, 0, 0, 0))
    head_mask = Image.new("L", base.size, 0)
    body_mask = Image.new("L", base.size, 0)
    md = ImageDraw.Draw(head_mask)
    bd = ImageDraw.Draw(body_mask)
    md.rectangle((0, 0, CELL_W, 104), fill=255)
    md.rectangle((44, 84, 146, 122), fill=210)
    bd.rectangle((0, 88, CELL_W, CELL_H), fill=255)
    bd.rectangle((54, 78, 138, 108), fill=190)
    head.alpha_composite(base)
    body.alpha_composite(base)
    head.putalpha(Image.composite(base.getchannel("A"), Image.new("L", base.size, 0), head_mask))
    body.putalpha(Image.composite(base.getchannel("A"), Image.new("L", base.size, 0), body_mask))
    return head, body


def transform_layer(layer: Image.Image, angle: float = 0, dx: int = 0, dy: int = 0, sx: float = 1, sy: float = 1) -> Image.Image:
    box = layer.getbbox()
    if not box:
        return Image.new("RGBA", layer.size, (0, 0, 0, 0))
    crop = layer.crop(box)
    if sx != 1 or sy != 1:
        crop = crop.resize((max(1, int(crop.width * sx)), max(1, int(crop.height * sy))), Image.Resampling.BICUBIC)
    if angle:
        crop = crop.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    cx = (box[0] + box[2]) // 2 + dx
    cy = (box[1] + box[3]) // 2 + dy
    out.alpha_composite(crop, (cx - crop.width // 2, cy - crop.height // 2))
    return out


def compose(head: Image.Image, body: Image.Image, *, ha=0, hdx=0, hdy=0, ba=0, bdx=0, bdy=0, bsx=1, bsy=1) -> Image.Image:
    out = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    out.alpha_composite(transform_layer(body, ba, bdx, bdy, bsx, bsy))
    out.alpha_composite(transform_layer(head, ha, hdx, hdy))
    return clear_rgb(out)


def mirror(image: Image.Image) -> Image.Image:
    box = image.getbbox()
    if not box:
        return image.copy()
    crop = image.crop(box).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    out.alpha_composite(crop, ((CELL_W - crop.width) // 2, box[1]))
    return clear_rgb(out)


def blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    d.line((78, 76, 89, 76), fill=(34, 28, 58, 235), width=2)
    d.line((101, 76, 112, 76), fill=(34, 28, 58, 235), width=2)
    return out


def happy_blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    d.arc((76, 70, 91, 82), 15, 165, fill=(34, 28, 58, 235), width=2)
    d.arc((100, 70, 115, 82), 15, 165, fill=(34, 28, 58, 235), width=2)
    return out


def add_wait_mark(frame: Image.Image, step: int) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    x = 136
    y = 38 + [0, -2, -3, -2, 0, 1][step]
    color = (117, 218, 255, 210)
    d.arc((x, y, x + 18, y + 18), 205, 520, fill=color, width=3)
    d.line((x + 12, y + 15, x + 10, y + 23), fill=color, width=3)
    d.ellipse((x + 8, y + 27, x + 13, y + 32), fill=color)
    return out


def add_sweat(frame: Image.Image, step: int) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    x = 126 + step % 2
    y = 56 + step % 3
    d.ellipse((x, y, x + 8, y + 13), fill=(115, 219, 255, 220), outline=(28, 80, 150, 210), width=1)
    return out


def state_frame(head: Image.Image, body: Image.Image, state: str, i: int) -> Image.Image:
    if state == "idle":
        f = compose(head, body, ha=[-1, 0, 1, 0, -1, 0][i], hdy=[1, -1, -2, -1, 1, 2][i], bdy=[2, 0, -1, 0, 1, 2][i])
        return blink(f) if i == 4 else f
    if state == "running-right":
        f = compose(head, body, ha=[3, 5, 4, 1, -1, 0, 2, 4][i], hdx=[4, 5, 5, 3, 2, 2, 3, 4][i], hdy=[0, -1, 0, 1, 0, -1, 0, 1][i], ba=[-7, -10, -8, -4, -2, -5, -8, -10][i], bdx=[-10, -6, 0, 7, 10, 6, 0, -6][i], bdy=[3, 0, -2, 0, 3, 1, -1, 1][i], bsx=1.03, bsy=0.98)
        return f
    if state == "running-left":
        return mirror(state_frame(head, body, "running-right", i))
    if state == "waving":
        f = compose(head, body, ha=[-3, 2, -2, 3][i], hdx=[-1, 1, 0, 1][i], hdy=[-2, -4, -2, 0][i], ba=[4, -3, 3, -4][i], bdx=[-2, 1, -1, 1][i], bdy=[0, -2, 0, 1][i])
        return happy_blink(f) if i == 1 else f
    if state == "jumping":
        f = compose(head, body, ha=[0, -4, 0, 4, 0][i], hdy=[4, -10, -26, -12, 3][i], bdy=[7, -8, -24, -10, 5][i], bsx=[1.06, 0.98, 0.95, 0.98, 1.08][i], bsy=[0.95, 1.04, 1.08, 1.03, 0.94][i])
        return f
    if state == "failed":
        f = compose(head, body, ha=[0, 8, 14, 18, 14, 10, 5, 0][i], hdy=[1, 5, 10, 16, 14, 10, 5, 2][i], ba=[0, 3, 6, 9, 6, 3, 1, 0][i], bdy=[2, 4, 6, 8, 7, 5, 3, 2][i], bsx=1.04, bsy=0.96)
        return add_sweat(blink(f), i) if 1 <= i <= 6 else f
    if state == "waiting":
        f = compose(head, body, ha=[-4, -2, 0, 3, 1, -2][i], hdx=[-2, -1, 0, 2, 1, -1][i], hdy=[0, -2, -1, 1, 0, -1][i], ba=[1, 0, -1, 0, 1, 0][i])
        return add_wait_mark(f, i)
    if state == "running":
        f = compose(head, body, ha=[-3, 2, -2, 3, -1, 1][i], hdy=[0, -3, 0, -2, 1, -1][i], ba=[2, -2, 3, -3, 2, -1][i], bdx=[0, 2, 0, -2, 1, -1][i], bdy=[0, -2, 0, -2, 1, 0][i])
        return happy_blink(f) if i == 3 else f
    if state == "review":
        f = compose(head, body, ha=[-5, -3, 0, 4, 3, 0][i], hdx=[-2, -1, 0, 2, 1, 0][i], hdy=[0, -1, -3, -2, 0, 1][i], ba=[-1, 0, 1, 0, -1, 0][i])
        return blink(f) if i in (1, 4) else f
    return compose(head, body)


def main() -> None:
    base = Image.open(BASE_CELL).convert("RGBA")
    head, body = make_layers(base)
    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    frames_root = ROOT / "frames-lively-v2"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)

    for row, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col in range(count):
            frame = state_frame(head, body, state, col)
            frame.save(state_dir / f"{col:02d}.png")
            atlas.alpha_composite(frame, (col * CELL_W, row * CELL_H))

    atlas = clear_rgb(atlas)
    atlas.save(ROOT / "spritesheet-lively-v2.png")
    atlas.save(ROOT / "spritesheet-lively-v2.webp", format="WEBP", lossless=True, quality=100, method=6, exact=True)
    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A lively no-weapon chibi pixel desktop pet inspired by Furina.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet-lively-v2.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(ROOT / "spritesheet-lively-v2.webp")
    print(ROOT / "pet-lively-v2.json")


if __name__ == "__main__":
    main()
