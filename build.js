/**
 * build.js
 * Ensambla las páginas finales (docs/*.html) a partir de:
 *   - partials/layout.html  (plantilla base: <head>, <body>, script)
 *   - partials/header.html  (header + menú móvil, compartido)
 *   - partials/footer.html  (footer + botón WhatsApp, compartido)
 *   - pages/*.content.html  (contenido único de cada página)
 * y copia:
 *   - assets/  -> docs/assets/
 *   - public/  -> docs/  (favicons, robots.txt, .nojekyll, CNAME si existe)
 * Además genera docs/sitemap.xml.
 *
 * Uso:
 *   node build.js
 *
 * Vuelve a correr este comando cada vez que edites algo en partials/, pages/, assets/ o public/.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DIST = path.join(ROOT, "docs");

// Dirección pública del sitio (con / al final). Cámbiala cuando tengas dominio propio,
// por ejemplo "https://equinoccial.com/", y vuelve a compilar.
const SITE_URL = "https://alexanderua29.github.io/equinoccial-site/";

// Datos estructurados para Google (empresa local). Solo se incluyen en la página de inicio.
const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Equinoccial — Maniobras e Izajes",
  description:
    "Alquiler de grúas telescópicas, camiones grúa, izajes industriales, transporte pesado y rescate pesado 24/7 en Ecuador.",
  url: SITE_URL,
  image: SITE_URL + "assets/img/hero-poster.jpg",
  logo: SITE_URL + "icon-192.png",
  telephone: "+593988145824",
  contactPoint: [
    { "@type": "ContactPoint", telephone: "+593988145824", contactType: "customer service", areaServed: "EC", availableLanguage: "es" },
    { "@type": "ContactPoint", telephone: "+593968759686", contactType: "customer service", areaServed: "EC", availableLanguage: "es", description: "WhatsApp" },
    { "@type": "ContactPoint", telephone: "+593983616335", contactType: "customer service", areaServed: "EC", availableLanguage: "es" },
  ],
  email: "gruasequinoccial.ec@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Panamericana 61, Cunchibamba",
    addressLocality: "Ambato",
    addressRegion: "Tungurahua",
    addressCountry: "EC",
  },
  areaServed: { "@type": "Country", name: "Ecuador" },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  sameAs: [
    "https://www.facebook.com/share/1DT8wPKGLw/",
    "https://www.instagram.com/gruasequinoccial",
    "https://www.tiktok.com/@gruas.equinoccial",
  ],
};

// Define aquí cada página del sitio: archivo de salida, título y descripción SEO
const PAGES = [
  {
    contentFile: "pages/index.content.html",
    outputFile: "index.html",
    title: "Equinoccial — Maniobras e Izajes",
    description:
      "Alquiler de grúas telescópicas, camiones grúa e izajes industriales en Ambato y a nivel nacional. Más de 25 años de experiencia.",
    headExtra:
      '<link rel="preload" as="image" href="assets/img/hero-poster.jpg" fetchpriority="high">\n' +
      '<script type="application/ld+json">' + JSON.stringify(LOCAL_BUSINESS) + "</script>",
  },
  {
    contentFile: "pages/blog.content.html",
    outputFile: "blog.html",
    title: "Blog — Equinoccial Maniobras e Izajes",
    description: "Noticias, casos de proyectos y consejos técnicos de Equinoccial.",
  },
  {
    contentFile: "pages/privacidad.content.html",
    outputFile: "privacidad.html",
    title: "Política de Privacidad — Equinoccial",
    description: "Política de privacidad y tratamiento de datos personales de Equinoccial.",
  },
  {
    contentFile: "pages/404.content.html",
    outputFile: "404.html",
    title: "Página no encontrada — Equinoccial",
    description: "La página que buscas no existe.",
    noindex: true,
  },
];

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Reemplaza todas las apariciones de un marcador
function fill(text, key, value) {
  return text.split("{{" + key + "}}").join(value);
}

// Huella corta del contenido de un archivo: cambia solo cuando el archivo cambia.
// Se agrega como ?v=... para que los navegadores no usen una copia vieja en caché.
function version(relPath) {
  return crypto.createHash("md5").update(fs.readFileSync(path.join(ROOT, relPath))).digest("hex").slice(0, 8);
}

function build() {
  const cssV = version("assets/css/styles.css");
  const jsV = version("assets/js/script.js");
  const layout = readFile("partials/layout.html")
    .replace('href="assets/css/styles.css"', 'href="assets/css/styles.css?v=' + cssV + '"')
    .replace('src="assets/js/script.js"', 'src="assets/js/script.js?v=' + jsV + '"');
  const header = readFile("partials/header.html");
  const footer = readFile("partials/footer.html");

  // Limpiar y recrear docs/
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const page of PAGES) {
    const content = readFile(page.contentFile);
    const isHome = page.outputFile === "index.html";
    const headerForPage = isHome ? header.replace(/href="index\.html#/g, 'href="#') : header;
    const footerForPage = isHome ? footer.replace(/href="index\.html#/g, 'href="#') : footer;
    const url = SITE_URL + (isHome ? "" : page.outputFile);

    let html = layout;
    html = fill(html, "TITLE", page.title);
    html = fill(html, "DESCRIPTION", page.description);
    html = fill(html, "URL", url);
    html = fill(html, "SITE_URL", SITE_URL);
    html = fill(html, "ROBOTS", page.noindex ? '<meta name="robots" content="noindex">' : "");
    html = fill(html, "HEAD_EXTRA", page.headExtra || "");
    html = fill(html, "HEADER", headerForPage);
    html = fill(html, "CONTENT", content);
    html = fill(html, "FOOTER", footerForPage);

    // La página 404 puede abrirse desde cualquier ruta: usa enlaces absolutos al sitio
    if (page.outputFile === "404.html") {
      html = html.replace(/(href|src)="(?!https?:|mailto:|tel:|#|\/)([^"]+)"/g, '$1="' + SITE_URL + '$2"');
    }

    fs.writeFileSync(path.join(DIST, page.outputFile), html, "utf-8");
    console.log("✓ Generado docs/" + page.outputFile);
  }

  // Copiar assets (css, js, imágenes) y archivos públicos
  copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
  console.log("✓ Assets copiados a docs/assets");
  copyDir(path.join(ROOT, "public"), DIST);
  console.log("✓ Archivos públicos copiados a docs/");

  // Sitemap para Google
  const urls = PAGES.filter((p) => !p.noindex)
    .map((p) => SITE_URL + (p.outputFile === "index.html" ? "" : p.outputFile))
    .map((u) => "  <url><loc>" + u + "</loc></url>")
    .join("\n");
  fs.writeFileSync(
    path.join(DIST, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n",
    "utf-8"
  );
  fs.writeFileSync(path.join(DIST, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + SITE_URL + "sitemap.xml\n", "utf-8");
  console.log("✓ sitemap.xml y robots.txt generados");

  console.log("\nListo. Revisa el sitio con `npm run serve` (ver README.md).");
}

build();
