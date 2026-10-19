const fs = require('fs');
const path = require('path');

const sitioDir = path.join(__dirname, '..', 'sitio');
const htmlPath = path.join(sitioDir, 'index.html');
const catPath = path.join(sitioDir, 'data', 'catalogo.json');
const repPath = path.join(__dirname, 'replacements.json');

const replacements = JSON.parse(fs.readFileSync(repPath, 'utf8'));

// 1. Update catalogo.json
let catStr = fs.readFileSync(catPath, 'utf8');
let catReplacementsCount = 0;
for (const [from, to] of Object.entries(replacements)) {
  const fromClean = from.replace(/\\/g, '/');
  const toClean = to.replace(/\\/g, '/');
  if (catStr.includes(fromClean)) {
    const parts = catStr.split(fromClean);
    catReplacementsCount += (parts.length - 1);
    catStr = parts.join(toClean);
  }
}
fs.writeFileSync(catPath, catStr);
console.log(`[OK] catalogo.json actualizado con ${catReplacementsCount} sustituciones WebP.`);

// 2. Update index.html
let html = fs.readFileSync(htmlPath, 'utf8');
let htmlReplacementsCount = 0;
for (const [from, to] of Object.entries(replacements)) {
  const fromClean = from.replace(/\\/g, '/');
  const toClean = to.replace(/\\/g, '/');
  if (html.includes(fromClean)) {
    const parts = html.split(fromClean);
    htmlReplacementsCount += (parts.length - 1);
    html = parts.join(toClean);
  }
}
console.log(`[OK] index.html actualizado con ${htmlReplacementsCount} sustituciones WebP.`);

// 3. Inspect all <img> in index.html, add width, height, decoding="async"
// Standard dimensions by context:
// - logo: 44x44
// - hero images / season banner: 1200x670
// - season cards / grid-haunted img: 600x800 (aspect 3:4) or 600x600 (aspect 1:1)
// - season item thumbnails: 82x82
// - season subsection images: 800x600 (aspect 4:3)
// - essence cover: 480x360
// - placeholders ph-*.svg: 600x800

html = html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
  let newAttrs = attrs;

  // Add decoding="async" if missing
  if (!/\bdecoding=/i.test(newAttrs)) {
    newAttrs = newAttrs + ' decoding="async"';
  }

  // Ensure loading="lazy" if not eager
  if (!/\bloading=/i.test(newAttrs)) {
    newAttrs = newAttrs + ' loading="lazy"';
  }

  // Add width and height if missing
  if (!/\bwidth=/i.test(newAttrs) || !/\bheight=/i.test(newAttrs)) {
    const srcMatch = newAttrs.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : '';

    if (src.includes('logo.jpg')) {
      newAttrs = newAttrs + ' width="44" height="44"';
    } else if (src.includes('hero') || src.includes('horror_bg')) {
      newAttrs = newAttrs + ' width="1200" height="670"';
    } else if (src.includes('essence') || newAttrs.includes('essence')) {
      newAttrs = newAttrs + ' width="480" height="360"';
    } else if (newAttrs.includes('season-item') || src.includes('thumb')) {
      newAttrs = newAttrs + ' width="82" height="82"';
    } else if (newAttrs.includes('subsection') || src.includes('subsection')) {
      newAttrs = newAttrs + ' width="800" height="600"';
    } else {
      // Default costume card image
      newAttrs = newAttrs + ' width="600" height="800"';
    }
  }

  return `<img${newAttrs}>`;
});

// 4. Add aria-label / title to buttons lacking it
html = html.replace(/<button\b([^>]*?)>/gi, (match, attrs) => {
  if (/\baria-label=/i.test(attrs) || /\baria-labelledby=/i.test(attrs) || /\btitle=/i.test(attrs)) {
    return match;
  }
  // Determine suitable label from class or id
  let label = 'Acción interactiva';
  if (/season-tab\b/i.test(attrs)) {
    const tabMatch = attrs.match(/data-season=["']([^"']+)["']/i) || attrs.match(/data-tab=["']([^"']+)["']/i);
    label = tabMatch ? `Ver temporada ${tabMatch[1]}` : 'Ver temporada';
  } else if (/dropdown-toggle\b/i.test(attrs)) {
    label = 'Abrir menú desplegable';
  } else if (/accordion\b/i.test(attrs)) {
    label = 'Alternar contenido';
  } else if (/menu-toggle\b/i.test(attrs)) {
    label = 'Abrir menú';
  } else if (/nav-close\b/i.test(attrs)) {
    label = 'Cerrar menú';
  } else if (/lightbox-close\b/i.test(attrs)) {
    label = 'Cerrar vista previa';
  } else if (/filter-btn\b/i.test(attrs)) {
    label = 'Filtrar catálogo';
  }

  return `<button${attrs} aria-label="${label}">`;
});

fs.writeFileSync(htmlPath, html);
console.log('[OK] index.html actualizado con dimensiones de imagen y atributos ARIA.');

// 5. Delete orphan ChatGPT image if exists
const orphanPath = path.join(sitioDir, 'assets', 'img', 'ChatGPT Image 13 ago 2026, 13_46_16.png');
if (fs.existsSync(orphanPath)) {
  fs.unlinkSync(orphanPath);
  console.log('[OK] Eliminado archivo huérfano pesado: ChatGPT Image... (2.58 MB ahorrados).');
}
