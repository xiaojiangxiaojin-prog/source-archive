from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


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


def clean_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for i in range(0, len(data), 4):
        if data[i + 3] == 0:
            data[i] = data[i + 1] = data[i + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def shift_sprite(sprite: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    out = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    out.alpha_composite(sprite, (dx, dy))
    return out


def tilt_sprite(sprite: Image.Image, angle: float, dx: int = 0, dy: int = 0) -> Image.Image:
    box = sprite.getbbox()
    if not box:
        return sprite.copy()
    crop = sprite.crop(box)
    rotated = crop.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    out = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    x = box[0] + (crop.width - rotated.width) // 2 + dx
    y = box[1] + (crop.height - rotated.height) // 2 + dy
    out.alpha_composite(rotated, (x, y))
    return out


def mirror_sprite(sprite: Image.Image) -> Image.Image:
    box = sprite.getbbox()
    if not box:
        return sprite.copy()
    crop = sprite.crop(box).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    out.alpha_composite(crop, ((CELL_W - crop.width) // 2, box[1]))
    return out


def add_question_mark(sprite: Image.Image, frame: int) -> Image.Image:
    out = sprite.copy()
    draw = ImageDraw.Draw(out)
    alpha = 170 + int(40 * math.sin(frame))
    color = (132, 220, 255, alpha)
    x, y = 142, 36 + int(math.sin(frame) * 2)
    draw.arc((x, y, x + 18, y + 18), 205, 520, fill=color, width=3)
    draw.line((x + 12, y + 16, x + 10, y + 23), fill=color, width=3)
    draw.ellipse((x + 9, y + 27, x + 13, y + 31), fill=color)
    return out


def add_failed_sweat(sprite: Image.Image, frame: int) -> Image.Image:
    out = sprite.copy()
    draw = ImageDraw.Draw(out)
    x = 132
    y = 58 + frame % 3
    draw.ellipse((x, y, x + 7, y + 11), fill=(116, 218, 255, 220), outline=(28, 76, 140, 220), width=1)
    return out


def make_state_frame(base: Image.Image, state: str, frame: int) -> Image.Image:
    if state == "idle":
        dy = [1, -1, -3, -1, 1, 2][frame]
        angle = [0, -0.8, 0, 0.8, 0, -0.5][frame]
        return tilt_sprite(base, angle, 0, dy)
    if state == "running-right":
        dx = [-6, -3, 1, 5, 7, 3, -1, -4][frame]
        dy = [-2, 0, 2, 0, -2, 0, 2, 0][frame]
        return tilt_sprite(base, 2.0 * math.sin(frame / 8 * math.tau), dx, dy)
    if state == "running-left":
        left = mirror_sprite(base)
        dx = [6, 3, -1, -5, -7, -3, 1, 4][frame]
        dy = [-2, 0, 2, 0, -2, 0, 2, 0][frame]
        return tilt_sprite(left, -2.0 * math.sin(frame / 8 * math.tau), dx, dy)
    if state == "waving":
        return tilt_sprite(base, [-4.0, 2.0, -3.0, 2.5][frame], [0, 1, 0, -1][frame], [-2, -4, -2, 0][frame])
    if state == "jumping":
        return tilt_sprite(base, [0, -2, 0, 2, 0][frame], 0, [5, -12, -26, -12, 3][frame])
    if state == "failed":
        return add_failed_sweat(tilt_sprite(base, [-2, -3, -2, 0, 2, 3, 2, 0][frame], 0, [2, 3, 2, 2, 2, 3, 2, 2][frame]), frame)
    if state == "waiting":
        return add_question_mark(tilt_sprite(base, [-1, 0, 1, 0, -1, 0][frame], 0, [0, -2, 0, 1, 0, -1][frame]), frame)
    if state == "running":
        return tilt_sprite(base, [0, -2, 0, 2, 0, -2][frame], [0, 2, 0, -2, 0, 2][frame], [0, -2, 0, -2, 0, 1][frame])
    if state == "review":
        return tilt_sprite(base, [-2, -1, 0, 2, 1, 0][frame], 0, [0, 0, -2, -1, 0, 1][frame])
    return base.copy()


def main() -> None:
    base = Image.open(BASE_CELL).convert("RGBA")
    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    frames_root = ROOT / "frames-v4"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)

    for row, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col in range(count):
            frame = clean_transparent_rgb(make_state_frame(base, state, col))
            frame.save(state_dir / f"{col:02d}.png")
            atlas.alpha_composite(frame, (col * CELL_W, row * CELL_H))

    atlas = clean_transparent_rgb(atlas)
    atlas.save(ROOT / "spritesheet-v6.png")
    atlas.save(ROOT / "spritesheet-v6.webp", format="WEBP", lossless=True, quality=100, method=6, exact=True)

    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A polished chibi pixel desktop pet inspired by Furina, with a blue theatrical outfit.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet-v6.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(ROOT / "spritesheet-v6.webp")
    print(ROOT / "pet-v6.json")


if __name__ == "__main__":
    main()
