/**
 * Efectos de revista: el ¡PIUUUM! de ME-NT (anillos amarillos y onomatopeya que cruza la pantalla)
 * y las onomatopeyas de las tiradas, con su sonido sintetizado (Web Audio, sin archivos).
 * Respetan «Reducir movimiento» de accesibilidad y los ajustes de cada navegador.
 */
import { ID, alRecibir, difundir } from "./mesa.mjs";

let ctx = null;
const sonando = () => game.settings.get(ID, "sonido") && game.settings.get(ID, "sonidoVolumen") > 0;
const vol = () => (game.settings.get(ID, "sonidoVolumen") / 100) * 0.45;

function audio() {
  const C = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tono({ tipo = "sine", de, a, dur, t = 0, fuerza = 1, vibrato = 0 }) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(de, t0);
  o.frequency.exponentialRampToValueAtTime(a, t0 + dur);
  if (vibrato) {
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = 18; lg.gain.value = vibrato;
    l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol() * fuerza, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function golpe(t = 0, fuerza = 1) {
  const c = audio();
  if (!c) return;
  const n = Math.floor(c.sampleRate * 0.25), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = "lowpass"; f.frequency.value = 900; g.gain.value = vol() * 1.6 * fuerza;
  s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + t);
  tono({ de: 140, a: 45, dur: 0.3, t, fuerza: 1.4 * fuerza });
}

export const SONIDOS = {
  piuuum: () => { tono({ tipo: "square", de: 1800, a: 220, dur: 0.9, fuerza: 0.35, vibrato: 60 }); tono({ de: 900, a: 1600, dur: 0.5, t: 0.85, fuerza: 0.5 }); },
  fiasco: () => { tono({ tipo: "triangle", de: 520, a: 90, dur: 0.7, fuerza: 0.8 }); golpe(0.65, 0.8); },
  aparatoso: () => { golpe(0); tono({ tipo: "square", de: 300, a: 600, dur: 0.18, t: 0.2, fuerza: 0.3 }); },
  brillante: () => { [660, 880, 1320].forEach((f, i) => tono({ de: f, a: f, dur: 0.35, t: i * 0.09, fuerza: 0.7 })); },
  descomunal: () => { golpe(0, 1.3); [523, 659, 784, 1047].forEach((f, i) => tono({ tipo: "triangle", de: f, a: f, dur: 0.5, t: 0.15 + i * 0.1, fuerza: 0.7 })); },
  oink: () => { tono({ tipo: "sawtooth", de: 420, a: 260, dur: 0.18, fuerza: 0.35, vibrato: 40 }); tono({ tipo: "sawtooth", de: 460, a: 300, dur: 0.22, t: 0.22, fuerza: 0.35, vibrato: 40 }); },
  campanilla: () => { [1568, 2093].forEach((f, i) => tono({ de: f, a: f * 0.99, dur: 1.2, t: i * 0.15, fuerza: 0.5 })); },
  yaLoSabia: () => { [784, 988, 1175, 1568].forEach((f, i) => tono({ tipo: "square", de: f, a: f, dur: 0.12, t: i * 0.07, fuerza: 0.25 })); }
};

export function sonar(clave) {
  if (sonando()) SONIDOS[clave]?.();
}

const sinMovimiento = () => document.body.classList.contains("mc-sin-movimiento");

/** Onomatopeya grande que cruza la pantalla. */
export function onomatopeya(texto, { tono = "amarillo", anillos = false } = {}) {
  if (!game.settings.get(ID, "efectos")) return;
  const capa = document.createElement("div");
  capa.className = `mr-mentira-cochina mc-fx mc-fx-${tono}${anillos ? " mc-fx-anillos" : ""}${sinMovimiento() ? " quieto" : ""}`;
  capa.setAttribute("aria-hidden", "true");
  capa.innerHTML = `${anillos ? "<i></i><i></i><i></i>" : ""}<b data-texto="${texto}">${texto}</b>`;
  document.body.append(capa);
  setTimeout(() => capa.remove(), sinMovimiento() ? 900 : 1700);
}

/** ¡PIUUUM! para toda la mesa. */
export function piuuum() {
  difundir("piuuum", {});
}

export function registrarEfectos() {
  game.settings.register(ID, "sonido", {
    name: "Sonidos de historieta",
    hint: "¡PIUUUM!, golpes de las tiradas, el oink de Porco y la campanilla de las cortinillas. Sintetizados, sin archivos. Ajuste de este navegador.",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "sonidoVolumen", { name: "Volumen de los sonidos", scope: "client", config: true, type: Number, default: 60, range: { min: 0, max: 100, step: 5 } });
  alRecibir("piuuum", () => { onomatopeya("¡PIUUUM!", { anillos: true }); sonar("piuuum"); });
  // Las tarjetas de chat traen su sonido y su onomatopeya; suenan en todos los clientes al llegar.
  Hooks.on("createChatMessage", m => {
    const fx = m.getFlag(ID, "fx");
    if (!fx || !m.visible) return;
    const lanzar = () => { if (fx.sonido) sonar(fx.sonido); if (fx.texto) onomatopeya(fx.texto, { tono: fx.tono }); };
    // Con Dice So Nice, la onomatopeya espera a que paren los dados.
    if (game.dice3d && m.rolls?.length) {
      const id = Hooks.on("diceSoNiceRollComplete", mid => { if (mid === m.id) { Hooks.off("diceSoNiceRollComplete", id); lanzar(); } });
      setTimeout(() => Hooks.off("diceSoNiceRollComplete", id), 15000);
    } else lanzar();
  });
  document.addEventListener("pointerdown", () => { if (ctx?.state === "suspended") ctx.resume(); }, { passive: true });
}
