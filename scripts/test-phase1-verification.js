const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let total = 5;

console.log('=== VERIFICACIÓN AUTOMATIZADA: FASE 1 (TSK-01, TSK-02, TSK-03) ===\n');

// Test 1: catalogo.json
try {
  const catRaw = fs.readFileSync(path.join(__dirname, '..', 'sitio', 'data', 'catalogo.json'), 'utf8');
  const cat = JSON.parse(catRaw);
  if (cat.temporadas && Object.keys(cat.temporadas).length === 12 && Array.isArray(cat.trajes) && cat.trajes.length >= 100) {
    console.log(`[PASS] Test 1: catalogo.json íntegro con 12 temporadas y ${cat.trajes.length} trajes extraídos.`);
    passed++;
  } else {
    console.error('[FAIL] Test 1: catalogo.json incompleto');
  }
} catch (e) {
  console.error('[FAIL] Test 1:', e.message);
}

// Test 2: index.html scripts
try {
  const html = fs.readFileSync(path.join(__dirname, '..', 'sitio', 'index.html'), 'utf8');
  const hasRenderer = html.includes('js/catalog-renderer.js');
  const hasAdmin = html.includes('js/admin.js') || html.includes('data/admin-content.js') || html.includes('edit-float-btn');
  if (hasRenderer && !hasAdmin) {
    console.log('[PASS] Test 2: index.html carga catalog-renderer.js y no tiene rastro de scripts monolíticos de admin.');
    passed++;
  } else {
    console.error('[FAIL] Test 2: index.html scripts inválidos (hasRenderer=' + hasRenderer + ', hasAdmin=' + hasAdmin + ')');
  }
} catch (e) {
  console.error('[FAIL] Test 2:', e.message);
}

// Test 3: Cero credenciales expuestas
try {
  let foundCreds = false;
  function search(dir) {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory()) search(fp);
      else if (/\.(js|html|css)$/.test(f)) {
        const content = fs.readFileSync(fp, 'utf8');
        if (content.includes('ANAISABEL2026') || content.includes('DEFAULT_PASSWORD')) {
          foundCreds = true;
        }
      }
    }
  }
  search(path.join(__dirname, '..', 'sitio'));
  if (!foundCreds) {
    console.log('[PASS] Test 3: Cero credenciales expuestas en archivos públicos de cliente.');
    passed++;
  } else {
    console.error('[FAIL] Test 3: Se encontraron credenciales expuestas');
  }
} catch (e) {
  console.error('[FAIL] Test 3:', e.message);
}

// Test 4: catalog-renderer.js syntax y tamaño
try {
  const rendCode = fs.readFileSync(path.join(__dirname, '..', 'sitio', 'js', 'catalog-renderer.js'), 'utf8');
  new vm.Script(rendCode);
  const lines = rendCode.split('\n').length;
  if (lines < 160) {
    console.log(`[PASS] Test 4: catalog-renderer.js sintaxis válida y código ligero (${lines} líneas).`);
    passed++;
  } else {
    console.error(`[FAIL] Test 4: catalog-renderer.js excede el límite de líneas (${lines})`);
  }
} catch (e) {
  console.error('[FAIL] Test 4:', e.message);
}

// Test 5: Servidor local y endpoints
try {
  const devServerCode = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'dev-server.js'), 'utf8');
  if (devServerCode.includes('/api/catalogo')) {
    console.log('[PASS] Test 5: dev-server.js configurado con soporte para /api/catalogo.');
    passed++;
  } else {
    console.error('[FAIL] Test 5: dev-server.js no maneja /api/catalogo');
  }
} catch (e) {
  console.error('[FAIL] Test 5:', e.message);
}

console.log(`\nResultado: ${passed}/${total} pruebas superadas.`);
if (passed === total) {
  console.log('✅ FASE 1 COMPLETADA CON ÉXITO.');
  process.exit(0);
} else {
  console.error('❌ Fallos en la verificación de Fase 1.');
  process.exit(1);
}
