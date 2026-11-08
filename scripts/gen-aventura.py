#!/usr/bin/env python3
"""content/aventura.json + assets → _data/aventura.json (un documento Adventure con escenas, actores, diarios y carpetas).
Solo incluye lo que tiene arte en assets/. Uso: python3 scripts/gen-aventura.py"""
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0, "/Volumes/Datos_Dock/FoundryVTT/Trabajo LOGO/marca")
import marca  # caja del brillo animado de la marca

ID = "mr-mentira-cochina"; R = f"systems/{ID}/assets"; A = Path("assets")
AV = json.load(open("content/aventura.json", encoding="utf-8"))
uid = lambda t: hashlib.sha1(f"{ID}:{t}".encode()).hexdigest()[:16]
hay = lambda p: (A / p).exists()
STATS = {"systemId": ID, "systemVersion": json.load(open("system.json"))["version"], "coreVersion": "13.351"}

def carpeta(nombre, tipo, color, orden):
    return {"_id": uid(f"carpeta-{tipo}-{nombre}"), "name": nombre, "type": tipo, "color": color, "sorting": "m", "sort": orden, "folder": None, "description": "", "flags": {}}

folders = [carpeta("Personajes jugadores", "Actor", "#e2172e", 1), carpeta("Vecinos de la villa", "Actor", "#0f9ad8", 2),
           carpeta("Reparto clásico (cameos)", "Actor", "#2fa84f", 3), carpeta("Cortinillas", "Scene", "#ffd60a", 1),
           carpeta("Villa Pingüino de día", "Scene", "#0f9ad8", 2), carpeta("La noche", "Scene", "#1d2350", 3)]
F = {f["name"]: f["_id"] for f in folders}

# ---------- Actores ----------
def token(img, w=1.2, h=1.8, nombre=None):
    return {"name": nombre, "texture": {"src": img, "fit": "contain", "scaleX": 1, "scaleY": 1}, "width": w, "height": h,
            "lockRotation": True, "displayName": 30, "disposition": 1, "actorLink": True, "ring": {"enabled": False}, "sight": {"enabled": False}}

actores = []
for i, p in enumerate(AV["pjs"]):
    k = p["clave"]
    actores.append({"_id": uid(f"pj-{k}"), "name": p["nombre"], "type": "pj", "img": f"{R}/retratos/pj-{k}.webp", "folder": F["Personajes jugadores"], "sort": i,
        "system": {kk: p.get(kk, "") for kk in ["titulo", "talento", "defecto", "objetivo", "vinculo", "frase", "presentacion", "mentira", "verdad", "confesion", "reto"]}
                  | {"defraudar": "", "jamas": "", "yaLoSabia": False, "notas": ""},
        "prototypeToken": token(f"{R}/personajes/pj-{k}.webp", nombre=p["nombre"]), "ownership": {"default": 0}, "flags": {ID: {"retrato": {"x": 0.5, "y": 0.4, "z": 1.15}}}})

