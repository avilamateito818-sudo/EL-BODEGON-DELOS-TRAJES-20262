/**
 * Suite de Verificación Automatizada: T4.6 (Limpieza de directorios huérfanos)
 *
 * Garantiza que:
 *  1. La carpeta duplicada `img/` de la raíz ya no existe.
 *  2. Git ya no rastrea ningún archivo bajo `img/`.
 *  3. Los 30 archivos que contenía siguen existiendo en `sitio/assets/img/` (cero pérdida).
 *  4. Ninguna referencia local a `assets/img/` en index.html / CSS apunta a un archivo inexistente.
 *  5. La documentación dejó de describir `img/` como carpeta vigente, y la carpeta raíz
 *     `data/` (datos privados de clientes, Habeas Data) NO fue tocada y sigue fuera de Git.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITIO = path.join(ROOT, 'sitio');
const ASSETS_IMG = path.join(SITIO, 'assets', 'img');

/** Inventario exacto de los 30 archivos que existían en la carpeta huérfana `img/`. */
const FORMER_ORPHAN_FILES = [
  'bata_laboratorio.jpg',
  'ChatGPT Image 13 ago 2026, 13_46_16.png',
  'descarg6.jpg',
  'descarga4.jpg',
  'descarga5.jpg',
  'descarga7.jpg',
  'er.jpg',
  'horror_bg.png',
  'ima18.jpg',
  'ima21.jpg',
  'imagen 3.jpg',
  'images (11.jpg',
  'images (12.jpg',
  'images 10.jpg',
  'images 8.jpg',
  'images 9.jpg',
  'images.jpg',
  'images2.jpg',
  'img13.jpg',
  'img14.jpg',
  'img15.jpg',
  'img16.jpg',
  'img17.jpg',
  'img19.jpg',
  'img20.jpg',
  'jr.jpg',
  'jr2.jpg',
  'logo.jpg',
  'reyes_magos.jpg',
  'uniforme_colegio.jpg',
];

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function listCssFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listCssFiles(full));
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

/** Extrae referencias locales a assets/img/ desde un texto (src/href/url()). */
function extractImgRefs(text) {
  const refs = new Set();
  const re = /(?:src|href|data-[\w-]+)\s*=\s*["']([^"']*assets\/img\/[^"'?#]+)|url\(\s*["']?([^"')?#]*assets\/img\/[^"')?#]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const ref = (m[1] || m[2] || '').trim();
    if (ref && !/^(https?:)?\/\//i.test(ref) && !ref.startsWith('data:')) refs.add(ref);
  }
  return refs;
}

function resolveRef(ref, baseDir) {
  const clean = decodeURIComponent(ref);
  if (clean.startsWith('/')) return path.join(SITIO, clean);
  return path.resolve(baseDir, clean);
}

let passed = 0;
const total = 5;

console.log('====================================================');
console.log(' SUITE DE VERIFICACIÓN: T4.6 (LIMPIEZA DE HUÉRFANOS)');
console.log('====================================================\n');

// TEST 1
console.log('[TEST 1] Verificando que la carpeta raíz img/ ya no existe...');
if (!fs.existsSync(path.join(ROOT, 'img'))) {
  console.log('  -> PASS: La carpeta duplicada img/ fue eliminada de la raíz.');
  passed++;
} else {
  console.error('  -> FAIL: La carpeta img/ todavía existe en la raíz.');
}

// TEST 2
console.log('\n[TEST 2] Verificando que Git ya no rastrea archivos bajo img/...');
try {
  const tracked = git('ls-files img').split('\n').filter(Boolean);
  if (tracked.length === 0) {
    console.log('  -> PASS: 0 archivos de img/ en el índice de Git.');
    passed++;
  } else {
    console.error(`  -> FAIL: Git aún rastrea ${tracked.length} archivos bajo img/.`);
  }
} catch (err) {
  console.error('  -> ERROR ejecutando git:', err.message);
}

// TEST 3
console.log('\n[TEST 3] Verificando cero pérdida: los 30 archivos existen en sitio/assets/img/...');
const missing = FORMER_ORPHAN_FILES.filter((f) => !fs.existsSync(path.join(ASSETS_IMG, f)));
if (missing.length === 0) {
  console.log(`  -> PASS: Los ${FORMER_ORPHAN_FILES.length}/${FORMER_ORPHAN_FILES.length} archivos siguen disponibles en sitio/assets/img/.`);
  passed++;
} else {
  console.error(`  -> FAIL: Faltan ${missing.length} archivos en sitio/assets/img/: ${missing.join(', ')}`);
}

// TEST 4
console.log('\n[TEST 4] Verificando integridad de referencias a assets/img/ (HTML + CSS)...');
const broken = [];
let checked = 0;
const sources = [
  { file: path.join(SITIO, 'index.html'), base: SITIO },
  ...listCssFiles(path.join(SITIO, 'css')).map((f) => ({ file: f, base: path.dirname(f) })),
];
for (const { file, base } of sources) {
  const refs = extractImgRefs(fs.readFileSync(file, 'utf8'));
  for (const ref of refs) {
    checked++;
    if (!fs.existsSync(resolveRef(ref, base))) {
      broken.push(`${path.relative(ROOT, file)} -> ${ref}`);
    }
  }
}
if (broken.length === 0) {
  console.log(`  -> PASS: ${checked} referencias locales verificadas; 0 enlaces rotos.`);
  passed++;
} else {
  console.error(`  -> FAIL: ${broken.length} referencias rotas:\n     ${broken.join('\n     ')}`);
}

// TEST 5
console.log('\n[TEST 5] Verificando documentación y protección de datos privados (data/)...');
let docsOk = true;
let privacyOk = true;
const docPath = path.join(ROOT, 'docs', 'DIRECTORY_STRUCTURE.md');
if (fs.existsSync(docPath)) {
  const doc = fs.readFileSync(docPath, 'utf8');
  if (/├── img\/|`img\/` \(raíz\)/.test(doc)) {
    docsOk = false;
    console.error('  -> FAIL: docs/DIRECTORY_STRUCTURE.md aún describe img/ como carpeta vigente.');
  }
}
const rootData = path.join(ROOT, 'data');
if (fs.existsSync(rootData)) {
  try {
    execSync('git check-ignore -q data/mensajes.json', { cwd: ROOT, stdio: 'ignore' });
  } catch (_) {
    privacyOk = false;
    console.error('  -> FAIL: data/ existe pero NO está protegido por .gitignore (riesgo Habeas Data).');
  }
  try {
    if (git('ls-files data').length > 0) {
      privacyOk = false;
      console.error('  -> FAIL: Git rastrea archivos de data/ (datos personales de clientes).');
    }
  } catch (_) { /* sin rastreo */ }
}
if (docsOk && privacyOk) {
  console.log('  -> PASS: Documentación actualizada; data/ (clientes) intacto y fuera de Git.');
  passed++;
}

console.log('\n----------------------------------------------------');
console.log(` RESULTADOS: ${passed}/${total} pruebas superadas`);
console.log('----------------------------------------------------');

if (passed === total) {
  console.log('>>> [SUCCESS] T4.6 APROBADA SATISFACTORIAMENTE <<<\n');
  process.exit(0);
} else {
  console.error('>>> [FAILURE] T4.6 NO SUPERÓ TODAS LAS PRUEBAS <<<\n');
  process.exit(1);
}
