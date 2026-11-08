import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sys = JSON.parse(fs.readFileSync("system.json"));
const leer = p => fs.readFileSync(p, "utf8");
const codigo = fs.readdirSync("module", { recursive: true }).filter(f => f.endsWith(".mjs")).map(f => leer(`module/${f}`)).join("\n") + leer("mr-mentira-cochina.mjs");

test("el manifiesto apunta a archivos que existen", () => {
  for (const f of [...sys.esmodules, ...sys.styles, ...sys.languages.map(l => l.path)]) assert.ok(fs.existsSync(f), f);
});

test("las plantillas citadas existen", () => {
  for (const [, ruta] of codigo.matchAll(/RUTA\}\/(templates\/[\w/.-]+\.hbs)/g)) assert.ok(fs.existsSync(ruta), ruta);
});

test("el CSS no pisa la fuente de los iconos de Foundry", () => {
  const css = leer("styles/mr-mentira-cochina.css");
  assert.doesNotMatch(css, /(^|[\s,])(button|\*|i|\.window-header)\s*\{[^}]*font(-family)?\s*:/m);
  assert.doesNotMatch(css, /all\s*:\s*unset/);
});

test("sin códigos de regla en la interfaz", () => {
  const ui = codigo + fs.readdirSync("templates", { recursive: true }).filter(f => f.endsWith(".hbs")).map(f => leer(`templates/${f}`)).join("\n");
  assert.doesNotMatch(ui, /\(R \d+\)|«R \d+»/);
});

test("DialogV2: icono y etiqueta por separado", () => {
  assert.doesNotMatch(codigo, /label:\s*["'`]<i /);
});