PNJ = [  # (archivo, nombre, papel, frase, descripción, carpeta)
 ("ment", "ME-NT [1R]", "Materializador Electromagnético de Narraciones Tramposas", "¡Yo no invento las mentiras, listillo! ¡Las inventáis vosotros!",
  "Caja amarilla con parabólica, abanicos y zapatones. Ingeniosa, petulante y burlona con quien se engaña a sí mismo; se paraliza cuando alguien acepta una verdad dolorosa. Quiere que la traten como alguien que puede elegir. Voz metálica y nasal; ríe «¡JE-JE-JE-JE!». Jamás se ríe del dolor grave.", "Vecinos de la villa"),
 ("porco-manana", "Porco", "Cerdito narrador en el árbol", "¡OIIIIINK! ¡BUENOS DÍAS, VILLA PINGÜINOOOO!", "Presenta cada cortinilla desde su rama con la cámara y el flash.", "Vecinos de la villa"),
 ("pnj-frambuesa", "Presidenta Frambuesa", "Presidenta de la asociación vecinal", "", "Anciana bajita de pelo rosa y gafas turquesa con un libro rojo atado con lazo. Recuerda que el prototipo se probaba al anochecer, «cuando por fin no había mil bocazas dando su opinión».", "Vecinos de la villa"),
 ("pnj-cafelina", "Doña Cafelina", "Dueña de la cafetería", "", "Moño plateado altísimo, delantal de cuadros y una sonrisa que esconde una furia formidable. Cobra consumición hasta a los camiones de bomberos.", "Vecinos de la villa"),
 ("pnj-goro", "Goro", "Repartidor canino", "", "Perro repartidor, serio y demasiado literal.", "Vecinos de la villa"),
 ("pnj-dragona", "La vecina dragona", "Suegra con bata (R06)", "", "Una dragona con rulos y bolso que solo quiere hablar con su hija y que el yerno la visite.", "Vecinos de la villa"),
 ("pnj-alcalde", "El alcalde porcino", "Efecto del reto R10", "", "Alcalde con hocico y pezuñas que debe firmar un permiso y no puede sujetar el bolígrafo. Por primera vez es popular.", "Vecinos de la villa"),
 ("pnj-tanaka", "Señor Tanaka", "Vecino de excusas perpetuas", "", "Tendero de cortinilla imposible, siempre inventando una excusa con dos recibos en la mano.", "Vecinos de la villa"),
 ("pnj-alien", "El amigo espacial de Kame", "Visitante imposible (R04)", "", "Dos metros y medio de amabilidad lavanda con tres ojos, dieciocho maletas, una trompeta cuántica y una mascota que come paredes.", "Vecinos de la villa"),
 ("pnj-ramona", "Ramona Ráting", "Agente comercial sin escrúpulos", "", "PNJ opcional: productora televisiva que quiere comprar ME-NT para un concurso.", "Vecinos de la villa"),
 ("pnj-policia-a", "Agente alto", "Pareja de policías", "", "Cameo: uniforme caqui y gorra de plato; tareas absurdas propias.", "Vecinos de la villa"),
 ("pnj-policia-b", "Agente bajito", "Pareja de policías", "", "Cameo: bigotazo y manos en la cintura.", "Vecinos de la villa"),
 ("pnj-anciano", "Heladero jubilado", "Cameo", "", "Anciano de gafas redondas oscuras que siempre está comiendo algo.", "Vecinos de la villa"),
 ("pnj-bombero", "Bombero canino", "Reto R14", "", "El bombero con más experiencia: no deja de perseguir la manguera.", "Vecinos de la villa"),
 ("pnj-pinguino", "Pingüino delegado", "Reto R02", "", "Se presenta como director del zoo y reclama horas extras.", "Vecinos de la villa"),
 ("pnj-heladeros", "Los heladeros", "Subtrama de Suppaman", "", "Dos vendedores de helados confundidos con atracadores internacionales.", "Vecinos de la villa"),
 ("canon-senbei", "Senbei", "Inventor (cameo)", "", "Construyó ME-NT. Tiene su propia trama tontísima (el cinturón abdominal) y no viene a resolver la partida.", "Reparto clásico (cameos)"),
 ("canon-midori", "Midori", "Cameo", "", "Encuentra el manual: «USO MÁXIMO: 5 SEGUNDOS».", "Reparto clásico (cameos)"),
 ("canon-arale", "Arale", "Cameo", "¡N'CHA!", "Arrastra una correa unida a algo demasiado grande para verse. Si al final alza el planeta con un dedo, no hay pulso: no estaba mintiendo.", "Reparto clásico (cameos)"),
 ("canon-gatchan", "Gatchan", "Cameo", "", "Se comió ayer el mando de ME-NT, que crujió como una galleta. No vuelve a aparecer oportunamente.", "Reparto clásico (cameos)"),
 ("canon-suppaman", "Suppaman", "Cameo", "", "Confunde a dos heladeros con atracadores internacionales y los persigue tumbado en su monopatín.", "Reparto clásico (cameos)"),
 ("canon-akane", "Akane", "Cameo", "", "Cambia las flechas de una señal para mandarlas al mar: «arte contemporáneo».", "Reparto clásico (cameos)"),
 ("canon-soramame", "Tarō Soramame", "Cameo (no confundir con Kame)", "", "Cómplice de Akane en lo de las señales.", "Reparto clásico (cameos)"),
 ("canon-peasuke", "Peasuke", "Cameo", "", "Quiere demostrar que su casco lo protege de todo.", "Reparto clásico (cameos)"),
 ("canon-criaturas", "Criaturas verdes", "Cameo", "", "Pasean por la villa con sus propias tareas absurdas.", "Reparto clásico (cameos)"),
]
for i, (k, nombre, papel, frase, desc, carp) in enumerate(PNJ):
    if not hay(f"personajes/{k}.webp"): continue
    img = f"{R}/retratos/ment.webp" if k == "ment" and hay("retratos/ment.webp") else f"{R}/retratos/porco.webp" if k.startswith("porco") and hay("retratos/porco.webp") else f"{R}/personajes/{k}-cara.webp"
    ancho = 1.6 if k in ("pnj-heladeros", "canon-criaturas", "pnj-dragona") else 1.2
    actores.append({"_id": uid(f"pnj-{k}"), "name": nombre, "type": "pnj", "img": img, "folder": F[carp], "sort": i,
        "system": {"papel": papel, "frase": frase, "descripcion": desc, "notas": ""},
        "prototypeToken": token(f"{R}/personajes/{k}.webp", ancho, 1.8 if k != "ment" else 1.4, nombre) | {"disposition": 0, "actorLink": k in ("ment", "porco-manana")},
        "ownership": {"default": 0}, "flags": {}})

