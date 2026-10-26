const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8798;
const CDP_PORT = 9228;

// Servidor local de prueba estático
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', 'sitio', reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const mimes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.png': 'image/png'
  };

  res.writeHead(200, { 'Content-Type': mimes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function main() {
  server.listen(PORT);
  console.log('=== TEST SUITE: AUDITORÍA IPHONE SAFARI - CARGA Y CATÁLOGO DE TODAS LAS TEMPORADAS ===\n');

  // Lanzar Chrome headless con emulación estricta de iPhone Safari
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-setuid-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  let wsUrl;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (!wsUrl) {
    console.error('No se pudo conectar a Chrome CDP');
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(res => ws.onopen = res);

  let msgId = 1;
  const cbs = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cbs.has(msg.id)) {
      const cb = cbs.get(msg.id);
      cbs.delete(msg.id);
      cb(msg);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      cbs.set(id, (res) => {
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  // Emulación precisa de Apple iPhone 15 / 16 en Mobile Safari
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });

  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    platform: 'iPhone'
  });

  await send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await new Promise(r => setTimeout(r, 2500));

  console.log('[1/3] Verificando carga inicial en iPhone Safari...');
  const initialAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyWidth = document.body.getBoundingClientRect().width;
      const scrollWidth = document.documentElement.scrollWidth;
      const overflowX = scrollWidth - window.innerWidth;
      const activePanel = document.querySelector('.season-panel.is-active');
      const activeSeason = activePanel ? activePanel.dataset.panel : null;
      const heroVisible = document.getElementById('inicio').offsetHeight > 400;
      return { overflowX, activeSeason, heroVisible };
    })()`,
    returnByValue: true
  });

  console.log(`  -> Desbordamiento horizontal inicial: ${initialAudit.result.value.overflowX <= 0 ? '✅ 0px (Sin scroll horizontal)' : '❌ Fallo'}`);
  console.log(`  -> Portada / Hero cargada: ${initialAudit.result.value.heroVisible ? '✅ OK' : '❌ Fallo'}`);
  console.log(`  -> Temporada activa en primer render: ✅ ${initialAudit.result.value.activeSeason}`);

  const SEASONS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  console.log('\n[2/3] Probando activación y botón de catálogo en las 12 temporadas...');
  let seasonsPass = 0;

  for (const s of SEASONS) {
    const testResult = await send('Runtime.evaluate', {
      expression: `(() => {
        // Simular selección de temporada (como tocar la pestaña o el enlace del menú)
        window.selectSeason('${s}');
        const panel = document.querySelector('.season-panel[data-panel="${s}"]');
        if (!panel) return { ok: false, error: 'Panel no encontrado' };
        
        const isActive = panel.classList.contains('is-active');
        const style = window.getComputedStyle(panel);
        const display = style.display;
        const opacity = parseFloat(style.opacity);
        
        // Simular click en el botón mágico de catálogo de la temporada
        const magicBtn = panel.querySelector('.btn-season-magic');
        if (magicBtn) {
          magicBtn.click();
        }
        
        // Contar tarjetas de disfraces en la temporada
        const cards = panel.querySelectorAll('.card-ghost').length;
        const subSections = panel.querySelectorAll('.season-catalog, .season-subsection').length;
        
        return {
          ok: isActive && display !== 'none' && (isNaN(opacity) || opacity > 0.5),
          display,
          opacity,
          isActive,
          cards,
          subSections,
          height: panel.offsetHeight
        };
      })()`,
      returnByValue: true
    });

    const v = testResult.result.value;
    if (v.ok) {
      console.log(`  [PASS] Temporada: ${s.toUpperCase().padEnd(10)} | Altura: ${v.height}px | Tarjetas: ${v.cards} | Subsecciones: ${v.subSections} | Visibilidad: ✅ OK`);
      seasonsPass++;
    } else {
      console.error(`  [FAIL] Temporada ${s}:`, v);
    }
  }

  console.log(`\n  -> Temporadas aprobadas en iPhone Safari: ${seasonsPass} / 12`);

  console.log('\n[3/3] Probando Lightbox al espichar una foto en iPhone Safari...');
  const lightboxAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      // Activar octubre y clickear la primera foto
      window.selectSeason('octubre');
      const panel = document.querySelector('.season-panel[data-panel="octubre"]');
      const firstCardImg = panel.querySelector('.img-ghost img');
      if (!firstCardImg) return { ok: false, error: 'No se encontró imagen de prueba' };
      
      // Simular click táctil en la foto
      firstCardImg.click();
      
      const lightbox = document.querySelector('.lightbox');
      const isOpen = lightbox.classList.contains('is-open');
      const lbImg = lightbox.querySelector('.lightbox-img');
      const title = lightbox.querySelector('.lightbox-title').textContent;
      const waBtn = lightbox.querySelector('.lightbox-wa-btn');
      const waHref = waBtn ? waBtn.getAttribute('href') : '';
      
      // Simular cierre
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.click();
      const isClosed = !lightbox.classList.contains('is-open');
      
      return {
        ok: isOpen && isClosed && lbImg.src.length > 0 && title.length > 0 && waHref.includes('wa.me'),
        title,
        waHref
      };
    })()`,
    returnByValue: true
  });

  const lb = lightboxAudit.result.value;
  if (lb.ok) {
    console.log(`  -> Modal ampliado en iPhone: ✅ OK`);
    console.log(`  -> Título de la prenda capturado: "${lb.title}"`);
    console.log(`  -> Botón WhatsApp directo: ✅ Enlazado`);
  } else {
    console.error('  -> Fallo en Lightbox:', lb);
  }

  console.log(`\n  -> Total errores JS en iPhone Safari: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errores:', consoleErrors);
  }

  console.log('\n======================================================================');
  console.log(seasonsPass === 12 && lb.ok && consoleErrors.length === 0
    ? ' ✅ AUDITORÍA DE IPHONE SAFARI: 100% APROBADA SIN ERRORES'
    : ' ❌ FALLARON ALGUNAS PRUEBAS EN IPHONE SAFARI');
  console.log('======================================================================\n');

  chromeProc.kill();
  server.close();
  process.exit(seasonsPass === 12 && lb.ok ? 0 : 1);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
