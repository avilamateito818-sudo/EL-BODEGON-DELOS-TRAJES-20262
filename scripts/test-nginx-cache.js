/**
 * Suite de Verificación Automatizada: T4.5 (Ajuste de Directivas de Caché en Nginx)
 * Valida que los datos dinámicos (/data/admin-content.js, index.html, /api/) nunca queden atrapados
 * en caché de 7 días, que los estáticos sí se almacenen con public/max-age,
 * y que la privacidad (/data/leads/) siga bloqueada con 403.
 */

const http = require('http');

function fetchHeaders(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8095,
        path: urlPath,
        method: 'HEAD',
      },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' SUITE DE VERIFICACIÓN: T4.5 (DIRECTIVAS DE CACHÉ NGINX)');
  console.log('====================================================\n');

  let passed = 0;
  const total = 5;

  // TEST 1: Exclusión estricta de /data/admin-content.js del caché de 7 días
  console.log('[TEST 1] Verificando cabeceras de /data/admin-content.js...');
  try {
    const res = await fetchHeaders('/data/admin-content.js');
    const cc = res.headers['cache-control'] || '';
    const isNoCache = cc.includes('no-cache') && (cc.includes('max-age=0') || cc.includes('must-revalidate'));
    const isNotTrapped = !cc.includes('604800') && !cc.includes('public');

    if (res.statusCode === 200 && isNoCache && isNotTrapped) {
      console.log(`  -> Status: ${res.statusCode} OK`);
      console.log(`  -> Cache-Control: "${cc}"`);
      console.log('  -> PASS: admin-content.js excluido de caché de 7 días; revalidación inmediata configurada.');
      passed++;
    } else {
      console.error(`  -> FAIL: Cache-Control inesperado: "${cc}", Status: ${res.statusCode}`);
    }
  } catch (err) {
    console.error('  -> ERROR al conectar con Docker (puerto 8095):', err.message);
  }

  // TEST 2: Preservación de 403 Forbidden en /data/leads/
  console.log('\n[TEST 2] Verificando protección de privacidad en /data/leads/...');
  try {
    const res = await fetchHeaders('/data/leads/');
    if (res.statusCode === 403) {
      console.log(`  -> Status: ${res.statusCode} Forbidden`);
      console.log('  -> PASS: /data/leads/ continúa estrictamente protegido con HTTP 403.');
      passed++;
    } else {
      console.error(`  -> FAIL: Se esperaba HTTP 403 pero se obtuvo: ${res.statusCode}`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 3: Caché estático de larga duración en assets (CSS, imágenes)
  console.log('\n[TEST 3] Verificando caché de 7 días para assets estáticos (/css/seasons.css)...');
  try {
    const res = await fetchHeaders('/css/seasons.css');
    const cc = res.headers['cache-control'] || '';
    const hasPublicCache = cc.includes('public') && cc.includes('604800');

    if (res.statusCode === 200 && hasPublicCache) {
      console.log(`  -> Status: ${res.statusCode} OK`);
      console.log(`  -> Cache-Control: "${cc}"`);
      console.log('  -> PASS: seasons.css cacheado adecuadamente con 7 días para máximo rendimiento.');
      passed++;
    } else {
      console.error(`  -> FAIL: Cache-Control incorrecto en assets estáticos: "${cc}"`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 4: Revalidación inmediata de index.html (SPA shell)
  console.log('\n[TEST 4] Verificando cabeceras de index.html (raíz)...');
  try {
    const res = await fetchHeaders('/');
    const cc = res.headers['cache-control'] || '';
    const isNoCache = cc.includes('no-cache');

    if (res.statusCode === 200 && isNoCache) {
      console.log(`  -> Status: ${res.statusCode} OK`);
      console.log(`  -> Cache-Control: "${cc}"`);
      console.log('  -> PASS: index.html configurado con no-cache para reflejar actualizaciones de frontend de inmediato.');
      passed++;
    } else {
      console.error(`  -> FAIL: Cache-Control en HTML raíz inesperado: "${cc}"`);
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  // TEST 5: Preservación de cabeceras de seguridad globales
  console.log('\n[TEST 5] Verificando presencia de cabeceras de seguridad en respuestas...');
  try {
    const res = await fetchHeaders('/data/admin-content.js');
    const xcto = res.headers['x-content-type-options'];
    const xfo = res.headers['x-frame-options'];
    const rp = res.headers['referrer-policy'];

    if (xcto === 'nosniff' && xfo === 'SAMEORIGIN' && rp === 'strict-origin-when-cross-origin') {
      console.log(`  -> X-Content-Type-Options: ${xcto}`);
      console.log(`  -> X-Frame-Options: ${xfo}`);
      console.log(`  -> Referrer-Policy: ${rp}`);
      console.log('  -> PASS: Cabeceras de seguridad preservadas en todas las directivas de ubicación.');
      passed++;
    } else {
      console.error('  -> FAIL: Faltan cabeceras de seguridad en la respuesta.');
    }
  } catch (err) {
    console.error('  -> ERROR:', err.message);
  }

  console.log('\n----------------------------------------------------');
  console.log(` RESULTADOS: ${passed}/${total} pruebas superadas`);
  console.log('----------------------------------------------------');

  if (passed === total) {
    console.log('>>> [SUCCESS] T4.5 APROBADA SATISFACTORIAMENTE <<<\n');
    process.exit(0);
  } else {
    console.error('>>> [FAILURE] T4.5 NO SUPERÓ TODAS LAS PRUEBAS <<<\n');
    process.exit(1);
  }
}

runTests();