# ---------- Escenas ----------
ESCENAS = [  # clave, nombre, carpeta, nav
 ("00-amanecer", "Cortinilla · ¡Buenos días!", "Cortinillas", True), ("01-mediodia", "Cortinilla · ¡A comer!", "Cortinillas", False),
 ("02-noche", "Cortinilla · ¡Buenas noches!", "Cortinillas", False), ("03-nuevo-amanecer", "Cortinilla · Nuevo amanecer", "Cortinillas", False),
 ("04-entrada", "Camino de entrada", "Villa Pingüino de día", True), ("05-plaza", "La plaza de la fuente", "Villa Pingüino de día", True),
 ("06-taller-exterior", "El taller del inventor", "Villa Pingüino de día", True), ("07-taller-interior", "Dentro del taller", "Villa Pingüino de día", False),
 ("08-cafeteria-exterior", "La cafetería Tetera", "Villa Pingüino de día", True), ("09-cafeteria-interior", "Dentro de la cafetería", "Villa Pingüino de día", False),
 ("10-archivo", "El archivo municipal", "Villa Pingüino de día", False), ("11-puente", "El puente del río", "Villa Pingüino de día", False),
 ("15-plaza-cataclismo", "La plaza, después del caos", "Villa Pingüino de día", False), ("12-calle-noche", "Calle dormida", "La noche", True),
 ("13-azotea", "La azotea (refugio)", "La noche", True), ("14-campanario", "El campanario", "La noche", False)]
# Capas de las cortinillas: (archivo, x, y, alto) en una escena de 1920×1080. Se ajustan mirando cada decorado.
CAPAS = json.load(open("content/capas.json")) if Path("content/capas.json").exists() else {}
bx, by, bw, bh = marca.caja_animada(1920, 1080)

def tile(src, x, y, w, h, n, alfa=1):
    return {"_id": uid(f"tile-{n}"), "texture": {"src": src, "fit": "fill", "scaleX": 1, "scaleY": 1}, "x": x, "y": y, "width": w, "height": h,
            "elevation": 0, "sort": 10 + len(n), "rotation": 0, "alpha": alfa, "hidden": False, "locked": True, "restrictions": {"light": False, "weather": False},
            "occlusion": {"mode": 0, "alpha": 0}, "video": {"loop": True, "autoplay": True, "volume": 0}, "flags": {ID: {"capa": n}}}

def medidas(p):
    from PIL import Image
    return Image.open(A / p).size

escenas = []
for i, (k, nombre, carp, nav) in enumerate(ESCENAS):
    if not hay(f"escenas/{k}.webp"): continue
    tiles = [tile(f"{R}/marca/mr-marca.webm", bx, by, bw, bh, f"{k}-marca")]
    for (arch, x, y, alto) in CAPAS.get(k, []):
        if hay(f"personajes/{arch}.webp"):
            w, h = medidas(f"personajes/{arch}.webp"); ancho = round(w * alto / h)
            tiles.append(tile(f"{R}/personajes/{arch}.webp", x, y, ancho, alto, f"{k}-{arch}"))
    escenas.append({"_id": uid(f"escena-{k}"), "name": nombre, "folder": F[carp], "sort": i * 100, "navigation": nav, "navOrder": i, "navName": nombre,
        "background": {"src": f"{R}/escenas/{k}.webp"}, "thumb": f"{R}/escenas/{k}-thumb.webp", "width": 1920, "height": 1080, "padding": 0,
        "backgroundColor": "#1d2350" if carp == "La noche" else "#f5eedb", "grid": {"type": 0, "size": 100, "distance": 1, "units": "m"},
        "tokenVision": False, "fog": {"exploration": False}, "environment": {"globalLight": {"enabled": True}},
        "tiles": tiles, "tokens": [], "drawings": [], "lights": [], "notes": [], "sounds": [], "templates": [], "walls": [], "regions": [],
        "initial": {"x": 960, "y": 540, "scale": 0.5}, "ownership": {"default": 0}, "flags": {ID: {"escena": k}}})

# ---------- Diarios ----------
def pagina(nombre, html, n, img=None, nivel=1):
    if img and hay(img): html = f'<p><img src="{R}/{img}" alt=""></p>' + html
    return {"_id": uid(f"pag-{nombre}"), "name": nombre, "type": "text", "title": {"show": True, "level": nivel}, "sort": n * 100,
            "text": {"format": 1, "content": html}, "ownership": {"default": -1}, "flags": {}}

