const GITHUB_REPO = process.env.GITHUB_REPO || 'avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262';
const FILE_PATH = 'sitio/data/admin-content.js';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN || '';

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

async function getFileSha() {
  const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (r.status === 404) return null;
  if (!r.ok) return null;
  const j = await r.json();
  return j.sha || null;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Método no permitido' });

  if (!TOKEN) {
    return send(res, 500, { ok: false, error: 'GITHUB_TOKEN no está configurado en Vercel' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch (e) {
    return send(res, 400, { ok: false, error: 'JSON inválido' });
  }

  let parsed;
  const rawContent = payload.content;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    try {
      parsed = JSON.parse(String(rawContent).replace(/^\s*window\.ADMIN_CONTENT\s*=\s*/, '').replace(/;\s*$/, ''));
    } catch (e2) {
      return send(res, 400, { ok: false, error: 'Contenido inválido' });
    }
  }

  const fileContent = 'window.ADMIN_CONTENT = ' + JSON.stringify(parsed, null, 2) + ';';
  const sha = await getFileSha();

  const body = {
    message: payload.message || 'Admin update: contenido actualizado desde el panel',
    content: Buffer.from(fileContent).toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const put = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify(body),
  });

  if (put.ok) {
    return send(res, 200, { ok: true });
  }

  const text = await put.text();
  return send(res, 502, { ok: false, error: 'GitHub rechazó la escritura: ' + text.slice(0, 200) });
};
