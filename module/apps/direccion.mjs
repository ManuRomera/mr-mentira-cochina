/**
 * Panel de dirección (solo GM): reloj real de 120 minutos, Desbarajuste y Ruido, ¡PIUUUM!,
 * las cuatro cortinillas del Sol y Porco, los 18 retos flotantes, el juicio de las mentiras y el reparto.
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { ID, RUTA, ARTE, estado, cambiarEstado, pjs } from "../mesa.mjs";
import { DESBARAJUSTE, RUIDO, tramo, minutosReloj, cortinillaPendiente } from "../reglas.mjs";
import { publicar } from "../chat.mjs";
import { piuuum } from "../efectos.mjs";
import { pintarRetratos } from "../retrato.mjs";
import AV from "../aventura.mjs";

const GRUPOS = [
  { clave: "personal", nombre: "Personales", test: r => /Pipa|Bruno|Bibi|Kame|Lulú/.test(r.quien) },
  { clave: "publico", nombre: "Públicos", test: r => r.quien === "público" },
  { clave: "grande", nombre: "Gran escala", test: r => r.quien === "gran escala" },
  { clave: "otros", nombre: "Social y comodín", test: r => /social|comodín/.test(r.quien) }
];
export const FRASES_MENT = [
  "¡Yo no invento las mentiras, listillo! ¡Las inventáis vosotros!",
  "¡Antena en alto! ¡Vergüenza en camino!",
  "¡Ese embuste tiene una potencia preciosa!",
  "¡No me hagas promesas bonitas si son para pulsarme un botón!",
  "¡YO NO HE MENTIDO, EH! ¡VOSOTROS SÍ!",
  "¡Los humanos sois unos mal diseñados!",
  "¡JE-JE-JE-JE!"
];
export const FINALES = [
  { id: "A", nombre: "Victoria limpia", texto: "ME-NT se entrega por elección: acompaña al grupo, conserva su libertad y activa la restauración selectiva. Los jugadores eligen qué cambios deshacer y qué secuelas se quedan." },
  { id: "B", nombre: "Victoria técnica", texto: "Reconfiguran la antena, aíslan el receptor o la encierran. Es legítimo vencer así: ME-NT sigue desconfiando y parte de las secuelas permanecen." },
  { id: "C", nombre: "Se les va de las manos", texto: "Sobrecarga definitiva: la villa despierta convertida en un collage de mentiras. No es perder: el episodio acaba con un desastre magnífico." },
  { id: "D", nombre: "Conservar una mentira", texto: "Algunos efectos persisten por acuerdo y muestran sus consecuencias. Villa Pingüino ya era extraordinaria antes." }
];
const JUICIO = "¡VENÍS A LLEVARME DE VUELTA! ¡JE-JE-JE! ¡PERO SEGURO QUE NI SIQUIERA OS CONOCÉIS DE VERDAD! ¡SI SOIS TAN AMIGOS, DECIDME QUIÉNES SOIS! ¡NO, MEJOR: DECÍDSELO A LOS DEMÁS! ¡MENTID! ¡MENTID BIEN, QUE YA NO QUEDA NADIE DESPIERTO PARA DIVERTIRME!";
const SILENCIO = "«¿Sabéis qué es lo que más me gusta de la noche?» (espera). «Que cuando dormís… por fin dejáis de mentir.» Da una patadita al aire. «Mi inventor dijo que yo era especial. Dijo que me quería. También me puso un mando para obligarme a obedecer. No sé cuál de esas tres cosas era mentira.»";

const esc = s => foundry.utils.escapeHTML(String(s ?? ""));
const mmss = m => `${String(Math.floor(m)).padStart(2, "0")}:${String(Math.floor((m % 1) * 60)).padStart(2, "0")}`;

/** ME-NT habla en el chat con su globo. */
export function hablaMent(texto, { sfx = "", arte = "ment", titulo = "ME-NT [1R]" } = {}) {
  return publicar({
    tipo: "ment", tono: "ment", icono: "fa-solid fa-satellite-dish", etiqueta: titulo, arte: `${ARTE}/personajes/${arte}.webp`, arteClase: "figura",
    titulo: "", globo: esc(texto), sfx, fx: sfx ? { texto: sfx, sonido: "piuuum", tono: "amarillo" } : null
  }, { alias: "ME-NT [1R]" });
}

/** Activa una escena de la aventura por su clave (flags.mr-mentira-cochina.escena). */
export async function activarEscena(clave) {
  const s = game.scenes.find(x => x.getFlag(ID, "escena") === clave);
  if (!s) return ui.notifications.warn("No encuentro esa escena: importa la aventura desde Configuración → ¡Mentira Cochina!.");
  await s.activate();
  return s;
}

