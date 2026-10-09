const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

months.forEach((m) => {
  const hasTemp = html.includes(`id="${m}-temporada"`);
  const hasCat = html.includes(`id="${m}-catalogo"`);
  const hasCont = html.includes(`id="${m}-contacto"`);
  console.log(m.padEnd(12), 'temp:', hasTemp, 'cat:', hasCat, 'cont:', hasCont);
});
