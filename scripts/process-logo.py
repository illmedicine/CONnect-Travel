"""Recolor the Connect Travel logo to match the navbar primary color
and remove the Gemini watermarks (small sparkle top-left, diamond bottom-right).

Output: public/logo.png (replaced).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path("public/logo.png")
DST = SRC

# Navbar primary color (from globals.css --color-primary)
TARGET_BG = np.array([30, 58, 95], dtype=np.float32)  # #1e3a5f

img = Image.open(SRC).convert("RGB")
arr = np.asarray(img, dtype=np.float32)
h, w, _ = arr.shape
print(f"loaded {w}x{h}")

# Sample current background color from a clean corner region (top-left strip,
# avoiding the watermark which sits roughly in the upper-left van area is foreground).
# Use the very top edge, away from the watermark sparkle.
sample = arr[0:20, w // 2 - 50 : w // 2 + 50, :]
bg_src = sample.reshape(-1, 3).mean(axis=0)
print(f"sampled bg: {bg_src}")

# Distance from each pixel to the sampled background (in RGB space).
diff = arr - bg_src
dist = np.sqrt((diff * diff).sum(axis=2))

# Soft blend factor: 0 = pure background → fully recolored,
# 1 = far from background → keep original.
LOW, HIGH = 18.0, 60.0
t = np.clip((dist - LOW) / (HIGH - LOW), 0.0, 1.0)[..., None]

# Recolor: where t==0 use TARGET_BG, where t==1 keep arr.
out = arr * t + TARGET_BG * (1.0 - t)

# --- Mask out the two Gemini watermarks ---
# They sit on background (not on the white van/text), so we just paint over
# those rectangles with TARGET_BG.

# Top-left sparkle: very small icon roughly within (0..6% width, 0..15% height).
out[0 : int(h * 0.18), 0 : int(w * 0.06), :] = TARGET_BG

# Bottom-right diamond sparkle: roughly within last ~5% width, last ~25% height.
out[int(h * 0.72) : h, int(w * 0.94) : w, :] = TARGET_BG

# Clamp + back to image
out = np.clip(out, 0, 255).astype(np.uint8)
recolored = Image.fromarray(out, "RGB")

# --- Trim near-uniform background to tighten the logo for the navbar ---
gray_bg = np.all(np.abs(out.astype(np.int16) - TARGET_BG.astype(np.int16)) < 6, axis=2)
mask_fg = ~gray_bg

ys = np.where(mask_fg.any(axis=1))[0]
xs = np.where(mask_fg.any(axis=0))[0]
if ys.size and xs.size:
    pad = 24
    y0 = max(0, ys[0] - pad)
    y1 = min(h, ys[-1] + pad + 1)
    x0 = max(0, xs[0] - pad)
    x1 = min(w, xs[-1] + pad + 1)
    print(f"crop bbox: ({x0},{y0}) -> ({x1},{y1})  size {x1-x0}x{y1-y0}")
    recolored = recolored.crop((x0, y0, x1, y1))

# Resize: target ~64px tall on retina (display height 36px), preserve aspect.
TARGET_H = 96
ratio = TARGET_H / recolored.height
new_w = int(round(recolored.width * ratio))
recolored = recolored.resize((new_w, TARGET_H), Image.LANCZOS)
print(f"final size: {recolored.size}")

recolored.save(DST, optimize=True)
print(f"wrote {DST}  ({DST.stat().st_size // 1024} KB)")
