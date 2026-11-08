#!/usr/bin/env python3
"""PDF de la aventura con aspecto de revista shōnen semanal de 1995 (B5, papel tintado por secciones, páginas a color).
content/aventura.json + assets/ → «Trabajo MENTIRA/pdf/mentira-cochina.html» → Chrome headless → PDF.
Uso: python3 scripts/pdf.py [salida.pdf]"""
import html, json, re, subprocess, sys
from pathlib import Path

RAIZ = Path.cwd()
OUT = Path("/Volumes/Datos_Dock/FoundryVTT/Trabajo MENTIRA/pdf"); OUT.mkdir(parents=True, exist_ok=True)
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT / "MR-Mentira-Cochina.pdf"
AV = json.load(open("content/aventura.json", encoding="utf-8"))
SYS = json.load(open("system.json"))
CACHE = OUT / "img"; CACHE.mkdir(exist_ok=True)
def A(p):
    """Las ilustraciones opacas van a Chrome como JPEG (las incrusta sin recomprimir); las figuras con alfa, tal cual."""
    src = RAIZ / "assets" / p
    from PIL import Image
    if p.startswith("personajes/") and not p.endswith("-cara.webp") or p.startswith("marca/logo"):
        dst = CACHE / (p.replace("/", "_").rsplit(".", 1)[0] + ".png")
        if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
            im = Image.open(src); im.thumbnail((900, 900), Image.LANCZOS)
            im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(dst, optimize=True)  # paleta: la tinta plana lo soporta
        return dst.as_uri()
    dst = CACHE / (p.replace("/", "_").rsplit(".", 1)[0] + ".jpg")
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        im = Image.open(src).convert("RGB")
        if im.width > 1500: im = im.resize((1500, round(im.height * 1500 / im.width)), Image.LANCZOS)
        im.save(dst, "JPEG", quality=82, optimize=True)
    return dst.as_uri()
hay = lambda p: (RAIZ / "assets" / p).exists()
e = html.escape
cap = {c["n"]: c for c in AV["capitulos"]}

def img(p, clase="", alt=""):
    return f'<img class="{clase}" src="{A(p)}" alt="{e(alt)}">' if hay(p) else ""

def limpia(h):
    """HTML del capítulo para papel: citas como cartuchos de narración, títulos de reto fuera (van en fichas)."""
    h = h.replace("<blockquote>", '<blockquote class="cartucho">')
    return h

def titulo_cap(n, titulo, papel, lamina=None, kana=""):
    return f'''<section class="cap {papel}" id="c{n}">
  <header class="cap-cab"><span class="cap-num">EPISODIO <b>{EP[n]}</b></span><h1>{e(titulo)}</h1><span class="kana">{kana}</span></header>
  {f'<figure class="lamina-bn">{img(lamina)}</figure>' if lamina and hay(lamina) else ""}'''

def splash(n, titulo, lamina, frase, color="rojo"):
    return f'''<section class="splash {color}">
  {img(lamina, "fondo")}
  <div class="splash-rotulo"><span class="cap-num">EPISODIO <b>{EP[n]}</b> · A TODO COLOR</span><h1>{e(titulo)}</h1></div>
  <p class="splash-frase">{frase}</p>
</section>'''

# ---------- Portada ----------
portada = f'''<section class="portada">
  {img("laminas/pdf-portada.webp", "fondo")}
  <div class="cabecera-revista"><span class="cr-semanal">SEMANAL</span><span class="cr-logo">¡PAM!</span>
    <span class="cr-num">NÚM. 47<br>1995<br><b>11·20</b></span></div>
  <div class="precio">220<small>PTAS</small></div>
  <div class="estallido e1">¡NUEVA AVENTURA<br>COMPLETA!</div>
  <div class="estallido e2">¡5 PROTAGONISTAS<br>A TODO COLOR!</div>
  <div class="estallido e3">120 MINUTOS<br>DE CAOS</div>
  {img("marca/logo.webp", "logo-portada")}
  <div class="portada-pie"><span>ESPECIAL VILLA PINGÜINO · PARTIDA FAN NO OFICIAL · REGLAS ¡PAM! 2.0 INCLUIDAS</span><i class="barras"></i></div>
</section>'''

