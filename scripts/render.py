#!/usr/bin/env python3
"""Rendern mit erzwungenem Graustufen-AA (R18).

Der Container-Cairo rendert Text per Default mit Subpixel-AA und erzeugt
farbige Glyphensaeume -> Kanaldivergenz im Titelband > 0. Alle 60 bisherigen
Karten sind auf Graustufen-AA vereinheitlicht; neue Karten muessen dazu passen.
"""
import sys
import cairocffi
import cairosvg

_set_fo = cairocffi.Context.set_font_options


def _patched_set_fo(self, opts):
    opts.set_antialias(cairocffi.ANTIALIAS_GRAY)
    return _set_fo(self, opts)


cairocffi.Context.set_font_options = _patched_set_fo

_ctx_init = cairocffi.Context.__init__


def _new_ctx_init(self, target):
    _ctx_init(self, target)
    fo = cairocffi.FontOptions()
    fo.set_antialias(cairocffi.ANTIALIAS_GRAY)
    _set_fo(self, fo)


cairocffi.Context.__init__ = _new_ctx_init


def render(stem):
    cairosvg.svg2png(url=f"{stem}.svg", write_to=f"{stem}.png", output_width=2400)
    cairosvg.svg2pdf(url=f"{stem}.svg", write_to=f"{stem}.pdf")
    print(f"{stem}: PNG (2400 px) + PDF gerendert, Graustufen-AA")


if __name__ == "__main__":
    for s in sys.argv[1:]:
        render(s)
