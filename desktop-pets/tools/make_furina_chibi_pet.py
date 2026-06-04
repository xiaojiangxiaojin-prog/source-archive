from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(r"C:\Users\Administrator\Documents\PPT\furina-chibi-pet")
CELL_W = 192
CELL_H = 208
COLUMNS = 8
ROWS = 9
ATLAS_W = CELL_W * COLUMNS
ATLAS_H = CELL_H * ROWS

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

NAVY = (21, 34, 88, 255)
DEEP_NAVY = (9, 18, 54, 255)
BLUE = (49, 105, 210, 255)
LIGHT_BLUE = (134, 220, 255, 255)
PALE_BLUE = (198, 241, 255, 255)
WHITE = (247, 252, 255, 255)
SKIN = (255, 225, 214, 255)
GOLD = (226, 183, 91, 255)
OUTLINE = (31, 27, 56, 255)
BLACK = (12, 12, 20, 255)
BLUSH = (255, 156, 180, 255)
CRAB = (130, 216, 245, 255)
OCTO = (102, 154, 242, 255)
SEAHORSE = (96, 202, 230, 255)


def px(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill, scale: int = 3) -> None:
    x0, y0, x1, y1 = xy
    draw.rectangle((x0 * scale, y0 * scale, x1 * scale, y1 * scale), fill=fill)


def ellipse(draw: ImageDraw.ImageDraw, box, fill, outline=OUTLINE, width=3) -> None:
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def polygon(draw: ImageDraw.ImageDraw, points, fill, outline=OUTLINE) -> None:
    draw.polygon(points, fill=fill, outline=outline)


def line(draw: ImageDraw.ImageDraw, points, fill=OUTLINE, width=3) -> None:
    draw.line(points, fill=fill, width=width, joint="curve")


def draw_hat(draw: ImageDraw.ImageDraw, cx: int, cy: int, tilt: int) -> None:
    brim = [(cx - 35 + tilt, cy + 1), (cx + 29 + tilt, cy - 5), (cx + 36 + tilt, cy + 7), (cx - 28 + tilt, cy + 13)]
    polygon(draw, brim, DEEP_NAVY)
    draw.line(brim + [brim[0]], fill=GOLD, width=2)
    body = [(cx - 22 + tilt, cy - 37), (cx + 21 + tilt, cy - 41), (cx + 27 + tilt, cy + 4), (cx - 18 + tilt, cy + 9)]
    polygon(draw, body, NAVY)
    draw.line([(cx - 19 + tilt, cy - 8), (cx + 25 + tilt, cy - 13)], fill=BLUE, width=5)
    ellipse(draw, (cx + 6 + tilt, cy - 30, cx + 15 + tilt, cy - 20), LIGHT_BLUE, width=2)
    for ox in (-15, 0, 16):
        line(draw, [(cx + ox + tilt, cy - 42), (cx + ox + 3 + tilt, cy - 52)], GOLD, width=2)


