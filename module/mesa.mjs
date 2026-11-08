/**
 * Estado compartido de la partida (ajuste de mundo): Desbarajuste, Ruido, reloj real,
 * retos lanzados y cortinillas. Solo un GM escribe ajustes de mundo; el resto lo pide por socket.
 * El socket también reparte los efectos de pantalla (¡PIUUUM!) a toda la mesa.
 */
import { olvidarTodo } from "./memoria.mjs";
import { ApplicationV2 } from "./compat.mjs";
import { acota } from "./reglas.mjs";

export const ID = "mr-mentira-cochina";
export const SOCKET = `system.${ID}`;
export const RUTA = `systems/${ID}`;
export const ARTE = `${RUTA}/assets`;

export const ESTADO_INICIAL = {
  desbarajuste: 0,
  ruido: 0,
  reloj: { inicio: null, acumulado: 0 },
  retos: {},          // R01: "activo" | "resuelto"
  cortinillas: [],    // ids ya lanzadas
  final: ""
};

class RestablecerVentanas extends ApplicationV2 {
  async render() {
    olvidarTodo();
    ui.notifications.info("Posiciones, tamaños y pestañas olvidadas en este navegador.");
    return this;
  }
}

export function registrarAjustes() {
  game.settings.register(ID, "estado", {
    scope: "world", config: false, type: Object, default: ESTADO_INICIAL,
    onChange: () => Hooks.callAll("mentira.estado", estado())
  });
  game.settings.register(ID, "bienvenida", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(ID, "importada", { scope: "world", config: false, type: Boolean, default: false });
  game.settings.register(ID, "efectos", {
    name: "Efectos de pantalla",
    hint: "El destello ¡PIUUUM! de ME-NT y las onomatopeyas de las tiradas cruzan la pantalla. Ajuste de este navegador.",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "marcadorPos", { scope: "client", config: false, type: Object, default: {} });
  game.settings.register(ID, "marcadorVisible", {
    name: "Mostrar la cartela del episodio",
    hint: "La cartela flotante con la hora del día, el Desbarajuste y el Ruido. Se arrastra con el botón derecho.",
    scope: "client", config: true, type: Boolean, default: true,
    onChange: () => Hooks.callAll("mentira.estado", estado())
  });
  game.settings.registerMenu(ID, "ventanas", {
    name: "Memoria de ventanas", label: "Olvidar posiciones",
    hint: "Las ventanas del sistema recuerdan posición, tamaño, pestaña y secciones plegadas en este navegador.",
    icon: "fa-solid fa-window-restore", type: RestablecerVentanas, restricted: false
  });
}

export const estado = () => foundry.utils.mergeObject(foundry.utils.deepClone(ESTADO_INICIAL), game.settings.get(ID, "estado") ?? {}, { inplace: false });

/** Cambios validados: solo claves conocidas y valores dentro de rango. */
function sanear(cambios = {}) {
  const v = {};
  if ("desbarajuste" in cambios) v.desbarajuste = acota(cambios.desbarajuste, 0, 6);
  if ("ruido" in cambios) v.ruido = acota(cambios.ruido, 0, 4);
  if (cambios.reloj && typeof cambios.reloj === "object") v.reloj = { inicio: Number(cambios.reloj.inicio) || null, acumulado: Math.max(0, Number(cambios.reloj.acumulado) || 0) };
  if (cambios.retos && typeof cambios.retos === "object") v.retos = Object.fromEntries(Object.entries(cambios.retos).filter(([k, e]) => /^R\d\d$/.test(k) && ["activo", "resuelto"].includes(e)));
  if (Array.isArray(cambios.cortinillas)) v.cortinillas = cambios.cortinillas.filter(c => typeof c === "string").slice(0, 8);
  if (typeof cambios.final === "string") v.final = cambios.final.slice(0, 2);
  return v;
}

/** Cambia el estado. Los objetos (reloj, retos) se sustituyen enteros. */
export async function cambiarEstado(cambios) {
  const validos = sanear(cambios);
  if (game.user.isGM) return game.settings.set(ID, "estado", { ...estado(), ...validos });
  if (!game.users.activeGM) return ui.notifications.warn("Hace falta que quien dirige esté conectado.");
  game.socket.emit(SOCKET, { op: "estado", datos: validos });
}

const RECEPTORES = {};
/** Registra qué hacer con un mensaje de socket de tipo `op`. */
export const alRecibir = (op, fn) => { RECEPTORES[op] = fn; };
/** Envía a los demás y lo ejecuta también aquí. */
export function difundir(op, datos) {
  game.socket.emit(SOCKET, { op, datos });
  RECEPTORES[op]?.(datos, game.user);
}

export function escucharSocket() {
  game.socket.on(SOCKET, ({ op, datos } = {}, de) => {
    const quien = game.users.get(de) ?? null;
    if (op === "estado") {
      if (game.users.activeGM?.isSelf) game.settings.set(ID, "estado", { ...estado(), ...sanear(datos) });
      return;
    }
    RECEPTORES[op]?.(datos, quien);
  });
}

export const pjs = () => game.actors.filter(a => a.type === "pj");