LAMINAS = {6: "laminas/pdf-acto1.webp", 7: "laminas/pdf-acto2.webp", 10: "laminas/pdf-acto3.webp", 19: "laminas/pdf-final.webp", 3: "laminas/bn-dados.webp", 2: "laminas/bn-mando.webp", 1: "laminas/bn-pulso.webp", 8: "laminas/bn-moto.webp", 9: "laminas/bn-cameos.webp"}
USO = f"""<p><strong>{AV['promesa']}</strong></p>
<p>Partida fan, original y no oficial, ambientada en Villa Pingüino. Para 3–5 jugadores y dirección; dura <strong>120 minutos reales</strong>. Comedia de enredo para mesa adulta.</p>
<h2>Cómo se juega en Foundry</h2>
<ul>
<li><strong>Panel de dirección</strong> (botón en el directorio de Actores, en la barra de tokens o haciendo clic en la cartela de arriba): reloj real con avisos de cortinilla, <em>Desbarajuste</em> 0–6, <em>Ruido</em> 0–4, el botón <strong>¡PIUUUM!</strong>, las cuatro cortinillas, los 18 retos flotantes, el juicio de las mentiras con las provocaciones de ME-NT y los cuatro finales.</li>
<li><strong>Cortinillas:</strong> activan su decorado con el Sol (o la Luna) y Porco en su rama y leen la narración en el chat. Toca a los 40, 80 y 112 minutos.</li>
<li><strong>¡PIUUUM!</strong> cada vez que alguien miente y ME-NT lo materializa: destello, anillos y sonido en todas las pantallas.</li>
<li><strong>Personajes:</strong> cada jugador tiene su perfil con el botón <strong>¡PAM!</strong> (2d6, +1 por talento, +1 por cada PJ que ayuda, máximo 4d6, suman los dos mejores) y su ficha «¡Eso ya lo sabía!». Su ficha privada solo la ven él y quien dirige.</li>
<li><strong>Seguridad:</strong> Pausa, Velo y Tarjeta X anónimas en la barra de tokens. Si un gag incomoda, se cambia sin explicaciones.</li>
<li>Reparte los personajes con clic derecho → <em>Configurar propiedad</em>. Al empezar una sesión nueva, repón las fichas «¡Eso ya lo sabía!» desde la pestaña Reparto.</li>
</ul>
<p>El libro completo, con la misma aventura maquetada como una revista de 1995, va en el PDF que acompaña al sistema.</p>"""
guia = [pagina("Cómo usar esta aventura", USO, 0, "laminas/pdf-portada.webp")]
for c in AV["capitulos"]:
    if c["n"] == 11: continue
    guia.append(pagina(c["titulo"], c["html"], c["n"], LAMINAS.get(c["n"])))
cap = {c["n"]: c for c in AV["capitulos"]}
diarios = [
    {"_id": uid("diario-guia"), "name": "¡Mentira Cochina! · La aventura", "pages": guia, "sort": 0, "folder": None, "ownership": {"default": 0}, "flags": {ID: {"clave": "guia"}}},
    {"_id": uid("diario-chuleta"), "name": "Chuleta de dirección", "pages": [pagina("Chuleta de dirección", cap[11]["html"], 0)], "sort": 1, "folder": None, "ownership": {"default": 0}, "flags": {ID: {"clave": "chuleta"}}},
    {"_id": uid("diario-reglas"), "name": "¡PAM! 2.0 · Reglas para la mesa", "pages": [pagina("¡PAM! 2.0", cap[3]["html"], 0, "laminas/bn-dados.webp")], "sort": 2, "folder": None, "ownership": {"default": 2}, "flags": {ID: {"clave": "reglas"}}},
]

aventura = {"_id": uid("aventura"), "name": "¡Mentira Cochina!", "img": f"{R}/marca/portada.webp",
    "caption": "Un día en Villa Pingüino en el que todas las mentiras se vuelven verdad.",
    "description": f"<p>{AV['promesa']}</p><p>Incluye 16 escenas (cuatro cortinillas con el Sol, la Luna y Porco), los cinco personajes jugadores con su ficha privada, vecinos y cameos, y el diario de dirección completo.</p>",
    "actors": actores, "scenes": escenas, "journal": diarios, "folders": folders, "items": [], "tables": [], "macros": [], "cards": [], "playlists": [], "combats": [],
    "sort": 0, "flags": {ID: {"version": STATS["systemVersion"]}}, "_stats": STATS}
json.dump([aventura], open("_data/aventura.json", "w"), ensure_ascii=False, indent=1)
print(f"aventura: {len(escenas)} escenas, {len(actores)} actores, {len(diarios)} diarios, {sum(len(d['pages']) for d in diarios)} páginas")
