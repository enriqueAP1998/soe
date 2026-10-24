# Publicar o sitio en GitHub Pages

GitHub **non renderiza** un `index.html` co seu CSS cando abres o ficheiro no visor do repositorio. Iso amosa o código, non a páxina. Para ver o sitio hai que publicalo con **GitHub Pages** (ou abrir o ficheiro en local).

## Opción A: sitio na raíz do repositorio

1. Sube **o contido** desta carpeta á raíz do repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `assets/`
   - `.nojekyll`
2. No repositorio: **Settings → Pages**.
3. En **Build and deployment**, escolle **Deploy from a branch**.
4. Branch: `main`; folder: `/(root)`.
5. Garda e espera uns minutos.
6. Abre `https://<usuario>.github.io/<repositorio>/`.

## Opción B: sitio nunha subcarpeta `/docs`

1. Move o contido a unha carpeta `docs/` do repositorio.
2. **Settings → Pages → Deploy from a branch → main → /docs**.
3. Abre `https://<usuario>.github.io/<repositorio>/`.

## Se o sitio xa está nunha subcarpeta `contrails/`

GitHub Pages só serve a raíz ou `/docs`. Se o `index.html` está en `contrails/`, tes dúas opcións:

- abrir directamente `https://<usuario>.github.io/<repositorio>/contrails/`, ou
- mover o contido de `contrails/` á raíz (ou a `docs/`).

## Comprobacións rápidas

- Abre a consola do navegador (F12) → **Network** e mira se `styles.css` e `app.js` dan **404**.
- Se dan 404, o ficheiro non está no mesmo nivel có `index.html` ou o nome ten maiúsculas/minúsculas distintas.
- Fai unha recarga forzada (`Ctrl+Shift+R`) para evitar caché.
- O sitio usa rutas relativas (`styles.css`, `app.js`, `assets/...`), así que funciona igual na raíz que nunha subcarpeta, sempre que se manteña a estrutura.
- O ficheiro `.nojekyll` evita que Jekyll procese ou ignore partes do sitio.