# ---------- Índice (página a color) ----------
SECCIONES = [(1, "crema"), (2, "crema"), (3, "crema"), (4, "crema"), (5, "rosa"), (6, "rosa"), (7, "rosa"), (8, "celeste"), (9, "verde"), (10, "noche"), (11, "crema"), (19, "crema")]
EP = {n: i + 1 for i, (n, _) in enumerate(SECCIONES)}   # episodios correlativos 1–12 (los números del texto fuente saltan)
indice_filas = "".join(f'<li><a href="#c{n}"><span class="ix-n">{EP[n]:02d}</span><b>{e(cap[n]["titulo"])}</b><span class="ix-p"></span></a></li>' for n, _ in SECCIONES)
indice = f'''<section class="indice">
  <h1 class="ix-titulo">ÍNDICE <small>もくじ</small></h1>
  <div class="ix-promesa"><p class="globo">{e(AV["promesa"])}</p>{img("personajes/porco-manana.webp", "ix-porco")}</div>
  <ol class="ix-lista">{indice_filas}<li><a href="#fichas"><span class="ix-n">EX</span><b>Fichas privadas para recortar</b></a></li></ol>
  <div class="staff"><b>STAFF</b> Aventura y sistema: Manu Romera · Arte: generado para esta partida a partir de diseños propios y cosplays · Rótulos: Bangers, Dela Gothic One y Zen Maru Gothic (OFL) · Versión {SYS["version"]} para Foundry VTT 13–14.
  <br><em>Partida fan, original y no oficial, ambientada en el universo de una serie de Akira Toriyama. Sin ánimo de lucro. Para 3–5 participantes y dirección; 120 minutos; comedia de enredo para mesa adulta.</em></div>
</section>'''

# ---------- Personajes (páginas a color) ----------
def ficha_pj(p):
    k = p["clave"]
    return f'''<section class="pj">
  <div class="pj-fondo"></div>
  {img(f"retratos/pj-{k}.webp", "pj-retrato")}
  {img(f"personajes/pj-{k}.webp", "pj-figura")}
  <header><h1>{e(p["nombre"])}</h1><span class="pj-titulo">{e(p["titulo"])}</span></header>
  <p class="globo pj-frase">«{e(p["frase"])}»</p>
  <dl class="pj-datos">
    <dt class="amarillo">Talento estrella</dt><dd>{e(p["talento"])}</dd>
    <dt class="rojo">Defecto</dt><dd>{e(p["defecto"])}</dd>
    <dt class="cian">Quiere conseguir hoy</dt><dd>{e(p["objetivo"])}</dd>
    <dt class="rosa">Vínculos</dt><dd>{e(p["vinculo"])}</dd>
    <dt class="negro">Presentación</dt><dd>{e(p["presentacion"])}</dd>
  </dl>
  <div class="pj-secreto"><b>SOLO DIRECCIÓN</b> Mentira habitual: «{e(p["mentira"])}» · Verdad vergonzosa: {e(p["verdad"])} {f'Confesión posible: {e(p["confesion"])}' if p["confesion"] else ""}<br><b>Reto personal</b> {e(p["reto"])}</div>
</section>'''

# ---------- Retos en tarjetas ----------
def reto(r):
    return f'''<article class="reto"><header><span class="reto-cod">{r["id"]}</span><h3>{e(r["titulo"])}</h3><small>{e(r["quien"])} · {e(r["cuando"])}</small></header>
  <p><b>Mentira</b> {e(r.get("mentira",""))}</p><p><b>Urgencia</b> {e(r.get("urgencia",""))}</p><p><b>Opciones</b> {e(r.get("opciones",""))}</p>
  <p><b>Giro</b> {e(r.get("giro",""))}</p><p><b>Secuela</b> {e(r.get("secuela",""))}</p></article>'''

intro8 = cap[8]["html"].split("<h2>", 1)[0]
seleccion = cap[8]["html"].split("<h3>Selección rápida recomendada</h3>", 1)
seleccion = "<h3>Selección rápida recomendada</h3>" + seleccion[1] if len(seleccion) > 1 else ""

