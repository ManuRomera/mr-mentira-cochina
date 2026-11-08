#!/usr/bin/env python3
"""Aventura en Markdown → content/aventura.json (datos para Foundry y el PDF).
Uso: python3 scripts/contenido.py "<ruta a aventura.md>"
Solo se toman los apartados de juego (1-11 y 19); los de producción de imágenes (12-18) se quedan fuera."""
import json, re, sys
import markdown

src = open(sys.argv[1], encoding="utf-8").read()
partes = re.split(r"^# (\d+)\. (.+)$", src, flags=re.M)
SEC = {int(partes[i]): (partes[i + 1].strip(), partes[i + 2]) for i in range(1, len(partes), 3)}
md = lambda t: markdown.markdown(t, extensions=["tables"])

def limpiar(t):
    """Quita las indicaciones de producción (archivos de referencia, recursos) del texto de juego."""
    t = re.sub(r"^\*\*(Imagen fijada|Referencia|Recurso Foundry|Composición aparte)[^\n]*\n", "", t, flags=re.M)
    t = re.sub(r"`(ESC|REF|PJ|PNJ|TRANS)_[A-Z0-9_]+(\.png)?`", "", t)
    t = t.replace("PORCO/SHI-BUTA", "PORCO").replace("Porco/Shi-Buta", "Porco")
    t = t.replace("Usa el vídeo, no nuevas interpretaciones genéricas.", "")
    t = re.sub(r"En vídeo, usa \*\*exactamente[^.]*\.\*\*", "", t)
    return re.sub(r"---\s*$", "", t.strip()).strip()

campo = lambda txt, k: (re.search(r"\*\*" + k + r"[^:*]*:\*\*\s*(.+)", txt) or [None, ""])[1].strip()

# --- Personajes jugadores ---
pjs = []
for m in re.finditer(r"^## PJ (\d) · (.+?) — (.+?)\n(.*?)(?=^## |^### |\Z)", SEC[4][1], flags=re.M | re.S):
    n, nombre, titulo, cuerpo = m.groups()
    b = lambda k: (re.search(r"^- \*\*" + k + r"[^:*]*:\*\*\s*(.+)$", cuerpo, flags=re.M) or [None, ""])[1].strip()
    verdad = b("Verdad vergonzosa")
    conf = re.search(r"\*\*Confesión posible:\*\*\s*(.+?)(?: No se fuerza\.)?$", verdad)
    pjs.append(dict(
        clave=["pipa", "bruno", "bibi", "kame", "lulu"][int(n) - 1], nombre=nombre.title().replace("Pistón", "Pistón"), titulo=titulo,
        talento=b("Talento"), defecto=b("Defecto"), objetivo=b("Objetivo"), vinculo=b("Vínculo"), frase=b("Frase").strip("«»."),
        presentacion=b("Presentación"), mentira=b("Mentira habitual").strip("«»."),
        verdad=re.sub(r"\s*\*\*Confesión posible:\*\*.*$", "", verdad), confesion=(conf[1].strip() if conf else ""),
        reto=b("Reto personal")))

# --- Retos flotantes ---
retos = []
for m in re.finditer(r"^## (R\d\d) · (.+?) \[(.+?)\]\n(.+?)$", SEC[8][1], flags=re.M):
    cod, titulo, etiqueta, txt = m.groups()
    trozos = dict(re.findall(r"\*\*(Mentira|Urgencia|Opciones|Giro|Secuela):\*\*\s*(.+?)(?=\s*\*\*(?:Mentira|Urgencia|Opciones|Giro|Secuela):\*\*|$)", txt))
    quien, _, cuando = etiqueta.partition(" / ")
    retos.append(dict(id=cod, titulo=titulo, quien=quien, cuando=cuando, **{k.lower(): v.strip() for k, v in trozos.items()}))

# --- Cortinillas: narraciones del Sol y Porco ---
def cita(t):
    return [re.sub(r"^\*\*Narración[^:]*:\*\*\s*|^\*\*Texto para leer:\*\*\s*", "", l[1:].strip()).replace("PORCO/SHI-BUTA", "PORCO") for l in t.splitlines() if l.startswith(">") and l[1:].strip()]
