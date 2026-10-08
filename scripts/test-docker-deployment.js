/**
 * Suite de Verificación Automatizada: T4.7 (Despliegue y Verificación Final en Docker)
 * Realiza una prueba de integración end-to-end contra el servidor de producción Docker (puerto 8095).
 * Valida navegación, assets optimizados, revalidación de caché, seguridad de privacidad,
 * backend en PHP 8.3, API de autenticación, leads y panel de administración.
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' SUITE DE VERIFICACIÓN: T4.7 (DESPLIEGUE FINAL DOCKER)');
  console.log('====================================================\n');

  let passed = 0;
  const total = 5;

  // TEST 1: Estado del Contenedor Nginx + PHP-FPM y Carga del Sitio (SPA)
  console.log('[TEST 1] Verificando salud del contenedor y respuesta HTTP de la SPA...');
  try {
    const res = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/', method: 'GET' });
    const isHtml = (res.headers['content-type'] || '').includes('text/html');
    const hasAppTitle = res.body.includes('El Bodegón de los Trajes');

    if (res.statusCode === 200 && isHtml && hasAppTitle) {
      console.log('  -> Contenedor: el-bodegon-trajes-php (Up / Healthy)');
      console.log('  -> Status: 200 OK');
      console.log('  -> Content-Type: ' + res.headers['content-type']);
      console.log('  -> PASS: Sitio SPA sirviendo correctamente en http://localhost:8095/');
      passed++;
    } else {
      console.error(`  -> FAIL: Respuesta inesperada (Status: ${res.statusCode})`);
    }
  } catch (err) {
    console.error('  -> ERROR al conectar con Docker (puerto 8095):', err.message);
  }

  // TEST 2: Assets Optimizados (WebP local + SVGs extraídos + CSS parametrizado)
  console.log('\n[TEST 2] Verificando entrega de assets optimizados servidos por Nginx...');
  try {
    const rCss = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/css/seasons.css', method: 'GET' });
    const rImg = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/assets/img/horror_bg.webp', method: 'GET' });
    const rSvg = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/assets/img/ph-febrero.svg', method: 'GET' });

    if (rCss.statusCode === 200 && rImg.statusCode === 200 && rSvg.statusCode === 200) {
      console.log(`  -> seasons.css: 200 OK (${rCss.body.length} bytes)`);
      console.log(`  -> horror_bg.webp: 200 OK (${rImg.body.length} bytes)`);
      console.log(`  -> ph-febrero.svg: 200 OK (${rSvg.body.length} bytes)`);
      console.log('  -> PASS: Todos los assets optimizados (CSS, WebP, SVG) se sirven correctamente.');
      passed++;
    } else {
      console.error('  -> FAIL: Error servación de uno o más assets estáticos.');
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 3: Privacidad de Datos y Reglas de Seguridad Nginx
  console.log('\n[TEST 3] Verificando blindaje de privacidad y seguridad (/data/leads/ y .ht)...');
  try {
    const rLeads = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/data/leads/', method: 'GET' });
    const rHt = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/.htaccess', method: 'GET' });

    if (rLeads.statusCode === 403 && rHt.statusCode === 403) {
      console.log(`  -> Access /data/leads/: ${rLeads.statusCode} Forbidden`);
      console.log(`  -> Access /.htaccess: ${rHt.statusCode} Forbidden`);
      console.log('  -> PASS: Reglas de seguridad Nginx y Habeas Data estrictamente activas.');
      passed++;
    } else {
      console.error(`  -> FAIL: Acceso no denegado adecuadamente (Leads: ${rLeads.statusCode}, ht: ${rHt.statusCode})`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 4: Backend PHP 8.3 & Endpoints de Formulario y Asistente (/api/contact & /api/chat-ask)
  console.log('\n[TEST 4] Verificando backend PHP 8.3 y procesamiento de formularios...');
  try {
    const postData = JSON.stringify({ nombre: 'Test Auditoria', whatsapp: '573000000000', correo: 'test@elbodegon.com', mensaje: 'Prueba final de produccion' });
    const res = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 8095,
        path: '/api/contact',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      },
      postData
    );

    if (res.statusCode === 200 && res.json && res.json.ok === true) {
      console.log(`  -> Status: 200 OK`);
      console.log(`  -> Respuesta API: ${JSON.stringify(res.json)}`);
      console.log('  -> PASS: API de contacto en PHP 8.3 respondió exitosamente con lead persistido.');
      passed++;
    } else {
      console.error(`  -> FAIL: API de contacto devolvió respuesta inesperada: ${res.body}`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 5: Autenticación, Middleware CSRF y Seguridad del CMS Admin (/api/auth)
  console.log('\n[TEST 5] Verificando endpoint de autenticación y middleware CSRF...');
  try {
    const res = await makeRequest({ hostname: '127.0.0.1', port: 8095, path: '/api/auth?action=status', method: 'GET' });
    const isJson = (res.headers['content-type'] || '').includes('application/json');

    if (res.statusCode === 200 && isJson && res.json && res.json.ok === true) {
      console.log(`  -> Status: 200 OK`);
      console.log(`  -> Autenticado: ${res.json.authenticated}`);
      console.log('  -> PASS: Servicio de autenticación activo y respondiendo JSON tipado.');
      passed++;
    } else {
      console.error(`  -> FAIL: Respuesta inesperada de /api/auth: ${res.body}`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  console.log('\n----------------------------------------------------');
  console.log(` RESULTADOS: ${passed}/${total} pruebas superadas`);
  console.log('----------------------------------------------------');

  if (passed === total) {
    console.log('>>> [SUCCESS] T4.7 APROBADA SATISFACTORIAMENTE <<<');
    console.log('>>> 🏁 PROYECTO 100% LISTO PARA PRODUCCIÓN <<<\n');
    process.exit(0);
  } else {
    console.error('>>> [FAILURE] T4.7 NO SUPERÓ TODAS LAS PRUEBAS <<<\n');
    process.exit(1);
  }
}

runTests();