# ---------- Galerías ----------
VEC = [("ment", "ME-NT [1R]"), ("porco-manana", "Porco"), ("pnj-frambuesa", "Presidenta Frambuesa"), ("pnj-cafelina", "Doña Cafelina"), ("pnj-goro", "Goro"),
       ("pnj-dragona", "La vecina dragona"), ("pnj-alcalde", "El alcalde porcino"), ("pnj-tanaka", "Señor Tanaka"), ("pnj-alien", "El amigo espacial"),
       ("pnj-ramona", "Ramona Ráting"), ("pnj-policia-a", "Agente alto"), ("pnj-policia-b", "Agente bajito"), ("pnj-anciano", "Heladero jubilado"),
       ("pnj-bombero", "Bombero canino"), ("pnj-pinguino", "Pingüino delegado"), ("pnj-heladeros", "Los heladeros"),
       ("canon-senbei", "Senbei"), ("canon-midori", "Midori"), ("canon-arale", "Arale"), ("canon-gatchan", "Gatchan"), ("canon-suppaman", "Suppaman"),
       ("canon-akane", "Akane"), ("canon-soramame", "Tarō Soramame"), ("canon-peasuke", "Peasuke"), ("canon-criaturas", "Criaturas verdes")]
vecinos = "".join(f'<figure>{img(f"personajes/{k}-cara.webp")}<figcaption>{e(n)}</figcaption></figure>' for k, n in VEC if hay(f"personajes/{k}-cara.webp"))
ESC = sorted(p.stem for p in (RAIZ / "assets/escenas").glob("*.webp") if not p.stem.endswith("thumb"))
NOMBRES = {"00-amanecer": "Amanecer", "01-mediodia": "Mediodía", "02-noche": "Noche", "03-nuevo-amanecer": "Nuevo amanecer", "04-entrada": "Camino de entrada",
           "05-plaza": "La plaza", "06-taller-exterior": "El taller", "07-taller-interior": "Dentro del taller", "08-cafeteria-exterior": "La cafetería Tetera",
           "09-cafeteria-interior": "Dentro de la cafetería", "10-archivo": "Archivo municipal", "11-puente": "El puente", "12-calle-noche": "Calle dormida",
           "13-azotea": "La azotea", "14-campanario": "El campanario", "15-plaza-cataclismo": "La plaza tras el caos"}
decorados = "".join(f'<figure>{img(f"escenas/{k}-thumb.webp")}<figcaption>{e(NOMBRES.get(k, k))}</figcaption></figure>' for k in ESC)

fichas = "".join(f'''<div class="recorte"><h3>{e(p["nombre"])} <small>{e(p["titulo"])}</small></h3>
  <p><b>Talento</b> {e(p["talento"])} <b>Defecto</b> {e(p["defecto"])}</p><p><b>Quiero conseguir hoy</b> {e(p["objetivo"])}</p>
  <p><b>Mi mentira que suelo contar</b> «{e(p["mentira"])}»</p><p><b>La verdad que no quiero decir</b> {e(p["verdad"])}</p>
  <p><b>Una persona a la que podría defraudar</b> ____________________ <b>Jamás perdonaría que me quitaran</b> ____________________</p>
  <p class="ficha-ya">☐ Ficha «¡ESO YA LO SABÍA!»</p></div>''' for p in AV["pjs"])

