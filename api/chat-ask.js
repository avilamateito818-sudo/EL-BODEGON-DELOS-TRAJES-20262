const GITHUB_REPO = process.env.GITHUB_REPO || 'avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262';
const FILE_PATH = 'data/consultas.json';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN || '';
const CONTACT_PHONE = '573107706615';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJson(url, auth) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${auth}`, Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return { sha: null, data: [] };
  if (!r.ok) return { sha: null, data: [] };
  const j = await r.json();
  const decoded = Buffer.from(j.content.replace(/\s/g, ''), 'base64').toString('utf8');
  try {
    return { sha: j.sha, data: JSON.parse(decoded) };
  } catch (e) {
    return { sha: j.sha, data: [] };
  }
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Método no permitido' });

  let p;
  try {
    p = JSON.parse(req.body || '{}');
  } catch (e) {
    return send(res, 400, { ok: false, error: 'JSON inválido' });
  }

  const record = {
    fecha: new Date().toISOString(),
    categoria: String(p.categoria || ''),
    nombre: String(p.nombre || ''),
    whatsapp: String(p.whatsapp || ''),
  };
  const waLink = `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(
    `Nueva consulta en El Bodegón: ${record.categoria}. Nombre: ${record.nombre}. WhatsApp: ${record.whatsapp}`
  )}`;

  if (!TOKEN) {
    // Sin token: responder OK con el enlace de WhatsApp para no romper la UX
    return send(res, 200, { ok: true, fallback: true, waLink });
  }

  try {
    const { sha, data } = await readJson(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      TOKEN
    );
    data.unshift(record);
    const trimmed = data.slice(0, 500);
    const body = {
      message: 'Nueva consulta del asistente',
      content: Buffer.from(JSON.stringify(trimmed, null, 2)).toString('base64'),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // No bloqueamos la UX si la persistencia falla
  }

  return send(res, 200, { ok: true, waLink });
};
