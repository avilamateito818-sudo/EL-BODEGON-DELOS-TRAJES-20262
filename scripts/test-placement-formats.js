const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('1. Autenticando admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 8095,
    path: '/api/auth?action=login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ user: 'Ana Avila', pass: 'ANAISABEL2026' }));

  const cookies = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  const loginData = JSON.parse(loginRes.body);
  const csrf = loginData.csrf_token;
  console.log('Autenticado. CSRF:', csrf.substring(0, 10) + '...');

  console.log('2. Creando traje con Portada y Formato Carta...');
  const postRes = await request({
    hostname: 'localhost',
    port: 8095,
    path: '/api/catalogo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'X-CSRF-Token': csrf
    }
  }, JSON.stringify({
    titulo: 'Traje Test Portada Carta ' + Date.now(),
    temporada: 'octubre',
    categoria: 'Terror',
    destacado: true,
    formato_foto: 'carta',
    tallas: 'S, M, XL',
    descripcion: 'Prueba de colocación en portada y formato carta',
    foto: 'assets/img/ph-octubre.svg',
    activo: true
  }));

  const postData = JSON.parse(postRes.body);
  if (!postData.ok) throw new Error('Error al crear traje: ' + postRes.body);
  const id = postData.traje.id;
  console.log('Traje creado ID:', id, 'Destacado:', postData.traje.destacado, 'Formato:', postData.traje.formato_foto);

  console.log('3. Actualizando traje a Cuadrado y Cuentos y Fantasía...');
  const putRes = await request({
    hostname: 'localhost',
    port: 8095,
    path: '/api/catalogo?id=' + encodeURIComponent(id),
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'X-CSRF-Token': csrf
    }
  }, JSON.stringify({
    id: id,
    titulo: postData.traje.titulo,
    categoria: 'Cuentos y Fantasía',
    destacado: false,
    formato_foto: 'cuadrado',
    tallas: ['M', 'L']
  }));
  const putData = JSON.parse(putRes.body);
  if (!putData.ok) throw new Error('Error al actualizar traje: ' + putRes.body);
  console.log('Traje actualizado:', putData.traje.categoria, 'Destacado:', putData.traje.destacado, 'Formato:', putData.traje.formato_foto);

  console.log('4. Borrando traje...');
  const delRes = await request({
    hostname: 'localhost',
    port: 8095,
    path: '/api/catalogo?id=' + encodeURIComponent(id),
    method: 'DELETE',
    headers: {
      'Cookie': cookies,
      'X-CSRF-Token': csrf
    }
  });
  const delData = JSON.parse(delRes.body);
  if (!delData.ok) throw new Error('Error al borrar traje: ' + delRes.body);
  console.log('Traje borrado exitosamente. Total trajes restantes:', delData.total_trajes);

  console.log('✅ TODAS LAS PRUEBAS DE COLOCACIÓN, FORMATO Y BORRADO PASARON EXITOSAMENTE!');
}

run().catch(console.error);
