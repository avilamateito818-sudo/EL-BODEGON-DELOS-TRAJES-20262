const { spawn } = require('child_process');
const http = require('http');
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
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Could not connect to Chrome debugging port');
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
    return new Promise((resolve) => {
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

async function runMobileAudit() {
  console.log('=== INICIANDO AUDITORÍA SENIOR DE PRODUCCIÓN (CHROME HEADLESS CDP) ===');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--hide-scrollbars'
  ]);

  try {
    const wsUrl = await getWsUrl(9222);
    const client = new CDPClient(wsUrl);
    await client.ready();

    // Enable domains
    await client.send('Page.enable');
    await client.send('Network.enable');
    await client.send('Runtime.enable');
    await client.send('Log.enable');

    const consoleLogs = [];
    const networkFailures = [];

    client.on('Runtime.consoleAPICalled', (params) => {
      consoleLogs.push({
        type: params.type,
        text: params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ')
      });
    });

    client.on('Runtime.exceptionThrown', (params) => {
      consoleLogs.push({
        type: 'EXCEPTION',
        text: params.exceptionDetails.text + (params.exceptionDetails.exception?.description || '')
      });
    });

    client.on('Network.responseReceived', (params) => {
      if (params.response.status >= 400) {
        networkFailures.push({
          url: params.response.url,
          status: params.response.status,
          statusText: params.response.statusText
        });
      }
    });

    client.on('Network.loadingFailed', (params) => {
      networkFailures.push({
        requestId: params.requestId,
        errorText: params.errorText,
        type: params.type
      });
    });

    // 1. Audit Desktop / Default
    console.log('\n[1/3] Navegando a', URL_TO_TEST);
    await client.send('Page.navigate', { url: URL_TO_TEST });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Audit iPhone 14 (390 x 844)
    console.log('\n[2/3] Simulando Apple iPhone 14 / Safari iOS (390 x 844, DPR 3)...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await client.send('Network.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    await client.send('Page.navigate', { url: URL_TO_TEST });
    await new Promise(r => setTimeout(r, 2500));

    // Evaluate layout and overflow on iPhone
    const iphoneLayout = await client.send('Runtime.evaluate', {
      expression: `(async () => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const bodyW = document.body.scrollWidth;

        // Test menu toggle click
        const menuBtn = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const menuBtnVisible = menuBtn ? window.getComputedStyle(menuBtn).display : 'none';
        
        let beforeOpen = navMenu.className;
        menuBtn.click();
        await new Promise(r => setTimeout(r, 450));
        let afterOpen = navMenu.className;
        let menuRect = navMenu.getBoundingClientRect();

        // Close it
        menuBtn.click();
        await new Promise(r => setTimeout(r, 450));
        let afterClose = navMenu.className;

        return {
          windowWidth: winW,
          documentScrollWidth: docW,
          bodyScrollWidth: bodyW,
          hasHorizontalScroll: docW > winW,
          menuButtonDisplay: menuBtnVisible,
          beforeOpen,
          afterOpen,
          drawerRectWhenOpen: {
            left: Math.round(menuRect.left),
            right: Math.round(menuRect.right),
            width: Math.round(menuRect.width)
          },
          afterClose
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Resultados iPhone 14:', JSON.stringify(iphoneLayout.result.value, null, 2));

    // 3. Audit Android Galaxy S20 / Pixel 7 (360 x 800)
    console.log('\n[3/3] Simulando Android Google Pixel / Samsung (360 x 800, DPR 3)...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await client.send('Network.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    });
    await client.send('Page.navigate', { url: URL_TO_TEST });
    await new Promise(r => setTimeout(r, 2500));

    const androidLayout = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        
        const overflowing = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winW + 1 || rect.left < -1) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
            });
          }
        });

        return {
          windowWidth: winW,
          documentScrollWidth: docW,
          hasHorizontalScroll: docW > winW,
          overflowCount: overflowing.length,
          overflowingElements: overflowing.slice(0, 10)
        };
      })()`,
      returnByValue: true
    });

    console.log('Resultados Android:', JSON.stringify(androidLayout.result.value, null, 2));

    console.log('\n--- AUDITORÍA DE CONSOLA & EXCEPCIONES ---');
    console.log('Total logs:', consoleLogs.length);
    consoleLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

    console.log('\n--- PETICIONES HTTP FALLIDAS / 404 ---');
    console.log('Total fallidas:', networkFailures.length);
    networkFailures.forEach(f => console.log('  ->', JSON.stringify(f)));

    client.close();
  } finally {
    chromeProc.kill();
  }
}

runMobileAudit().catch(err => {
  console.error('Error en auditoría:', err);
  process.exit(1);
});
