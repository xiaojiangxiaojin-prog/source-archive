from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from PIL import ImageDraw


ROOT = Path(r"C:\Users\Administrator\Documents\PPT\furina-chibi-pet")
SRC = ROOT / "qa" / "v8-generated-actions" / "furina-generated-actions-source.png"
OUT_DIR = ROOT / "qa" / "v8-generated-actions"
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


def remove_magenta(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    key = np.array([255, 0, 255], dtype=np.int16)
    dist = np.sqrt(((rgb - key) ** 2).sum(axis=2))
    mask_bg = dist < 70
    arr[mask_bg, 3] = 0
    arr[mask_bg, :3] = 0
    # Drop tiny semi-magenta antialias residue on edges of the generated canvas.
    mask_near = (dist < 115) & (arr[:, :, 3] > 0) & (arr[:, :, 1] < 80)
    arr[mask_near, 3] = np.minimum(arr[mask_near, 3], 40)
    return Image.fromarray(arr, "RGBA")


def extract_components(img: Image.Image) -> list[Image.Image]:
    alpha = np.array(img.getchannel("A"))
    binary = (alpha > 32).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    comps: list[tuple[int, int, int, int, int, Image.Image]] = []
    for label in range(1, count):
        x, y, w, h, area = stats[label]
        if area < 800 or w < 24 or h < 36:
            continue
        crop = img.crop((x, y, x + w, y + h))
        comp_alpha = np.where(labels[y : y + h, x : x + w] == label, np.array(crop.getchannel("A")), 0).astype(np.uint8)
        crop.putalpha(Image.fromarray(comp_alpha, "L"))
        comps.append((x, y, w, h, area, crop))
    comps.sort(key=lambda item: (item[1] + item[3] / 2, item[0] + item[2] / 2))
    return [c[-1] for c in comps]


def group_rows(components: list[Image.Image], positions: list[tuple[int, int, int, int]]) -> list[list[Image.Image]]:
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
        comp_alpha = np.where(labels[y : y + h, x : x + w] == label, np.array(crop.getchannel("A")), 0).astype(np.uint8)
        crop.putalpha(Image.fromarray(comp_alpha, "L"))
        found.append((x, y, w, h, area, crop))
    found.sort(key=lambda item: (item[1] + item[3] / 2, item[0] + item[2] / 2))
    return [f[-1] for f in found], [(f[0], f[1], f[2], f[3]) for f in found]


def pick_frames(frames: list[Image.Image], count: int) -> list[Image.Image]:
    if not frames:
        raise ValueError("no frames to pick from")
    if len(frames) == count:
        return [f.copy() for f in frames]
    if len(frames) > count:
        return [frames[round(i * (len(frames) - 1) / (count - 1))].copy() for i in range(count)]
    result = []
    for i in range(count):
        idx = round(i * (len(frames) - 1) / max(1, count - 1))
        result.append(frames[idx].copy())
    return result


def clean_rgb(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for i in range(0, len(data), 4):
        if data[i + 3] == 0:
            data[i] = data[i + 1] = data[i + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def fit_cell(sprite: Image.Image, *, max_w: int = 172, max_h: int = 190, bottom_pad: int = 7) -> Image.Image:
    sprite = sprite.convert("RGBA")
    box = sprite.getbbox()
    if not box:
        return Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    crop = sprite.crop(box)
    scale = min(max_w / crop.width, max_h / crop.height)
    new = (max(1, int(crop.width * scale)), max(1, int(crop.height * scale)))
    small = crop.resize(new, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(small, ((CELL_W - new[0]) // 2, CELL_H - new[1] - bottom_pad))
    return clean_rgb(cell)


def make_jump_from_idle(idle: list[Image.Image]) -> list[Image.Image]:
    base = idle[0]
    shifts = [8, -10, -28, -12, 4]
    scales = [(1.06, 0.94), (0.98, 1.04), (0.95, 1.08), (0.99, 1.03), (1.08, 0.93)]
    out = []
    for dy, (sx, sy) in zip(shifts, scales):
        box = base.getbbox()
        crop = base.crop(box)
        resized = crop.resize((int(crop.width * sx), int(crop.height * sy)), Image.Resampling.BICUBIC)
        frame = Image.new("RGBA", base.size, (0, 0, 0, 0))
        cx = (box[0] + box[2]) // 2
        frame.alpha_composite(resized, (cx - resized.width // 2, box[1] + dy))
        out.append(clean_rgb(frame))
    return out


def add_blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    # Coordinates are relative to the fitted Furina cell; subtle closed-eye arcs
    # keep the generated face intact while making the animation feel alive.
    d.line((78, 78, 89, 78), fill=(34, 28, 58, 235), width=2)
    d.line((101, 78, 112, 78), fill=(34, 28, 58, 235), width=2)
    return clean_rgb(out)


def add_happy_blink(frame: Image.Image) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out)
    d.arc((76, 72, 91, 84), 20, 160, fill=(34, 28, 58, 235), width=2)
    d.arc((100, 72, 115, 84), 20, 160, fill=(34, 28, 58, 235), width=2)
    return clean_rgb(out)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    alpha = remove_magenta(SRC)
    alpha.save(OUT_DIR / "source-alpha.png")
    comps, positions = extract_components_with_positions(alpha)
    rows = group_rows(comps, positions)
    rows = [row for row in rows if len(row) >= 3]

    debug = {
        "components": len(comps),
        "rows": [len(row) for row in rows],
    }
    (OUT_DIR / "detected.json").write_text(json.dumps(debug, indent=2) + "\n", encoding="utf-8")

    # Generated row order: idle, running-right, running-left, waving, failed, waiting, active/read, review/read.
    state_source = {
        "idle": rows[0],
        "running-right": rows[1],
        "running-left": rows[2],
        "waving": rows[3],
        "failed": rows[4],
        "waiting": rows[5],
        "running": rows[6],
        "review": rows[7] if len(rows) > 7 else rows[6],
    }

    frames_root = ROOT / "frames-generated-actions"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)
    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))

    idle_cells = [fit_cell(f) for f in pick_frames(state_source["idle"], 6)]
    row_frames: dict[str, list[Image.Image]] = {"idle": idle_cells}
    row_frames["jumping"] = make_jump_from_idle(idle_cells)

    for state, count in ROW_SPECS:
        if state in row_frames:
            frames = row_frames[state]
        else:
            max_h = 178 if state in {"running-right", "running-left"} else 190
            frames = [fit_cell(f, max_h=max_h) for f in pick_frames(state_source[state], count)]
        row_frames[state] = frames

    if len(row_frames["idle"]) >= 5:
        row_frames["idle"][4] = add_blink(row_frames["idle"][4])
    if len(row_frames["waving"]) >= 2:
        row_frames["waving"][1] = add_happy_blink(row_frames["waving"][1])
    if len(row_frames["waiting"]) >= 4:
        row_frames["waiting"][3] = add_blink(row_frames["waiting"][3])
    if len(row_frames["running"]) >= 4:
        row_frames["running"][3] = add_happy_blink(row_frames["running"][3])
    if len(row_frames["review"]) >= 5:
        row_frames["review"][1] = add_blink(row_frames["review"][1])
        row_frames["review"][4] = add_blink(row_frames["review"][4])

    for row_idx, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col, frame in enumerate(row_frames[state][:count]):
            frame.save(state_dir / f"{col:02d}.png")
            atlas.alpha_composite(frame, (col * CELL_W, row_idx * CELL_H))

    atlas = clean_rgb(atlas)
    atlas.save(ROOT / "spritesheet-generated-actions.png")
    atlas.save(ROOT / "spritesheet-generated-actions.webp", format="WEBP", lossless=True, quality=100, method=6, exact=True)
    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A lively no-weapon Furina-inspired chibi desktop pet with generated action poses.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet-generated-actions.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(ROOT / "spritesheet-generated-actions.webp")
    print(ROOT / "pet-generated-actions.json")


if __name__ == "__main__":
    main()
