from __future__ import annotations

import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(r"C:\Users\Administrator\Documents\PPT\furina-chibi-pet")
SRC = ROOT / "qa" / "v12-image2" / "furina-image2-source.png"
OUT_DIR = ROOT / "qa" / "v17-image2-hires-edgefix"
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
    rgba = img.convert("RGBA")
    arr = np.array(rgba)
    arr[arr[:, :, 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")


def remove_magenta_fringe(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int32)
    alpha = arr[:, :, 3]
    key = np.array([255, 0, 255], dtype=np.int32)
    dist = np.sqrt(((rgb - key) ** 2).sum(axis=2))

    # Remove semi-transparent chroma-key residue that becomes a red/pink outline
    # on dark desktop backgrounds after scaling.
    red_pink_edge = (
        (alpha > 0)
        & (alpha < 235)
        & (arr[:, :, 0] > 150)
        & (arr[:, :, 2] > 125)
        & (arr[:, :, 1] < 135)
        & (dist < 175)
    )
    arr[red_pink_edge, 3] = 0
    arr[red_pink_edge, :3] = 0

    soft_pink_edge = (
        (alpha > 0)
        & (alpha < 210)
        & (arr[:, :, 0] > arr[:, :, 1] + 55)
        & (arr[:, :, 2] > arr[:, :, 1] + 45)
        & (dist < 215)
    )
    arr[soft_pink_edge, 3] = np.minimum(arr[soft_pink_edge, 3], 24)
    arr[soft_pink_edge, :3] = np.minimum(arr[soft_pink_edge, :3], np.array([90, 80, 120], dtype=np.uint8))
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def unspill_edge_red(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    foreground = (alpha > 0).astype(np.uint8)
    dist_inside = cv2.distanceTransform(foreground, cv2.DIST_L2, 3)
    near_edge = (alpha > 0) & (dist_inside <= 5.0)

    red_purple = (
        near_edge
        & (arr[:, :, 0] > 105)
        & (arr[:, :, 2] > 105)
        & (arr[:, :, 1] < 155)
        & (arr[:, :, 0] > arr[:, :, 1] + 28)
        & (arr[:, :, 2] > arr[:, :, 1] + 18)
    )
    semi = red_purple & (alpha < 245)
    arr[semi, 3] = 0
    arr[semi, :3] = 0

    solid = red_purple & (alpha >= 245)
    arr[solid, 0] = np.minimum(arr[solid, 0], arr[solid, 1] + 36)
    arr[solid, 2] = np.maximum(arr[solid, 2], arr[solid, 1] + 48)
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def trim_colored_outer_edge(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    mask = (alpha > 0).astype(np.uint8)
    kernel = np.ones((3, 3), np.uint8)
    eroded_once = cv2.erode(mask, kernel, iterations=1).astype(bool)
    outer_ring = (mask.astype(bool)) & ~eroded_once

    pink_or_red = (
        (arr[:, :, 0] > 115)
        & (arr[:, :, 2] > 95)
        & (arr[:, :, 1] < 170)
        & (arr[:, :, 0] > arr[:, :, 1] + 18)
    )
    blue_purple_bleed = (
        (arr[:, :, 0] > 95)
        & (arr[:, :, 2] > 135)
        & (arr[:, :, 1] < 150)
        & (arr[:, :, 2] > arr[:, :, 1] + 22)
    )
    remove = outer_ring & (pink_or_red | blue_purple_bleed)
    arr[remove, 3] = 0
    arr[remove, :3] = 0

    # The remaining first visible pixel should read as cool outline, not pink.
    mask2 = (arr[:, :, 3] > 0).astype(np.uint8)
    edge_distance = cv2.distanceTransform(mask2, cv2.DIST_L2, 3)
    inner_edge = (arr[:, :, 3] > 0) & (edge_distance <= 3.0) & pink_or_red
    arr[inner_edge, 0] = np.minimum(arr[inner_edge, 0], arr[inner_edge, 1] + 32)
    arr[inner_edge, 2] = np.maximum(arr[inner_edge, 2], arr[inner_edge, 1] + 42)
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def strip_near_edge_magenta(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    mask = (alpha > 0).astype(np.uint8)
    edge_distance = cv2.distanceTransform(mask, cv2.DIST_L2, 3)
    near_edge = (alpha > 0) & (edge_distance <= 8.0)

    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    magenta_family = (
        near_edge
        & (r > 80)
        & (b > 90)
        & (g < 185)
        & (((r + b) // 2 - g) > 18)
        & ((r - g) > 10)
    )
    hard_edge = magenta_family & (edge_distance <= 4.2)
    soft_edge = magenta_family & (edge_distance > 4.2)

    arr[hard_edge, 3] = 0
    arr[hard_edge, :3] = 0
    arr[soft_edge, 3] = np.minimum(arr[soft_edge, 3], 80)
    arr[soft_edge, 0] = np.minimum(arr[soft_edge, 0], arr[soft_edge, 1] + 18)
    arr[soft_edge, 2] = np.maximum(arr[soft_edge, 2], arr[soft_edge, 1] + 35)
    return clean_rgb(Image.fromarray(arr, "RGBA"))


def remove_magenta(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int32)
    key = np.array([255, 0, 255], dtype=np.int32)
    dist = np.sqrt(((rgb - key) ** 2).sum(axis=2))
    arr[dist < 92, 3] = 0
    arr[dist < 92, :3] = 0

    # Keep the character crisp while dropping only the magenta antialias fringe.
    fringe = (dist < 170) & (arr[:, :, 3] > 0) & (arr[:, :, 3] < 245) & (arr[:, :, 1] < 135)
    arr[fringe, 3] = 0
    arr[fringe, :3] = 0
    return remove_magenta_fringe(Image.fromarray(arr, "RGBA"))


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
        found.append((x, y, w, h, area, clean_rgb(crop)))
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
    if len(frames) == count:
        return [f.copy() for f in frames]
    return [frames[round(i * (len(frames) - 1) / max(1, count - 1))].copy() for i in range(count)]


def sharpen_sprite(sprite: Image.Image) -> Image.Image:
    alpha = sprite.getchannel("A")
    rgb = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    rgb.alpha_composite(sprite)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=0.6, percent=105, threshold=2))
    rgb.putalpha(alpha)
    return clean_rgb(rgb)


def fit_cell(sprite: Image.Image, *, max_w: int = 184, max_h: int = 202, bottom_pad: int = 3) -> Image.Image:
    sprite = sprite.convert("RGBA")
    box = sprite.getbbox()
    if not box:
        return Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    crop = sprite.crop(box)
    scale = min(max_w / crop.width, max_h / crop.height)
    new_size = (max(1, int(crop.width * scale)), max(1, int(crop.height * scale)))
    fitted = strip_near_edge_magenta(
        trim_colored_outer_edge(
            unspill_edge_red(remove_magenta_fringe(sharpen_sprite(crop.resize(new_size, Image.Resampling.LANCZOS))))
        )
    )
    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(fitted, ((CELL_W - new_size[0]) // 2, CELL_H - new_size[1] - bottom_pad))
    return clean_rgb(cell)


def add_blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    d.arc((76, 71, 91, 84), 18, 162, fill=(30, 27, 55, 235), width=2)
    d.arc((101, 71, 116, 84), 18, 162, fill=(30, 27, 55, 235), width=2)
    return clean_rgb(out)


def add_small_bounce(frames: list[Image.Image], shifts: list[int]) -> list[Image.Image]:
    out: list[Image.Image] = []
    for frame, dy in zip(frames, shifts):
        box = frame.getbbox()
        if not box:
            out.append(frame.copy())
            continue
        crop = frame.crop(box)
        moved = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        moved.alpha_composite(crop, (box[0], box[1] + dy))
        out.append(clean_rgb(moved))
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source_alpha = remove_magenta(SRC)
    source_alpha.save(OUT_DIR / "source-alpha.png")

    comps, positions = extract_components_with_positions(source_alpha)
    rows = [row for row in group_rows(comps, positions) if len(row) >= 3]
    debug = {"components": len(comps), "rows": [len(row) for row in rows]}
    (OUT_DIR / "detected.json").write_text(json.dumps(debug, indent=2) + "\n", encoding="utf-8")
    if [len(row) for row in rows] != [6, 8, 8, 4, 5, 8, 6, 6, 6]:
        raise RuntimeError(f"unexpected row layout: {debug}")

    # Source row 1 faces left and source row 2 faces right, so map them to the
    # runtime directions that matched the user's previous drag-direction fix.
    state_source = {
        "idle": rows[0],
        "running-right": rows[2],
        "running-left": rows[1],
        "waving": rows[3],
        "jumping": rows[4],
        "failed": rows[5],
        "waiting": rows[6],
        "running": rows[7],
        "review": rows[8],
    }

    frames_root = ROOT / "frames-image2-v17-edgefix"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)

    row_frames: dict[str, list[Image.Image]] = {}
    for state, count in ROW_SPECS:
        max_h = 190 if state in {"running-right", "running-left"} else 202
        frames = [fit_cell(f, max_h=max_h) for f in pick_frames(state_source[state], count)]
        if state == "jumping":
            frames = add_small_bounce(frames, [7, -8, -24, -8, 6])
        row_frames[state] = frames

    for state, cols in {
        "idle": [1, 3],
        "waving": [2],
        "waiting": [1, 4],
        "review": [2, 5],
    }.items():
        for col in cols:
            if col < len(row_frames[state]):
                row_frames[state][col] = add_blink(row_frames[state][col])

    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    for row_idx, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col, frame in enumerate(row_frames[state][:count]):
            frame.save(state_dir / f"{col:02d}.png")
            atlas.alpha_composite(frame, (col * CELL_W, row_idx * CELL_H))

    atlas = clean_rgb(atlas)
    atlas = strip_near_edge_magenta(trim_colored_outer_edge(unspill_edge_red(remove_magenta_fringe(atlas))))
    atlas.save(ROOT / "spritesheet-image2-v17-hires-edgefix.png")
    atlas.save(ROOT / "spritesheet-image2-v17-hires-edgefix.webp", format="WEBP", lossless=True, quality=100, method=6, exact=True)

    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A lively no-weapon Furina-inspired chibi desktop pet generated with image2.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet-image2-v17-hires-edgefix.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(ROOT / "spritesheet-image2-v17-hires-edgefix.webp")
    print(ROOT / "pet-image2-v17-hires-edgefix.json")
    print(OUT_DIR / "detected.json")


if __name__ == "__main__":
    main()
