/**
 * MR- ¡Mentira Cochina! · punto de entrada. Aquí solo se registran piezas y hooks; la lógica vive en `module/`.
 */
import { ApplicationV2, DocumentSheetConfig, anadirHerramienta, diagnostico } from "./module/compat.mjs";
import { ID, ARTE, registrarAjustes, escucharSocket, estado, cambiarEstado } from "./module/mesa.mjs";
import { MODELOS } from "./module/modelos.mjs";
import { HojaPJ, HojaPNJ } from "./module/hojas.mjs";
import { PanelDireccion, lanzarCortinilla, hablaMent, activarEscena } from "./module/apps/direccion.mjs";
import { escucharChat, publicar } from "./module/chat.mjs";
import { registrarEfectos, piuuum, onomatopeya } from "./module/efectos.mjs";
import { registrarCartela, restablecerCartela } from "./module/cartela.mjs";
import { dialogoTirada, tirar } from "./module/tirada.mjs";
import { registrarAccesibilidad } from "./module/accesibilidad.mjs";
import { pintarRetratos, repintarRetratos } from "./module/retrato.mjs";
import { PanelSeguridad, registrarSeguridad } from "./module/apps/seguridad.mjs";
import { PanelDiagnostico } from "./module/apps/diagnostico.mjs";
import { registrarLupa } from "./module/lupa.mjs";
import { registrarCoberturaDeFondo } from "./module/escenario.mjs";
import { registrarInicio, importarAventura } from "./module/inicio.mjs";

Hooks.once("init", () => {
  Object.assign(CONFIG.Actor.dataModels, MODELOS);
  DocumentSheetConfig.registerSheet(Actor, ID, HojaPJ, { types: ["pj"], makeDefault: true, label: "¡Mentira Cochina! · Personaje" });
  DocumentSheetConfig.registerSheet(Actor, ID, HojaPNJ, { types: ["pnj"], makeDefault: true, label: "¡Mentira Cochina! · Vecino" });

  registrarAjustes();
  registrarEfectos();
  registrarAccesibilidad();
  registrarLupa();
  registrarCoberturaDeFondo();
  registrarSeguridad();
  registrarCartela();
  registrarInicio();
  game.settings.registerMenu(ID, "diagnosticoMenu", {
    name: "Diagnóstico", label: "Comprobar el sistema",
    hint: "Comprueba el compendio, las imágenes y el estado de la partida, y deja un informe copiable.",
    icon: "fa-solid fa-stethoscope",
    type: class extends ApplicationV2 { async render() { PanelDiagnostico.abrir(); return this; } }, restricted: false
  });
  game.settings.registerMenu(ID, "cartelaMenu", {
    name: "Cartela del episodio", label: "Volver a su sitio",
    hint: "Devuelve la cartela flotante (hora, Desbarajuste, Ruido) a la parte superior de la pantalla.",
    icon: "fa-solid fa-arrows-to-dot",
    type: class extends ApplicationV2 { async render() { restablecerCartela(); return this; } }, restricted: false
  });

  game.mrMentira = {
    abrirDireccion: () => PanelDireccion.abrir(),
    abrirSeguridad: () => PanelSeguridad.abrir(),
    abrirDiagnostico: () => PanelDiagnostico.abrir(),
    tirar, dialogoTirada, piuuum, onomatopeya, lanzarCortinilla, hablaMent, activarEscena, importarAventura,
    estado, cambiarEstado, publicar, diagnostico
  };
});

Hooks.once("ready", () => {
  escucharSocket();
  escucharChat();
  PanelSeguridad.iniciar();
  document.body.classList.toggle("mc-es-gm", game.user.isGM);
  console.info(`MR- ¡Mentira Cochina! ${game.system.version} · Foundry ${game.version}`);
});

/** Un personaje nuevo estrena el retrato de ME-NT en lugar del misterioso de Foundry. */
Hooks.on("preCreateActor", (actor, datos) => {
  if (datos.img && datos.img !== Actor.DEFAULT_ICON) return;
  const img = `${ARTE}/personajes/${actor.type === "pj" ? "ment-timido" : "ment"}.webp`;
  actor.updateSource({ img, "prototypeToken.texture.src": img });
});

Hooks.on("updateActor", (actor, cambios) => {
  const f = cambios.flags?.[ID];
  if ("img" in cambios || (f && ("retrato" in f || "-=retrato" in f))) repintarRetratos();
  if (cambios.system && "yaLoSabia" in cambios.system) foundry.applications.instances.get("mc-direccion")?.render();
});
Hooks.on("mentira.estado", () => foundry.applications.instances.get("mc-direccion")?.render());

/** Los diarios de la aventura se visten de revista. */
Hooks.on("renderJournalEntrySheet", (app) => {
  if (app.document.getFlag(ID, "clave") || app.document.pack?.startsWith(`${ID}.`)) {
    app.element.classList.add("mr-mentira-cochina", "mc-diario", "themed", "theme-light");
    app.element.classList.remove("theme-dark");
  }
});
/** Papel de revista: las ventanas del sistema usan siempre el tema claro de Foundry por dentro. */
Hooks.on("renderApplicationV2", app => {
  if (!app.element?.classList.contains("mr-mentira-cochina")) return;
  app.element.classList.add("themed", "theme-light");
  app.element.classList.remove("theme-dark");
});

Hooks.on("renderActorDirectory", (app, html) => {
  const raiz = html instanceof HTMLElement ? html : html[0];
  pintarRetratos(raiz);
  const acciones = raiz?.querySelector(".header-actions");
  if (!game.user.isGM || !acciones || acciones.querySelector(".mc-boton-panel")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "mc-boton-panel";
  b.innerHTML = `<i class="fa-solid fa-clapperboard" inert></i><span>Panel de dirección</span>`;
  b.addEventListener("click", () => PanelDireccion.abrir());
  acciones.append(b);
});

Hooks.on("getSceneControlButtons", controles => {
  anadirHerramienta(controles, "tokens", { name: "mcSeguridad", title: "Seguridad en mesa", icon: "fa-solid fa-shield-heart", onChange: () => PanelSeguridad.abrir() });
  if (!game.user.isGM) return;
  anadirHerramienta(controles, "tokens", { name: "mcDireccion", title: "Panel de dirección", icon: "fa-solid fa-clapperboard", onChange: () => PanelDireccion.abrir() });
  anadirHerramienta(controles, "tokens", { name: "mcPiuuum", title: "¡PIUUUM! (alguien ha mentido)", icon: "fa-solid fa-satellite-dish", onChange: () => piuuum() });
});
