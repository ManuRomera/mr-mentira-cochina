/** Hojas V2 con memoria: personaje jugador (perfil de revista con ficha privada) y vecino de la villa. */
import { ActorSheetV2, HandlebarsApplicationMixin, enriquecer } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { ID, RUTA } from "./mesa.mjs";
import { EditorRetrato, pintarRetratos } from "./retrato.mjs";
import { dialogoTirada, yaLoSabia } from "./tirada.mjs";

class HojaBase extends ConMemoria(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["mr-mentira-cochina", "mc-hoja"],
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      retrato: HojaBase.#retrato,
      figura: HojaBase.#figura,
      tirar: HojaBase.#tirar,
      yaLoSabia: HojaBase.#yaLoSabia,
      reponer: HojaBase.#reponer
    }
  };
  static SCROLL_MEMORIA = [".mc-hoja-cuerpo"];

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const a = this.document;
    return {
      ...base, actor: a, system: a.system, editable: this.isEditable,
      // La ficha privada: su jugador y quien dirige. (Foundry envía los datos a todos: es discreción, no secreto.)
      privado: a.isOwner,
      esGM: game.user.isGM,
      figura: a.prototypeToken?.texture?.src || a.img,
      notas: await enriquecer(a.system.notas, a)
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    pintarRetratos(this.element);
  }

  static #retrato() { if (this.isEditable) EditorRetrato.abrir(this.document); }
  static async #figura() {
    if (!this.isEditable) return;
    const FP = foundry.applications.apps.FilePicker.implementation;
    new FP({ type: "image", current: this.document.prototypeToken.texture.src, callback: src => this.document.update({ "prototypeToken.texture.src": src }) }).render({ force: true });
  }
  static #tirar() { return dialogoTirada(this.document); }
  static #yaLoSabia() { return yaLoSabia(this.document); }
  static async #reponer() { if (game.user.isGM) await this.document.update({ "system.yaLoSabia": false }); }
}

export class HojaPJ extends HojaBase {
  static DEFAULT_OPTIONS = { classes: ["mc-hoja-pj"], position: { width: 820, height: 760 } };
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/pj.hbs`, scrollable: [".mc-hoja-cuerpo"] } };
}

export class HojaPNJ extends HojaBase {
  static DEFAULT_OPTIONS = { classes: ["mc-hoja-pnj"], position: { width: 560, height: 560 } };
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/pnj.hbs`, scrollable: [".mc-hoja-cuerpo"] } };
}
