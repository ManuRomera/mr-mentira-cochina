/** Modelos de datos de los actores: personaje jugador (con su ficha privada) y vecino de la villa. */
const { StringField, HTMLField, BooleanField } = foundry.data.fields;
const texto = (initial = "") => new StringField({ required: true, blank: true, initial });

export class ModeloPJ extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      titulo: texto(), talento: texto(), defecto: texto(), objetivo: texto(), vinculo: texto(), frase: texto(), presentacion: texto(),
      // Ficha privada: solo la ven su jugador y quien dirige.
      mentira: texto(), verdad: texto(), confesion: texto(), defraudar: texto(), jamas: texto(), reto: texto(),
      // La ficha «¡ESO YA LO SABÍA!»: una por sesión.
      yaLoSabia: new BooleanField({ initial: false }),
      notas: new HTMLField({ required: true, blank: true })
    };
  }
}

export class ModeloPNJ extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { papel: texto(), frase: texto(), descripcion: texto(), notas: new HTMLField({ required: true, blank: true }) };
  }
}

export const MODELOS = { pj: ModeloPJ, pnj: ModeloPNJ };
