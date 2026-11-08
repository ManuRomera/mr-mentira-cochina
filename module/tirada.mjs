/**
 * ¡PAM! 2.0: 2d6, +1d6 por el talento estrella, +1d6 por cada PJ que colabora (y se arriesga a la complicación);
 * como mucho 4d6. Se suman los dos mejores. Solo se tira cuando hay incertidumbre interesante.
 */
import { ID, ARTE, pjs } from "./mesa.mjs";
import { DialogV2 } from "./compat.mjs";
import { reserva, resultado, dosMejores } from "./reglas.mjs";
import { publicar } from "./chat.mjs";

const esc = s => foundry.utils.escapeHTML(String(s ?? ""));

/** Diálogo de tirada para un actor PJ. */
export async function dialogoTirada(actor) {
  const otros = pjs().filter(a => a.id !== actor.id);
  const ayudas = otros.map(a => `<label class="mc-casilla"><input type="checkbox" name="ayuda" value="${a.id}"><img src="${a.img}" alt="" data-retrato="${a.id}"><span>${esc(a.name)}</span></label>`).join("");
  const datos = await DialogV2.prompt({
    window: { title: `¡PAM! · ${actor.name}`, icon: "fa-solid fa-dice" },
    classes: ["mr-mentira-cochina", "mc-dialogo"],
    content: `<div class="mc-dialogo-cuerpo">
      <label class="mc-campo"><span>¿Qué intentas? <small>(opcional)</small></span><input type="text" name="accion" placeholder="Frenar la moto antes del puerto…" autofocus></label>
      <label class="mc-casilla mc-casilla-grande"><input type="checkbox" name="talento"><span><b>Mi talento estrella ayuda</b> <small>+1 dado · ${esc(actor.system.talento || "sin definir")}</small></span></label>
      ${otros.length ? `<fieldset class="mc-ayudas"><legend>Colabora y se arriesga a la complicación <small>+1 dado cada uno</small></legend>${ayudas}</fieldset>` : ""}
      <p class="mc-nota">2d6 de base, máximo 4d6. Se suman los <b>dos mejores</b>. 2–5 fiasco útil · 6–8 éxito aparatoso · 9–11 éxito brillante · 12 éxito descomunal.</p>
    </div>`,
    ok: {
      label: "¡PAM!", icon: "fa-solid fa-hand-fist",
      callback: (ev, boton) => {
        const f = boton.form.elements;
        return { accion: f.accion.value.trim(), talento: f.talento.checked, ayudas: [...boton.form.querySelectorAll("input[name=ayuda]:checked")].map(i => i.value) };
      }
    },
    rejectClose: false
  });
  if (datos) return tirar(actor, datos);
}

export async function tirar(actor, { accion = "", talento = false, ayudas = [] } = {}) {
  const n = reserva({ talento, ayudas: ayudas.length });
  const roll = await new Roll(`${n}d6kh2`).evaluate();
  const caras = roll.dice[0].results.map(r => r.result);
  const cuentan = new Set(dosMejores(caras));
  const suma = roll.total;
  const r = resultado(suma);
  const nombresAyuda = ayudas.map(id => game.actors.get(id)?.name).filter(Boolean);
  const extras = [talento && "talento", nombresAyuda.length && `ayuda de ${nombresAyuda.join(" y ")}`].filter(Boolean).join(" + ");
  return publicar({
    tipo: "tirada", tono: r.clave, icono: "fa-solid fa-dice", etiqueta: `¡PAM! · ${n}d6${extras ? ` (${extras})` : ""}`,
    sfx: r.sfx, arte: actor.prototypeToken?.texture?.src || actor.img, arteClase: "figura", arteAlt: actor.name,
    dados: caras.map((valor, i) => ({ valor, cuenta: cuentan.has(i) })), suma,
    titulo: r.nombre,
    globo: accion ? esc(accion) : "",
    texto: `<p>${r.texto}</p>`,
    botones: r.clave === "fiasco" ? [{ etiqueta: "+1 Desbarajuste", icono: "fa-solid fa-burst", accion: "desbarajuste", clase: "mc-solo-gm" }] : undefined,
    pie: nombresAyuda.length ? `Quien ayuda comparte la complicación si la hay.` : "",
    fx: { texto: r.sfx, sonido: r.clave, tono: r.clave }
  }, { actor, tirada: roll });
}

/** La ficha «¡ESO YA LO SABÍA!»: una coincidencia estrambótica y útil, una vez por sesión. */
export async function yaLoSabia(actor) {
  if (actor.system.yaLoSabia) return ui.notifications.warn(`${actor.name} ya ha gastado su ficha «¡Eso ya lo sabía!» esta sesión.`);
  const texto = await DialogV2.prompt({
    window: { title: "¡Eso ya lo sabía!", icon: "fa-solid fa-lightbulb" },
    classes: ["mr-mentira-cochina", "mc-dialogo"],
    content: `<div class="mc-dialogo-cuerpo"><p class="mc-nota">Declara una coincidencia estrambótica y útil. Si encaja con lo establecido, es cierta sin tirada; quien dirige añade un remate que no le quita la utilidad. No resuelve por sí sola el problema de la máquina.</p>
      <label class="mc-campo"><span>¿Qué sabías?</span><textarea name="texto" rows="3" placeholder="Mi tía guarda un gancho para detener casas voladoras…" autofocus></textarea></label></div>`,
    ok: { label: "¡Eso ya lo sabía!", icon: "fa-solid fa-lightbulb", callback: (ev, b) => b.form.elements.texto.value.trim() },
    rejectClose: false
  });
  if (texto === null || texto === undefined) return;
  await actor.update({ "system.yaLoSabia": true });
  return publicar({
    tipo: "yaLoSabia", tono: "brillante", icono: "fa-solid fa-lightbulb", etiqueta: "Ficha gastada", sfx: "¡TA-CHÁN!",
    arte: actor.prototypeToken?.texture?.src || actor.img, arteClase: "figura", titulo: "¡Eso ya lo sabía!",
    globo: esc(texto || "…"), pie: "Quien dirige añade un remate, sin quitarle la utilidad.",
    fx: { texto: "¡TA-CHÁN!", sonido: "yaLoSabia", tono: "brillante" }
  }, { actor });
}

export const ARTE_MENT = `${ARTE}/personajes/ment.webp`;
