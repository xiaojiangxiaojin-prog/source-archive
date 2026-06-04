from __future__ import annotations

import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(r"C:\Users\Administrator\Documents\PPT\furina-chibi-pet")
SRC = ROOT / "qa" / "v18-image2-greenkey" / "furina-image2-green-source.png"
OUT_DIR = ROOT / "qa" / "v18-image2-greenkey"
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


def clean_rgb(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    arr[arr[:, :, 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")


def remove_green_background(path: Path) -> Image.Image:
    arr = np.array(Image.open(path).convert("RGBA"))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)

    bg = (g > 135) & (r < 105) & (b < 125) & (g > r + 55) & (g > b + 55)
    arr[bg, 3] = 0
    arr[bg, :3] = 0

    # Remove green antialias residue without touching Furina's blue outfit.
    fringe = (arr[:, :, 3] > 0) & (g > 95) & (g > r + 35) & (g > b + 35)
    arr[fringe, 3] = np.minimum(arr[fringe, 3], 24)
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def remove_green_fringe(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    alpha = arr[:, :, 3]
    mask = (alpha > 0).astype(np.uint8)
    edge_distance = cv2.distanceTransform(mask, cv2.DIST_L2, 3)
    edge = (alpha > 0) & (edge_distance <= 5.0)

    greenish = edge & (g > 85) & (g > r + 24) & (g > b + 24)
    arr[greenish, 3] = 0
    arr[greenish, :3] = 0
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def extract_components_with_positions(img: Image.Image) -> tuple[list[Image.Image], list[tuple[int, int, int, int]]]:
    alpha = np.array(img.getchannel("A"))
    binary = (alpha > 32).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    found: list[tuple[int, int, int, int, int, Image.Image]] = []
    for label in range(1, count):
        x, y, w, h, area = stats[label]
        if area < 800 or w < 24 or h < 36:
            continue
        crop = img.crop((x, y, x + w, y + h))
        comp_alpha = np.where(
            labels[y : y + h, x : x + w] == label,
            np.array(crop.getchannel("A")),
            0,
        ).astype(np.uint8)
        crop.putalpha(Image.fromarray(comp_alpha, "L"))
        found.append((x, y, w, h, area, remove_green_fringe(clean_rgb(crop))))
    found.sort(key=lambda item: (item[1] + item[3] / 2, item[0] + item[2] / 2))
    return [f[-1] for f in found], [(f[0], f[1], f[2], f[3]) for f in found]


def group_rows(
    components: list[Image.Image],
    positions: list[tuple[int, int, int, int]],
) -> list[list[Image.Image]]:
    items = sorted(zip(components, positions), key=lambda item: item[1][1] + item[1][3] / 2)
    rows: list[list[tuple[Image.Image, tuple[int, int, int, int]]]] = []
    for comp, pos in items:
        cy = pos[1] + pos[3] / 2
        if not rows:
            rows.append([(comp, pos)])
            continue
        last_cy = sum(p[1] + p[3] / 2 for _, p in rows[-1]) / len(rows[-1])
        if abs(cy - last_cy) < 95:
            rows[-1].append((comp, pos))
        else:
            rows.append([(comp, pos)])
    for row in rows:
        row.sort(key=lambda item: item[1][0])
    return [[comp for comp, _ in row] for row in rows]


def pick_frames(frames: list[Image.Image], count: int) -> list[Image.Image]:
    if not frames:
        raise ValueError("no frames to pick from")
    return [frames[round(i * (len(frames) - 1) / max(1, count - 1))].copy() for i in range(count)]


def sharpen_sprite(sprite: Image.Image) -> Image.Image:
    alpha = sprite.getchannel("A")
    rgb = sprite.filter(ImageFilter.UnsharpMask(radius=0.5, percent=85, threshold=2))
    rgb.putalpha(alpha)
    return clean_rgb(rgb)


def fit_cell(sprite: Image.Image, *, max_w: int = 184, max_h: int = 200, bottom_pad: int = 4) -> Image.Image:
    sprite = sprite.convert("RGBA")
    box = sprite.getbbox()
    if not box:
        return Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    crop = sprite.crop(box)
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, int(crop.width * scale)), max(1, int(crop.height * scale)))
    fitted = remove_green_fringe(sharpen_sprite(crop.resize(size, Image.Resampling.LANCZOS)))
    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(fitted, ((CELL_W - size[0]) // 2, CELL_H - size[1] - bottom_pad))
    return clean_rgb(cell)


def add_blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    d.arc((76, 71, 91, 84), 18, 162, fill=(30, 27, 55, 235), width=2)
    d.arc((101, 71, 116, 84), 18, 162, fill=(30, 27, 55, 235), width=2)
    return clean_rgb(out)


def make_jump_from_waving(frames: list[Image.Image]) -> list[Image.Image]:
    base_frames = pick_frames(frames, 5)
    shifts = [7, -8, -24, -9, 6]
    out: list[Image.Image] = []
    for frame, dy in zip(base_frames, shifts):
        box = frame.getbbox()
        crop = frame.crop(box)
        moved = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        moved.alpha_composite(crop, (box[0], box[1] + dy))
        out.append(clean_rgb(moved))
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source_alpha = remove_green_background(SRC)
    source_alpha.save(OUT_DIR / "source-alpha.png")
    comps, positions = extract_components_with_positions(source_alpha)
    rows = [row for row in group_rows(comps, positions) if len(row) >= 3]
    debug = {"components": len(comps), "rows": [len(row) for row in rows]}
    (OUT_DIR / "detected.json").write_text(json.dumps(debug, indent=2) + "\n", encoding="utf-8")
    if len(rows) < 8:
        raise RuntimeError(f"unexpected row layout: {debug}")

    state_source = {
        "idle": rows[0],
        "running-right": rows[2],
        "running-left": rows[1],
        "waving": rows[3],
        "failed": rows[4],
        "waiting": rows[5],
        "running": rows[6],
        "review": rows[7],
    }

    frames_root = ROOT / "frames-image2-v18-greenkey"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)

    row_frames: dict[str, list[Image.Image]] = {}
    for state, count in ROW_SPECS:
        if state == "jumping":
            continue
        max_h = 188 if state in {"running-right", "running-left"} else 200
        row_frames[state] = [fit_cell(f, max_h=max_h) for f in pick_frames(state_source[state], count)]
    row_frames["jumping"] = make_jump_from_waving(row_frames["waving"])

    for state, cols in {"idle": [1, 4], "waving": [2], "waiting": [1, 4], "review": [1, 4]}.items():
        for col in cols:
            if col < len(row_frames[state]):
                row_frames[state][col] = add_blink(row_frames[state][col])

    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    for row_idx, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col, frame in enumerate(row_frames[state][:count]):
            frame = remove_green_fringe(frame)
            frame.save(state_dir / f"{col:02d}.png")
            atlas.alpha_composite(frame, (col * CELL_W, row_idx * CELL_H))

    atlas = remove_green_fringe(clean_rgb(atlas))
    atlas.save(ROOT / "spritesheet-image2-v18-greenkey.png")
    atlas.save(ROOT / "spritesheet-image2-v18-greenkey.webp", format="WEBP", lossless=True, quality=100, method=6, exact=True)
    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A lively no-weapon Furina-inspired chibi desktop pet generated with image2 green-key cleanup.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet-image2-v18-greenkey.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(ROOT / "spritesheet-image2-v18-greenkey.webp")
    print(ROOT / "pet-image2-v18-greenkey.json")
    print(OUT_DIR / "detected.json")


if __name__ == "__main__":
    main()
