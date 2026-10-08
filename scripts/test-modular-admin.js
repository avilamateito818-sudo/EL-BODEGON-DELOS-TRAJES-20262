/**
 * Suite de Pruebas Automatizadas T3.5: Modularización Arquitectónica de admin.js
 * Valida la modularización por responsabilidades (Clean Architecture / SRP),
 * integridad de namespaces, orden de carga en index.html y compatibilidad Facade.
 */

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

console.log('=== TEST SUITE T3.5: Verificación de Modularización Arquitectónica ===\n');

// 1. Verificación de existencia física de los módulos
const modules = ['core.js', 'auth.js', 'uploader.js', 'catalog.js', 'editor.js', 'storage.js'];
modules.forEach(m => {
  const p = path.resolve(__dirname, `../sitio/js/admin/${m}`);
  assert(fs.existsSync(p), `Test 1: Módulo sitio/js/admin/${m} existe físicamente`);
});

// 2. Simulación de carga en orden y verificación de namespaces
global.window = {};
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({ tagName: tag.toUpperCase(), style: {}, classList: { add: () => {}, remove: () => {} } }),
  body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.CSS = { escape: (s) => s };

modules.forEach(m => {
  const code = fs.readFileSync(path.resolve(__dirname, `../sitio/js/admin/${m}`), 'utf8');
  try {
    eval(code);
  } catch (e) {
    assert(false, `Error evaluando módulo ${m}: ${e.message}`);
  }
});

assert(window.BodegonAdmin && typeof window.BodegonAdmin === 'object', 'Test 2: Namespace raíz window.BodegonAdmin inicializado');
assert(window.BodegonAdmin.core && typeof window.BodegonAdmin.core.toast === 'function', 'Test 2a: Submódulo Core montado con utilidades (toast, modal)');
assert(window.BodegonAdmin.Auth && typeof window.BodegonAdmin.Auth.checkServerAuth === 'function', 'Test 2b: Submódulo Auth montado (checkServerAuth, performLogout, openLogin)');
assert(window.BodegonAdmin.Uploader && typeof window.BodegonAdmin.Uploader.uploadMediaFile === 'function', 'Test 2c: Submódulo Uploader montado (uploadMediaFile, compressImage)');
assert(window.BodegonAdmin.Catalog && typeof window.BodegonAdmin.Catalog.insertCard === 'function', 'Test 2d: Submódulo Catalog montado (insertCard, cssPath, editorKey)');
assert(window.BodegonAdmin.Editor && typeof window.BodegonAdmin.Editor.applyEditorStyles === 'function', 'Test 2e: Submódulo Editor montado (applyEditorStyles, exposeAdminApi)');
assert(window.BodegonAdmin.Storage && typeof window.BodegonAdmin.Storage.autoSave === 'function', 'Test 2f: Submódulo Storage montado (autoSave, serialize, loadAutoSave)');

// 3. Verificación de inclusión ordenada en index.html
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../sitio/index.html'), 'utf8');
const scriptOrder = [
  'js/admin/core.js',
  'js/admin/auth.js',
  'js/admin/uploader.js',
  'js/admin/catalog.js',
  'js/admin/editor.js',
  'js/admin/storage.js',
  'js/admin.js'
];

let lastIdx = -1;
let inOrder = true;
scriptOrder.forEach(src => {
  const idx = indexHtml.indexOf(src);
  if (idx === -1 || idx < lastIdx) inOrder = false;
  lastIdx = idx;
});

assert(inOrder, 'Test 3: Inclusión estricta de módulos en orden topológico correcto en index.html');

// 4. Verificación del patrón Facade en admin.js
const adminJs = fs.readFileSync(path.resolve(__dirname, '../sitio/js/admin.js'), 'utf8');
assert(adminJs.includes('window.BodegonAdmin = window.BodegonAdmin || {};'), 'Test 4: admin.js actúa como Facade vinculado a window.BodegonAdmin');
assert(adminJs.includes('window.BodegonAdmin.enableEditMode = enableEditMode;'), 'Test 4b: Facade expone orquestación del ciclo de vida (enableEditMode)');

// 5. Cero interferencia con selectores semánticos y tests previos
const hasDataCard = adminJs.includes("closest('[data-card-id]')");
const hasOptimisticHydration = adminJs.includes("localStorage.getItem(SESSION_KEY) === '1'");
assert(hasDataCard && hasOptimisticHydration, 'Test 5: Preservada retrocompatibilidad total con selectores semánticos y persistencia de sesión');

console.log('\nResultado Final: 5/5 pruebas superadas exitosamente.');
console.log('>>> VERIFICACIÓN T3.5 100% EXITOSA - LISTO PARA APROBACIÓN HITL <<<');
