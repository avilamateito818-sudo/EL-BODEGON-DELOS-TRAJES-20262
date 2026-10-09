const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// List of all months in order
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Let's ensure each panel's section #[mes]-catalogo is closed before #[mes]-contacto
months.forEach(m => {
  const panelMarker = 'data-panel="' + m + '"';
  const start = html.indexOf(panelMarker);
  if (start === -1) return;
  const end = html.indexOf('</article>', start);
  let panelHtml = html.substring(start, end);

  // Check if #[mes]-contacto exists
  const contactoMarker = `id="${m === 'octubre' ? 'contacto-octubre' : m + '-contacto'}"`;
  const contactoIdx = panelHtml.indexOf(contactoMarker);
  if (contactoIdx !== -1) {
    // Look backwards from contactoIdx to find <section class="season-catalog" id="...contacto..."
    const secStart = panelHtml.lastIndexOf('<section', contactoIdx);
    const beforeContacto = panelHtml.substring(0, secStart).trimEnd();
    const contactoAndAfter = panelHtml.substring(secStart);

    // If beforeContacto doesn't end with </section>, let's see what is unclosed
    // Count open/close div and section in beforeContacto
    const divOpen = (beforeContacto.match(/<div[\s>]/g) || []).length;
    const divClose = (beforeContacto.match(/<\/div>/g) || []).length;
    const secOpen = (beforeContacto.match(/<section[\s>]/g) || []).length;
    const secClose = (beforeContacto.match(/<\/section>/g) || []).length;

    let fixClosing = '';
    // If there is an unclosed div (e.g. grid-haunted or catalog-note)
    if (divOpen > divClose + 1) { // +1 because season-sub-sections is open
      for (let i = 0; i < (divOpen - (divClose + 1)); i++) {
        fixClosing += '\n          </div>';
      }
    }
    // If there is an unclosed section (the [mes]-catalogo section)
    if (secOpen > secClose) {
      for (let i = 0; i < (secOpen - secClose); i++) {
        fixClosing += '\n          </section>';
      }
    }

    if (fixClosing) {
      panelHtml = beforeContacto + fixClosing + '\n\n          ' + contactoAndAfter;
      html = html.substring(0, start) + panelHtml + html.substring(end);
    }
  }
});

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Finished closing unclosed tags before contacto sections.');
