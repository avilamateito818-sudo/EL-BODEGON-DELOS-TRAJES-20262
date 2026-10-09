const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('sitio/data/catalogo.json', 'utf8'));

let withPh = 0;
let withReal = 0;
let withUploads = 0;

cat.trajes.forEach(t => {
  if (!t.foto || t.foto.includes('ph-')) {
    withPh++;
  } else if (t.foto.includes('uploads/')) {
    withUploads++;
  } else {
    withReal++;
  }
});

console.log('Total trajes:', cat.trajes.length);
console.log('Trajes con placeholder ph-*.svg:', withPh);
console.log('Trajes con uploads:', withUploads);
console.log('Trajes con fotos reales existentes:', withReal);
