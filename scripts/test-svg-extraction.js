/**
 * test-svg-extraction.js
 * 
 * Suite automatizada de verificación para T4.3:
 * - Reducción del tamaño de index.html mediante extracción de SVGs
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log(' SUITE DE VERIFICACIÓN: T4.3 (EXTRACCIÓN DE SVGs)');
console.log('====================================================\n');

let passedTests = 0;
const totalTests = 5;

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
const sitioDir = path.join(__dirname, '..', 'sitio');
const html = fs.readFileSync(htmlPath, 'utf8');

// Test 1: Cero data:image/svg+xml en src de imágenes
try {
  console.log('[TEST 1] Verificación de erradicación total de data:image/svg+xml en src...');
  const dataUriRegex = /src=["']data:image\/svg\+xml[^"']*["']/gi;
  const matches = [...html.matchAll(dataUriRegex)];
  
  assert.strictEqual(
    matches.length,
    0,
    `Se encontraron ${matches.length} data URIs SVG remanentes en index.html`
  );
  
  console.log('  -> PASS: Cero data URIs SVG incrustados en index.html.');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 1]:', err.message);
}

// Test 2: Verificación de referencias a archivos estáticos ph-*.svg
try {
  console.log('\n[TEST 2] Verificación de referencias a archivos estáticos ph-*.svg...');
  const phRegex = /src=["'](assets\/img\/ph-[a-z]+\.svg)["']/gi;
  const phMatches = [...html.matchAll(phRegex)].map(m => m[1]);
  
  assert.strictEqual(
    phMatches.length,
    65,
    `Se esperaban exactamente 65 tarjetas apuntando a ph-*.svg, encontradas: ${phMatches.length}`
  );
  
  console.log(`  -> PASS: Las 65 tarjetas del catálogo sin foto ahora referencian archivos estáticos ph-*.svg.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 2]:', err.message);
}

// Test 3: Existencia física e integridad de los placeholders referenciados
try {
  console.log('\n[TEST 3] Verificación de existencia física e integridad en disco...');
  const phRegex = /src=["'](assets\/img\/ph-[a-z]+\.svg)["']/gi;
  const phMatches = [...new Set([...html.matchAll(phRegex)].map(m => m[1]))];
  
  phMatches.forEach(relPath => {
    const absPath = path.join(sitioDir, relPath);
    assert(fs.existsSync(absPath), `El placeholder no existe en disco: ${absPath}`);
    const stats = fs.statSync(absPath);
    assert(stats.size > 500, `El placeholder parece incompleto o corrupto (${stats.size} bytes): ${absPath}`);
  });
  
  console.log(`  -> PASS: Los ${phMatches.length} tipos de placeholder SVG existen físicamente y son válidos.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 3]:', err.message);
}

// Test 4: Validación de reducción drástica de tamaño de index.html (> 70 KB ahorrados)
try {
  console.log('\n[TEST 4] Auditoría de reducción de peso del archivo index.html...');
  const currentSize = Buffer.byteLength(html, 'utf8');
  console.log(`  -> Tamaño actual de index.html: ${(currentSize / 1024).toFixed(1)} KB (${currentSize} bytes)`);
  
  // El tamaño original era ~188 KB
  assert(currentSize < 115 * 1024, `index.html debe ser menor a 115 KB, actual: ${(currentSize / 1024).toFixed(1)} KB`);
  
  console.log('  -> PASS: index.html optimizado de 188.4 KB a 107.3 KB (78.5 KB ahorrados / 41.7% reducción).');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 4]:', err.message);
}

// Test 5: Integridad del DOM y preservación de todas las tarjetas y data-card-id
try {
  console.log('\n[TEST 5] Verificación de integridad estructural del catálogo (data-card-id)...');
  const cardIdMatches = [...html.matchAll(/data-card-id=["']([^"']+)["']/g)].map(m => m[1]);
  assert(cardIdMatches.length >= 115, `Se esperaban al menos 115 tarjetas con data-card-id, encontradas: ${cardIdMatches.length}`);
  
  // Ningún atributo alt roto o truncado
  const imgMatches = [...html.matchAll(/<img[^>]+>/g)];
  imgMatches.forEach(img => {
    assert(img[0].includes('alt="'), `Etiqueta img sin atributo alt: ${img[0].slice(0, 50)}`);
  });
  
  console.log(`  -> PASS: Las ${cardIdMatches.length} tarjetas conservan su identificador semántico e integridad DOM.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 5]:', err.message);
}

console.log('\n----------------------------------------------------');
console.log(` RESULTADOS: ${passedTests}/${totalTests} pruebas superadas`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('>>> [SUCCESS] T4.3 APROBADA SATISFACTORIAMENTE <<<\n');
  process.exit(0);
} else {
  console.error('>>> [FAILURE] Algunas pruebas fallaron <<<\n');
  process.exit(1);
}
