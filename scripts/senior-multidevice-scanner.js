const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8792;
const URL_TO_TEST = `http://localhost:${PORT}/`;

// Iniciar dev-server en puerto 8792 para el escaneo
const serverProcess = spawn('node', [path.join(__dirname, 'dev-server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe'
});

async function waitForServer(port) {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(500, () => req.abort());
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Servidor dev no levantó a tiempo');
}

async function getWsUrl(port) {
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const data = await res.json();
      const page = data.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('No se pudo conectar a Chrome CDP');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        const list = this.events.get(msg.method) || [];
        list.forEach(fn => fn(msg.params));
      }
    };
  }

  ready() {
    return new Promise(resolve => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(fn);
  }

  close() {
    this.ws.close();
  }
}

const TEST_DEVICES = [
  { name: 'Android Galaxy/Pixel Compacto', width: 360, height: 800, scale: 3, mobile: true, platform: 'Android' },
  { name: 'Android Pantalla Estándar', width: 393, height: 851, scale: 2.75, mobile: true, platform: 'Android' },
  { name: 'Apple iPhone 14/15/16 Safari', width: 390, height: 844, scale: 3, mobile: true, platform: 'iOS' },
  { name: 'Apple iPhone Pro Max', width: 430, height: 932, scale: 3, mobile: true, platform: 'iOS' },
  { name: 'Tablet iPad Portrait', width: 768, height: 1024, scale: 2, mobile: true, platform: 'iPad' },
  { name: 'Tablet iPad Landscape', width: 1024, height: 768, scale: 2, mobile: true, platform: 'iPad' },
  { name: 'PC Portátil Estándar (Laptop)', width: 1366, height: 768, scale: 1, mobile: false, platform: 'Desktop' },
  { name: 'PC Escritorio Full HD', width: 1920, height: 1080, scale: 1, mobile: false, platform: 'Desktop' }
];