s6, s7, s10 = SEC[6][1], SEC[7][1], SEC[10][1]
bloque = lambda t, ini: t.split(ini, 1)[1].split("\n## ", 1)[0] if ini in t else ""
cortinillas = [
    dict(id="amanecer", titulo="¡Buenos días, Villa Pingüino!", minuto=0, escena="00-amanecer", sol="sol-manana", porco="porco-manana", lineas=cita(bloque(s6, "## Cabecera audiovisual"))),
    dict(id="mediodia", titulo="¡A comer!", minuto=40, escena="01-mediodia", sol="sol-mediodia", porco="porco-mediodia", lineas=cita(bloque(s6, "## Cortinilla"))),
    dict(id="noche", titulo="¡Buenas noches!", minuto=80, escena="02-noche", sol="luna", porco="porco-noche", lineas=cita(bloque(s7, "## Cortinilla"))),
    dict(id="nuevo", titulo="Nuevo amanecer", minuto=112, escena="03-nuevo-amanecer", sol="sol-tarde", porco="porco-amanecer", lineas=cita(bloque(s10, "## 10.4."))),
]
for c in cortinillas:
    c["lineas"] = [re.sub(r"^<p>|</p>$", "", md(l)) for l in c["lineas"]]
# La frase de producción de la noche (pijama «sobre su ropa habitual») no es narración.
cortinillas[2]["lineas"] = [l for l in cortinillas[2]["lineas"] if "de la referencia" not in l]

# --- Provocaciones del juicio ---
prov = []
for fila in re.findall(r"^\| (Pipa|Bruno|Bibi|Kame|Lulú) \| (.+?) \| (.+?) \|$", s10, flags=re.M):
    prov.append(dict(pj=fila[0], provocacion=fila[1].strip("«»"), si_miente=fila[2]))

# --- Reloj real ---
reloj = [dict(minutos=a.strip("*"), titulo=re.sub(r"\*", "", b).replace("Porco/Shi-Buta", "Porco"), claro=c) for a, b, c in re.findall(r"^\| (\*\*\d\d–\d+\*\*) \| (.+?) \| (.+?) \|$", SEC[5][1], flags=re.M)]

# --- Capítulos (diario y PDF) ---
CAPS = [(1, "Una máquina, cien mentiras", "La máquina"), (2, "Las reglas de ME-NT [1R]", "Reglas de ME-NT"),
        (3, "¡PAM! 2.0 · Dos dados buenos, muchos problemas", "¡PAM! 2.0"), (4, "Cinco humanos y cinco verdades", "Personajes"),
        (5, "Un día entero en 120 minutos", "El reloj"), (6, "Acto I · Amanecer y desastres cotidianos", "Acto I"),
        (7, "Acto II · La tarde que todos mintieron", "Acto II"), (8, "Banco de retos flotantes", "Retos"),
        (9, "La villa vive sin nosotros", "Subtramas"), (10, "Acto III · La noche y el juicio de las mentiras", "Acto III"),
        (11, "Chuleta de dirección", "Chuleta"), (19, "Apuntes para una dirección memorable", "Apuntes")]
capitulos = []
for n, titulo, corto in CAPS:
    capitulos.append(dict(n=n, titulo=titulo, corto=corto, html=md(limpiar(SEC[n][1]))))

entrada = src.split("\n# 1.", 1)[0]
promesa = re.search(r"\*\*Promesa:\*\*\s*(.+)", entrada)[1].replace("**", "")
json.dump(dict(promesa=promesa, pjs=pjs, retos=retos, cortinillas=cortinillas, provocaciones=prov, reloj=reloj, capitulos=capitulos),
          open("content/aventura.json", "w"), ensure_ascii=False, indent=1)
print(len(pjs), "PJ ·", len(retos), "retos ·", len(cortinillas), "cortinillas ·", len(prov), "provocaciones ·", len(reloj), "tramos ·", len(capitulos), "capítulos")
# El sistema lo importa como módulo (sin fetch al arrancar); los capítulos HTML solo hacen falta para el diario y el PDF.
ligero = dict(promesa=promesa, pjs=pjs, retos=retos, cortinillas=cortinillas, provocaciones=prov, reloj=reloj)
open("module/aventura.mjs", "w").write("/** Generado por scripts/contenido.py desde la aventura: no editar a mano. */\nexport default " + json.dumps(ligero, ensure_ascii=False, indent=1) + ";\n")
