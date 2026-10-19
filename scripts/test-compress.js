const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
  throw new Error('Could not connect');
}

async function testCompress() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  try {
    const wsUrl = await getWsUrl(9223);
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

    const testImgPath = path.join(__dirname, '..', 'sitio', 'assets', 'img', 'quinceanera_bodas.jpg');
    const buf = fs.readFileSync(testImgPath);
    const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;

    console.log('Original size:', (buf.length / 1024).toFixed(1), 'KB');

    const result = await send('Runtime.evaluate', {
      expression: `(async () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const maxW = 800;
            const maxH = 1000;
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
            ctx.drawImage(img, 0, 0, w, h);
            const webpData = canvas.toDataURL('image/webp', 0.82);
            resolve({
              width: w,
              height: h,
              data: webpData.split(',')[1]
            });
          };
          img.onerror = reject;
          img.src = ${JSON.stringify(dataUrl)};
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const outBuf = Buffer.from(result.result.value.data, 'base64');
    console.log('Optimized WebP size:', (outBuf.length / 1024).toFixed(1), 'KB');
    console.log('Reduction:', ((1 - outBuf.length / buf.length) * 100).toFixed(1), '%');
    console.log('New dimensions:', result.result.value.width, 'x', result.result.value.height);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

testCompress().catch(console.error);
