const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_TO_TEST = 'http://localhost:8790/';

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
  throw new Error('No se pudo conectar a Chrome');
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

const devices = [
  { name: 'Android (Google Pixel / Samsung)', width: 360, height: 800, scale: 3, mobile: true },
  { name: 'Apple iPhone 14/15/16', width: 390, height: 844, scale: 3, mobile: true },
  { name: 'Tablet Vertical (iPad Portrait)', width: 768, height: 1024, scale: 2, mobile: true },
  { name: 'Tablet Horizontal (iPad Landscape)', width: 1024, height: 768, scale: 2, mobile: true },
  { name: 'Portátil Estándar (Laptop 1366x768)', width: 1366, height: 768, scale: 1, mobile: false },
  { name: 'Escritorio Full HD (Desktop 1920x1080)', width: 1920, height: 1080, scale: 1, mobile: false }
];

async function runTest() {
  console.log('=== VERIFICACIÓN MULTI-DISPOSITIVO (ANDROID, IPHONE, TABLET, PORTÁTIL, ESCRITORIO) ===\n');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  try {
    const wsUrl = await getWsUrl(9226);
    const client = new CDPClient(wsUrl);
    await client.ready();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    const consoleErrors = [];
    client.on('Runtime.exceptionThrown', (params) => {
      const exp = params.exceptionDetails;
      const text = exp.text || '';
      const desc = exp.exception ? (exp.exception.description || exp.exception.value || '') : '';
      consoleErrors.push(`${text} ${desc} at ${exp.url || ''}:${exp.lineNumber || 0}:${exp.columnNumber || 0}`);
    });

    for (const dev of devices) {
      console.log(`\n--------------------------------------------------------------`);
      console.log(` Probando: ${dev.name} [${dev.width} x ${dev.height} px]`);
      console.log(`--------------------------------------------------------------`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: dev.scale,
        mobile: dev.mobile
      });

      await client.send('Page.navigate', { url: URL_TO_TEST });
      await new Promise(r => setTimeout(r, 1200));

      const evalResult = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const winW = window.innerWidth;
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;

          // Check visible overflowing elements
          const overflow = [];
          document.querySelectorAll('body *').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            const rect = el.getBoundingClientRect();
            // Allow small 1px subpixel tolerance
            if (rect.right > winW + 2) {
              overflow.push({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                rectRight: Math.round(rect.right),
                excess: Math.round(rect.right - winW)
              });
            }
          });

          // Check menu layout
          const menuBtn = document.getElementById('menu-toggle');
          const menuBtnDisplay = menuBtn ? window.getComputedStyle(menuBtn).display : 'none';
          const navMenu = document.getElementById('nav-menu');
          const navMenuStyle = navMenu ? window.getComputedStyle(navMenu) : null;

          // Check images loading and dimensions
          const allImgs = Array.from(document.querySelectorAll('img'));
          const imgsWithoutLazy = allImgs.filter(img => !img.hasAttribute('loading')).length;
          const imgsWithoutDim = allImgs.filter(img => !img.hasAttribute('width') || !img.hasAttribute('height')).length;

          return {
            windowWidth: winW,
            documentScrollWidth: docW,
            hasHorizontalScroll: docW > winW,
            overflowCount: overflow.length,
            overflowSample: overflow.slice(0, 3),
            menuButtonDisplay: menuBtnDisplay,
            totalImages: allImgs.length,
            imgsWithoutLazy,
            imgsWithoutDim
          };
        })()`,
        returnByValue: true
      });

      const res = evalResult.result.value;
      console.log(`  - Ancho de viewport: ${res.windowWidth} px | Ancho de documento: ${res.documentScrollWidth} px`);
      console.log(`  - ¿Tiene scroll horizontal defectuoso?: ${res.hasHorizontalScroll ? '❌ SÍ (ERROR)' : '✅ NO (PERFECTO)'}`);
      console.log(`  - Elementos desbordantes visibles: ${res.overflowCount}`);
      if (res.overflowCount > 0) {
        console.log('    Muestra de desbordamiento:', res.overflowSample);
      }
      console.log(`  - Menú hamburguesa visible: ${res.menuButtonDisplay !== 'none' ? 'SÍ (Modo Drawer)' : 'NO (Barra Horizontal Completa)'}`);
      console.log(`  - Total imágenes: ${res.totalImages} | Sin loading: ${res.imgsWithoutLazy} | Sin width/height: ${res.imgsWithoutDim}`);
    }

    console.log('\n--- AUDITORÍA DE EXCEPCIONES ---');
    console.log('Total excepciones en todos los dispositivos:', consoleErrors.length);
    consoleErrors.forEach(e => console.error('  ->', e));

    client.close();
  } finally {
    chromeProc.kill();
  }
}

runTest().catch(console.error);
