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

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

const CSRF_TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'; // Exactly 64 chars

http
  .createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost:' + PORT);
    const p = decodeURIComponent(parsedUrl.pathname);

    /* 1. Endpoint de autenticación */
    if (/^\/api\/auth\/?$/.test(p)) {
      const action = parsedUrl.searchParams.get('action') || '';
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (action === 'logout') {
        res.setHeader('Set-Cookie', 'bodegon_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, authenticated: false, message: 'Sesión cerrada exitosamente.' }));
        return;
      }

      if (req.method === 'POST' && action === 'login') {
        const body = await parseBody(req);
        const pass = body.pass || body.password || '';
        if (pass === 'ANAISABEL2026' || pass === 'dev2026') {
          res.setHeader('Set-Cookie', 'bodegon_session=mock_dev_session_token_12345; Path=/; HttpOnly; SameSite=Lax');
          res.writeHead(200);
          res.end(JSON.stringify({
            ok: true,
            authenticated: true,
            user: body.user || 'Ana Avila',
            csrf_token: CSRF_TOKEN,
            local: true
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ ok: false, error: 'Credenciales inválidas.' }));
        }
        return;
      }

      // Default status
      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        authenticated: true,
        user: 'Ana Avila',
        csrf_token: CSRF_TOKEN,
        local: true
      }));
      return;
    }

    /* 2. Endpoint de catálogo REST CRUD */
    if (p === '/api/catalogo' || p === '/api/catalogo/') {
      const catPath = path.join(root, 'data', 'catalogo.json');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate, max-age=0');

      if (req.method === 'GET') {
        res.writeHead(200);
        if (fs.existsSync(catPath)) {
          fs.createReadStream(catPath).pipe(res);
        } else {
          res.end(JSON.stringify({ ok: true, trajes: [] }));
        }
        return;
      }

      let catalogData = { temporada_activa: 'octubre', trajes: [] };
      if (fs.existsSync(catPath)) {
        try {
          catalogData = JSON.parse(fs.readFileSync(catPath, 'utf8'));
        } catch (e) {}
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const newTraje = {
          id: 'tr_dev_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          temporada: body.temporada || 'octubre',
          titulo: body.titulo || 'Nuevo Traje',
          descripcion: body.descripcion || '',
          grupo: body.grupo || '',
          categoria: body.categoria || body.grupo || '',
          foto: body.foto || 'assets/img/ph-octubre.svg',
          formato_foto: body.formato_foto || 'carta',
          tallas: body.tallas || ['S', 'M', 'L'],
          activo: body.activo !== false
        };
        catalogData.trajes.push(newTraje);
        fs.writeFileSync(catPath, JSON.stringify(catalogData, null, 2), 'utf8');
        res.writeHead(201);
        res.end(JSON.stringify({ ok: true, traje: newTraje }));
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const trajeId = body.id || parsedUrl.searchParams.get('id');
        const idx = catalogData.trajes.findIndex(t => t.id === trajeId);
        if (idx !== -1) {
          Object.assign(catalogData.trajes[idx], body);
          fs.writeFileSync(catPath, JSON.stringify(catalogData, null, 2), 'utf8');
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, traje: catalogData.trajes[idx] }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, traje: body }));
        }
        return;
      }

      if (req.method === 'DELETE') {
        const trajeId = parsedUrl.searchParams.get('id');
        if (trajeId) {
          catalogData.trajes = catalogData.trajes.filter(t => t.id !== trajeId);
          fs.writeFileSync(catPath, JSON.stringify(catalogData, null, 2), 'utf8');
        }
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, message: 'Traje eliminado exitosamente.' }));
        return;
      }
    }

    /* 3. Endpoint de Leads y Prospectos */
    if (p === '/api/leads' || p === '/api/leads/') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, must-revalidate, max-age=0'
      });
      const sampleLeads = [
        {
          id: 'lead_001',
          fecha: new Date().toISOString(),
          nombre: 'Carolina Gómez',
          whatsapp: '573101234567',
          correo: 'carolina@ejemplo.com',
          mensaje: 'Quisiera cotizar disfraces de bruja y trajes medievales para una comparsa familiar.',
          tipo: 'formulario_contacto',
          estado: 'nuevo',
          wa_link: 'https://wa.me/573101234567'
        }
      ];
      res.end(JSON.stringify({ ok: true, leads: sampleLeads, total: sampleLeads.length }));
      return;
    }

    /* 4. Endpoint de Configuración General del Negocio */
    if (p === '/api/config' || p === '/api/config/') {
      const cfgPath = path.join(root, 'data', 'config-negocio.json');
      let currentCfg = {
        whatsapp: '573107706615',
        phone_display: '+57 310 770 6615',
        email: 'elbodegondelostrajes@gmail.com',
        address: 'Diagonal 66 2B 04, Tunja, Boyacá',
        hours_week: 'Lun–Sáb 8:00 am – 6:00 pm',
        hours_sun: 'Dom y festivos 9:00 am – 1:00 pm'
      };
      if (fs.existsSync(cfgPath)) {
        try {
          currentCfg = Object.assign(currentCfg, JSON.parse(fs.readFileSync(cfgPath, 'utf8')));
        } catch (e) {}
      }

      if (req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, must-revalidate, max-age=0'
        });
        res.end(JSON.stringify({ ok: true, config: currentCfg }));
        return;
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (body.whatsapp) currentCfg.whatsapp = String(body.whatsapp).replace(/[^0-9]/g, '');
        if (body.phone_display) currentCfg.phone_display = String(body.phone_display).trim();
        if (body.email) currentCfg.email = String(body.email).trim();
        if (body.address) currentCfg.address = String(body.address).trim();
        if (body.hours_week) currentCfg.hours_week = String(body.hours_week).trim();
        if (body.hours_sun) currentCfg.hours_sun = String(body.hours_sun).trim();
        currentCfg.ultima_actualizacion = new Date().toISOString();

        fs.writeFileSync(cfgPath, JSON.stringify(currentCfg, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, mensaje: 'Configuración de negocio guardada exitosamente.', config: currentCfg }));
        return;
      }
    }

    /* 5. Endpoint deprecado: save-content */
    if (p === '/api/save-content' || p === '/api/save-content/') {
      res.writeHead(410, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: false,
        error: 'Endpoint deprecado (410 Gone). La gestión de contenidos ahora se realiza a través de /api/catalogo y /api/config bajo arquitectura REST SSOT.'
      }));
      return;
    }

    /* 6. Endpoints de persistencia simulada / subidas */
    if (req.method === 'POST' && (/^\/api\/(chat-ask|contact|upload-media)\/?$/.test(p))) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      if (p.includes('upload-media')) {
        res.end(JSON.stringify({ ok: true, url: 'assets/img/reyes_magos.webp', local: true }));
      } else {
        res.end(JSON.stringify({ ok: true, local: true }));
      }
      return;
    }

    /* 5. Privacidad y bloqueo de datos protegidos */
    if (p.startsWith('/data/leads/')) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    /* 6. Enrutamiento de páginas base */
    if (p === '/' || p === '/index.html') {
      const fp = path.join(root, 'index.html');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, must-revalidate, max-age=0'
      });
      fs.createReadStream(fp).pipe(res);
      return;
    }

    if (p === '/admin' || p === '/admin/' || p === '/admin/index.html') {
      const fp = path.join(root, 'admin', 'index.html');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, must-revalidate, max-age=0'
      });
      fs.createReadStream(fp).pipe(res);
      return;
    }

    /* 7. Servir archivos estáticos */
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
      const headers = { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' };
      if (p.startsWith('/data/')) {
        headers['Cache-Control'] = 'no-cache, must-revalidate, max-age=0';
      } else {
        headers['Cache-Control'] = 'public, max-age=604800';
      }
      res.writeHead(200, headers);
      fs.createReadStream(fp).pipe(res);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Sirviendo ${root} en http://localhost:${PORT}`);
  });
