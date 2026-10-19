const fs = require('fs');
const path = require('path');

const sitioDir = path.join(__dirname, '..', 'sitio');
const htmlPath = path.join(sitioDir, 'index.html');
const catPath = path.join(sitioDir, 'data', 'catalogo.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

// Extract all src, href, url from html
const re = /(?:src|href)=["']([^"']+\.(?:png|jpg|jpeg|webp|svg|gif|ico))["']/gi;
let match;
const htmlImgs = new Set();
while ((match = re.exec(html)) !== null) {
  htmlImgs.add(match[1]);
}

// Extract from catalogo.json
const catImgs = new Set();
for (const t of cat.trajes || []) {
  if (t.foto) catImgs.add(t.foto);
}
for (const k in cat.temporadas || {}) {
  const temp = cat.temporadas[k];
  if (temp.hero) catImgs.add(temp.hero);
  if (temp.banner) catImgs.add(temp.banner);
}

console.log('HTML referenced images:', htmlImgs.size);
console.log('Catalog referenced images:', catImgs.size);

const missing = [];
const allReferenced = new Set([...htmlImgs, ...catImgs]);
for (const rel of allReferenced) {
  if (rel.startsWith('http://') || rel.startsWith('https://') || rel.startsWith('data:')) continue;
  const clean = rel.replace(/^\/+/, '').split('?')[0];
  const abs = path.join(sitioDir, clean);
  if (!fs.existsSync(abs)) {
    missing.push({ rel, abs });
  }
}

console.log('\nMISSING IMAGES (will 404):', missing.length);
missing.forEach(m => console.log('  404 ->', m.rel));

// Check all disk images
function walkDir(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) list = list.concat(walkDir(p));
    else if (/\.(png|jpe?g|webp|svg|gif)$/i.test(item)) {
      list.push({ path: p, rel: path.relative(sitioDir, p).replace(/\\/g, '/'), size: fs.statSync(p).size });
    }
  }
  return list;
}

const diskImages = walkDir(path.join(sitioDir, 'assets', 'img'));
console.log('\nTOTAL DISK IMAGES:', diskImages.length);
diskImages.sort((a,b) => b.size - a.size);
console.log('\nTOP 15 HEAVIEST IMAGES:');
diskImages.slice(0, 15).forEach(img => {
  console.log(`  ${(img.size / 1024).toFixed(1)} KB - ${img.rel}`);
});