async function scan() {
  console.log('======================================================================');
  console.log('   ESCANEO TOTAL MULTI-DISPOSITIVO Y AUDITORÍA SENIOR DE PRODUCCIÓN   ');
  console.log('======================================================================\n');

  console.log('[1/4] Esperando servidor local de prueba...');
  await waitForServer(PORT);
  console.log('  -> Servidor online en puerto', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  try {
    console.log('[2/4] Conectando protocolo Chrome DevTools (CDP)...');
    const wsUrl = await getWsUrl(9227);
    const client = new CDPClient(wsUrl);
    await client.ready();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    const consoleErrors = [];
    const failedRequests = [];

    client.on('Runtime.exceptionThrown', (params) => {
      const exp = params.exceptionDetails;
      consoleErrors.push({
        text: exp.text || '',
        desc: exp.exception ? (exp.exception.description || exp.exception.value || '') : '',
        location: `${exp.url || ''}:${exp.lineNumber || 0}`
      });
    });

    client.on('Network.loadingFailed', (params) => {
      failedRequests.push({
        requestId: params.requestId,
        errorText: params.errorText,
        type: params.type
      });
    });

    console.log('[3/4] Ejecutando escaneo en matriz de 8 dispositivos...\n');

    const scanSummary = [];

    for (const dev of TEST_DEVICES) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: dev.scale,
        mobile: dev.mobile
      });

      if (dev.platform === 'iOS') {
        await client.send('Network.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
        });
      } else if (dev.platform === 'Android') {
        await client.send('Network.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
        });
      } else {
        await client.send('Network.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        });
      }

      await client.send('Page.navigate', { url: URL_TO_TEST });
      await new Promise(r => setTimeout(r, 1200));

      const evaluation = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const winW = window.innerWidth;
          const winH = window.innerHeight;
          const docW = document.documentElement.scrollWidth;

          // 1. Detección de desbordamiento horizontal
          const overflowEls = [];
          document.querySelectorAll('body *').forEach(el => {
            const s = window.getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') return;
            const r = el.getBoundingClientRect();
            if (r.right > winW + 2) {
              overflowEls.push({
                tag: el.tagName,
                id: el.id || '',
                class: el.className || '',
                excess: Math.round(r.right - winW)
              });
            }
          });

          // 2. Verificación de catálogo y temporadas: ¿quedan vacías o en negro?
          const seasons = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
          const seasonsStatus = {};
          seasons.forEach(m => {
            const p = document.querySelector('.season-panel[data-panel="' + m + '"]');
            if (!p) {
              seasonsStatus[m] = { exists: false };
              return;
            }
            const cards = p.querySelectorAll('[data-card-id]');
            const visibleCards = Array.from(cards).filter(c => {
              const cs = window.getComputedStyle(c);
              return cs.display !== 'none' && cs.visibility !== 'hidden';
            });
            seasonsStatus[m] = {
              exists: true,
              totalCards: cards.length,
              visibleCards: visibleCards.length,
              isExpanded: p.classList.contains('is-expanded'),
              hasHeight: p.offsetHeight > 100
            };
          });

          // 3. Verificación de imágenes rotas
          const allImgs = Array.from(document.querySelectorAll('img'));
          const brokenImgs = allImgs.filter(img => img.naturalWidth === 0 && img.complete);
          const brokenDetails = brokenImgs.map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            loading: img.getAttribute('loading'),
            complete: img.complete,
            naturalWidth: img.naturalWidth
          }));

          // 4. Verificación de tamaños táctiles (mínimo 44px en móviles)
          const smallTouchTargets = [];
          if (winW <= 768) {
            document.querySelectorAll('button, a.btn-haunted, a.season-tab, a.card-cta-wa').forEach(btn => {
              const s = window.getComputedStyle(btn);
              if (s.display === 'none' || s.visibility === 'hidden') return;
              const r = btn.getBoundingClientRect();
              if (r.height > 0 && r.height < 40) {
                smallTouchTargets.push({
                  text: (btn.textContent || '').trim().slice(0, 25),
                  height: Math.round(r.height),
                  tag: btn.tagName
                });
              }
            });
          }

          // 5. Botones sin aria-label
          const btnsWithoutAria = Array.from(document.querySelectorAll('button:not([aria-label]):not([title])')).filter(b => !(b.textContent || '').trim()).length;

          return {
            winW,
            docW,
            hasHorizontalScroll: docW > winW,
            overflowCount: overflowEls.length,
            overflowSample: overflowEls.slice(0, 3),
            totalImages: allImgs.length,
            brokenImagesCount: brokenImgs.length,
            brokenDetails,
            smallTouchCount: smallTouchTargets.length,
            btnsWithoutAria,
            seasonsStatus
          };
        })()`,
        returnByValue: true
      });

      const res = evaluation.result.value;
      const okOverflow = !res.hasHorizontalScroll;
      const okBroken = res.brokenImagesCount === 0;

      // Probar interactividad de cambio de temporada (probar cambio a octubre y febrero)
      const tabSwitchResult = await client.send('Runtime.evaluate', {
        expression: `(() => {
          if (typeof window.selectSeason === 'function') {
            window.selectSeason('octubre');
            const octPanel = document.querySelector('.season-panel[data-panel="octubre"]');
            const octSub = octPanel ? octPanel.querySelector('.season-sub-sections') : null;
            const octHeight = octPanel ? octPanel.offsetHeight : 0;
            const octVisible = octSub ? window.getComputedStyle(octSub).opacity : '0';

            window.selectSeason('febrero');
            const febPanel = document.querySelector('.season-panel[data-panel="febrero"]');
            const febSub = febPanel ? febPanel.querySelector('.season-sub-sections') : null;
            const febHeight = febPanel ? febPanel.offsetHeight : 0;
            const febVisible = febSub ? window.getComputedStyle(febSub).opacity : '0';

            return {
              octHeight,
              octVisible,
              febHeight,
              febVisible,
              octCards: octPanel ? octPanel.querySelectorAll('[data-card-id]').length : 0,
              febCards: febPanel ? febPanel.querySelectorAll('[data-card-id]').length : 0
            };
          }
          return null;
        })()`,
        returnByValue: true
      });

      const switchData = tabSwitchResult.result.value;

      console.log(`[DISPOSITIVO] ${dev.name} (${dev.width}x${dev.height} px, DPR ${dev.scale})`);
      console.log(`  -> Desbordamiento horizontal: ${okOverflow ? '✅ 0px (Sin scroll horizontal)' : '❌ FALLO: ' + res.docW + 'px'}`);
      console.log(`  -> Imágenes rotas: ${okBroken ? '✅ 0 rotas (' + res.totalImages + ' válidas)' : '❌ ' + res.brokenImagesCount + ' rotas'}`);
      if (!okBroken) {
        console.log('     Detalle imagen rota:', res.brokenDetails);
      }
      console.log(`  -> Botones táctiles <40px: ${res.smallTouchCount === 0 ? '✅ 0 (Ergonomía OK)' : '⚠️ ' + res.smallTouchCount}`);
      console.log(`  -> Cambio a Octubre: Altura=${switchData.octHeight}px | Opacidad=${switchData.octVisible} | Trajes=${switchData.octCards}`);
      console.log(`  -> Cambio a Febrero: Altura=${switchData.febHeight}px | Opacidad=${switchData.febVisible} | Trajes=${switchData.febCards}`);
      console.log('');

      scanSummary.push({
        device: dev.name,
        okOverflow,
        okBroken,
        touchOk: res.smallTouchCount === 0,
        switchOk: switchData && switchData.octHeight > 300 && switchData.febHeight > 300
      });
    }

    console.log('[4/4] Resumen de auditoría de errores y red:');
    console.log('  -> Total excepciones JS de consola:', consoleErrors.length);
    consoleErrors.forEach(e => console.error('     ERROR:', e.text, e.desc, e.location));
    console.log('  -> Total peticiones fallidas:', failedRequests.length);

    console.log('\n======================================================================');
    console.log('                      RESULTADOS DEL ESCANEO TOTAL                     ');
    console.log('======================================================================');
    scanSummary.forEach(s => {
      const allPass = s.okOverflow && s.okBroken && s.switchOk;
      console.log(`${allPass ? ' [PASS]' : ' [FAIL]'} ${s.device.padEnd(35)} | Overflow: ${s.okOverflow ? 'OK' : 'FAIL'} | Imgs: ${s.okBroken ? 'OK' : 'FAIL'} | Temporadas: ${s.switchOk ? 'OK' : 'FAIL'}`);
    });
    console.log('======================================================================\n');

    client.close();
  } finally {
    chromeProc.kill();
    serverProcess.kill();
  }
}

scan().catch(err => {
  console.error('Error fatal en escaneo:', err);
  serverProcess.kill();
  process.exit(1);
});
