"""Kommandozeile: aus Specs werden Dateien.

    python -m certops_diagram build specs/card-005.yaml
    python -m certops_diagram build specs/            # alle
    python -m certops_diagram icons kendra            # Kurznamen suchen
    python -m certops_diagram check                   # Aliase gegen Vendor prüfen

Je Karte entstehen:
    <id>.svg        Druckfassung mit Titel und Legende (Keynote, PDF)
    <id>.web.svg    nur die Zeichnung, ohne Titel und Legende (App)
    <id>.pdf        Vektor für Folien
    <id>.png        Rasterfassung, doppelte Auflösung
    <id>.json       Titel, Untertitel und Schrittliste für die App
"""
import argparse
import glob
import json
import os
import sys

import yaml

from . import icons
from .canvas import Finding

TEMPLATES = {}


def _template(name):
    if name not in TEMPLATES:
        mod = __import__(f"certops_diagram.templates.{name}", fromlist=["build"])
        TEMPLATES[name] = mod.build
    return TEMPLATES[name]


def load(path):
    with open(path, encoding="utf-8") as f:
        spec = yaml.safe_load(f)
    for key in ("id", "template", "title"):
        if key not in spec:
            raise ValueError(f"{path}: Pflichtfeld '{key}' fehlt")
    return spec


def build_one(path, outdir, formats=("svg", "web", "pdf", "png", "json")):
    spec = load(path)
    cid = spec["id"]
    made = []

    canvas = _template(spec["template"])(spec)
    svg_print = canvas.render()
    if canvas.findings:
        print(f"  {cid}: {len(canvas.findings)} Befund(e)")
        for f in canvas.findings:
            print("   ", f)

    os.makedirs(outdir, exist_ok=True)
    if "svg" in formats:
        p = os.path.join(outdir, f"{cid}.svg")
        open(p, "w", encoding="utf-8").write(svg_print)
        made.append(p)

    if "web" in formats:
        web_spec = dict(spec)
        web_spec["title"] = ""
        web_spec["subtitle"] = None
        web_spec["legend"] = []
        wc = _template(spec["template"])(web_spec)
        p = os.path.join(outdir, f"{cid}.web.svg")
        open(p, "w", encoding="utf-8").write(wc.render())
        made.append(p)

    if "json" in formats:
        p = os.path.join(outdir, f"{cid}.json")
        json.dump({"id": cid, "title": spec["title"], "subtitle": spec.get("subtitle", ""),
                   "steps": spec.get("legend", [])}, open(p, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        made.append(p)

    if "pdf" in formats or "png" in formats:
        try:
            import cairosvg
        except ImportError:
            print("  cairosvg fehlt — PDF und PNG übersprungen")
            return made, canvas.findings
        src = os.path.join(outdir, f"{cid}.svg")
        if "pdf" in formats:
            p = os.path.join(outdir, f"{cid}.pdf")
            cairosvg.svg2pdf(url=src, write_to=p)
            made.append(p)
        if "png" in formats:
            p = os.path.join(outdir, f"{cid}.png")
            cairosvg.svg2png(url=src, write_to=p, scale=2.0)
            made.append(p)

    return made, canvas.findings


def main(argv=None):
    ap = argparse.ArgumentParser(prog="certops_diagram")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build")
    b.add_argument("path")
    b.add_argument("-o", "--out", default="build")
    b.add_argument("--lax", action="store_true", help="trotz Befunden ausgeben")

    i = sub.add_parser("icons")
    i.add_argument("fragment")

    sub.add_parser("check")

    a = ap.parse_args(argv)

    if a.cmd == "icons":
        for k in icons.search(a.fragment):
            print(" ", k)
        return 0

    if a.cmd == "check":
        missing = icons.check_aliases()
        print(f"Aliase: {len(icons.ALIASES)}, fehlende Dateien: {len(missing)}")
        for k, v in missing:
            print("  fehlt:", k, "->", v)
        return 1 if missing else 0

    paths = sorted(glob.glob(os.path.join(a.path, "*.yaml"))) if os.path.isdir(a.path) else [a.path]
    total, failed = 0, 0
    for p in paths:
        spec = load(p)
        if a.lax:
            spec["strict"] = False
        try:
            made, findings = build_one(p, a.out)
            total += 1
            state = "ok" if not findings else f"{len(findings)} Befund(e)"
            print(f"{spec['id']}: {len(made)} Datei(en), {state}")
        except Finding as e:
            failed += 1
            print(f"{spec['id']}: ABGELEHNT\n{e}")
    print(f"\n{total} gebaut, {failed} abgelehnt")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
