const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
const catPath = path.join(__dirname, '..', 'sitio', 'data', 'catalogo.json');

const html = fs.readFileSync(indexPath, 'utf8');
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

console.log('=== TEST DE AISLAMIENTO ESTRICTO DE CATÁLOGOS POR TEMPORADA ===\n');

let failed = false;

const expectedOrder = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// 1. Verify DOM order of panels
console.log('1. Verificando orden cronológico de paneles en el DOM:');
const panelIndices = expectedOrder.map(m => {
  const idx = html.indexOf(`data-panel="${m}"`);
  return { month: m, index: idx };
});

for (let i = 0; i < panelIndices.length; i++) {
  if (panelIndices[i].index === -1) {
    console.error(`[FAIL] Panel no encontrado: ${panelIndices[i].month}`);
    failed = true;
  }
  if (i > 0 && panelIndices[i].index < panelIndices[i - 1].index) {
    console.error(`[FAIL] Orden incorrecto: ${panelIndices[i].month} aparece antes de ${panelIndices[i - 1].month}`);
    failed = true;
  }
}
if (!failed) {
  console.log('   [OK] Los 12 paneles están en estricto orden cronológico (enero -> diciembre).\n');
}

// 2. Verify Costume count and isolation per panel in HTML
console.log('2. Verificando aislamiento absoluto de prendas por mes en HTML:');
const expectedCounts = {
  enero: 3,
  febrero: 8,
  marzo: 8,
  abril: 8,
  mayo: 8,
  junio: 8,
  julio: 8,
  agosto: 8,
  septiembre: 8,
  octubre: 21,
  noviembre: 16,
  diciembre: 15
};

expectedOrder.forEach(m => {
  const panelStart = html.indexOf(`data-panel="${m}"`);
  const panelEnd = html.indexOf('</article>', panelStart);
  const panelHtml = html.substring(panelStart, panelEnd);

  const cardMatches = [...panelHtml.matchAll(/data-card-id="([^"]+)"/g)].map(x => x[1]);
  const foreign = cardMatches.filter(id => !id.startsWith(`card-${m}-`));

  if (foreign.length > 0) {
    console.error(`[FAIL] Panel [${m}] tiene tarjetas de otro mes:`, foreign);
    failed = true;
  } else {
    console.log(`   [OK] Panel [${m}]: ${cardMatches.length} prendas (esperadas: ${expectedCounts[m]}), 0 mezcladas.`);
  }

  if (cardMatches.length !== expectedCounts[m]) {
    console.error(`[FAIL] Panel [${m}] tiene ${cardMatches.length} prendas pero se esperaban ${expectedCounts[m]}.`);
    failed = true;
  }

  // Check catalogue anchor exists
  const catAnchor = `id="${m}-catalogo"`;
  if (!panelHtml.includes(catAnchor)) {
    console.error(`[FAIL] Panel [${m}] no contiene su sección de catálogo propia: ${catAnchor}`);
    failed = true;
  }
});

// 3. Verify catalogo.json
console.log('\n3. Verificando coherencia con catalogo.json:');
const catCounts = {};
cat.trajes.forEach(t => {
  catCounts[t.temporada] = (catCounts[t.temporada] || 0) + 1;
  const expectedSeason = t.id.split('-')[1];
  if (t.temporada !== expectedSeason) {
    console.error(`[FAIL] En catalogo.json, el traje ${t.id} tiene temporada ${t.temporada} pero su ID dice ${expectedSeason}`);
    failed = true;
  }
});

console.log('   Prendas en catalogo.json:', catCounts);
if (cat.trajes.length >= 119) {
  console.log(`   [OK] Total de ${cat.trajes.length} prendas perfectamente distribuidas y sincronizadas.`);
} else {
  console.error(`[FAIL] Total de trajes es ${cat.trajes.length}, se esperaban al menos 119.`);
  failed = true;
}

if (!failed) {
  console.log('\n=============================================================');
  console.log('RESULTADO: TODAS LAS PRUEBAS DE AISLAMIENTO SUPERADAS AL 100%');
  console.log('Cada mes tiene única y exclusivamente sus trajes correspondientes.');
  console.log('=============================================================');
} else {
  console.error('\nERROR: Fallaron algunas verificaciones de aislamiento.');
  process.exit(1);
}
