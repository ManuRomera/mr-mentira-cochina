#!/usr/bin/env python3
"""Capturas de Foundry (Trabajo MENTIRA/capturas/*.png, 2880×1800) y PDF → montajes de docs/img para el README.
Uso: python3 tools/montajes.py"""
import math
from pathlib import Path
import fitz
from PIL import Image, ImageDraw, ImageFilter

CAP = Path("/Volumes/Datos_Dock/FoundryVTT/Trabajo MENTIRA/capturas"); OUT = Path("docs/img"); OUT.mkdir(parents=True, exist_ok=True)
PDF = Path("docs/MR-Mentira-Cochina.pdf")
img = lambda n: Image.open(CAP / f"{n}.png").convert("RGB")
guardar = lambda im, n, q=86: im.save(OUT / f"{n}.webp", "WEBP", quality=q, method=6)

def fondo(w, h, c1=(255, 214, 10), c2=(255, 233, 120)):
    """Rayos de historieta amarillos con trama de puntos."""
    im = Image.new("RGB", (w, h), c1); d = ImageDraw.Draw(im); cx, cy = w / 2, h / 2; R = math.hypot(w, h)
    n = 48
    for i in range(n):
        if i % 2: continue
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        d.polygon([(cx, cy), (cx + R * math.cos(a0), cy + R * math.sin(a0)), (cx + R * math.cos(a1), cy + R * math.sin(a1))], fill=c2)
    for y in range(0, h, 14):
        for x in range((y // 14 % 2) * 7, w, 14): d.ellipse((x, y, x + 3, y + 3), fill=(226, 23, 46, 0) if False else (240, 190, 0))
    return im

def sombra(im, d=10):
    """Recuadro con borde negro y sombra dura, como una viñeta."""
    w, h = im.size; out = Image.new("RGBA", (w + 6 + d, h + 6 + d), (0, 0, 0, 0)); dr = ImageDraw.Draw(out)
    dr.rectangle((d, d, w + 5 + d, h + 5 + d), fill=(27, 21, 21, 255)); dr.rectangle((0, 0, w + 5, h + 5), fill=(27, 21, 21, 255)); out.paste(im, (3, 3)); return out

def rejilla(ims, cols, ancho, hueco=26, margen=40, bg=None):
    t = [sombra(i.resize((ancho, round(i.height * ancho / i.width)), Image.LANCZOS)) for i in ims]
    filas = [t[i:i + cols] for i in range(0, len(t), cols)]
    W = margen * 2 + cols * t[0].width + (cols - 1) * hueco; alto_f = [max(x.height for x in f) for f in filas]; H = margen * 2 + sum(alto_f) + hueco * (len(filas) - 1)
    lienzo = (bg or fondo(W, H)).convert("RGBA"); y = margen
    for f, ah in zip(filas, alto_f):
        x = margen + (W - 2 * margen - len(f) * t[0].width - (len(f) - 1) * hueco) // 2
        for im in f: lienzo.alpha_composite(im, (x, y)); x += im.width + hueco
        y += ah + hueco
    return lienzo.convert("RGB")

# --- Cortinillas: pantalla entera del juego, sin la interfaz ---
guardar(rejilla([img(k).resize((1440, 900), Image.LANCZOS) for k in ["c-amanecer", "c-mediodia", "c-noche", "c-nuevo"]], 2, 760), "cortinillas")
guardar(img("c-amanecer").resize((1600, 1000), Image.LANCZOS), "cortinilla-amanecer", 84)
guardar(img("c-noche").resize((1600, 1000), Image.LANCZOS), "cortinilla-noche", 84)

# --- Fichas de personaje (ventana de 820×822 en la captura) ---
ficha = lambda n: img(f"f-{n}").crop((620, 40, 2260, 1684))
guardar(ficha("pipa").resize((1000, 1003), Image.LANCZOS), "ficha-pipa")
guardar(rejilla([ficha(n) for n in ["bruno", "bibi", "kame", "lulu"]], 2, 640), "fichas", 84)

# --- Panel de dirección (ventana de 780×840) ---
panel = lambda n: img(f"p-{n}").crop((660, 60, 2220, 1740))
guardar(rejilla([panel(n) for n in ["mesa", "retos", "juicio", "reparto"]], 2, 700), "panel", 84)

# --- Chat y diálogo de tirada ---
m = [img("m0").crop((2288, 8, 2872, 868)), img("m1").crop((2288, 283, 2872, 1355)), img("m2").crop((2288, 1362, 2872, 2087))]
dlg = img("dialogo").crop((1040, 470, 1840, 1328))
guardar(rejilla([dlg, *m], 4, 520, margen=50), "chat", 84)
guardar(img("piuuum").resize((1600, 1000), Image.LANCZOS), "piuuum", 84)
guardar(img("diario").crop((400, 40, 2480, 1760)).resize((1500, 1240), Image.LANCZOS), "diario", 84)

# --- PDF: portada, personaje, acto, retos y contraportada ---
d = fitz.open(PDF); pags = [1, 10, 19, 24, len(d)]
guardar(rejilla([Image.frombytes("RGB", (p.width, p.height), p.samples) for p in [d[i - 1].get_pixmap(dpi=90) for i in pags]], 5, 380, hueco=22, margen=34), "pdf", 86)
print("montajes:", sorted(p.name for p in OUT.glob("*.webp")))
