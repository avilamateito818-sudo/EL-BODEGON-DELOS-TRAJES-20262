# Docker — El Bodegón de los Trajes

El proyecto incluye soporte **Docker** para servir el sitio con **Nginx + PHP-FPM** en un solo contenedor. Es la forma más simple y robusta de desplegar la web completa (sitio estático **y** API PHP) sin instalar Nginx ni PHP en el host.

---

## Contenido

- `docker/Dockerfile.php` — imagen Nginx + php-fpm (la que usa `docker-compose.yml`).
- `docker/nginx-php.conf` — configuración de Nginx: estático, caché, SPA, rewrites `/api/x → api/x.php` y cabeceras de seguridad.
- `docker/supervisord.conf` — levanta `nginx` y `php-fpm` dentro del mismo contenedor.
- `docker/Dockerfile` + `docker/nginx.conf` — variante **solo estática** (sin PHP), opcional.
- `docker-compose.yml` — orquesta el contenedor (en la raíz).
- `.dockerignore` — excluye lo que no debe entrar a la imagen (git, docs, logs, credenciales).

---

## Requisitos

- **Docker** y **Docker Compose** instalados.

---

## Cómo usarlo

### 1) Construir y levantar

```bash
docker compose up --build
```

- El sitio queda servido en `http://localhost:8095`.
- El contenedor se llama **`el-bodegon-trajes-php`** y usa **exclusivamente el puerto 8095** (libre, no se mezcla con otros servicios: 3000, 8080, 8082, 8090, 8791, 1355…).
- `sitio/` es la **raíz del documento**; `index.html` se sirve en `/`.
- Los endpoints PHP funcionan dentro del contenedor:

```bash
# Sitio
curl http://localhost:8095/

# API (deben responder JSON, no 404/405)
curl -X POST http://localhost:8095/api/chat-ask \
  -H "Content-Type: application/json" \
  -d '{"categoria":"prueba","consulta":"hola","nombre":"t","whatsapp":"300"}'
```

### 2) Detener

```bash
docker compose down
```

### 3) Solo construir la imagen

```bash
docker build -t el-bodegon-trajes -f docker/Dockerfile.php .
```

---

## API y token de GitHub

Los endpoints PHP (`/api/save-content`, `/api/chat-ask`, `/api/contact`) pueden
persistir en GitHub. La configuración se lee en este orden (ver
`sitio/api/_config.php`):

1. Variable de entorno `BODEGON_CONFIG` (ruta a un archivo de configuración).
2. `~/bodegon-config.php`.
3. `sitio/api/config.local.php` (desarrollo local, gitignored).
4. **Variables de entorno** `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`,
   `CONTACT_PHONE` (las no vacías sobrescriben).

En Docker se pasan así (crea un archivo `.env` junto a `docker-compose.yml`,
ya que `.env` está en `.gitignore`):

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
# GITHUB_REPO=avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262   (opcional)
# GITHUB_BRANCH=main                                                (opcional)
```

```bash
docker compose up --build
```

**Sin token el sitio igual funciona**: `chat-ask` y `contact` responden con
fallback a WhatsApp y `save-content` responde un error claro indicando que falta
el token (el panel de administración lo muestra en su badge de sincronización).

---

## Detalles de la imagen

- Imagen base: `php:8.3-fpm-alpine` + `nginx` (ligera).
- `supervisord` mantiene ambos procesos vivos y reinicia cualquiera que caiga.
- Copia el contenido de `sitio/` a `/usr/share/nginx/html`.
- Expone el puerto **80** (mapeado al **8095** en `docker-compose.yml`).
- `HEALTHCHECK` integrado: el contenedor queda `healthy` si Nginx responde.

```
Docker build contexto
├── sitio/                  -> /usr/share/nginx/html
├── docker/nginx-php.conf   -> /etc/nginx/nginx.conf
└── docker/supervisord.conf -> /etc/supervisord.conf
```

### Seguridad dentro del contenedor

- `/api/_config.php`, `/api/config.local.php` y `.htaccess` → **403** (nunca por HTTP).
- `.env`, `config.local.php`, logs y credenciales quedan **fuera de la imagen** (`.dockerignore`).
- Cabeceras: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

---

## Variante solo estática (sin PHP)

Si solo necesitas el HTML/CSS/JS (por ejemplo, para producción en DreamHost donde el PHP ya corre en el servidor):

```bash
docker build -t el-bodegon-trajes-estatico -f docker/Dockerfile .
```

---

## Despliegue en un servidor (ej. VPS)

```bash
git clone https://github.com/avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262.git
cd EL-BODEGON-DELOS-TRAJES-20262
docker compose up -d --build
```

Nginx servirá la web en el puerto mapeado (ajustar `ports` en `docker-compose.yml` según el servidor, p. ej. `80:80`).

---

## Notas

- El panel de administración funciona en el navegador. La **sincronización de contenido** usa el endpoint PHP (`/api/save-content`) y GitHub (ver [`ADMIN.md`](ADMIN.md)).
- Para desarrolladores sin Docker, también se puede servir con el servidor estático de Node: `node scripts/dev-server.js sitio` → `http://localhost:8790` (ver [`README.md`](../README.md)).
