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
const SITE_URL = "https://gruasequinoccial.com/";

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
  email: "info@gruasequinoccial.com",
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

// Páginas de servicio. Cada una tiene su contenido en pages/<archivo>.content.html.
// "nombre" se usa en el bloque "Otros servicios" y en los datos para Google.
const SERVICES = [
  {
    outputFile: "alquiler-gruas-telescopicas.html",
    nombre: "Grúas telescópicas",
    serviceType: "Alquiler de grúas telescópicas",
    title: "Alquiler de grúas telescópicas de 20 a 50 toneladas en Ambato | Equinoccial",
    description:
      "Alquiler de grúas telescópicas autopropulsadas de 20 a 50 toneladas, con alcance de hasta 57 m con jib y operadores certificados. Base en Ambato y servicio en todo el Ecuador.",
  },
  {
    outputFile: "camiones-grua.html",
    nombre: "Camiones grúa",
    serviceType: "Alquiler de camiones grúa",
    title: "Alquiler de camiones grúa de 6 a 12 toneladas en Ambato | Equinoccial",
    description:
      "Camiones grúa con brazo hidráulico articulado de 6 a 12 toneladas y hasta 23 m de alcance, para carga, descarga y montaje en espacios reducidos. Ambato y todo el Ecuador.",
  },
  {
    outputFile: "izajes-montaje-estructuras.html",
    nombre: "Izajes y montaje de estructuras",
    serviceType: "Izajes industriales y montaje de estructuras",
    title: "Izajes industriales y montaje de estructuras en Ecuador | Equinoccial",
    description:
      "Planificación, simulación y ejecución de izajes industriales y montaje de estructuras metálicas, vallas, postes y equipos. Más de 25 años de experiencia desde Ambato.",
  },
  {
    outputFile: "transporte-pesado.html",
    nombre: "Transporte pesado",
    serviceType: "Transporte de carga pesada y maquinaria",
    title: "Transporte de carga pesada y maquinaria en Ecuador | Equinoccial",
    description:
      "Movilización de maquinaria y cargas con exceso de dimensiones o peso a nivel nacional, con carga y descarga con nuestros propios equipos de izaje. Base en Ambato.",
  },
  {
    outputFile: "rescate-pesado-24-7.html",
    nombre: "Rescate pesado 24/7",
    serviceType: "Rescate y remolque de vehículos pesados",
    title: "Rescate pesado 24/7 en Ambato y todo el Ecuador | Grúas Equinoccial",
    description:
      "Salvamento, remolque y liberación de camiones, volquetas y maquinaria pesada las 24 horas, los 365 días. Llama al 096 875 9686. Base en Ambato, cobertura nacional.",
  },
];

// Datos para Google de cada página de servicio
function serviceSchema(s) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.serviceType,
    serviceType: s.serviceType,
    description: s.description,
    url: SITE_URL + s.outputFile,
    areaServed: { "@type": "Country", name: "Ecuador" },
    provider: {
      "@type": "LocalBusiness",
      name: LOCAL_BUSINESS.name,
      url: SITE_URL,
      telephone: "+593968759686",
      address: LOCAL_BUSINESS.address,
    },
  };
}

// Bloque "Otros servicios" al final de cada página de servicio (sin la página actual)
function otherServices(current) {
  const links = SERVICES.filter((s) => s.outputFile !== current)
    .map((s) => '    <a href="' + s.outputFile + '">' + s.nombre + "</a>")
    .join("\n");
  return (
    '<section class="block svc-others">\n' +
    '  <div class="block-eyebrow">OTROS SERVICIOS</div>\n' +
    '  <h2 class="section-title">También podemos ayudarte con</h2>\n' +
    '  <nav class="catalog-jump" aria-label="Otros servicios">\n' + links + "\n  </nav>\n" +
    "</section>"
  );
}

// Define aquí cada página del sitio: archivo de salida, título y descripción SEO
const PAGES = [
  {
    contentFile: "pages/index.content.html",
    outputFile: "index.html",
    title: "Alquiler de grúas e izajes en Ambato | Equinoccial",
    description:
      "Alquiler de grúas telescópicas de 20 a 50 toneladas, camiones grúa, izajes industriales y rescate pesado 24/7 en Ambato y todo el Ecuador. Más de 25 años de experiencia.",
    headExtra:
      '<link rel="preload" as="image" href="assets/img/hero-poster.jpg" imagesrcset="assets/img/hero-poster-640.jpg 640w, assets/img/hero-poster.jpg 1280w" imagesizes="100vw" fetchpriority="high">\n' +
      '<script type="application/ld+json">' + JSON.stringify(LOCAL_BUSINESS) + "</script>",
  },
  {
    contentFile: "pages/flota.content.html",
    outputFile: "flota.html",
    title: "Catálogo técnico de flota — Equinoccial Maniobras e Izajes",
    description:
      "Grúas telescópicas de 20 a 50 toneladas, camiones grúa con brazo articulado de 6 a 12 toneladas, manipulador telescópico y montacargas. Alquiler en Ambato y todo el Ecuador.",
  },
  ...SERVICES.map((s) => ({
    contentFile: "pages/" + s.outputFile.replace(".html", ".content.html"),
    outputFile: s.outputFile,
    title: s.title,
    description: s.description,
    headExtra: '<script type="application/ld+json">' + JSON.stringify(serviceSchema(s)) + "</script>",
  })),
  // Blog oculto hasta tener artículos. Para activarlo: quitar los comentarios
  // y volver a poner el enlace "Blog" en partials/header.html y partials/footer.html.
  // {
  //   contentFile: "pages/blog.content.html",
  //   outputFile: "blog.html",
  //   title: "Blog — Equinoccial Maniobras e Izajes",
  //   description: "Noticias, casos de proyectos y consejos técnicos de Equinoccial.",
  // },
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
    html = fill(html, "ORIGIN", new URL(SITE_URL).origin);
    html = fill(html, "ROBOTS", page.noindex ? '<meta name="robots" content="noindex">' : "");
    html = fill(html, "HEAD_EXTRA", page.headExtra || "");
    html = fill(html, "HEADER", headerForPage);
    html = fill(html, "CONTENT", content);
    html = fill(html, "FOOTER", footerForPage);
    html = fill(html, "OTROS_SERVICIOS", otherServices(page.outputFile));

    // Versiones pequeñas automáticas: si existe assets/img/NOMBRE-480.jpg, se agrega srcset
    // para que los celulares descarguen la imagen liviana
    html = html.replace(/<img src="(assets\/img\/([^"?]+?))\.jpg"(?![^>]*srcset)/g, (m, base) => {
      const small = base + "-480.jpg";
      if (!fs.existsSync(path.join(ROOT, small))) return m;
      return '<img src="' + base + '.jpg" srcset="' + small + ' 480w, ' + base + '.jpg 800w" sizes="(max-width: 900px) 50vw, 25vw"';
    });

    // Marca de versión en imágenes y videos (?v=...): si cambias una foto con el mismo nombre,
    // los navegadores descargan la nueva en lugar de mostrar la vieja guardada en caché
    html = html.replace(/assets\/(img|fonts)\/[^"?#\s,]+\.(jpg|png|webp|mp4|woff2)(?!\?)/g, (ruta) =>
      fs.existsSync(path.join(ROOT, ruta)) ? ruta + "?v=" + version(ruta) : ruta
    );

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
