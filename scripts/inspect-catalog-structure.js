const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const sampleCardIdx = html.indexOf('data-card-id="card-febrero-traje-de-comparsa-negro"');
console.log('Position of sample card:', sampleCardIdx);
if (sampleCardIdx !== -1) {
  console.log(html.slice(sampleCardIdx - 200, sampleCardIdx + 800));
}