def draw_companions(draw: ImageDraw.ImageDraw, cx: int, cy: int, frame: int, state: str, direction: int) -> None:
    bob = int(math.sin(frame * 1.2) * 3)
    spread = 4 if state in {"waiting", "review"} else 0

    # Surintendante Chevalmarin: bubbly seahorse-shaped superintendent.
    sx, sy = cx - 55 - spread, cy + 44 + bob
    ellipse(draw, (sx - 10, sy - 18, sx + 10, sy + 12), SEAHORSE, width=2)
    ellipse(draw, (sx - 5, sy - 30, sx + 14, sy - 13), PALE_BLUE, width=2)
    line(draw, [(sx + 4, sy + 10), (sx + 16, sy + 18), (sx + 6, sy + 24)], BLUE, width=3)
    ellipse(draw, (sx + 4, sy - 24, sx + 8, sy - 20), BLACK, outline=BLACK, width=1)
    line(draw, [(sx - 4, sy - 27), (sx - 12, sy - 36)], GOLD, width=2)

    # Mademoiselle Crabaletta: armored crab-shaped mademoiselle.
    kx, ky = cx + 54 + spread, cy + 50 - bob
    ellipse(draw, (kx - 16, ky - 11, kx + 16, ky + 12), CRAB, width=2)
    ellipse(draw, (kx - 8, ky - 16, kx - 3, ky - 11), BLACK, outline=BLACK, width=1)
    ellipse(draw, (kx + 3, ky - 16, kx + 8, ky - 11), BLACK, outline=BLACK, width=1)
    line(draw, [(kx - 15, ky - 4), (kx - 29, ky - 13), (kx - 25, ky - 22)], CRAB, width=4)
    line(draw, [(kx + 15, ky - 4), (kx + 29, ky - 13), (kx + 25, ky - 22)], CRAB, width=4)
    line(draw, [(kx - 10, ky + 11), (kx - 18, ky + 20)], BLUE, width=2)
    line(draw, [(kx + 10, ky + 11), (kx + 18, ky + 20)], BLUE, width=2)

    # Gentilhomme Usher: ball-octopus-shaped gentleman.
    ox, oy = cx + direction * 36, cy + 77 + int(math.cos(frame * 1.1) * 2)
    ellipse(draw, (ox - 17, oy - 19, ox + 17, oy + 12), OCTO, width=2)
    draw.arc((ox - 15, oy - 23, ox + 15, oy + 7), 205, 330, fill=PALE_BLUE, width=2)
    ellipse(draw, (ox - 8, oy - 10, ox - 4, oy - 6), BLACK, outline=BLACK, width=1)
    ellipse(draw, (ox + 4, oy - 10, ox + 8, oy - 6), BLACK, outline=BLACK, width=1)
    for dx in (-14, -5, 5, 14):
        line(draw, [(ox + dx, oy + 9), (ox + dx - 5, oy + 22)], OCTO, width=4)


