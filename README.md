# Estelas de condensación sobre Europa

Recurso didáctico para a materia **Sistemas de Observación Espaciais** do
**Mestrado en Enxeñería Aeronáutica** (Universidade de Vigo). O sitio explica a
formación das estelas de condensación, a súa detección con satélites (SEVIRI) e
o seu papel no quecemento global, cun caso de estudo local nas Illas Canarias e
unha mirada de conxunto sobre Europa.

## Como abrir

Opción 1: abrir `index.html` directamente no navegador.

Opción 2 (recomendada para presentacións): servir a carpeta en local para que
o vídeo e os recursos carguen sen restricións do navegador:

```bash
cd /home/enrique/Downloads/contrails
python3 -m http.server 8000
```

E abrir <http://localhost:8000>.

## Estrutura

- `index.html` — contido e estrutura da páxina.
- `styles.css` — deseño, temas claro/escuro e animacións.
- `app.js` — simuladores, gráfico de forzamento, quiz e navegación.
- `assets/` — figuras, vídeo e MathJax local.
  - `btd_evolution.mp4` / `.webm` — vídeo de evolución da BTD nas Illas Canarias.
  - `btd_evolution_poster.webp` — portada do vídeo.
  - `mathjax/tex-svg.js` — MathJax local para que as fórmulas funcionen sen CDN.

## Notas sobre o material

- No PPTX orixinal había **un único vídeo** (`media1.mp4`), a secuencia de
  evolución da BTD nas Illas Canarias. Emprégase como **Figura 4**.
- A **rotación de SEVIRI** represéntase cunha animación SVG didáctica, porque
  non había un vídeo independente da rotación no PPTX.
- As figuras 2–11 conservan as etiquetas orixinais en inglés; os textos e as
  explicacións están en galego.
- As fontes de datos e as referencias están ligadas na sección 07 do sitio.
- O sitio está pensado para unha conferencia de innovación docente: inclúe un
  guión de 10 minutos, unha guía de 5 sesións, rúbrica e quiz de autoavaliación.