FIGURAS = ["porco-mediodia", "ment", "pj-kame", "porco-noche", "pnj-dragona", "canon-arale", "pnj-alien", "pj-bruno", "canon-gatchan", "ment-timido", "pj-lulu", "pnj-alcalde"]
def construir(rellenos):
  def RELLENO(n):
    alto = rellenos.get(n, 0)
    marca = f'<span class="fincap">FINCAP{n:02d}</span>'
    if alto < 40: return marca
    fig = FIGURAS[n % len(FIGURAS)]
    return f'<div class="continuara" style="height:{alto}mm">{img(f"personajes/{fig}.webp")}<b>¡CONTINUARÁ!</b><span>つづく</span></div>{marca}'
  cuerpo = [portada, indice]
  for n, papel in SECCIONES:
      c = cap[n]
      if n == 4:
          cuerpo.append(titulo_cap(4, c["titulo"], "crema", kana="キャラクター") + '<div class="texto">' + limpia(c["html"].split("<h2>", 1)[0]) + f"</div>{RELLENO(4)}</section>")
          cuerpo += [ficha_pj(p) for p in AV["pjs"]]
          continue
      if n in (6, 7, 10, 19):
          lam = {6: "laminas/pdf-acto1.webp", 7: "laminas/pdf-acto2.webp", 10: "laminas/pdf-acto3.webp", 19: "laminas/pdf-final.webp"}[n]
          frases = {6: "¡OIIIIINK! ¡BUENOS DÍAS, VILLA PINGÜINOOOO!", 7: "¡Los humanos sois unos mal diseñados!", 10: "«Que cuando dormís… por fin dejáis de mentir».", 19: "¡O por lo menos va a intentarlo!"}
          cuerpo.append(splash(n, c["titulo"], lam, e(frases[n]), "noche" if n == 10 else "rojo"))
      lam = {1: "laminas/bn-pulso.webp", 2: "laminas/bn-mando.webp", 3: "laminas/bn-dados.webp", 5: "laminas/bn-porco.webp", 8: "laminas/bn-moto.webp", 9: "laminas/bn-cameos.webp", 10: "laminas/bn-tejado.webp"}.get(n)
      kana = {1: "マシン", 2: "ルール", 3: "パム!", 5: "とけい", 6: "あさ", 7: "ひる", 8: "ピウーン!", 9: "むら", 10: "よる", 11: "メモ", 19: "おわり"}.get(n, "")
      if n == 8:
          cuerpo.append(titulo_cap(8, c["titulo"], papel, lam, kana) + f'<div class="texto">{intro8}</div><div class="retos">{"".join(reto(r) for r in AV["retos"])}</div><div class="texto">{seleccion}</div>{RELLENO(8)}</section>')
          continue
      texto = limpia(c["html"])
      if n == 10 and hay("laminas/bn-juicio.webp"):
          texto = texto.replace("<h2>10.3.", f'<figure class="lamina-bn ancha">{img("laminas/bn-juicio.webp")}</figure><h2>10.3.', 1)
      cuerpo.append(titulo_cap(n, c["titulo"], papel, lam, kana) + f'<div class="texto">{texto}</div>{RELLENO(n)}</section>')

  cuerpo.append(f'<section class="galeria"><h1 class="gal-titulo">¡TODOS LOS VECINOS! <small>Reparto de Villa Pingüino</small></h1><div class="gal-caras">{vecinos}</div></section>')
  cuerpo.append(f'<section class="galeria decorados"><h1 class="gal-titulo">DECORADOS <small>16 escenas incluidas en Foundry</small></h1><div class="gal-esc">{decorados}</div></section>')
  cuerpo.append(f'<section class="cap crema" id="fichas"><header class="cap-cab"><span class="cap-num">EXTRA</span><h1>Fichas privadas para recortar</h1><span class="kana">ひみつ</span></header><p class="texto">Entrega a cada jugador la suya en privado. Las verdades son ficción del personaje; se pueden cambiar por un secreto de orgullo, dinero, trabajo, rivalidad o metedura de pata. No hay castigo por no confesarlo.</p><div class="recortes">{fichas}</div></section>')
  cuerpo.append(f'''<section class="encuesta"><h1>¡ENCUESTA DEL LECTOR! <small>アンケート</small></h1>
    <p>Rellena la postal y envíala a la Redacción de ¡PAM!, Apartado de Correos de Villa Pingüino. Entre todas las respuestas sortearemos un ME-NT [1R] que, probablemente, no funciona.</p>
    <ol><li>¿Qué mentira os salió más cara? ______________________</li><li>¿Qué final jugasteis? ☐ A ☐ B ☐ C ☐ D ☐ Otro magnífico desastre</li>
    <li>¿Cuántas veces sonó ¡PIUUUM!? ☐ 1–5 ☐ 6–10 ☐ Perdimos la cuenta</li><li>¿Quién confesó primero? ______________________</li>
    <li>¿Qué secuela queréis volver a ver? ______________________</li></ol>{img("personajes/ment-timido.webp", "enc-ment")}</section>''')
  cuerpo.append(f'''<section class="contra">
    <div class="anuncio"><span class="an-nuevo">¡NUEVO!</span><h1>ME-NT [1R]</h1><p class="an-sub">EL MATERIALIZADOR DE NARRACIONES TRAMPOSAS</p>
    {img("personajes/ment.webp", "an-ment")}
    <ul><li>¡Con parabólica gigante giratoria!</li><li>¡Dos abanicos de papel de verdad!</li><li>¡Mando a distancia NO incluido (se lo comió alguien)!</li></ul>
    <p class="an-letra">Las mentiras que digas cerca de este producto pueden hacerse realidad. El fabricante no se hace responsable de casas voladoras, alcaldes porcinos ni suegras dragonas.</p>
    <div class="an-precio">¡Sólo<br><b>9.995</b><br>ptas!</div></div>
    {img("marca/logo.webp", "contra-logo")}<p class="contra-pie">MR- ¡Mentira Cochina! · Manu Romera · Digital RPG Design · v{SYS["version"]}</p>
  </section>''')
  return cuerpo

