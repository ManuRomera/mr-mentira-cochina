/** Tarjetas de chat con aspecto de viñeta: tiradas, ¡PIUUUM!, retos, cortinillas, frases de ME-NT y avisos. */
import { ID, RUTA, estado, cambiarEstado } from "./mesa.mjs";
import { aplicarModo, alRenderizarMensaje, renderTemplate } from "./compat.mjs";
import { pintarRetratos } from "./retrato.mjs";

const attrs = (datos = {}) => Object.entries(datos).map(([k, v]) => `data-${k}="${foundry.utils.escapeHTML(String(v))}"`).join(" ");

/**
 * @param {object} t  datos de templates/chat/tarjeta.hbs (+ fx: {texto, sonido, tono})
 * @param {object} [op] actor que habla, alias, tirada, susurro a GM
 */
export async function publicar(t, { actor, alias, tirada, soloGM = false } = {}) {
  const vista = { ...t, botones: t.botones?.map(b => ({ ...b, attrs: attrs(b.datos) })) };
  const datos = {
    content: await renderTemplate(`${RUTA}/templates/chat/tarjeta.hbs`, vista),
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker({ alias: alias ?? "Villa Pingüino" }),
    flags: { [ID]: { tipo: t.tipo ?? "aviso", fx: t.fx ?? null } }
  };
  if (tirada) {
    datos.rolls = [tirada];
    datos.sound = CONFIG.sounds.dice;
    aplicarModo(datos);
  }
  if (soloGM) datos.whisper = game.users.filter(u => u.isGM).map(u => u.id);
  return ChatMessage.create(datos);
}

const ACCIONES = {
  async desbarajuste() {
    if (!game.user.isGM) return ui.notifications.warn("Solo quien dirige mueve el Desbarajuste.");
    const e = estado();
    await cambiarEstado({ desbarajuste: e.desbarajuste + 1 });
  },
  async ruido() {
    if (!game.user.isGM) return ui.notifications.warn("Solo quien dirige mueve el Ruido.");
    await cambiarEstado({ ruido: estado().ruido + 1 });
  },
  direccion() { return game.mrMentira?.abrirDireccion(); },
  seguridad() { return game.mrMentira?.abrirSeguridad(); },
  tutorial() { return game.mrMentira?.tutorial(); },
  async abrir(ds) { (await fromUuid(ds.uuid))?.sheet.render(true); },
  async diario(ds) {
    const j = game.journal.find(x => x.getFlag(ID, "clave") === ds.clave);
    if (j) return j.sheet.render(true);
    ui.notifications.warn("Importa primero la aventura (Configuración → ¡Mentira Cochina!).");
  }
};

export function escucharChat() {
  alRenderizarMensaje((mensaje, html) => {
    if (!mensaje.getFlag(ID, "tipo")) return;
    pintarRetratos(html);
    for (const b of html.querySelectorAll("[data-mc-accion]")) {
      b.addEventListener("click", ev => { ev.preventDefault(); ACCIONES[b.dataset.mcAccion]?.({ ...b.dataset }); });
    }
  });
}