def draw_furina(draw: ImageDraw.ImageDraw, frame: int, state: str, direction: int = 1) -> None:
    cx = 96
    base_y = 78
    bob = 0
    arm_wave = 0
    lean = 0
    sad = False
    blink = False
    ask = False
    review = False

    if state == "idle":
        bob = [0, -1, -2, -1, 0, 1][frame % 6]
        blink = frame == 4
    elif state in {"running-right", "running-left"}:
        bob = [-2, -1, 1, 2, 1, -1, -2, 0][frame % 8]
        lean = direction * 5
    elif state == "waving":
        arm_wave = [-16, -28, -18, -30][frame % 4]
        bob = [-1, -2, -1, 0][frame % 4]
    elif state == "jumping":
        bob = [4, -10, -22, -11, 2][frame % 5]
    elif state == "failed":
        bob = [2, 3, 2, 1, 2, 3, 2, 1][frame % 8]
        sad = True
    elif state == "waiting":
        bob = [0, -1, 0, 1, 0, -1][frame % 6]
        ask = True
    elif state == "running":
        bob = [0, -1, 0, -2, 0, 1][frame % 6]
        review = frame % 2 == 0
    elif state == "review":
        bob = [0, 0, -1, -1, 0, 1][frame % 6]
        review = True
        blink = frame == 3

    cx += direction * (frame % 2 if state in {"running-right", "running-left"} else 0)
    cy = base_y + bob
    draw_companions(draw, cx, cy, frame, state, direction)

    # Cape and coat tails.
    polygon(draw, [(cx - 38 + lean, cy + 44), (cx - 54 + lean, cy + 105), (cx - 18 + lean, cy + 91), (cx - 4 + lean, cy + 46)], NAVY)
    polygon(draw, [(cx + 30 + lean, cy + 44), (cx + 50 + lean, cy + 104), (cx + 13 + lean, cy + 92), (cx + 3 + lean, cy + 47)], BLUE)
    line(draw, [(cx - 37 + lean, cy + 57), (cx - 49 + lean, cy + 97)], LIGHT_BLUE, width=2)
    line(draw, [(cx + 31 + lean, cy + 57), (cx + 43 + lean, cy + 96)], LIGHT_BLUE, width=2)

    # Legs.
    step = [0, 4, 8, 4, 0, -4, -8, -4][frame % 8] if state in {"running-right", "running-left"} else 0
    if state == "jumping":
        step = [-5, -3, 0, 3, 5][frame % 5]
    leg_y = cy + 95
    line(draw, [(cx - 13, cy + 82), (cx - 17 - step // 2, leg_y + 20)], SKIN, width=8)
    line(draw, [(cx + 11, cy + 82), (cx + 16 + step // 2, leg_y + 20)], SKIN, width=8)
    ellipse(draw, (cx - 29 - step // 2, leg_y + 13, cx - 6 - step // 2, leg_y + 27), DEEP_NAVY, width=2)
    ellipse(draw, (cx + 5 + step // 2, leg_y + 13, cx + 29 + step // 2, leg_y + 27), DEEP_NAVY, width=2)
    draw.rectangle((cx - 24, cy + 70, cx + 24, cy + 88), fill=WHITE, outline=OUTLINE, width=2)
    line(draw, [(cx - 24, cy + 88), (cx + 24, cy + 88)], PALE_BLUE, width=3)

    # Torso.
    polygon(draw, [(cx - 28 + lean, cy + 36), (cx + 26 + lean, cy + 36), (cx + 22 + lean, cy + 76), (cx - 22 + lean, cy + 76)], DEEP_NAVY)
    draw.rectangle((cx - 12 + lean, cy + 39, cx + 12 + lean, cy + 72), fill=NAVY, outline=BLUE, width=2)
    polygon(draw, [(cx - 18 + lean, cy + 42), (cx, cy + 54), (cx + 18 + lean, cy + 42), (cx, cy + 66)], BLUE)
    ellipse(draw, (cx - 7 + lean, cy + 55, cx + 7 + lean, cy + 71), LIGHT_BLUE, width=2)
    for y in (46, 55, 64):
        ellipse(draw, (cx + 15 + lean, cy + y, cx + 20 + lean, cy + y + 5), GOLD, width=1)

    # Arms.
    left_hand = (cx - 42 - lean, cy + 67)
    right_hand = (cx + 42 + lean, cy + 67)
    if state == "waving":
        right_hand = (cx + 43, cy + 30 + arm_wave // 4)
    if ask:
        left_hand = (cx - 46, cy + 56)
        right_hand = (cx + 46, cy + 56)
    if review:
        right_hand = (cx + 34, cy + 45)
    line(draw, [(cx - 24 + lean, cy + 44), left_hand], NAVY, width=9)
    line(draw, [(cx + 24 + lean, cy + 44), right_hand], NAVY, width=9)
    ellipse(draw, (left_hand[0] - 6, left_hand[1] - 5, left_hand[0] + 6, left_hand[1] + 6), WHITE, width=2)
    ellipse(draw, (right_hand[0] - 6, right_hand[1] - 5, right_hand[0] + 6, right_hand[1] + 6), WHITE, width=2)

    # Head, hair, face.
    ellipse(draw, (cx - 29 + lean, cy - 8, cx + 29 + lean, cy + 49), SKIN, width=3)
    ellipse(draw, (cx - 34 + lean, cy - 16, cx + 34 + lean, cy + 26), WHITE, width=3)
    polygon(draw, [(cx - 29 + lean, cy - 7), (cx - 45 + lean, cy + 36), (cx - 23 + lean, cy + 34)], WHITE)
    polygon(draw, [(cx + 25 + lean, cy - 6), (cx + 43 + lean, cy + 35), (cx + 19 + lean, cy + 34)], PALE_BLUE)
    line(draw, [(cx - 18 + lean, cy - 14), (cx - 27 + lean, cy + 18)], PALE_BLUE, width=5)
    line(draw, [(cx + 8 + lean, cy - 16), (cx - 4 + lean, cy + 21)], WHITE, width=6)
    line(draw, [(cx - 22 + lean, cy + 32), (cx - 28 + lean, cy + 52), (cx - 18 + lean, cy + 64)], WHITE, width=6)
    line(draw, [(cx + 22 + lean, cy + 31), (cx + 28 + lean, cy + 50), (cx + 17 + lean, cy + 62)], PALE_BLUE, width=6)
    if blink:
        line(draw, [(cx - 17 + lean, cy + 21), (cx - 7 + lean, cy + 21)], OUTLINE, width=2)
        line(draw, [(cx + 7 + lean, cy + 21), (cx + 17 + lean, cy + 21)], OUTLINE, width=2)
    else:
        ellipse(draw, (cx - 18 + lean, cy + 14, cx - 7 + lean, cy + 27), LIGHT_BLUE, width=2)
        ellipse(draw, (cx + 7 + lean, cy + 14, cx + 18 + lean, cy + 27), LIGHT_BLUE, width=2)
        ellipse(draw, (cx - 14 + lean, cy + 18, cx - 10 + lean, cy + 23), BLACK, outline=BLACK, width=1)
        ellipse(draw, (cx + 10 + lean, cy + 18, cx + 14 + lean, cy + 23), BLACK, outline=BLACK, width=1)
    if sad:
        line(draw, [(cx - 8 + lean, cy + 38), (cx + 8 + lean, cy + 38)], OUTLINE, width=2)
        line(draw, [(cx + 18 + lean, cy + 26), (cx + 20 + lean, cy + 38)], LIGHT_BLUE, width=3)
    else:
        line(draw, [(cx - 6 + lean, cy + 37), (cx + 6 + lean, cy + 37)], OUTLINE, width=2)
    ellipse(draw, (cx - 25 + lean, cy + 29, cx - 19 + lean, cy + 34), BLUSH, outline=BLUSH, width=1)
    ellipse(draw, (cx + 19 + lean, cy + 29, cx + 25 + lean, cy + 34), BLUSH, outline=BLUSH, width=1)

    draw_hat(draw, cx + 11 + lean, cy - 11, tilt=2 if direction > 0 else -2)


def make_frame(state: str, frame: int, direction: int = 1) -> Image.Image:
    image = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_furina(draw, frame, state, direction)
    return image


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for i in range(0, len(data), 4):
        if data[i + 3] == 0:
            data[i] = data[i + 1] = data[i + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    frames_root = ROOT / "frames"
    if frames_root.exists():
        shutil.rmtree(frames_root)
    frames_root.mkdir(parents=True)

    for row, (state, count) in enumerate(ROW_SPECS):
        state_dir = frames_root / state
        state_dir.mkdir()
        for col in range(count):
            direction = -1 if state == "running-left" else 1
            frame = make_frame(state, col, direction=direction)
            atlas.alpha_composite(frame, (col * CELL_W, row * CELL_H))
            frame.save(state_dir / f"{col:02d}.png")

    atlas = clear_transparent_rgb(atlas)
    png_path = ROOT / "spritesheet.png"
    webp_path = ROOT / "spritesheet.webp"
    atlas.save(png_path)
    atlas.save(webp_path, format="WEBP", lossless=True, quality=100, method=6, exact=True)

    base = make_frame("idle", 0)
    decoded = ROOT / "decoded"
    refs = ROOT / "references"
    decoded.mkdir(exist_ok=True)
    refs.mkdir(exist_ok=True)
    base.save(decoded / "base.png")
    base.save(refs / "canonical-base.png")

    pet_json = {
        "id": "furina-chibi",
        "displayName": "Furina Chibi",
        "description": "A chibi pixel desktop pet inspired by Furina, with Gentilhomme Usher, Surintendante Chevalmarin, and Mademoiselle Crabaletta.",
        "spritesheetPath": "spritesheet.webp",
    }
    (ROOT / "pet.json").write_text(json.dumps(pet_json, indent=2) + "\n", encoding="utf-8")
    print(png_path)
    print(webp_path)
    print(ROOT / "pet.json")


if __name__ == "__main__":
    main()