F = (RAIZ / "fonts").as_uri()
CSS = (RAIZ / "scripts" / "pdf.css").read_text(encoding="utf-8").replace("FUENTES", F)
import fitz
H = OUT / "mentira-cochina.html"; crudo = OUT / "crudo.pdf"
def imprimir(rellenos):
    doc = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>¡Mentira Cochina!</title><style>{CSS}</style></head><body>{"".join(construir(rellenos))}</body></html>'
    H.write_text(doc, encoding="utf-8")
    subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
                    "--virtual-time-budget=20000", f"--print-to-pdf={crudo}", H.as_uri()], check=True, capture_output=True)
    return fitz.open(crudo)

# Pasada 1: dónde acaba cada capítulo y cuánto papel queda debajo. Si el siguiente bloque empieza en página nueva,
# el hueco se llena con una viñeta «¡CONTINUARÁ!» a medida (pasada 2).
MM = 72 / 25.4
d = imprimir({})
rellenos = {}
for n, _ in SECCIONES:
    for pg in d:
        r = pg.search_for(f"FINCAP{n:02d}")
        if not r: continue
        siguiente = [m for m, _ in SECCIONES if m > n]
        mismo = siguiente and pg.search_for(f"EPISODIO {EP[siguiente[0]]}")
        libre = (pg.rect.height - 17 * MM - r[0].y1) / MM
        if not mismo and libre > 45: rellenos[n] = round(libre - 9)
        break
d = imprimir(rellenos)
print("rellenos:", rellenos)

# Índice con números de página reales: se buscan los títulos y se rellena con PyMuPDF.
pags = {}
for n, _ in SECCIONES:
    for i in range(2, len(d)):
        if d[i].search_for(f"EPISODIO {EP[n]}"):
            pags[n] = i + 1; break
idx = d[1]
for n, p in pags.items():
    for r in idx.search_for(cap[n]["titulo"][:28]):
        idx.insert_text((r.x0 + 330 if r.x0 < 300 else r.x1 + 6, r.y1 - 1), f"p. {p}", fontsize=10, fontname="helv", color=(0.89, 0.09, 0.18))
        break
for i in range(2, len(d)):
    if "EXTRA" in d[i].get_text() and "Fichas privadas para recortar" in d[i].get_text():  # sensible a mayúsculas: «extra» aparece en el texto
        for r in idx.search_for("Fichas privadas para recortar"):
            idx.insert_text((r.x0 + 330, r.y1 - 1), f"p. {i + 1}", fontsize=10, fontname="helv", color=(0.89, 0.09, 0.18)); break
        break
d.save(PDF, garbage=1, deflate=True)  # garbage≥3 o rewrite_images rompen los subconjuntos de fuentes de Chrome
print(f"{PDF}: {len(d)} páginas, {PDF.stat().st_size / 1e6:.1f} MB · índice {pags}")
