/** Reglas puras de ¡PAM! 2.0 y de los marcadores: sin Foundry, para poder probarlas. */

export const RESULTADOS = [
  { min: 2, max: 5, clave: "fiasco", nombre: "Fiasco útil", sfx: "¡PATAPLAF!", texto: "La acción falla o se desvía. Quien dirige ofrece enseguida otra posibilidad y un lío visible: nunca un callejón sin salida." },
  { min: 6, max: 8, clave: "aparatoso", nombre: "Éxito aparatoso", sfx: "¡CATACROC!", texto: "Lo consigues, pero con un coste cómico o una consecuencia secundaria concreta." },
  { min: 9, max: 11, clave: "brillante", nombre: "Éxito brillante", sfx: "¡ZAS!", texto: "Logras lo que querías sin precio relevante. Descríbelo a lo grande: nada de castigos escondidos." },
  { min: 12, max: 12, clave: "descomunal", nombre: "Éxito descomunal", sfx: "¡KA-BOOM!", texto: "Además de lograrlo, eliges un beneficio extraordinario y visible." }
];

export const resultado = suma => RESULTADOS.find(r => suma >= r.min && suma <= r.max) ?? (suma > 12 ? RESULTADOS[3] : RESULTADOS[0]);

/** Dados de la reserva: 2 de base, +1 por el talento estrella, +1 por cada PJ que ayuda; como mucho 4. */
export const reserva = ({ talento = false, ayudas = 0 } = {}) => Math.min(4, 2 + (talento ? 1 : 0) + Math.max(0, ayudas | 0));

/** Índices de los dos dados que cuentan (los más altos; a igualdad, los primeros). */
export function dosMejores(caras) {
  return caras.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, 2).map(([, i]) => i);
}

/** Probabilidad exacta de sacar al menos `objetivo` sumando los dos mejores de `n` d6. */
export function probabilidad(n, objetivo) {
  let si = 0, total = 0;
  const caras = Array(n).fill(1);
  for (;;) {
    total++;
    const [a, b] = [...caras].sort((x, y) => y - x);
    if (a + b >= objetivo) si++;
    let i = 0;
    while (i < n && caras[i] === 6) caras[i++] = 1;
    if (i === n) break;
    caras[i]++;
  }
  return si / total;
}

export const DESBARAJUSTE = [
  "Todo en calma. Efectos locales; ME-NT se burla y juega.",
  "Efectos locales; ME-NT se burla y juega.",
  "Se mezclan secuelas de retos previos: aparece una consecuencia recurrente.",
  "Se mezclan secuelas de retos previos: aparece una consecuencia recurrente.",
  "La antena pierde precisión: un nuevo pulso amenaza viviendas, calles o seres queridos.",
  "La antena pierde precisión: un nuevo pulso amenaza viviendas, calles o seres queridos.",
  "¡Sobrecarga! La máquina busca un lugar donde parar y alguien a quien retar. Se prepara el clímax."
];

export const RUIDO = [
  "Silencio: se puede encontrar a ME-NT igualmente.",
  "La antena se orienta hacia vosotros.",
  "¡Aparece un pulso!",
  "ME-NT cambia de refugio.",
  "ME-NT deja de huir y provoca la confrontación: empieza el juicio."
];

export const acota = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

/** Tramos del reloj real (minutos de mesa). */
export const TRAMOS = [
  { desde: 0, clave: "amanecer", nombre: "Amanece", noche: false },
  { desde: 5, clave: "montaje", nombre: "Montaje matinal", noche: false },
  { desde: 12, clave: "acto1", nombre: "Acto I · Caos matinal", noche: false },
  { desde: 40, clave: "mediodia", nombre: "Mediodía", noche: false },
  { desde: 43, clave: "acto2", nombre: "Acto II · Tarde de locos", noche: false },
  { desde: 80, clave: "noche", nombre: "Noche", noche: true },
  { desde: 83, clave: "caceria", nombre: "Cacería nocturna", noche: true },
  { desde: 95, clave: "juicio", nombre: "El juicio de las mentiras", noche: true },
  { desde: 112, clave: "nuevo", nombre: "Nuevo amanecer", noche: false },
  { desde: 120, clave: "fin", nombre: "¡Fin del episodio!", noche: false }
];

export const tramo = minutos => [...TRAMOS].reverse().find(t => minutos >= t.desde) ?? TRAMOS[0];

/** Minutos transcurridos de un reloj {inicio, acumulado} (inicio = marca de tiempo si está en marcha). */
export const minutosReloj = (reloj, ahora = Date.now()) =>
  ((reloj?.acumulado ?? 0) + (reloj?.inicio ? ahora - reloj.inicio : 0)) / 60000;

/** Cortinilla que toca (minuto 40, 80 o 112) si aún no se ha lanzado. */
export function cortinillaPendiente(minutos, lanzadas = []) {
  const toca = [["mediodia", 40], ["noche", 80], ["nuevo", 112]].filter(([, m]) => minutos >= m).map(([id]) => id);
  return toca.find(id => !lanzadas.includes(id)) ?? null;
}
