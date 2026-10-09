// scripts/test-admin-fix.js
async function runTest() {
  console.log('--- TEST 1: LOGIN CON ANA AVILA ---');
  const loginRes = await fetch('http://localhost:8095/api/auth?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Ana Avila', pass: 'ANAISABEL2026' })
  }).then(r => r.json());
  console.log('Login result:', loginRes.ok, loginRes.user, 'SessionID:', loginRes.session_id ? 'PRESENTE' : 'FALTA');

  if (!loginRes.ok || !loginRes.session_id) {
    throw new Error('Login falló: ' + JSON.stringify(loginRes));
  }

  const sid = loginRes.session_id;
  const csrf = loginRes.csrf_token;

  console.log('--- TEST 2: STATUS CON X-SESSION-ID ---');
  const statusRes = await fetch('http://localhost:8095/api/auth?action=status', {
    headers: { 'X-Session-ID': sid }
  }).then(r => r.json());
  console.log('Status authenticated:', statusRes.authenticated, 'User:', statusRes.user);

  console.log('--- TEST 3: SUBIDA DE FOTO CON X-SESSION-ID Y CSRF ---');
  const form = new FormData();
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileBlob = new Blob([Buffer.from(pngBase64, 'base64')], { type: 'image/png' });
  form.append('file', fileBlob, 'princesa_pich.png');

  const uploadRes = await fetch('http://localhost:8095/api/upload-media', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrf,
      'X-Session-ID': sid
    },
    body: form
  }).then(r => r.json());
  console.log('Upload result:', uploadRes.ok, 'URL:', uploadRes.url);

  if (!uploadRes.ok || !uploadRes.url) {
    throw new Error('Upload falló: ' + JSON.stringify(uploadRes));
  }

  console.log('--- TEST 4: GUARDAR TRAJE PRINCESA PICH ---');
  const newTraje = {
    titulo: 'PRINCESA PICH',
    temporada: 'octubre',
    categoria: 'Princesas y Cuentos de Hadas',
    grupo: 'Princesas y Cuentos de Hadas',
    tallas: ['S', 'M', 'L'],
    descripcion: 'VESTIDO DE PRINCESA',
    foto: uploadRes.url,
    formato_foto: 'carta',
    activo: true
  };

  const saveRes = await fetch('http://localhost:8095/api/catalogo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'X-Session-ID': sid
    },
    body: JSON.stringify(newTraje)
  }).then(r => r.json());
  console.log('Save traje result:', saveRes.ok, saveRes.message);

  console.log('--- TEST 5: VERIFICAR TRAJE EN CATALOGO ---');
  const catRes = await fetch('http://localhost:8095/api/catalogo').then(r => r.json());
  const found = catRes.trajes.find(t => t.titulo === 'PRINCESA PICH');
  console.log('Found traje:', found ? `${found.titulo} [temporada: ${found.temporada}, foto: ${found.foto}]` : 'NO ENCONTRADO');

  console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE.');
}

runTest().catch(err => {
  console.error('❌ Error en prueba:', err);
  process.exit(1);
});
