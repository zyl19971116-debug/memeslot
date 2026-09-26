"""
Meme Slot asset post-processor.
- Crops the bottom-right generator watermark (bottom strip).
- Optional background removal via border flood-fill (PIL floodfill with magic color).
- Optional detection of the 3 slot reel windows (dark rectangles) -> JSON.

Usage: python process.py jobs.json
job = {
  "src": "...", "dst": "...",
  "cropBottom": 0.09,          # fraction of height to crop from bottom
  "removeBg": true,            # flood-fill bg -> transparent
  "bgThresh": 40,              # flood fill tolerance
  "detectWindows": true,       # output reel window boxes (percent)
  "maxSize": 1024              # downscale so files stay light
}
"""
import json
import sys
import os
from PIL import Image, ImageDraw, ImageFilter

MAGIC = (255, 0, 254)  # magenta-ish key color


def flood_remove_bg(im, thresh):
    im = im.convert("RGBA")
    rgb = im.convert("RGB")
    w, h = im.size
    seeds = [
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
        (w // 2, 2), (w // 2, h - 3), (2, h // 2), (w - 3, h // 2),
    ]
    for s in seeds:
        try:
            px = rgb.getpixel(s)
            if sum(px[:3]) < 330:
                continue
            ImageDraw.floodfill(rgb, s, MAGIC, thresh=thresh)
        except Exception:
            pass
    mask = Image.new("L", im.size, 255)
    mp = mask.load()
    rp = rgb.load()
    for y in range(h):
        for x in range(w):
            r, g, b = rp[x, y][:3]
            if r > 240 and g < 24 and b > 240:
                mp[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mask)
    return im


def clear_edge_dark_fragments(im, band=16, dark_sum=250):
    """Kill dark watermark fragments left near the image borders."""
    w, h = im.size
    rgb = im.convert("RGB")
    rp = rgb.load()
    mask = im.getchannel("A")
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if x < band or x >= w - band or y < band or y >= h - band:
                r, g, b = rp[x, y][:3]
                if r + g + b < dark_sum:
                    mp[x, y] = 0
    im.putalpha(mask)
    return im


def crop_bottom(im, frac):
    w, h = im.size
    return im.crop((0, 0, w, max(1, int(h * (1 - frac)))))


def downscale(im, max_size):
    w, h = im.size
    if max(w, h) <= max_size:
        return im
    if w >= h:
        nw, nh = max_size, int(h * max_size / w)
    else:
        nw, nh = int(w * max_size / h), max_size
    return im.resize((nw, nh), Image.LANCZOS)


def detect_windows(im):
    g = im.convert("L")
    w, h = g.size
    band_top, band_bot = int(h * 0.15), int(h * 0.60)
    px = g.load()
    dark_thr = 140
    col_counts = []
    for x in range(w):
        c = 0
        for y in range(band_top, band_bot):
            if px[x, y] < dark_thr:
                c += 1
        col_counts.append(c)
    band_h = band_bot - band_top
    runs = []
    in_run = False
    for x, c in enumerate(col_counts):
        filled = c > band_h * 0.45
        if filled and not in_run:
            start = x
            in_run = True
        elif not filled and in_run:
            runs.append((start, x - 1))
            in_run = False
    if in_run:
        runs.append((start, w - 1))
    runs = [r for r in runs if (r[1] - r[0]) > w * 0.08]
    boxes = []
    for (x0, x1) in runs:
        ys = []
        for y in range(band_top, band_bot):
            dark_in_col = sum(1 for x in range(x0, x1 + 1, 3) if px[x, y] < dark_thr)
            if dark_in_col > (x1 - x0) / 3 * 0.5:
                ys.append(y)
        if ys:
            y0, y1 = min(ys), max(ys)
            boxes.append({
                "left": round(x0 / w * 100, 2),
                "top": round(y0 / h * 100, 2),
                "width": round((x1 - x0 + 1) / w * 100, 2),
                "height": round((y1 - y0 + 1) / h * 100, 2),
                "dark_thr": dark_thr,
            })
    return boxes


def main():
    jobs_path = sys.argv[1]
    with open(jobs_path, "r", encoding="utf-8") as f:
        jobs = json.load(f)
    report = []
    for job in jobs:
        src, dst = job["src"], job["dst"]
        im = Image.open(src).convert("RGBA")
        im = crop_bottom(im, job.get("cropBottom", 0.09))
        if job.get("removeBg"):
            im = flood_remove_bg(im, job.get("bgThresh", 40))
            im = clear_edge_dark_fragments(im)
        if job.get("maxSize"):
            im = downscale(im, job["maxSize"])
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im.save(dst, "PNG", optimize=True)
        entry = {"src": src, "dst": dst, "size": list(im.size)}
        if job.get("detectWindows"):
            entry["windows"] = detect_windows(im)
        report.append(entry)
        print(json.dumps(entry))
    with open(os.path.join(os.path.dirname(jobs_path), "process_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()
