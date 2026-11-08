import test from "node:test";
import assert from "node:assert/strict";
import { resultado, reserva, dosMejores, probabilidad, tramo, minutosReloj, cortinillaPendiente, acota } from "../module/reglas.mjs";

test("tabla de resultados", () => {
  assert.equal(resultado(2).clave, "fiasco");
  assert.equal(resultado(5).clave, "fiasco");
  assert.equal(resultado(6).clave, "aparatoso");
  assert.equal(resultado(8).clave, "aparatoso");
  assert.equal(resultado(9).clave, "brillante");
  assert.equal(resultado(11).clave, "brillante");
  assert.equal(resultado(12).clave, "descomunal");
});

test("reserva: 2 dados, +1 talento, +1 por ayuda, máximo 4", () => {
  assert.equal(reserva(), 2);
  assert.equal(reserva({ talento: true }), 3);
  assert.equal(reserva({ talento: true, ayudas: 1 }), 4);
  assert.equal(reserva({ talento: true, ayudas: 3 }), 4);
});

test("los dos mejores dados", () => {
  assert.deepEqual(dosMejores([3, 6, 1, 5]).sort(), [1, 3]);
  assert.deepEqual(dosMejores([4, 4, 4]), [0, 1]);
});

test("probabilidades del libro (al menos 6)", () => {
  assert.equal(Math.round(probabilidad(2, 6) * 1000) / 10, 72.2);
  assert.equal(Math.round(probabilidad(3, 6) * 1000) / 10, 89.4);
  assert.equal(Math.round(probabilidad(4, 6) * 1000) / 10, 96);
});

test("reloj real y cortinillas", () => {
  assert.equal(tramo(0).clave, "amanecer");
  assert.equal(tramo(41).clave, "mediodia");
  assert.equal(tramo(100).clave, "juicio");
  assert.equal(Math.round(minutosReloj({ acumulado: 60000, inicio: 1000 }, 61000)), 2);
  assert.equal(cortinillaPendiente(45, []), "mediodia");
  assert.equal(cortinillaPendiente(85, ["mediodia"]), "noche");
  assert.equal(cortinillaPendiente(30, []), null);
  assert.equal(acota(9, 0, 6), 6);
});

test("dobles del caos: solo con Desbarajuste 4+ o caos marcado y dados iguales", async () => {
  const { caosActivo, esDobles } = await import("../module/reglas.mjs");
  assert.equal(esDobles([4, 4]), true);
  assert.equal(esDobles([4, 3]), false);
  assert.equal(caosActivo(3), false);
  assert.equal(caosActivo(4), true);
  assert.equal(caosActivo(0, true), true);
});
