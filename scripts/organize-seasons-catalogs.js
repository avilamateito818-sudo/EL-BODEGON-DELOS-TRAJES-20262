const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original index.html lines:', html.split('\n').length);

// 1. Move Octubre panel between Septiembre and Noviembre
const octubreStart = html.indexOf('<article class="season-panel season-panel-stack season-panel-exclusive" data-panel="octubre"');
if (octubreStart === -1) {
  console.error('Could not find octubre panel!');
  process.exit(1);
}
const octubreEnd = html.indexOf('</article>', octubreStart) + '</article>'.length;
const octubreBlock = html.substring(octubreStart, octubreEnd);

// Remove octubre from end
html = html.substring(0, octubreStart) + html.substring(octubreEnd);

// Find Septiembre end
const septiembreEndMarker = 'data-panel="septiembre"';
const sepIdx = html.indexOf(septiembreEndMarker);
const sepArticleEnd = html.indexOf('</article>', sepIdx) + '</article>'.length;

// Insert Octubre after Septiembre
html = html.substring(0, sepArticleEnd) + '\n\n      <!-- OCTUBRE (HALLOWEEN EXCLUSIVO) -->\n      ' + octubreBlock + html.substring(sepArticleEnd);

console.log('Octubre successfully moved between Septiembre and Noviembre in DOM order.');

// 2. Fix anchor links in quick-nav: in all months, replace href="#catalogo" with href="#[mes]-catalogo"
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

months.forEach(m => {
  const panelMarker = 'data-panel="' + m + '"';
  const start = html.indexOf(panelMarker);
  if (start === -1) return;
  const end = html.indexOf('</article>', start);
  let panelHtml = html.substring(start, end);

  // Replace <a href="#catalogo"> with <a href="#m-catalogo"> inside this panel's quick-nav
  const replaced = panelHtml.replace(/<a\s+href=[\'\"]#catalogo[\'\"]>Catálogo<\/a>/g, `<a href="#${m}-catalogo">Catálogo</a>`);
  if (replaced !== panelHtml) {
    html = html.substring(0, start) + replaced + html.substring(end);
  }
});

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Saved preliminary reorder and quick-nav updates.');
