const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8790;
const rootArg = process.argv[2] || path.join(__dirname, '..', 'sitio');
const root = path.normalize(path.resolve(rootArg));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.vcf': 'text/vcard',
  '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(root)) {
  console.error(`Raíz no encontrada: ${root}`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';

    const fp = path.normalize(path.join(root, p));
    if (!fp.startsWith(root)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    fs.stat(fp, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Sirviendo ${root} en http://localhost:${PORT}`);
  });
