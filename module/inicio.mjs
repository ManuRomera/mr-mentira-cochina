/**
 * Instalación de la aventura. En un mundo vacío, el GM activo la importa sola la primera vez;
 * después se puede repetir desde Configuración → ¡Mentira Cochina!. Tarjeta de bienvenida por versión.
 */
import { ID, ARTE } from "./mesa.mjs";
import { DialogV2 } from "./compat.mjs";
import { publicar } from "./chat.mjs";

const PACK = `${ID}.aventura`;

/** Sin personajes, objetos, diarios, listas, macros ni tablas, y como mucho la escena de bienvenida de Foundry. */
function mundoVacio() {
  const sin = ["actors", "items", "journal", "playlists", "macros", "tables", "cards"].every(c => !game[c]?.size);
  return sin && game.scenes.contents.every(s => (!s.background?.src || s.background.src.startsWith("nue/")) && !s.tokens.size);
}

export async function importarAventura({ confirmar = false } = {}) {
  if (!game.user.isGM) return ui.notifications.warn("Solo quien dirige importa la aventura.");
  const pack = game.packs.get(PACK);
  if (!pack) return ui.notifications.error("No encuentro el compendio de la aventura.");
  if (confirmar && !mundoVacio()) {
    const ok = await DialogV2.confirm({
      window: { title: "Importar la aventura", icon: "fa-solid fa-file-import" },
      content: "<p>Este mundo ya tiene contenido. Si importas la aventura se <b>sobrescribirán</b> los documentos de ¡Mentira Cochina! que hayas cambiado a mano (personajes, diarios y escenas).</p>",
      yes: { label: "Importar", icon: "fa-solid fa-file-import" }, no: { label: "Cancelar" }, rejectClose: false
    });
    if (!ok) return;
  }
  ui.notifications.info("¡Mentira Cochina!: importando la aventura (escenas, personajes y diarios)…");
  const aventura = (await pack.getDocuments())[0];
  await aventura.import({ dialog: false });
  await game.settings.set(ID, "importada", true);
  await game.scenes.find(s => s.getFlag(ID, "escena") === "00-amanecer")?.activate();
  ui.notifications.info("¡Aventura importada! Empieza por el diario «¡Mentira Cochina! · La aventura».");
  return true;
}

async function instalarSiVacio() {
  if (!game.user.isGM || game.user !== game.users.activeGM) return false;
  if (game.settings.get(ID, "importada") || !mundoVacio()) return false;
  return importarAventura();
}

async function bienvenida() {
  if (!game.user.isGM || game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  await publicar({
    tipo: "bienvenida", tono: "dia", icono: "fa-solid fa-newspaper", etiqueta: `MR- ¡Mentira Cochina! ${game.system.version}`,
    sfx: "¡OIIIINK!", arte: `${ARTE}/marca/portada.webp`, arteClase: "banner",
    titulo: "¡Buenos días, Villa Pingüino!",
    texto: "<p>La aventura está en el mundo: escenas, personajes jugadores, vecinos y el diario de dirección. El <b>Panel de dirección</b> lleva el reloj real de 120 minutos, el Desbarajuste, el Ruido, las cortinillas, los retos flotantes y el juicio.</p><p>Reparte los cinco personajes (clic derecho → Configurar propiedad) y que cada jugador lea su ficha privada.</p>",
    botones: [
      { etiqueta: "Panel de dirección", icono: "fa-solid fa-clapperboard", accion: "direccion" },
      { etiqueta: "La aventura", icono: "fa-solid fa-book-open", accion: "diario", datos: { clave: "guia" } },
      { etiqueta: "Seguridad", icono: "fa-solid fa-shield-heart", accion: "seguridad" }
    ],
    fx: { texto: "¡OIIIINK!", sonido: "oink", tono: "rosa" }
  }, { alias: "Porco", soloGM: true });
}

export function registrarInicio() {
  Hooks.on("renderSettings", (app, html) => {
    const raiz = html instanceof HTMLElement ? html : html[0];
    const sitio = raiz?.querySelector("section.settings");
    if (!sitio || raiz.querySelector(".mc-ajustes") || !game.user.isGM) return;
    const sec = document.createElement("section");
    sec.className = "mc-ajustes flexcol";
    sec.innerHTML = `<h4 class="divider">¡Mentira Cochina!</h4>
      <button type="button" data-mc="panel"><i class="fa-solid fa-clapperboard" inert></i> Panel de dirección</button>
      <button type="button" data-mc="importar"><i class="fa-solid fa-file-import" inert></i> Importar la aventura</button>`;
    sec.addEventListener("click", ev => {
      const a = ev.target.closest("button[data-mc]")?.dataset.mc;
      if (a === "panel") game.mrMentira.abrirDireccion();
      if (a === "importar") importarAventura({ confirmar: true });
    });
    sitio.after(sec);
  });
  Hooks.once("ready", async () => {
    try { await instalarSiVacio(); }
    catch (e) { console.error(`${ID} | la importación automática ha fallado`, e); ui.notifications.error("La importación automática ha fallado. Puedes hacerla desde Configuración → ¡Mentira Cochina!."); }
    await bienvenida();
  });
}
