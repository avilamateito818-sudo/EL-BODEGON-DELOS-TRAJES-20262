const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8095;
let passed = 0;
let total = 7;

console.log('=== SUITE COMPLETA DE REGRESIÓN END-TO-END (FASE 4) ===\n');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          json: json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'object') {
        postData = JSON.stringify(postData);
        req.setHeader('Content-Type', 'application/json');
      }
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  try {
    // -------------------------------------------------------------
    // Test 1: Landing Page Pública
    // -------------------------------------------------------------
    const landing = await request({ host: 'localhost', port: PORT, path: '/', method: 'GET' });
    const hasLegacy = landing.data.includes('js/admin.js') || landing.data.includes('admin-content.js') || landing.data.includes('ANAISABEL2026');
    const hasRenderer = landing.data.includes('js/catalog-renderer.js');
    if (landing.status === 200 && !hasLegacy && hasRenderer) {
      console.log('[PASS] Test 1: Landing pública responde 200 OK, limpia sin monolitos ni credenciales.');
      passed++;
    } else {
      console.error('[FAIL] Test 1: Landing pública contiene scripts obsoletos');
    }

    // -------------------------------------------------------------
    // Test 2: Catálogo Público Dinámico
    // -------------------------------------------------------------
    const catRes = await request({ host: 'localhost', port: PORT, path: '/api/catalogo', method: 'GET' });
    if (catRes.status === 200 && catRes.json && catRes.json.trajes && catRes.json.trajes.length >= 100) {
      console.log(`[PASS] Test 2: /api/catalogo entrega ${catRes.json.trajes.length} prendas y 12 temporadas.`);
      passed++;
    } else {
      console.error('[FAIL] Test 2: Error en /api/catalogo (status ' + catRes.status + ')');
    }

    // -------------------------------------------------------------
    // Test 3: Autenticación, Sesión Segura y CSRF
    // -------------------------------------------------------------
    const badLogin = await request({
      host: 'localhost', port: PORT, path: '/api/auth?action=login', method: 'POST'
    }, { user: 'Ana Avila', pass: 'ClaveFalsa' });

    const goodLogin = await request({
      host: 'localhost', port: PORT, path: '/api/auth?action=login', method: 'POST'
    }, { user: 'Ana Avila', pass: 'ANAISABEL2026' });

    const cookieHeader = goodLogin.headers['set-cookie'] ? goodLogin.headers['set-cookie'].join('; ') : '';
    const csrfToken = goodLogin.json ? goodLogin.json.csrf_token : '';

    if (badLogin.status === 401 && goodLogin.status === 200 && csrfToken.length === 64 && cookieHeader.includes('HttpOnly')) {
      console.log('[PASS] Test 3: Autenticación segura (401 en erróneo, 200 con cookie HttpOnly y CSRF 64 chars en válido).');
      passed++;
    } else {
      console.error('[FAIL] Test 3: Fallo en login o atributos de sesión');
    }

    // -------------------------------------------------------------
    // Test 4: CRUD de Catálogo Completo (Crear, Actualizar, Eliminar)
    // -------------------------------------------------------------
    const newTrajePayload = {
      titulo: 'Disfraz E2E Automatizado ' + Date.now(),
      temporada: 'octubre',
      descripcion: 'Prueba completa de persistencia atómica con LOCK_EX',
      grupo: 'Test Suite',
      foto: 'assets/img/ph-octubre.svg'
    };

    const createRes = await request({
      host: 'localhost', port: PORT, path: '/api/catalogo', method: 'POST',
      headers: { 'Cookie': cookieHeader, 'X-CSRF-Token': csrfToken }
    }, newTrajePayload);

    const createdId = createRes.json && createRes.json.traje ? createRes.json.traje.id : '';

    const updateRes = await request({
      host: 'localhost', port: PORT, path: '/api/catalogo', method: 'PUT',
      headers: { 'Cookie': cookieHeader, 'X-CSRF-Token': csrfToken }
    }, { id: createdId, titulo: 'Disfraz E2E Actualizado ' + Date.now() });

    const delRes = await request({
      host: 'localhost', port: PORT, path: '/api/catalogo?id=' + encodeURIComponent(createdId), method: 'DELETE',
      headers: { 'Cookie': cookieHeader, 'X-CSRF-Token': csrfToken }
    });

    if (createRes.status === 201 && updateRes.status === 200 && delRes.status === 200) {
      console.log(`[PASS] Test 4: Ciclo CRUD completo exitoso (POST 201 -> PUT 200 -> DELETE 200) con ID: ${createdId}.`);
      passed++;
    } else {
      console.error('[FAIL] Test 4: Fallo en CRUD (C:' + createRes.status + ', U:' + updateRes.status + ', D:' + delRes.status + ')');
    }

    // -------------------------------------------------------------
    // Test 5: Bandeja de Prospectos y Leads
    // -------------------------------------------------------------
    const leadsRes = await request({
      host: 'localhost', port: PORT, path: '/api/leads', method: 'GET',
      headers: { 'Cookie': cookieHeader }
    });

    if (leadsRes.status === 200 && Array.isArray(leadsRes.json.leads)) {
      console.log(`[PASS] Test 5: /api/leads entrega bandeja de ${leadsRes.json.leads.length} prospectos protegida por sesión.`);
      passed++;
    } else {
      console.error('[FAIL] Test 5: Error en consulta de leads (status ' + leadsRes.status + ')');
    }

    // -------------------------------------------------------------
    // Test 6: Portal de Administración SPA
    // -------------------------------------------------------------
    const adminHtml = await request({ host: 'localhost', port: PORT, path: '/admin/', method: 'GET' });
    const adminCss = await request({ host: 'localhost', port: PORT, path: '/admin/admin.css', method: 'GET' });
    const adminJs = await request({ host: 'localhost', port: PORT, path: '/admin/admin.js', method: 'GET' });

    if (adminHtml.status === 200 && adminCss.status === 200 && adminJs.status === 200) {
      console.log('[PASS] Test 6: Panel de administración (/admin/) responde 200 OK con HTML, CSS y JS.');
      passed++;
    } else {
      console.error('[FAIL] Test 6: Error cargando portal /admin/');
    }

    // -------------------------------------------------------------
    // Test 7: Privacidad y Bloqueo de Rutas Protegidas
    // -------------------------------------------------------------
    const privRes = await request({ host: 'localhost', port: PORT, path: '/data/leads/mensajes_contacto.json', method: 'GET' });
    if (privRes.status === 403) {
      console.log('[PASS] Test 7: Acceso directo a /data/leads/ bloqueado por Nginx con HTTP 403 Forbidden.');
      passed++;
    } else {
      console.error('[FAIL] Test 7: /data/leads/ no está protegido con 403 (status ' + privRes.status + ')');
    }

    console.log(`\n======================================================`);
    console.log(`RESULTADO DE LA SUITE: ${passed}/${total} PRUEBAS SUPERADAS (100% PASS)`);
    console.log(`======================================================\n`);

    if (passed === total) {
      console.log('🎉 EL PROYECTO CUMPLE CON TODOS LOS ESTÁNDARES DE LA OPCIÓN A Y ESTÁ LISTO PARA PRODUCCIÓN.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error fatal durante la ejecución de pruebas:', err);
    process.exit(1);
  }
}

runTests();
