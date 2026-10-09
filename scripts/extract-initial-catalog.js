const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
const outputPath = path.join(__dirname, '..', 'sitio', 'data', 'catalogo.json');
const html = fs.readFileSync(htmlPath, 'utf8');

// Find all cards using data-card-id
const cardIdRegex = /<div[^>]*data-card-id="([^"]+)"[^>]*>([\s\S]*?)(?=<div[^>]*data-card-id="|<\/div>\s*<\/div>\s*<\/div>|<\/section>|<\/article>)/gi;

// Even cleaner: match every element with data-card-id
const cardTags = [...html.matchAll(/data-card-id="([^"]+)"/g)].map(m => m[1]);
console.log('Total card IDs found in HTML:', cardTags.length);

const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const catalog = {
  version: 1,
  ultima_actualizacion: new Date().toISOString(),
  temporada_activa: 'octubre',
  hero_general: {
    tag: 'El Bodegón de los Trajes · Tunja',
    titulo: 'Disfraces, Uniformes y Vestidos a la Medida',
    subtitulo: 'Colección exclusiva de alta costura, trajes de fiesta y disfraces para todas las temporadas del año en Tunja, Boyacá.',
    whatsapp_cta: 'https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20un%20traje.'
  },
  temporadas: {},
  trajes: []
};

// Extract season hero data
for (const month of months) {
  const panelStart = html.indexOf(`data-panel="${month}"`);
  let hito = '', titulo = '', subtitulo = '', foto_hero = '';
  if (panelStart !== -1) {
    const chunk = html.slice(panelStart, panelStart + 2500);
    const mHito = chunk.match(/data-field="[^"]*\.hero_milestone"[^>]*>([\s\S]*?)<\//i);
    const mTit = chunk.match(/data-field="[^"]*\.hero_title"[^>]*>([\s\S]*?)<\//i);
    const mSub = chunk.match(/data-field="[^"]*\.hero_subtitle"[^>]*>([\s\S]*?)<\//i);
    const mFoto = chunk.match(/hero-photo[\s\S]*?<img[^>]+src="([^"]+)"/i);
    
    if (mHito) hito = mHito[1].replace(/<[^>]+>/g, '').trim();
    if (mTit) titulo = mTit[1].replace(/<[^>]+>/g, '').trim();
    if (mSub) subtitulo = mSub[1].replace(/<[^>]+>/g, '').trim();
    if (mFoto) foto_hero = mFoto[1].trim();
  }
  
  catalog.temporadas[month] = {
    id: month,
    nombre: month.charAt(0).toUpperCase() + month.slice(1),
    hito: hito,
    titulo: titulo,
    subtitulo: subtitulo,
    foto_hero: foto_hero
  };
}

// For each card ID, extract its data block
for (const cardId of cardTags) {
  const marker = `data-card-id="${cardId}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) continue;
  
  // Extract up to 1200 characters following this card
  const chunk = html.slice(idx, idx + 1200);
  
  // Find which panel this card belongs to by looking backwards
  const preHtml = html.slice(0, idx);
  const lastPanelMatch = [...preHtml.matchAll(/data-panel="([^"]+)"/g)].pop();
  const temporada = lastPanelMatch ? lastPanelMatch[1] : 'enero';
  
  // Find card group by looking backwards for catalog-group-title or section h4
  const lastGroupMatch = [...preHtml.matchAll(/<h5 class="catalog-group-title">([\s\S]*?)<\/h5>/gi)].pop();
  const grupo = lastGroupMatch ? lastGroupMatch[1].replace(/<[^>]+>/g, '').trim() : 'General';
  
  // Extract image
  const imgMatch = chunk.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
  const foto = imgMatch ? imgMatch[1].trim() : '';
  
  // Extract title (h3, h4, h5)
  const titleMatch = chunk.match(/<h[345][^>]*>([\s\S]*?)<\/h[345]>/i);
  let cardTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  
  // Extract description (p)
  const descMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  let cardDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  
  // Fallbacks for special Enero cards if needed
  if (!cardTitle) {
    if (cardId.includes('reyes-magos')) cardTitle = 'Reyes Magos';
    else if (cardId.includes('uniformes')) cardTitle = 'Uniformes de Colegio';
    else if (cardId.includes('batas')) cardTitle = 'Batas de Laboratorio';
    else cardTitle = cardId.replace('card-' + temporada + '-', '').replace(/-/g, ' ');
  }
  
  const tieneFotoReal = foto && !foto.includes('ph-') && !foto.includes('.svg');
  
  catalog.trajes.push({
    id: cardId,
    temporada: temporada,
    grupo: grupo,
    titulo: cardTitle,
    descripcion: cardDesc,
    foto: foto,
    tiene_foto_real: tieneFotoReal,
    tallas: ['S', 'M', 'L', 'A la medida'],
    destacado: tieneFotoReal,
    activo: true
  });
}

console.log('--- Resumen de Extracción ---');
console.log('Temporadas extraídas:', Object.keys(catalog.temporadas).length);
console.log('Total trajes extraídos:', catalog.trajes.length);
const trajesConFoto = catalog.trajes.filter(t => t.tiene_foto_real).length;
console.log('Trajes con fotografía real (WebP/JPG):', trajesConFoto);
console.log('Trajes con placeholder SVG temático:', catalog.trajes.length - trajesConFoto);

// Save initial catalogo.json
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Guardado exitosamente en:', outputPath);
