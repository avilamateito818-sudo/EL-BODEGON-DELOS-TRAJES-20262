const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8812;
const CDP_PORT = 9235;

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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && cbs.has(msg.id)) {
      const cb = cbs.get(msg.id);
      cbs.delete(msg.id);
      cb(msg);
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

  // Exact resolution from user screenshot: 1024 x 841
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 841,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  // Evaluate layout
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = document.querySelector('#octubre-catalogo .grid-haunted');
      const cat = document.querySelector('#octubre-catalogo');
      const p = document.querySelector('.season-panel[data-panel="octubre"]');
      const panels = document.querySelector('.season-panels');
      const sec = document.querySelector('#temporadas');

      return JSON.stringify({
        viewportWidth: window.innerWidth,
        temporadas: { offsetW: sec.offsetWidth, scrollW: sec.scrollWidth, clientW: sec.clientWidth, pl: getComputedStyle(sec).paddingLeft, pr: getComputedStyle(sec).paddingRight },
        panels: { offsetW: panels.offsetWidth, scrollW: panels.scrollWidth, clientW: panels.clientWidth, maxW: getComputedStyle(panels).maxWidth },
        panel: { offsetW: p.offsetWidth, scrollW: p.scrollWidth, clientW: p.clientWidth, display: getComputedStyle(p).display, cols: getComputedStyle(p).gridTemplateColumns },
        catalog: { offsetW: cat.offsetWidth, scrollW: cat.scrollWidth, clientW: cat.clientWidth, pl: getComputedStyle(cat).paddingLeft, pr: getComputedStyle(cat).paddingRight },
        grid: { offsetW: g.offsetWidth, scrollW: g.scrollWidth, clientW: g.clientWidth, cols: getComputedStyle(g).gridTemplateColumns, gap: getComputedStyle(g).gap }
      }, null, 2);
    })()`,
    returnByValue: true
  });

  console.log('LAYOUT EVALUATION AT 1024px:');
  console.log(res.result.value);

  // Scroll to catalog
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-card-id="card-octubre-capitana-marvel"]');
      if (card) {
        const rect = card.getBoundingClientRect();
        window.scrollTo(0, window.pageYOffset + rect.top - 100);
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Take screenshot
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'screenshot-1024.png'), Buffer.from(screenshotRes.data, 'base64'));

  chromeProc.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
