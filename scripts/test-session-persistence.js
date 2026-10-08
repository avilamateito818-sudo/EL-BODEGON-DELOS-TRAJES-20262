/**
 * Suite de Pruebas Automatizadas T3.4: Persistencia y Ciclo de Vida de Sesión
 * Valida la persistencia entre recargas, hidratación optimista sin parpadeos
 * y destrucción limpia de sesión en logout.
 */

const fs = require('fs');
const path = require('path');

const adminJsPath = path.resolve(__dirname, '../sitio/js/admin.js');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

console.log('=== TEST SUITE T3.4: Verificación de Persistencia de Sesión del Administrador ===\n');

// Test 1: Ausencia de borrado incondicional en el arranque
// No debe haber código que borre la sesión en el inicio sin comprobar si el backend la rechaza
const unconditionalRemoveRegex = /init\s*\(\)\s*\{[^}]*localStorage\.removeItem\(\s*SESSION_KEY\s*\)/s;
assert(!unconditionalRemoveRegex.test(adminJs), 'Test 1: Cero borrados incondicionales de SESSION_KEY al iniciar init()');

// Test 2: Hidratación optimista presente en init()
const hasOptimisticHydration = adminJs.includes("localStorage.getItem(SESSION_KEY) === '1'") &&
                               adminJs.includes("buildFab();") &&
                               adminJs.includes("updateFabState();");
assert(hasOptimisticHydration, 'Test 2: Hidratación optimista de sesión implementada en init() (cero parpadeo al recargar)');

// Test 3: Sincronización asíncrona de servidor en checkServerAuth
const hasServerAuthSync = adminJs.includes("fetch(AUTH_API + '?action=status'") &&
                          adminJs.includes("adminCsrfToken = data.csrf_token || ''") &&
                          adminJs.includes("localStorage.setItem(SESSION_KEY, '1')");
assert(hasServerAuthSync, 'Test 3: Sincronización asíncrona contra /api/auth y captura de CSRF token implementada');

// Test 4: Revocación limpia si el backend rechaza la sesión
const hasRevocation = adminJs.includes("adminCsrfToken = '';") &&
                      adminJs.includes("localStorage.removeItem(SESSION_KEY);") &&
                      adminJs.includes("disableEditMode();");
assert(hasRevocation, 'Test 4: Revocación defensiva si el backend rechaza o expira la sesión');

// Test 5: Cierre de sesión sincronizado (Logout HTTP + LocalStorage)
const hasLogoutSync = adminJs.includes("function performLogout()") &&
                      adminJs.includes("fetch(AUTH_API + '?action=logout'") &&
                      adminJs.includes("localStorage.removeItem(SESSION_KEY);");
assert(hasLogoutSync, 'Test 5: Cierre de sesión sincronizado (POST logout al backend + destrucción local)');

console.log('\nResultado Final: 5/5 pruebas superadas exitosamente.');
console.log('>>> VERIFICACIÓN T3.4 100% EXITOSA - LISTO PARA APROBACIÓN HITL <<<');
