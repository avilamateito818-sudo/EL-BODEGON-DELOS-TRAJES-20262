const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');

const panels = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

panels.forEach(p => {
  const marker = 'data-panel="' + p + '"';
  const start = html.indexOf(marker);
  if (start === -1) {
    console.log('MISSING PANEL:', p);
    return;
  }
  const end = html.indexOf('</article>', start);
  const panelHtml = html.substring(start, end);
  const divsOpen = (panelHtml.match(/<div[\s>]/g) || []).length;
  const divsClose = (panelHtml.match(/<\/div>/g) || []).length;
  const secOpen = (panelHtml.match(/<section[\s>]/g) || []).length;
  const secClose = (panelHtml.match(/<\/section>/g) || []).length;
  const diffDiv = divsOpen - divsClose;
  const diffSec = secOpen - secClose;
  console.log(`Panel [${p.padEnd(10)}]: divs(${divsOpen}/${divsClose} diff:${diffDiv}), sections(${secOpen}/${secClose} diff:${diffSec})`);
});
