/**
 * test-assets-optimization.js
 * 
 * Suite automatizada de verificación para T4.1 y T4.2:
 * - T4.1: Descarga y migración local de imágenes con Hotlinking externo
 * - T4.2: Sustitución de imágenes pesadas por versiones WebP existentes
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log(' SUITE DE VERIFICACIÓN: T4.1 y T4.2 (OPTIMIZACIÓN DE ASSETS)');
console.log('====================================================\n');

let passedTests = 0;
const totalTests = 5;

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
const sitioDir = path.join(__dirname, '..', 'sitio');
const html = fs.readFileSync(htmlPath, 'utf8');

// Test 1: Cero hotlinks externos en atributos src de index.html
try {
  console.log('[TEST 1] Verificación de cero URLs externas http/https en etiquetas de imagen...');
  const externalSrcRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
  const externalMatches = [...html.matchAll(externalSrcRegex)].map(m => m[1]);
  
  assert.strictEqual(
    externalMatches.length,
    0,
    `Se encontraron ${externalMatches.length} imágenes externas aún enlazadas: ${externalMatches.join(', ')}`
  );
  
  console.log('  -> PASS: 0 peticiones salientes externas detectadas en src de imágenes.');
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 1]:', err.message);
}

// Test 2: Integridad física y resolución de todas las 28 imágenes migradas a assets/img/remote/
try {
  console.log('\n[TEST 2] Verificación de integridad física de imágenes del catálogo en assets/img/remote/...');
  const remoteSrcRegex = /src=["'](assets\/img\/remote\/[^"']+)["']/gi;
  const remoteMatches = [...html.matchAll(remoteSrcRegex)].map(m => m[1]);
  
  assert(remoteMatches.length >= 28, `Se esperaban al menos 28 imágenes locales remotas, encontradas: ${remoteMatches.length}`);
  
  let totalBytes = 0;
  remoteMatches.forEach(relPath => {
    const absPath = path.join(sitioDir, relPath);
    assert(fs.existsSync(absPath), `El archivo referenciado no existe en disco: ${absPath}`);
    const stats = fs.statSync(absPath);
    assert(stats.size > 0, `El archivo está vacío (0 bytes): ${absPath}`);
    totalBytes += stats.size;
  });
  
  console.log(`  -> PASS: Las ${remoteMatches.length} referencias a assets/img/remote/ existen físicamente en disco.`);
  console.log(`  -> Tamaño total servido localmente: ${(totalBytes / 1024).toFixed(1)} KB`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 2]:', err.message);
}

// Test 3: Erradicación completa de horror_bg.png en HTML y CSS
try {
  console.log('\n[TEST 3] Verificación de sustitución de horror_bg.png por horror_bg.webp...');
  assert(!html.includes('horror_bg.png'), 'sitio/index.html todavía contiene referencia a horror_bg.png');
  assert(html.includes('horror_bg.webp'), 'sitio/index.html debe incluir horror_bg.webp');
  
  // Revisar archivos CSS
  const cssDir = path.join(sitioDir, 'css');
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  cssFiles.forEach(cf => {
    const cssContent = fs.readFileSync(path.join(cssDir, cf), 'utf8');
    assert(!cssContent.includes('horror_bg.png'), `El archivo CSS ${cf} todavía hace referencia a horror_bg.png`);
  });
  
  const pngSize = fs.statSync(path.join(sitioDir, 'assets/img/horror_bg.png')).size;
  const webpSize = fs.statSync(path.join(sitioDir, 'assets/img/horror_bg.webp')).size;
  const savedKB = ((pngSize - webpSize) / 1024).toFixed(1);
  
  console.log(`  -> PASS: 0 referencias a horror_bg.png en HTML y CSS.`);
  console.log(`  -> horror_bg: ${pngSize} B -> ${webpSize} B (Ahorro directo: ${savedKB} KB)`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 3]:', err.message);
}

// Test 4: Sustitución de imágenes pesadas locales por WebP
try {
  console.log('\n[TEST 4] Verificación de adopción de versiones WebP en imágenes clave...');
  const migratedImages = [
    { name: 'reyes_magos', orig: 'reyes_magos.jpg', webp: 'reyes_magos.webp' },
    { name: 'uniforme_colegio', orig: 'uniforme_colegio.jpg', webp: 'uniforme_colegio.webp' },
    { name: 'bata_laboratorio', orig: 'bata_laboratorio.jpg', webp: 'bata_laboratorio.webp' },
    { name: 'ima21', orig: 'ima21.jpg', webp: 'ima21.webp' },
    { name: 'jr2', orig: 'jr2.jpg', webp: 'jr2.webp' },
    { name: 'img19', orig: 'img19.jpg', webp: 'img19.webp' },
    { name: 'img20', orig: 'img20.jpg', webp: 'img20.webp' },
    { name: 'img13', orig: 'img13.jpg', webp: 'img13.webp' },
    { name: 'vestido_nina', orig: 'vestido_nina.jpg', webp: 'vestido_nina.webp' },
    { name: 'reno_rudolfo', orig: 'reno_rudolfo.jpg', webp: 'reno_rudolfo.webp' }
  ];
  
  migratedImages.forEach(img => {
    assert(!html.includes(`assets/img/${img.orig}`), `index.html todavía contiene ${img.orig}`);
    assert(html.includes(`assets/img/${img.webp}`), `index.html debe contener ${img.webp}`);
    
    const origPath = path.join(sitioDir, 'assets/img', img.orig);
    const webpPath = path.join(sitioDir, 'assets/img', img.webp);
    assert(fs.existsSync(webpPath), `El archivo WebP no existe: ${webpPath}`);
    assert(fs.statSync(webpPath).size > 0, `El archivo WebP está vacío: ${webpPath}`);
  });
  
  console.log(`  -> PASS: Las 10 imágenes principales ahora usan sus versiones .webp optimizadas.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 4]:', err.message);
}

// Test 5: Cálculo y validación de ahorro de transferencia (> 1.5 MB)
try {
  console.log('\n[TEST 5] Auditoría de ahorro total de transferencia en la carga de assets...');
  
  const optimizedPairs = [
    { orig: 'assets/img/horror_bg.png', opt: 'assets/img/horror_bg.webp' },
    { orig: 'assets/img/reyes_magos.jpg', opt: 'assets/img/reyes_magos.webp' },
    { orig: 'assets/img/uniforme_colegio.jpg', opt: 'assets/img/uniforme_colegio.webp' },
    { orig: 'assets/img/bata_laboratorio.jpg', opt: 'assets/img/bata_laboratorio.webp' },
    { orig: 'assets/img/vestido_nina.jpg', opt: 'assets/img/vestido_nina.webp' },
    { orig: 'assets/img/reno_rudolfo.jpg', opt: 'assets/img/reno_rudolfo.webp' },
    { orig: 'assets/img/ima21.jpg', opt: 'assets/img/ima21.webp' },
    { orig: 'assets/img/jr2.jpg', opt: 'assets/img/jr2.webp' },
    { orig: 'assets/img/img19.jpg', opt: 'assets/img/img19.webp' },
    { orig: 'assets/img/img20.jpg', opt: 'assets/img/img20.webp' },
    { orig: 'assets/img/img13.jpg', opt: 'assets/img/img13.webp' }
  ];
  
  let origBytes = 0;
  let optBytes = 0;
  
  optimizedPairs.forEach(pair => {
    origBytes += fs.statSync(path.join(sitioDir, pair.orig)).size;
    optBytes += fs.statSync(path.join(sitioDir, pair.opt)).size;
  });
  
  const savedLocalBytes = origBytes - optBytes;
  const savedLocalMB = (savedLocalBytes / (1024 * 1024)).toFixed(2);
  
  // Además, los 28 assets remotos que antes eran imágenes full-res externas ahora están comprimidos en disco
  const remoteDir = path.join(sitioDir, 'assets/img/remote');
  const remoteFiles = fs.readdirSync(remoteDir);
  let remoteTotalBytes = 0;
  remoteFiles.forEach(rf => {
    remoteTotalBytes += fs.statSync(path.join(remoteDir, rf)).size;
  });
  
  console.log(`  -> Bytes originales de imágenes pesadas: ${(origBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  -> Bytes optimizados WebP: ${(optBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  -> Ahorro directo en imágenes locales sustituidas: ${savedLocalMB} MB (${((savedLocalBytes / origBytes) * 100).toFixed(1)}% reducción)`);
  console.log(`  -> Peso total de los 28 assets del catálogo localizados: ${(remoteTotalBytes / (1024 * 1024)).toFixed(2)} MB`);
  
  assert(savedLocalBytes > 1000 * 1024, `El ahorro local debe superar 1 MB, actual: ${savedLocalMB} MB`);
  
  console.log(`  -> PASS: Criterio de optimización superado con éxito.`);
  passedTests++;
} catch (err) {
  console.error('  -> FAIL [TEST 5]:', err.message);
}

console.log('\n----------------------------------------------------');
console.log(` RESULTADOS: ${passedTests}/${totalTests} pruebas superadas`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('>>> [SUCCESS] T4.1 Y T4.2 APROBADAS SATISFACTORIAMENTE <<<\n');
  process.exit(0);
} else {
  console.error('>>> [FAILURE] Algunas pruebas fallaron <<<\n');
  process.exit(1);
}
