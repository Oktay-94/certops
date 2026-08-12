"""R16: engster Abstand freier Labels zu Boxkanten. -1 = Ueberlappung."""
import glob, sys, xml.etree.ElementTree as ET
from qc import collect, text_bbox
pat = sys.argv[1] if len(sys.argv) > 1 else "battle_card_*.svg"
for f in sorted(glob.glob(pat)):
    root = ET.parse(f).getroot()
    rects, texts, segs, circles = collect(root)
    boxes = [r for r in rects if not r["zone"]]
    badge_t = {i for i, t in enumerate(texts) for c in circles
               if abs(t["x"]-c["cx"]) < 1 and abs(t["y"]-(c["cy"]+6)) < 1}
    worst = []
    for i, t in enumerate(texts):
        if i in badge_t:
            continue
        if any(b["x0"] <= t["x"] <= b["x1"] and b["y0"] <= t["y"] <= b["y1"] for b in boxes):
            continue
        x0, y0, x1, y1 = text_bbox(t)
        for b in boxes:
            dx = max(b["x0"]-x1, x0-b["x1"], 0); dy = max(b["y0"]-y1, y0-b["y1"], 0)
            worst.append((-1 if (dx == 0 and dy == 0) else max(dx, dy), t["text"]))
    worst.sort()
    print(f, f"{worst[0][0]:.1f} px  '{worst[0][1]}'" if worst else "keine freien Labels")
