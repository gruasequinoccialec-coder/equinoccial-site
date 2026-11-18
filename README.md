# Sitio web de Equinoccial

Sitio corporativo de Equinoccial — Maniobras e Izajes. El **header, menú y footer viven en un solo
lugar** y se reutilizan en todas las páginas automáticamente.

---

## 1. Instalar lo necesario (una sola vez)

1. **Visual Studio Code** — https://code.visualstudio.com/
2. **Node.js** (versión LTS) — https://nodejs.org/
   Para confirmar que quedó instalado, abre una terminal y escribe:
   ```
   node --version
   ```
   Debe mostrar un número de versión (ej. `v22.x.x`).
3. **Git** — https://git-scm.com/

## 2. Abrir el proyecto

1. Abre **VS Code**.
2. Ve a `Archivo → Abrir carpeta...` y selecciona la carpeta `equinoccial-site`.
3. Abre la terminal integrada: menú `Terminal → Nueva Terminal` (o `Ctrl + ñ`).

## 3. Generar y ver el sitio

Cada vez que cambies algo en `partials/`, `pages/` o `assets/`, hay que "compilar" el sitio (unir
las piezas en los archivos finales dentro de `docs/`):

```
npm run build
```

Luego, para verlo en el navegador con un servidor local:

```
npm run serve
```

Esto abre algo como `http://localhost:3000` — ábrelo en tu navegador y navega el sitio completo.

> 💡 Alternativa: instala la extensión **Live Server** en VS Code, haz clic derecho sobre
> `docs/index.html` → "Open with Live Server".

## 4. Estructura del proyecto

```
equinoccial-site/
├── partials/
│   ├── layout.html      ← plantilla base (head, body, script)
│   ├── header.html      ← header + menú — EDITA AQUÍ y se actualiza en TODAS las páginas
│   └── footer.html      ← footer + botón de WhatsApp — igual, un solo lugar
├── pages/
│   ├── index.content.html       ← contenido de la página de inicio
│   ├── blog.content.html        ← contenido del blog
│   └── privacidad.content.html  ← contenido de la política de privacidad
├── assets/
│   ├── css/styles.css   ← todos los estilos del sitio
│   ├── js/script.js     ← menú móvil, video del hero y formulario
│   └── img/             ← fotos de la flota y video del hero
├── build.js             ← script que arma las páginas finales
├── package.json
└── docs/                ← 🚫 no se edita a mano — se genera con `npm run build` y es lo que se publica
```

**Regla de oro:** nunca edites nada dentro de `docs/` directamente — esos archivos se regeneran
cada vez que corres `npm run build` y tus cambios se perderían. Edita siempre en `partials/`,
`pages/` o `assets/`.

## 5. Tareas comunes

- **Cambiar el teléfono en todo el sitio** → edítalo en `partials/header.html` y
  `partials/footer.html`, luego `npm run build`.
- **Agregar una página nueva** (ej. "Nosotros") → crea `pages/nosotros.content.html`, agrégala a
  la lista `PAGES` en `build.js`, luego `npm run build`.
- **Agregar un artículo al blog** → edita `pages/blog.content.html`.
- **Cambiar colores o estilos** → edita `assets/css/styles.css` (busca `:root` para los colores
  de marca).

## 6. Publicar cambios

El sitio se publica con **GitHub Pages** desde la carpeta `docs/` de la rama `main`
(repositorio `alexanderua29/equinoccial-site`). Después de compilar:

```
git add .
git commit -m "Describe aquí el cambio"
git push
```

En uno o dos minutos el sitio publicado se actualiza.
