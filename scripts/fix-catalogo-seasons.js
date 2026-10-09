const fs = require('fs');

const catPath = 'sitio/data/catalogo.json';
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

let changed = 0;
cat.trajes.forEach(traje => {
  if (traje.id) {
    const parts = traje.id.split('-');
    if (parts.length > 1) {
      const monthFromId = parts[1];
      const validMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      if (validMonths.includes(monthFromId) && traje.temporada !== monthFromId) {
        console.log(`Fixing traje ${traje.id}: season was ${traje.temporada} -> now ${monthFromId}`);
        traje.temporada = monthFromId;
        changed++;
      }
    }
  }
});

console.log(`Updated ${changed} trajes with their correct season in catalogo.json`);

// Check counts per season now
const counts = {};
cat.trajes.forEach(t => {
  counts[t.temporada] = (counts[t.temporada] || 0) + 1;
});
console.log('New counts per season:', counts);

fs.writeFileSync(catPath, JSON.stringify(cat, null, 4), 'utf8');
console.log('Saved updated catalogo.json');
