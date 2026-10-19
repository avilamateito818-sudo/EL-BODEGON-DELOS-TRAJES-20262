const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sitioDir = path.join(__dirname, '..', 'sitio');
const htmlPath = path.join(sitioDir, 'index.html');
const catPath = path.join(sitioDir, 'data', 'catalogo.json');

async function getWsUrl(port) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const data = await res.json();
      const page = data.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('No se pudo conectar a Chrome Headless');
}

async function main() {
  console.log('=== OPTIMIZADOR PROFESIONAL DE ASSETS WEBP (CHROME HEADLESS) ===');

  // List of images to optimize
  const filesToOptimize = [
    'assets/img/quinceanera_bodas.jpg',
    'assets/img/carnaval_comparsa.jpg',
    'assets/img/primavera_romeria.jpg',
    'assets/img/folclor_boyacense.jpg',
    'assets/img/gala_aniversario.jpg',
    'assets/img/nazareno_cuaresma.jpg',
    'assets/img/pasillo_fiestero.jpg',
    'assets/img/princesa_peach.jpg',
    'assets/img/san_valentin_novia.jpg',
    'assets/img/blazer_ejecutivo.jpg',
    'assets/img/abril_hero.jpg',
    'assets/img/navidad_hero.jpg',
    'assets/img/mayo_hero.jpg',
    'assets/img/vestido_nina.jpg',
    'assets/img/reyes_magos.jpg',
    'assets/img/uniforme_colegio.jpg',
    'assets/img/remote/ryMDI2LzA3L1NNT0stQkxVRS5wbmc.png',
    'assets/img/remote/r8wMDU5LWNjLTEtc2NhbGVkLmpwZw.jpg',
    'assets/img/remote/rUQ18wMDU5LWNjLXNjYWxlZC5qcGc.jpg',
    'assets/img/remote/r2NTAxNy5qcGcdj0xNzE1NzI0MTQx.webp',
    'assets/img/remote/r4MTgwMC5qcGcdj0xNzIxNzAxNjY0.webp',
    'assets/img/remote/rlamEtUmVnaW9uLUFuZGluYS5qcGc.webp',
    'assets/img/remote/rZnJhY2VzLWJvZ290YS5qcGcuanBn.webp',
    'assets/img/remote/rFqZS1qb3JvcG8tcGFyZWphLmpwZw.webp',
    'assets/img/remote/ryMy8wOS9TYW4tSnVhbmVyby5qcGc.webp',
    'assets/img/remote/rljby1yb2pvLXNvbWJyZXJvLmpwZw.webp',
    'assets/img/remote/r1MTU2Mzc1JmFtcDt3aWR0aD01MzM.webp',
    'assets/img/uploads/img_20261009_013458_2e54791152c8.jpg',
    'assets/img/uploads/img_20261009_142030_b4dd57341aa7.png'
  ];

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  try {
    const wsUrl = await getWsUrl(9224);
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === reqId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    let totalOriginalBytes = 0;
    let totalOptimizedBytes = 0;
    const replacementMap = new Map();

    for (const rel of filesToOptimize) {
      const absPath = path.join(sitioDir, rel);
      if (!fs.existsSync(absPath)) {
        console.log(`[SKIP] No existe: ${rel}`);
        continue;
      }

      const originalBuf = fs.readFileSync(absPath);
      const originalSize = originalBuf.length;
      totalOriginalBytes += originalSize;

      const ext = path.extname(rel).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
      const dataUrl = `data:${mime};base64,${originalBuf.toString('base64')}`;

      const isHero = rel.includes('hero') || rel.includes('bg');
      const maxW = isHero ? 1200 : 800;
      const maxH = isHero ? 800 : 1000;
      const quality = isHero ? 0.85 : 0.82;

      const evalRes = await send('Runtime.evaluate', {
        expression: `(async () => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const maxW = ${maxW};
              const maxH = ${maxH};
              let w = img.width;
              let h = img.height;
              if (w > maxW) {
                h = Math.round(h * (maxW / w));
                w = maxW;
              }
              if (h > maxH) {
                w = Math.round(w * (maxH / h));
                h = maxH;
              }
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, w, h);
              const webpData = canvas.toDataURL('image/webp', ${quality});
              resolve({
                width: w,
                height: h,
                data: webpData.split(',')[1]
              });
            };
            img.onerror = () => reject(new Error('Failed to load image in canvas'));
            img.src = ${JSON.stringify(dataUrl)};
          });
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      if (!evalRes || !evalRes.result || !evalRes.result.value) {
        console.error(`[ERR] Falló conversión de ${rel}`);
        continue;
      }

      const { width, height, data } = evalRes.result.value;
      const optimizedBuf = Buffer.from(data, 'base64');
      const optimizedSize = optimizedBuf.length;

      // Determine output filename
      const targetRel = rel.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const targetAbs = path.join(sitioDir, targetRel);

      // Write optimized file
      fs.writeFileSync(targetAbs, optimizedBuf);
      totalOptimizedBytes += optimizedSize;

      const saving = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      console.log(`[OK] ${rel} -> ${targetRel} | ${(originalSize/1024).toFixed(1)} KB -> ${(optimizedSize/1024).toFixed(1)} KB (-${saving}%) [${width}x${height}]`);

      if (targetRel !== rel) {
        replacementMap.set(rel, targetRel);
      }
    }

    console.log('\n--- RESUMEN TOTAL DE COMPRESIÓN ---');
    console.log('Bytes originales:', (totalOriginalBytes / 1024 / 1024).toFixed(2), 'MB');
    console.log('Bytes optimizados:', (totalOptimizedBytes / 1024 / 1024).toFixed(2), 'MB');
    console.log('Ahorro total:', ((1 - totalOptimizedBytes / totalOriginalBytes) * 100).toFixed(1), '%');
    console.log('Megabytes ahorrados:', ((totalOriginalBytes - totalOptimizedBytes) / 1024 / 1024).toFixed(2), 'MB');

    // Save replacement map to scratch/replacements.json
    fs.writeFileSync(
      path.join(__dirname, 'replacements.json'),
      JSON.stringify(Object.fromEntries(replacementMap), null, 2)
    );

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
