# AGENTS.md

Guía para asistentes de programación que trabajen en este repositorio.

## Proyecto

Sitio web estático de Equinoccial (Maniobras e Izajes — alquiler de grúas e izajes industriales, Ambato, Ecuador). Sin framework: HTML/CSS/JS plano ensamblado por un pequeño script de Node.js. Todo el contenido del sitio está en español.

Repositorio: `alexanderua29/equinoccial-site` (rama `main`). Se publica con GitHub Pages desde la carpeta `docs/`.

## Comandos

```
npm run build   # node build.js — arma docs/*.html desde partials/ + pages/ y copia assets/ a docs/assets/
npm run serve   # npx serve docs — sirve docs/ en local (ej. http://localhost:3000)
npm test        # revisa docs/ en un navegador real (celular y PC): errores, enlaces, menú, formulario y mapa
```

`npm test` usa Playwright (`npm install` y `npx playwright install chromium` la primera vez). La misma revisión corre en GitHub Actions (`.github/workflows/revisar-sitio.yml`) en cada push a `main` y en cada pull request, y además verifica que `docs/` coincida con lo que genera `npm run build`. Si falla, GitHub avisa por correo.

Alternativa para ver el sitio en local: extensión "Live Server" de VS Code sobre `docs/index.html` (después de `npm run build`).

## Arquitectura

Sistema de ensamblado por plantillas:

- `partials/layout.html` — estructura base (`<head>`, `<body>`, script) con los marcadores `{{TITLE}}`, `{{DESCRIPTION}}`, `{{HEADER}}`, `{{CONTENT}}`, `{{FOOTER}}`.
- `partials/header.html` / `partials/footer.html` — header con menú y footer con botón de WhatsApp, compartidos por todas las páginas.
- `pages/*.content.html` — solo el contenido de cada página (sin head/header/footer).
- `build.js` — define el arreglo `PAGES` (`contentFile`, `outputFile`, `title`, `description`), reemplaza los marcadores, borra y regenera `docs/`, y copia `assets/` a `docs/assets/`.
- `assets/css/styles.css`, `assets/js/script.js` (menú móvil, video del hero, formulario de cotización), `assets/img/`.
- `public/` — archivos que van a la raíz del sitio tal cual: favicons, `.nojekyll` y, si se usa dominio propio, `CNAME`.
- `build.js` también genera `docs/sitemap.xml` y `docs/robots.txt`, y contiene `SITE_URL` (dirección pública usada en etiquetas para redes sociales, sitemap y datos estructurados). Al conectar un dominio propio, cambiar `SITE_URL` y agregar `public/CNAME`.
- Video del hero: `hero-video-mobile.mp4` (640 px, para pantallas ≤ 700 px) y `hero-video.mp4` (1280 px). Mantenerlos livianos (≈1 MB y ≈3 MB).
- La sección de certificaciones está comentada en `pages/index.content.html` hasta tener logos reales.
- `docs/` — salida generada y publicada. **Nunca editar `docs/` a mano**: `npm run build` la borra y la regenera.

## Tareas comunes

- **Cambiar datos compartidos (teléfono, WhatsApp)**: editar `partials/header.html` y `partials/footer.html`, luego `npm run build`.
- **Agregar una página**: crear `pages/<nombre>.content.html`, añadirla a `PAGES` en `build.js`, luego `npm run build`.
- **Editar el blog**: `pages/blog.content.html`.
- **Colores / estilos**: `assets/css/styles.css`; los colores de marca están en `:root`.

## Mapa de cobertura

Los datos están en el bloque `<script type="application/json" id="coverageData">` de `pages/index.content.html`: `base` y la lista `trabajos` (titulo, lugar, provincia, lat, lon, sector, detalle, enlace). Los puntos que quedan juntos se separan solos; `npm test` comprueba que cada punto se pueda tocar.

## Publicar

Después de `npm run build` (y `npm test`), hacer commit de los cambios (incluida `docs/`) y `git push` a `main`. GitHub Pages actualiza el sitio en uno o dos minutos.
