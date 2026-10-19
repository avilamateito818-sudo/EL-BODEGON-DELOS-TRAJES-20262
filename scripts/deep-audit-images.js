const fs = require('fs');
const path = require('path');

const sitioDir = path.join(__dirname, '..', 'sitio');
const htmlPath = path.join(sitioDir, 'index.html');
const catPath = path.join(sitioDir, 'data', 'catalogo.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

// Extract all image paths in HTML
const re = /(?:src|href)=["']([^"']+\.(?:png|jpe?g|webp|svg))["']/gi;
const usedImages = new Map();
let m;
while ((m = re.exec(html)) !== null) {
  const clean = m[1].split('?')[0];
  usedImages.set(clean, (usedImages.get(clean) || 0) + 1);
}

// Extract all image paths in catalogo.json
for (const t of cat.trajes || []) {
  if (t.foto) {
    const clean = t.foto.split('?')[0];
    usedImages.set(clean, (usedImages.get(clean) || 0) + 1);
  }
}
for (const k in cat.temporadas || {}) {
  const temp = cat.temporadas[k];
  if (temp.hero) {
    const clean = temp.hero.split('?')[0];
    usedImages.set(clean, (usedImages.get(clean) || 0) + 1);
  }
  if (temp.banner) {
    const clean = temp.banner.split('?')[0];
    usedImages.set(clean, (usedImages.get(clean) || 0) + 1);
  }
}

const report = [];
let totalBytes = 0;
let formatCounts = { jpg: 0, png: 0, webp: 0, svg: 0, other: 0 };

for (const [relPath, count] of usedImages.entries()) {
  if (relPath.startsWith('http://') || relPath.startsWith('https://')) continue;
  const absPath = path.join(sitioDir, relPath.replace(/^\/+/, ''));
  if (fs.existsSync(absPath)) {
    const size = fs.statSync(absPath).size;
    totalBytes += size;
    const ext = path.extname(relPath).toLowerCase().replace('.', '');
    if (ext === 'jpg' || ext === 'jpeg') formatCounts.jpg++;
    else if (ext === 'png') formatCounts.png++;
    else if (ext === 'webp') formatCounts.webp++;
    else if (ext === 'svg') formatCounts.svg++;
    else formatCounts.other++;

    report.push({
      relPath,
      size,
      sizeKB: (size / 1024).toFixed(1),
      count,
      ext
    });
  }
}

report.sort((a, b) => b.size - a.size);

console.log('=== AUDITORÍA PROFUNDA DE IMÁGENES ACTIVAS ===');
console.log('Total imágenes únicas en uso:', report.length);
console.log('Peso total activo:', (totalBytes / 1024 / 1024).toFixed(2), 'MB');
console.log('Formatos en uso:', formatCounts);
console.log('\nTop 25 imágenes más pesadas en uso:');
report.slice(0, 25).forEach(img => {
  console.log(`  ${img.sizeKB.padStart(7)} KB [${img.ext.toUpperCase()}] (ref: ${img.count}x) -> ${img.relPath}`);
});
