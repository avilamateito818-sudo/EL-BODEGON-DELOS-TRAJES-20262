# Despliegue en DreamHost — El Bodegón de los Trajes

**Dominio:** `elbodegondelostrajes.com` (DNS en DreamHost: `ns1/ns2/ns3.dreamhost.com`).

El sitio se publica en **DreamHost (plan Web Hosting Launch)** desde **GitHub** con
**GitHub Actions + rsync/SSH**. Los endpoints `/api/*` son **PHP** (`sitio/api/*.php`)
que persisten datos en el repo vía API de GitHub.

---

## Cómo funciona el flujo

```
push a main ──▶ GitHub Actions ──▶ rsync sitio/ ──▶ servidor DreamHost
     ▲                                                  │
     └────── commit vía API ◀── save-content.php ◀── panel admin
```

1. Cualquier `push` a `main` despliega `sitio/` al servidor automáticamente.
2. El panel admin guarda el contenido → `api/save-content.php` crea un commit en
   GitHub → el push dispara el deploy → el sitio queda actualizado en segundos.

---

## 1. Servidor DreamHost

1. En el panel de DreamHost: **Manage Domains → tu dominio**, y anota la
   **carpeta del sitio** (ej. `~/tudominio.com`). Esa carpeta será el destino
   del rsync y debe contener `index.html` en su raíz.
2. Activa **SSH** (panel → *Advanced → SSH access*) y sube tu clave pública:
   puedes generarla con `ssh-keygen -t ed25519 -f ~/.ssh/dreamhost_bodegon`
   y añadir la clave pública en el panel de DreamHost (o en `~/.ssh/authorized_keys`
   vía el file manager).
3. Verifica: `ssh usuario@tudominio.com 'php -v && git --version'`
   (PHP con extensión `curl` viene incluido; no hace falta Node).

## 2. Segredos en GitHub (Settings → Secrets and variables → Actions)

| Secreto | Valor |
|---------|-------|
| `DREAMHOST_SSH_KEY` | Contenido completo de la clave privada (`~/.ssh/dreamhost_bodegon`) |
| `DREAMHOST_HOST` | `usuario@servidor` (el que usas para SSH) |
| `DREAMHOST_PATH` | Ruta absoluta de la carpeta del sitio, con `/` final (ej. `~/tudominio.com/`) |

El workflow está en [`.github/workflows/deploy-dreamhost.yml`](../.github/workflows/deploy-dreamhost.yml).

## 3. Token de GitHub en el servidor

Los endpoints PHP escriben en el repo con un **PAT con scope `repo`**.
Guárdalo **fuera del docroot**, nunca en el repositorio:

```bash
ssh usuario@tudominio.com
cat > ~/bodegon-config.php <<'EOF'
<?php
return array(
    'GITHUB_TOKEN'  => 'ghp_...',
    'GITHUB_REPO'   => 'avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262',
    'GITHUB_BRANCH' => 'main',
);
EOF
chmod 600 ~/bodegon-config.php
```

> Sin token el sitio funciona igual, pero el guardado del panel y las consultas
> degradan a enlace de WhatsApp (comportamiento "fallback").

## 4. Primer despliegue

1. Haz `push` a `main` (o ejecuta el workflow a mano desde la pestaña *Actions*).
2. Revisa el log del job: debe terminar con `sent ... bytes` de rsync sin errores.
3. Abre tu dominio: debe cargar la página con normalidad.

## 5. Verificación

| Qué probar | Cómo |
|---|---|
| Sitio | Abrir la URL raíz — carga sin errores en consola |
| Asistente | Enviar una consulta desde el chat → debe responder y registrar en `data/consultas.json` (commit nuevo en GitHub) |
| Panel admin | *Admin → Sincronizar* → insignia "Conexión OK — GitHub sync activo"; editar algo y ver el commit "Admin update…" |
| Endpoint | `curl -X POST https://tudominio.com/api/chat-ask.php -H 'Content-Type: application/json' -d '{"consulta":"prueba"}'` → `{"ok":true,...}` |
| Seguridad | `https://tudominio.com/api/_config.php` debe dar **403**; `data/*.json` (raíz del repo) **no** está publicado (viven fuera de `sitio/`) |

---

## Notas y solución de problemas

- **Rutas limpias**: `sitio/.htaccess` reescribe `/api/x` → `api/x.php` para que
  el frontend no cambie. Si tu cuenta restringiera `AllowOverride` (error 404 en
  `/api/save-content`), escribe a `admin.js` la constante
  `CLOUD_SYNC_API = '/api/save-content.php'`.
- **Configuración local**: copia `sitio/api/config.local.example.php` a
  `sitio/api/config.local.php` (gitignored) y pon tu token. Prueba los endpoints
  con `php -S localhost:8790 -t sitio`.
- **Despliegue manual de emergencia** (si Actions está caído):
  `rsync -avz --delete -e ssh ./sitio/ usuario@tudominio.com:~/tudominio.com/`
- **Volver a Vercel**: la migración es reversible con git (los archivos de
  Vercel están en el historial); restaura `vercel.json`, `api/` y
  `docs/VERCEL.md` desde un commit anterior y reconecta el proyecto en vercel.com.

## Datos que viven en GitHub (no en el disco del servidor)

| Archivo | Quién lo escribe |
|---|---|
| `sitio/data/admin-content.js` | Panel admin (`save-content.php`) |
| `data/consultas.json` | Asistente (`chat-ask.php`) |
| `data/mensajes.json` | Formulario de contacto (`contact.php`) |
