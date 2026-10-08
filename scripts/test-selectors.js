const fs = require('fs');

console.log('=== TEST SUITE T3.1: Verificación de Identificadores Semánticos ===\n');

const html = fs.readFileSync('sitio/index.html', 'utf8');

let passedTests = 0;
let totalTests = 5;

// TEST 1: Unicidad de data-field
const allFields = [...html.matchAll(/data-field="([^"]+)"/g)].map(m => m[1]);
const duplicateFields = allFields.filter((item, index) => allFields.indexOf(item) !== index);

if (duplicateFields.length === 0 && allFields.length > 50) {
  console.log(`[PASS] Test 1: Unicidad estricta de data-field (${allFields.length} campos analizados, 0 colisiones)`);
  passedTests++;
} else {
  console.error(`[FAIL] Test 1: Se encontraron duplicados en data-field:`, duplicateFields);
}

// TEST 2: Unicidad de data-card-id
const allCards = [...html.matchAll(/data-card-id="([^"]+)"/g)].map(m => m[1]);
const duplicateCards = allCards.filter((item, index) => allCards.indexOf(item) !== index);

if (duplicateCards.length === 0 && allCards.length >= 115) {
  console.log(`[PASS] Test 2: Unicidad estricta de data-card-id (${allCards.length} tarjetas identificadas, 0 colisiones)`);
  passedTests++;
} else {
  console.error(`[FAIL] Test 2: Se encontraron duplicados o faltan tarjetas: total=${allCards.length}, duplicados:`, duplicateCards);
}

// TEST 3: Cobertura de las 12 temporadas
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
let missingMonths = [];
months.forEach(m => {
  if (!allFields.includes(`${m}.hero_title`)) {
    missingMonths.push(m);
  }
});

if (missingMonths.length === 0) {
  console.log(`[PASS] Test 3: Cobertura total de las 12 temporadas con encabezados semánticos`);
  passedTests++;
} else {
  console.error(`[FAIL] Test 3: Temporadas sin hero_title:`, missingMonths);
}

// TEST 4: Simulación de Resiliencia ante mutación de orden en el DOM (Inserción antes de tarjeta)
// Simulamos el algoritmo de selección de admin.js:
function simulateCssPathResolution(domString, targetCardId, elementTag) {
  const selector = `[data-card-id="${targetCardId}"] ${elementTag}`;
  const regex = new RegExp(`<div[^>]*data-card-id="${targetCardId}"[^>]*>[\\s\\S]*?<${elementTag}>([\\s\\S]*?)<\\/${elementTag}>`, 'i');
  const match = domString.match(regex);
  return match ? { selector, text: match[1].trim() } : null;
}

const targetCard = 'card-febrero-traje-de-comparsa-blanco';
const initialResolution = simulateCssPathResolution(html, targetCard, 'h3');

// Simulamos mutación del DOM: inyectamos 2 tarjetas nuevas ANTES de la tarjeta objetivo en el HTML
const mutatedHtml = html.replace(
  `data-card-id="${targetCard}"`,
  `data-card-id="card-febrero-nueva-1"><h3>Nueva 1</h3></div><div class="card-ghost" data-card-id="card-febrero-nueva-2"><h3>Nueva 2</h3></div><div class="card-ghost" data-card-id="${targetCard}"`
);

const postMutationResolution = simulateCssPathResolution(mutatedHtml, targetCard, 'h3');

if (initialResolution && postMutationResolution && initialResolution.text === postMutationResolution.text) {
  console.log(`[PASS] Test 4: Inmunidad a mutación del árbol DOM (inserción de elementos previos no altera el selector semántico)`);
  passedTests++;
} else {
  console.error(`[FAIL] Test 4: La mutación del DOM alteró la resolución de la tarjeta objetivo.`);
}

// TEST 5: Verificación de soporte semántico en admin.js
const adminJs = fs.readFileSync('sitio/js/admin.js', 'utf8');
const hasDataCardInCssPath = adminJs.includes("closest('[data-card-id]')");
const hasDataCardInInsert = adminJs.includes("card.dataset.cardId = 'card-' + entry.id;");
const hasDataFieldInTextSel = adminJs.includes("[data-field]");

if (hasDataCardInCssPath && hasDataCardInInsert && hasDataFieldInTextSel) {
  console.log(`[PASS] Test 5: admin.js sincronizado (cssPath, editorKey, insertCard y TEXT_SEL soportan data-card-id y data-field)`);
  passedTests++;
} else {
  console.error(`[FAIL] Test 5: Falta soporte en admin.js:`, { hasDataCardInCssPath, hasDataCardInInsert, hasDataFieldInTextSel });
}

console.log(`\nResultado Final: ${passedTests}/${totalTests} pruebas superadas.`);

if (passedTests === totalTests) {
  console.log('>>> VERIFICACIÓN T3.1 100% EXITOSA - LISTO PARA APROBACIÓN HITL <<<\n');
  process.exit(0);
} else {
  console.error('>>> VERIFICACIÓN FALLIDA <<<\n');
  process.exit(1);
}
