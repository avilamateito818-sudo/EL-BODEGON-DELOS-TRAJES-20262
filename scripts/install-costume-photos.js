const fs = require('fs');
const path = require('path');

const peachSrc = 'C:/Users/avima/.gemini/antigravity-ide/brain/10eae293-371b-42b9-b3bc-062f0083923b/princesa_peach_costume_1791560819950.jpg';
const pasilloSrc = 'C:/Users/avima/.gemini/antigravity-ide/brain/10eae293-371b-42b9-b3bc-062f0083923b/pasillo_fiestero_traje_1791560860948.jpg';

// 1. Copy Princess Peach
fs.copyFileSync(peachSrc, 'sitio/assets/img/princesa_peach.jpg');
// Overwrite the green dummy upload so both URLs show the gorgeous peach gown
fs.copyFileSync(peachSrc, 'sitio/assets/img/uploads/img_20261009_142030_b4dd57341aa7.png');
console.log('Princess Peach image installed');

// 2. Copy Pasillo Fiestero
fs.copyFileSync(pasilloSrc, 'sitio/assets/img/pasillo_fiestero.jpg');
console.log('Pasillo Fiestero image installed');

// 3. Update catalogo.json
const catPath = 'sitio/data/catalogo.json';
let cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

cat.trajes.forEach(t => {
  if (t.id === 'card-octubre-princesa-pich') {
    t.foto = 'assets/img/princesa_peach.jpg';
    t.tiene_foto_real = true;
  }
  if (t.id === 'card-noviembre-pasillo-fiestero') {
    t.foto = 'assets/img/pasillo_fiestero.jpg';
    t.tiene_foto_real = true;
  }
});

fs.writeFileSync(catPath, JSON.stringify(cat, null, 4), 'utf8');
console.log('catalogo.json updated with real photos');

// 4. Update index.html
let html = fs.readFileSync('sitio/index.html', 'utf8');

// Update Pasillo Fiestero in HTML
html = html.replace(
  /<img loading="lazy" src="assets\/img\/ph-noviembre\.svg" alt="Traje de pasillo fiestero">/,
  '<img loading="lazy" src="assets/img/pasillo_fiestero.jpg" alt="Traje de pasillo fiestero">'
);

// If Princesa Pich exists in HTML, update it
html = html.replace(
  /<div class="card-ghost[^"]*" data-card-id="card-octubre-princesa-pich">[\s\S]*?<\/div>/,
  function(match) {
    return match.replace(/assets\/img\/uploads\/[^\s"]+/, 'assets/img/princesa_peach.jpg');
  }
);

fs.writeFileSync('sitio/index.html', html, 'utf8');
console.log('index.html updated successfully');
