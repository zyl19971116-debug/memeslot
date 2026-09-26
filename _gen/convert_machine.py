"""Convert the new machine render to the public asset PNG."""
from PIL import Image

SRC = r"C:\Users\21194\WorkBuddy\2026-09-21-23-01-50\_gen\new-machine-src.jpg"
OUT = r"C:\Users\21194\WorkBuddy\2026-09-21-23-01-50\public\assets\meme-slot\machine\meme-slot-machine.png"

im = Image.open(SRC).convert("RGB")
# keep detail for the 720px display (2x retina ≈ 1440) — keep original 1536
im.save(OUT, "PNG", optimize=True)
import os
print("saved", OUT, os.path.getsize(OUT) // 1024, "KB", im.size)
