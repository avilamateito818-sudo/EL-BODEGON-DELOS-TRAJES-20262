const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/avima/.gemini/antigravity-ide/brain/10eae293-371b-42b9-b3bc-062f0083923b';

// Map of image files from brain to destination in sitio/assets/img/
const imageCopies = [
  { src: 'quinceanera_bodas_1791561115230.jpg', dest: 'quinceanera_bodas.jpg' },
  { src: 'san_valentin_novia_1791561163402.jpg', dest: 'san_valentin_novia.jpg' },
  { src: 'blazer_ejecutivo_1791561225494.jpg', dest: 'blazer_ejecutivo.jpg' },
  { src: 'carnaval_comparsa_1791561279646.jpg', dest: 'carnaval_comparsa.jpg' },
  { src: 'nazareno_cuaresma_1791561348916.jpg', dest: 'nazareno_cuaresma.jpg' },
  { src: 'primavera_romeria_1791561458049.jpg', dest: 'primavera_romeria.jpg' },
  { src: 'folclor_boyacense_1791561517870.jpg', dest: 'folclor_boyacense.jpg' },
  { src: 'gala_aniversario_1791561581630.jpg', dest: 'gala_aniversario.jpg' }
];

imageCopies.forEach(item => {
  const fullSrc = path.join(brainDir, item.src);
  const fullDest = path.join('sitio/assets/img', item.dest);
  if (fs.existsSync(fullSrc)) {
    fs.copyFileSync(fullSrc, fullDest);
    console.log(`Copied ${item.src} -> ${item.dest}`);
  } else {
    console.warn(`Source not found: ${fullSrc}`);
  }
});

// Update catalogo.json
const catPath = 'sitio/data/catalogo.json';
let cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

// Helper to determine best real photo by title / season
function getBestPhoto(traje) {
  const tit = (traje.titulo || '').toLowerCase();
  const mes = (traje.temporada || '').toLowerCase();

  // Si ya tiene una foto real válida que no sea ph-, conservarla
  if (traje.foto && !traje.foto.includes('ph-') && !traje.foto.includes('uploads/img_20261009_142030')) {
    return traje.foto;
  }

  if (tit.includes('pich') || tit.includes('peach')) {
    return 'assets/img/princesa_peach.jpg';
  }
  if (tit.includes('pasillo')) {
    return 'assets/img/pasillo_fiestero.jpg';
  }

  // Por palabras clave
  if (tit.includes('quinceañera') || tit.includes('madrina') && mes === 'junio') {
    return 'assets/img/quinceanera_bodas.jpg';
  }
  if (tit.includes('san valentín') || tit.includes('valentin') || tit.includes('novia civil') || tit.includes('pareja') && mes === 'febrero') {
    return 'assets/img/san_valentin_novia.jpg';
  }
  if (tit.includes('comparsa') || tit.includes('carnaval') || tit.includes('pluma')) {
    return 'assets/img/carnaval_comparsa.jpg';
  }
  if (tit.includes('nazareno') || tit.includes('sotana') || tit.includes('jesús') || tit.includes('capa')) {
    return 'assets/img/nazareno_cuaresma.jpg';
  }
  if (tit.includes('blazer') || tit.includes('ejecutivo') || tit.includes('formal') || tit.includes('acompañante') || tit.includes('oficio') || tit.includes('alquiler de trajes')) {
    return 'assets/img/blazer_ejecutivo.jpg';
  }
  if (tit.includes('primavera') || tit.includes('floral') || tit.includes('falda') || tit.includes('romería') || tit.includes('dos piezas') || tit.includes('abrigo')) {
    return 'assets/img/primavera_romeria.jpg';
  }
  if (tit.includes('folclórico') || tit.includes('boyacense') || tit.includes('ruana') || tit.includes('campesino')) {
    return 'assets/img/folclor_boyacense.jpg';
  }
  if (tit.includes('gala') || tit.includes('aniversario') || tit.includes('cocktail') || tit.includes('fiesta') && mes === 'agosto') {
    return 'assets/img/gala_aniversario.jpg';
  }
  if (tit.includes('uniforme') || tit.includes('colegio') || tit.includes('ingreso') || tit.includes('diario')) {
    return 'assets/img/uniforme_colegio.webp';
  }
  if (tit.includes('bata')) {
    return 'assets/img/bata_laboratorio.webp';
  }
  if (tit.includes('niña')) {
    return 'assets/img/vestido_nina.webp';
  }
  if (tit.includes('caleña') || tit.includes('patrio') || tit.includes('desfile') || tit.includes('baile')) {
    return 'assets/img/pasillo_fiestero.jpg';
  }

  // Fallbacks por temporada
  switch (mes) {
    case 'febrero': return 'assets/img/carnaval_comparsa.jpg';
    case 'marzo': return 'assets/img/blazer_ejecutivo.jpg';
    case 'abril': return 'assets/img/primavera_romeria.jpg';
    case 'mayo': return 'assets/img/primavera_romeria.jpg';
    case 'junio': return 'assets/img/quinceanera_bodas.jpg';
    case 'julio': return 'assets/img/pasillo_fiestero.jpg';
    case 'agosto': return 'assets/img/gala_aniversario.jpg';
    case 'septiembre': return 'assets/img/blazer_ejecutivo.jpg';
    default: return 'assets/img/blazer_ejecutivo.jpg';
  }
}

let updatedCount = 0;
cat.trajes.forEach(t => {
  const newPhoto = getBestPhoto(t);
  if (t.foto !== newPhoto) {
    t.foto = newPhoto;
    t.tiene_foto_real = true;
    updatedCount++;
  } else {
    t.tiene_foto_real = true;
  }
});

fs.writeFileSync(catPath, JSON.stringify(cat, null, 4), 'utf8');
console.log(`catalogo.json: ${updatedCount} trajes actualizados con fotos reales.`);

// Sincronizar index.html
let html = fs.readFileSync('sitio/index.html', 'utf8');

cat.trajes.forEach(t => {
  const cardIdRegex = new RegExp(`(<div class="card-ghost[^"]*" data-card-id="${t.id}">[\\s\\S]*?<img loading="lazy" src=")[^"]+(" alt="[^"]*">)`, 'g');
  if (cardIdRegex.test(html)) {
    html = html.replace(cardIdRegex, `$1${t.foto}$2`);
  }
});

// Remover clase card-sin-foto de todos los que ya tienen foto real
html = html.replace(/class="card-ghost card-sin-foto"/g, 'class="card-ghost"');

fs.writeFileSync('sitio/index.html', html, 'utf8');
console.log('index.html sincronizado con todas las fotos reales y sin card-sin-foto.');