export async function lanzarCortinilla(id) {
  const c = AV.cortinillas.find(x => x.id === id);
  if (!c) return;
  await activarEscena(c.escena);
  const e = estado();
  await cambiarEstado({ cortinillas: [...new Set([...e.cortinillas, id])], ...(id === "noche" ? { ruido: 0 } : {}) });
  return publicar({
    tipo: "cortinilla", tono: id === "noche" ? "noche" : "dia", icono: id === "noche" ? "fa-solid fa-moon" : "fa-solid fa-sun",
    etiqueta: `Cortinilla · minuto ${c.minuto}`, sfx: "¡OIIIINK!", arte: `${ARTE}/personajes/${c.porco}.webp`, arteClase: "figura",
    titulo: c.titulo, texto: c.lineas.map(l => `<p>${l}</p>`).join(""),
    fx: { texto: "¡OIIIINK!", sonido: "oink", tono: id === "noche" ? "noche" : "rosa" }
  }, { alias: "Porco" });
}

export class PanelDireccion extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORIA = "direccion";
  static DEFAULT_OPTIONS = {
    id: "mc-direccion",
    classes: ["mr-mentira-cochina", "mc-direccion"],
    position: { width: 760, height: 720 },
    window: { title: "Panel de dirección", icon: "fa-solid fa-clapperboard", resizable: true },
    actions: {
      reloj: PanelDireccion.#reloj, marcador: PanelDireccion.#marcador, piuuum: () => piuuum(),
      cortinilla: (ev, b) => lanzarCortinilla(b.dataset.id), escena: (ev, b) => activarEscena(b.dataset.clave),
      reto: PanelDireccion.#reto, estadoReto: PanelDireccion.#estadoReto, frase: (ev, b) => hablaMent(FRASES_MENT[b.dataset.i], { sfx: "¡JE-JE-JE!" }),
      provocar: PanelDireccion.#provocar, juicio: () => hablaMent(JUICIO, { sfx: "¡JE-JE-JE!" }), silencio: () => hablaMent(SILENCIO, { arte: "ment-triste" }),
      final: PanelDireccion.#final, abrir: (ev, b) => game.actors.get(b.dataset.id)?.sheet.render(true), reponer: PanelDireccion.#reponer,
      diario: (ev, b) => game.journal.find(j => j.getFlag(ID, "clave") === b.dataset.clave)?.sheet.render(true),
      seguridad: () => game.mrMentira.abrirSeguridad(), filtro: PanelDireccion.#filtro
    }
  };
  static PARTS = { panel: { template: `${RUTA}/templates/apps/direccion.hbs`, scrollable: [".mc-pestana"] } };
  static SCROLL_MEMORIA = [".mc-pestana.active"];
  tabGroups = { panel: "mesa" };
  filtro = "todos";

  static abrir() {
    if (!game.user.isGM) return ui.notifications.warn("El panel de dirección es para quien dirige.");
    return (foundry.applications.instances.get("mc-direccion") ?? new PanelDireccion()).render({ force: true });
  }

  async _prepareContext() {
    const e = estado();
    const min = minutosReloj(e.reloj);
    const t = tramo(min);
    const pendiente = cortinillaPendiente(min, e.cortinillas);
    return {
      pestana: this.tabGroups.panel,
      pestanas: [["mesa", "La mesa", "fa-sun"], ["retos", "Retos flotantes", "fa-burst"], ["juicio", "El juicio", "fa-scale-balanced"], ["reparto", "Reparto", "fa-users"]]
        .map(([id, nombre, icono]) => ({ id, nombre, icono, activa: id === this.tabGroups.panel })),
      reloj: { texto: mmss(min), marcha: Boolean(e.reloj.inicio), tramo: t.nombre, pct: Math.min(100, (min / 120) * 100),
        aviso: pendiente ? AV.cortinillas.find(c => c.id === pendiente)?.titulo : "" },
      tramos: AV.reloj,
      desbarajuste: { valor: e.desbarajuste, texto: DESBARAJUSTE[e.desbarajuste], casillas: [1, 2, 3, 4, 5, 6].map(n => ({ n, llena: n <= e.desbarajuste })) },
      ruido: { valor: e.ruido, texto: RUIDO[e.ruido], casillas: [1, 2, 3, 4].map(n => ({ n, llena: n <= e.ruido })) },
      cortinillas: AV.cortinillas.map(c => ({ ...c, hecha: e.cortinillas.includes(c.id), arte: `${ARTE}/personajes/${c.porco}.webp` })),
      filtro: this.filtro,
      grupos: [{ clave: "todos", nombre: "Todos" }, ...GRUPOS].map(g => ({ ...g, activo: g.clave === this.filtro })),
      retos: AV.retos.filter(r => this.filtro === "todos" || GRUPOS.find(g => g.clave === this.filtro)?.test(r)).map(r => ({ ...r, estado: e.retos[r.id] ?? "" })),
      provocaciones: AV.provocaciones.map(p => ({ ...p, actor: pjs().find(a => a.name.includes(p.pj)) })),
      frases: FRASES_MENT.map((texto, i) => ({ texto, i })),
      finales: FINALES.map(f => ({ ...f, elegido: e.final === f.id })),
      reparto: pjs().map(a => ({ id: a.id, nombre: a.name, img: a.img, titulo: a.system.titulo, ya: a.system.yaLoSabia, duenos: game.users.filter(u => !u.isGM && a.testUserPermission(u, "OWNER")).map(u => u.name).join(", ") })),
      vecinos: game.actors.filter(a => a.type === "pnj").map(a => ({ id: a.id, nombre: a.name, img: a.img })),
      arte: ARTE
    };
  }

  async _onRender(ctx, op) {
    await super._onRender(ctx, op);
    pintarRetratos(this.element);
    clearInterval(this._tic);
    this._tic = setInterval(() => { if (this.rendered && estado().reloj.inicio) this.render({ parts: ["panel"] }); }, 10000);
  }

  async close(o) { clearInterval(this._tic); return super.close(o); }

  static async #reloj(ev, b) {
    const r = estado().reloj;
    const ahora = Date.now();
    const accion = b.dataset.op;
    let nuevo = r;
    if (accion === "marcha") nuevo = r.inicio ? { inicio: null, acumulado: r.acumulado + (ahora - r.inicio) } : { inicio: ahora, acumulado: r.acumulado };
    if (accion === "menos" || accion === "mas") {
      const delta = (accion === "mas" ? 5 : -5) * 60000;
      nuevo = { inicio: r.inicio, acumulado: Math.max(0, r.acumulado + delta) };
    }
    if (accion === "cero") nuevo = { inicio: null, acumulado: 0 };
    await cambiarEstado({ reloj: nuevo, ...(accion === "cero" ? { cortinillas: [], desbarajuste: 0, ruido: 0, retos: {}, final: "" } : {}) });
  }

  static async #marcador(ev, b) {
    const e = estado();
    const clave = b.dataset.clave;
    const v = b.dataset.valor !== undefined ? Number(b.dataset.valor) : e[clave] + Number(b.dataset.delta);
    // Pulsar la casilla ya marcada la desmarca.
    await cambiarEstado({ [clave]: b.dataset.valor !== undefined && v === e[clave] ? v - 1 : v });
  }

  static async #reto(ev, b) {
    const r = AV.retos.find(x => x.id === b.dataset.id);
    if (!r) return;
    const e = estado();
    await cambiarEstado({ retos: { ...e.retos, [r.id]: "activo" } });
    return publicar({
      tipo: "reto", tono: "reto", icono: "fa-solid fa-burst", etiqueta: `Reto ${r.id} · ${r.quien}`, sfx: "¡PIUUUM!",
      arte: `${ARTE}/personajes/ment.webp`, arteClase: "figura mini", titulo: r.titulo,
      globo: esc(r.mentira), texto: `<p><b>¡Urgente!</b> ${esc(r.urgencia)}</p>`,
      pie: "¿Qué hacéis?", fx: { texto: "¡PIUUUM!", sonido: "piuuum", tono: "amarillo" }
    }, { alias: "ME-NT [1R]" });
  }

  static async #estadoReto(ev, b) {
    const e = estado();
    const retos = { ...e.retos };
    retos[b.dataset.id] === "resuelto" ? delete retos[b.dataset.id] : (retos[b.dataset.id] = "resuelto");
    await cambiarEstado({ retos });
  }

  static async #provocar(ev, b) {
    const p = AV.provocaciones[Number(b.dataset.i)];
    if (p) return hablaMent(p.provocacion, { sfx: "¡JE-JE-JE!" });
  }

  static async #final(ev, b) {
    const f = FINALES.find(x => x.id === b.dataset.id);
    await cambiarEstado({ final: f.id });
    return publicar({ tipo: "final", tono: "dia", icono: "fa-solid fa-flag-checkered", etiqueta: `Final ${f.id}`, titulo: f.nombre, texto: `<p>${esc(f.texto)}</p>`,
      sfx: "¡FIN!", fx: { texto: "¡FIN!", sonido: "descomunal", tono: "descomunal" } }, { soloGM: true, alias: "Dirección" });
  }

  static async #reponer() {
    for (const a of pjs()) if (a.system.yaLoSabia) await a.update({ "system.yaLoSabia": false });
    ui.notifications.info("Fichas «¡Eso ya lo sabía!» repuestas: nueva sesión.");
  }

  static #filtro(ev, b) { this.filtro = b.dataset.clave; this.render(); }
}
