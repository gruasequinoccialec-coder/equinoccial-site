# AGENTS.md

Guía para asistentes de programación que trabajen en este repositorio.

## Proyecto

Sitio web estático de Equinoccial (Maniobras e Izajes — alquiler de grúas e izajes industriales, Ambato, Ecuador). Sin framework: HTML/CSS/JS plano ensamblado por un pequeño script de Node.js. Todo el contenido del sitio está en español.

Repositorio: `alexanderua29/equinoccial-site` (rama `main`). Se publica con GitHub Pages desde la carpeta `docs/`.

## Comandos

```
npm run build   # node build.js — arma docs/*.html desde partials/ + pages/ y copia assets/ a docs/assets/
npm run serve   # npx serve docs — sirve docs/ en local (ej. http://localhost:3000)
```

No hay tests, linter ni verificación de tipos.

Alternativa para ver el sitio en local: extensión "Live Server" de VS Code sobre `docs/index.html` (después de `npm run build`).

## Arquitectura

Sistema de ensamblado por plantillas:

- `partials/layout.html` — estructura base (`<head>`, `<body>`, script) con los marcadores `{{TITLE}}`, `{{DESCRIPTION}}`, `{{HEADER}}`, `{{CONTENT}}`, `{{FOOTER}}`.
- `partials/header.html` / `partials/footer.html` — header con menú y footer con botón de WhatsApp, compartidos por todas las páginas.
- `pages/*.content.html` — solo el contenido de cada página (sin head/header/footer).
- `build.js` — define el arreglo `PAGES` (`contentFile`, `outputFile`, `title`, `description`), reemplaza los marcadores, borra y regenera `docs/`, y copia `assets/` a `docs/assets/`.
- `assets/css/styles.css`, `assets/js/script.js` (menú móvil, video del hero, formulario de cotización), `assets/img/`.
- `docs/` — salida generada y publicada. **Nunca editar `docs/` a mano**: `npm run build` la borra y la regenera.
- `dist/` — salida antigua, ya no se usa (está en `.gitignore`).

## Tareas comunes

- **Cambiar datos compartidos (teléfono, WhatsApp)**: editar `partials/header.html` y `partials/footer.html`, luego `npm run build`.
- **Agregar una página**: crear `pages/<nombre>.content.html`, añadirla a `PAGES` en `build.js`, luego `npm run build`.
- **Editar el blog**: `pages/blog.content.html`.
- **Colores / estilos**: `assets/css/styles.css`; los colores de marca están en `:root`.

## Publicar

Después de `npm run build`, hacer commit de los cambios (incluida `docs/`) y `git push` a `main`. GitHub Pages actualiza el sitio en uno o dos minutos.
