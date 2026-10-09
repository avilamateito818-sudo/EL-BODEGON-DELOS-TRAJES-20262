const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('sitio/data/catalogo.json', 'utf8'));

const counts = {};
cat.trajes.forEach(t => {
  const s = t.temporada || 'sin_temporada';
  counts[s] = (counts[s] || 0) + 1;
});

console.log('Trajes por temporada en catalogo.json:', counts);

let mismatches = 0;
cat.trajes.forEach(t => {
  const expectedSeason = t.id.split('-')[1];
  if (t.temporada !== expectedSeason) {
    console.log(`Mismatch: ID ${t.id} has temporada '${t.temporada}', expected '${expectedSeason}'`);
    mismatches++;
  }
});
if (mismatches === 0) {
  console.log('PERFECTO: Todos los 119 trajes corresponden exactamente a su temporada!');
}
