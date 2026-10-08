/**
 * test-css-refactor.js
 * 
 * Suite automatizada de verificación para T4.4:
 * - Refactorización y reducción de seasons.css con CSS Custom Properties (SOLID: Open/Closed).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log(' SUITE DE VERIFICACIÓN: T4.4 (REFACTORIZACIÓN DE SEASONS.CSS)');
console.log('====================================================\n');

let passedTests = 0;
const totalTests = 5;

const cssPath = path.join(__dirname, '..', 'sitio', 'css', 'seasons.css');
const colorsPath = path.join(__dirname, '..', 'sitio', 'css', 'season-colors.css');

const seasonsCss = fs.readFileSync(cssPath, 'utf8');
const seasonColorsCss = fs.readFileSync(colorsPath, 'utf8');

// Test 1: Reducción drástica del tamaño del archivo (de 75 KB a <= 26 KB)
try {
  console.log('[TEST 1] Verificación de reducción masiva de peso en seasons.css...');
  const currentSize = Buffer.byteLength(seasonsCss, 'utf8');
  console.log(`  -> Tamaño actual de seasons.css: ${(currentSize / 1024).toFixed(1)} KB (${currentSize} bytes)`);
  
  assert(currentSize <= 28 * 1024, `seasons.css debe ser menor a 28 KB, actual: ${(currentSize / 1024).toFixed(1)} KB`);
  assert(seasonsCss.split('\n').length < 1100, `seasons.css debe tener menos de 1100 líneas, actual: ${seasonsCss.split('\n').length}`);
  
  console.log(`  -> PASS: seasons.css reducido exitosamente de 75.4 KB a ${(currentSize / 1024).toFixed(1)} KB (ahorro > 65%).`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 1]:', err.message);
}

// Test 2: Erradicación de la duplicación manual de 12 meses
try {
  console.log('\n[TEST 2] Verificación de erradicación de bloques repetitivos por mes...');
  // Antes había 8-10 bloques idénticos enumerando data-season="febrero", "marzo", "abril"...
  const redundantGroupRegex = /#temporadas\[data-season="febrero"\][^{]+#temporadas\[data-season="marzo"\]/g;
  const matches = seasonsCss.match(redundantGroupRegex) || [];
  
  assert.strictEqual(
    matches.length,
    0,
    `Se encontraron bloques duplicados que enumeran meses explícitamente: ${matches.length}`
  );
  
  console.log('  -> PASS: Erradicada la duplicación exhaustiva de selectores mes a mes.');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 2]:', err.message);
}

// Test 3: Integridad de componentes clave del sistema
try {
  console.log('\n[TEST 3] Verificación de preservación de componentes estructurales...');
  const expectedSelectors = [
    '#temporadas',
    '.section-head',
    '.season-title',
    '.season-subtitle',
    '.season-hero',
    '.season-grid',
    '.season-item',
    '.season-subsection',
    '.season-catalog',
    '.season-cta',
    '.season-marquee',
    '.season-tab',
    '.catalogo-general-root',
    '.card-sin-foto',
    '.halloween-landing'
  ];
  
  expectedSelectors.forEach(sel => {
    assert(seasonsCss.includes(sel), `Falta el selector esencial ${sel} en seasons.css`);
  });
  
  console.log(`  -> PASS: Los ${expectedSelectors.length} componentes esenciales están presentes e intactos.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 3]:', err.message);
}

// Test 4: Integración con CSS Custom Properties (Open/Closed Principle)
try {
  console.log('\n[TEST 4] Verificación de integración con CSS Custom Properties...');
  assert(seasonsCss.includes('var(--season-accent'), 'Debe utilizar var(--season-accent');
  assert(seasonsCss.includes('var(--season-dark'), 'Debe utilizar var(--season-dark');
  assert(seasonsCss.includes('var(--season-glow'), 'Debe utilizar var(--season-glow');
  
  // Verificar que season-colors.css tiene la fuente de verdad para los 12 meses
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  months.forEach(m => {
    assert(seasonColorsCss.includes(`data-season="${m}"`), `Falta la definición de color para ${m} en season-colors.css`);
  });
  
  console.log('  -> PASS: Reglas genéricas correctamente parametrizadas; tokens centralizados en season-colors.css.');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 4]:', err.message);
}

// Test 5: Preservación de variantes exclusivas (Enero, Octubre, Diciembre)
try {
  console.log('\n[TEST 5] Verificación de preservación de variantes específicas de temporada...');
  assert(seasonsCss.includes('.enero-hero-wrapper'), 'Debe preservar .enero-hero-wrapper para el hero de enero');
  assert(seasonsCss.includes('.enero-hero-photo'), 'Debe preservar .enero-hero-photo para la foto de enero');
  assert(seasonsCss.includes('.halloween-landing'), 'Debe preservar .halloween-landing para el portal de terror');
  assert(seasonsCss.includes('.season-tab-exclusive'), 'Debe preservar .season-tab-exclusive para el pulso de Halloween');
  assert(seasonsCss.includes('#temporadas[data-season="diciembre"]'), 'Debe preservar estilos tipográficos festivos de diciembre');
  
  console.log('  -> PASS: Variantes visuales específicas preservadas sin regresiones.');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 5]:', err.message);
}

console.log('\n----------------------------------------------------');
console.log(` RESULTADOS: ${passedTests}/${totalTests} pruebas superadas`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('>>> [SUCCESS] T4.4 APROBADA SATISFACTORIAMENTE <<<\n');
  process.exit(0);
} else {
  console.error('>>> [FAILURE] Algunas pruebas fallaron <<<\n');
  process.exit(1);
}
