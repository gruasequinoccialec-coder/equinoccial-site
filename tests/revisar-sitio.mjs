/**
 * Revisión automática del sitio (se ejecuta con `npm test`).
 * Abre docs/ en un navegador real, en celular y en PC, y comprueba:
 *  - que no haya errores de JavaScript
 *  - que la página no se desplace hacia los lados
 *  - que todos los enlaces internos, imágenes, videos, estilos y scripts existan
 *  - que el menú móvil abra y cierre
 *  - que el formulario no se envíe vacío ni sin aceptar la privacidad
 *  - que el mapa de cobertura muestre un punto por trabajo y que cada punto funcione
 * Si algo falla, termina con error y GitHub avisa por correo.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
const PAGES = ["index.html", "flota.html", "blog.html", "privacidad.html", "404.html"];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".xml": "application/xml", ".txt": "text/plain" };

const errores = [];
const fallo = (msg) => { errores.push(msg); console.log("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

// Servidor local mínimo para docs/
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  let file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("no encontrado"); return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// 1) Archivos y enlaces internos
console.log("\nEnlaces y archivos");
const SITE_URL = (fs.readFileSync(path.join(ROOT, "..", "build.js"), "utf-8").match(/SITE_URL = "([^"]+)"/) || [])[1];
const idsDe = (archivo) => new Set([...fs.readFileSync(path.join(ROOT, archivo), "utf-8").matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
let revisados = 0;
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf-8");
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = ref;
    if (SITE_URL && u.startsWith(SITE_URL)) u = u.slice(SITE_URL.length);
    if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    const [archivo, ancla] = u.split("?")[0].split("#");
    if (archivo && !fs.existsSync(path.join(ROOT, archivo))) fallo(`${page}: no existe "${ref}"`);
    const destino = archivo || page;
    if (ancla && ancla !== "top" && destino.endsWith(".html") && fs.existsSync(path.join(ROOT, destino)) && !idsDe(destino).has(ancla)) fallo(`${page}: el enlace "${ref}" apunta a una sección que no existe`);
    revisados++;
  }
}
ok(`${revisados} enlaces y archivos revisados`);

// 2) Navegador real: celular y PC
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
for (const [nombre, viewport, movil] of [["celular", { width: 390, height: 844 }, true], ["PC", { width: 1440, height: 900 }, false]]) {
  console.log(`\nVista ${nombre}`);
  const ctx = await browser.newContext({ viewport, isMobile: movil, hasTouch: movil });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|web3forms\.com/, (r) => r.abort()); // sin internet externo
  const page = await ctx.newPage();
  const jsErr = [];
  page.on("pageerror", (e) => jsErr.push(e.message));
  page.on("response", (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) jsErr.push(`recurso no encontrado: ${r.url().slice(BASE.length)}`); });

  for (const p of PAGES) {
    jsErr.length = 0;
    await page.goto(BASE + p, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (desborde > 1) fallo(`${p}: la página se desplaza ${desborde}px hacia los lados`);
    if (jsErr.length) fallo(`${p}: ${jsErr.join(" | ")}`);
    else if (desborde <= 1) ok(`${p} carga sin errores`);
  }

  await page.goto(BASE + "index.html", { waitUntil: "load" });
  if (movil) {
    await page.click("#hamburgerBtn");
    await page.waitForTimeout(400);
    const abierto = await page.evaluate(() => document.getElementById("mobileNav").classList.contains("open"));
    const tapado = await page.evaluate(() => { const b = document.getElementById("hamburgerBtn").getBoundingClientRect(); return !document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2).closest("#hamburgerBtn"); });
    await page.click("#hamburgerBtn", { force: true });
    await page.waitForTimeout(400);
    const cerrado = await page.evaluate(() => !document.getElementById("mobileNav").classList.contains("open"));
    if (!abierto || !cerrado || tapado) fallo("el menú móvil no abre/cierra correctamente");
    else ok("menú móvil abre y cierra");
  }

  // Formulario: no debe enviarse vacío ni sin aceptar la privacidad
  let envios = 0;
  page.on("request", (r) => { if (r.url().includes("web3forms")) envios++; });
  await page.click(".btn-submit", { force: true });
  await page.fill("#q-nombre", "Prueba"); await page.fill("#q-telefono", "0990000000"); await page.fill("#q-email", "prueba@ejemplo.com");
  await page.click(".btn-submit", { force: true });
  await page.waitForTimeout(300);
  if (envios > 0) fallo("el formulario se envía sin datos obligatorios o sin aceptar la privacidad");
  else ok("formulario valida los campos obligatorios");

  // Mapa de cobertura
  const datos = await page.evaluate(() => { try { return JSON.parse(document.getElementById("coverageData").textContent); } catch (e) { return null; } });
  if (!datos) fallo("los datos del mapa de cobertura tienen un error de formato (revisa comas y comillas)");
  else {
    const esperados = datos.trabajos.length + (datos.base ? 1 : 0);
    const puntos = await page.locator(".coverage-svg .marker").count();
    if (puntos !== esperados) fallo(`el mapa muestra ${puntos} puntos y deberían ser ${esperados}`);
    let sinAbrir = 0;
    for (let i = 0; i < puntos; i++) {
      const m = page.locator(".coverage-svg .marker").nth(i);
      await m.click({ force: true });
      if (!((await m.getAttribute("class")) || "").includes("active")) sinAbrir++;
    }
    if (sinAbrir) fallo(`${sinAbrir} punto(s) del mapa no se pueden tocar porque están tapados`);
    else if (puntos === esperados) ok(`mapa de cobertura: ${puntos} puntos, todos funcionan`);
  }
  await ctx.close();
}
await browser.close();
server.close();

console.log(errores.length ? `\n✗ ${errores.length} problema(s) encontrado(s).` : "\n✓ Todo en orden.");
process.exit(errores.length ? 1 : 0);
