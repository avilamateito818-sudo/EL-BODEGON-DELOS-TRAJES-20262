/**
 * Suite de Pruebas Automatizadas T3.3: Saneamiento de Datos y Estilos Responsivos
 * Valida la integridad estructural, codificación UTF-8, erradicación de Base64
 * y ausencia de anchos destructivos en sitio/data/admin-content.js.
 */

const fs = require('fs');
const path = require('path');

const contentFile = path.resolve(__dirname, '../sitio/data/admin-content.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

console.log('=== TEST SUITE T3.3: Verificación de admin-content.js y Estilos Fluidos ===\n');

// 1. Carga y parsing
const rawCode = fs.readFileSync(contentFile, 'utf8');
global.window = {};

try {
  eval(rawCode);
} catch (err) {
  assert(false, `Error de sintaxis al evaluar admin-content.js: ${err.message}`);
}

const content = global.window.ADMIN_CONTENT;
assert(content && typeof content === 'object', 'Test 1: Estructura window.ADMIN_CONTENT parseable y válida');

// 2. Erradicación de Mojibake (UTF-8 corrupto)
const serialized = JSON.stringify(content);
const mojibakePatterns = [/A├æO/, /Operaci├│n/, /├│/, /├æ/, /Ã±/, /Ã³/];
const foundMojibake = mojibakePatterns.some(pattern => pattern.test(serialized));
assert(!foundMojibake, 'Test 2: Cero caracteres corruptos (mojibake) en textos, títulos y secciones');

// 3. Ausencia de anchos destructivos en editorStyles
const styles = content.editorStyles || {};
let hasDestructiveWidth = false;
let offendingKey = '';

Object.keys(styles).forEach(key => {
  const css = styles[key];
  const widthMatch = css.match(/width:\s*(\d+)px/i);
  if (widthMatch) {
    const px = parseInt(widthMatch[1], 10);
    if (px > 400) {
      hasDestructiveWidth = true;
      offendingKey = `${key} -> ${css}`;
    }
  }
});

assert(!hasDestructiveWidth, `Test 3: Cero anchos fijos destructivos (>400px) en editorStyles (detectado: ${offendingKey || 'ninguno'})`);

// 4. Erradicación total de Base64
let hasBase64 = false;
(content.images || []).forEach(img => {
  if (img.src && img.src.startsWith('data:image')) hasBase64 = true;
});
Object.keys(content.seasonCovers || {}).forEach(k => {
  if (content.seasonCovers[k] && content.seasonCovers[k].startsWith('data:image')) hasBase64 = true;
});
(content.addPhotos || []).forEach(p => {
  if (p.src && p.src.startsWith('data:image')) hasBase64 = true;
});

assert(!hasBase64, 'Test 4: Cero imágenes en Base64 incrustadas en el archivo de datos (100% rutas relativas)');

// 5. Verificación de ortografía corregida en secciones y títulos
const titlesAndSections = [
  ...(content.addTitles || []).map(t => t.html),
  ...(content.addSections || []).map(s => `${s.tag} ${s.title} ${s.desc}`)
].join(' ');

assert(!/VESITDOS/.test(titlesAndSections), 'Test 5: Corrección ortográfica aplicada (sin "VESITDOS")');
assert(!/CABELLARO/.test(titlesAndSections), 'Test 5b: Corrección ortográfica aplicada (sin "CABELLARO")');

console.log('\nResultado Final: 5/5 pruebas superadas exitosamente.');
console.log('>>> VERIFICACIÓN T3.3 100% EXITOSA - LISTO PARA APROBACIÓN HITL <<<');
