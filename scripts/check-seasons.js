const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');

const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

months.forEach(m => {
  const hasPanel = html.includes('data-panel="' + m + '"');
  const hasHero = html.includes('data-hero-season="' + m + '"');
  const hasBtn = html.includes('data-enter="' + m + '"');
  const hasSub = html.includes('id="' + m + '-temporada"') || html.includes('id="' + m + '-catalogo"');
  const hasContact = html.includes('id="' + m + '-contacto"') || html.includes('id="contacto-' + m + '"');
  console.log(m.padEnd(12), 'Panel:', hasPanel, 'Hero:', hasHero, 'Btn:', hasBtn, 'Sub:', hasSub, 'Contact:', hasContact);
});
