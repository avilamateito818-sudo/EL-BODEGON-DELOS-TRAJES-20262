const fs = require('fs');
const path = require('path');

const sitioDir = path.join(__dirname, '..', 'sitio');
const html = fs.readFileSync(path.join(sitioDir, 'index.html'), 'utf8');

console.log('=== AUDITORÍA ESTRUCTURAL DE INDEX.HTML ===');

// 1. Check duplicate IDs
const idRegex = /\bid=["']([^"']+)["']/gi;
const idCounts = {};
let m;
while ((m = idRegex.exec(html)) !== null) {
  const id = m[1];
  idCounts[id] = (idCounts[id] || 0) + 1;
}
const dupes = Object.entries(idCounts).filter(([_, count]) => count > 1);
console.log('IDs duplicados encontrados:', dupes.length);
dupes.forEach(([id, count]) => console.log(`  - #${id} aparece ${count} veces`));

// 2. Check broken internal hash links (<a href="#...">)
const linkRegex = /<a[^>]+href=["']#([^"']+)["']/gi;
const brokenAnchors = [];
while ((m = linkRegex.exec(html)) !== null) {
  const targetId = m[1];
  if (!idCounts[targetId] && !html.includes(`name="${targetId}"`)) {
    brokenAnchors.push(targetId);
  }
}
console.log('\nEnlaces internos rotos (#id no existe):', brokenAnchors.length);
[...new Set(brokenAnchors)].forEach(a => console.log(`  - #${a}`));

// 3. Check touch targets and buttons without aria-label
const btnRegex = /<button([^>]+)>/gi;
let btnsWithoutAria = 0;
while ((m = btnRegex.exec(html)) !== null) {
  const attrs = m[1];
  if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby') && !attrs.includes('title')) {
    btnsWithoutAria++;
  }
}
console.log('\nBotones sin aria-label ni title:', btnsWithoutAria);

// 4. Check images without width / height or alt
const imgRegex = /<img([^>]+)>/gi;
let missingAlt = 0;
let missingDim = 0;
let missingLazy = 0;
let totalImgs = 0;
while ((m = imgRegex.exec(html)) !== null) {
  totalImgs++;
  const attrs = m[1];
  if (!/alt=["'][^"']*["']/i.test(attrs)) missingAlt++;
  if (!/width=["'][^"']+["']/i.test(attrs) || !/height=["'][^"']+["']/i.test(attrs)) missingDim++;
  if (!/loading=["'][^"']+["']/i.test(attrs)) missingLazy++;
}
console.log(`\nImágenes auditadas: ${totalImgs}`);
console.log(`  - Sin alt: ${missingAlt}`);
console.log(`  - Sin width o height (causa CLS en móvil): ${missingDim}`);
console.log(`  - Sin loading="lazy" (consume datos iniciales innecesarios): ${missingLazy}`);

// 5. Check hardcoded credentials or sensitive data
const sensitivePatterns = ['ANAISABEL2026', 'admin2026', 'DEFAULT_PASSWORD', 'SECRET'];
console.log('\nChequeo de credenciales expuestas en HTML:');
sensitivePatterns.forEach(p => {
  if (html.includes(p)) console.log(`  [ALERTA CRÍTICA] Encontrado: ${p}`);
});
