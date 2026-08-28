# Docker — El Bodegón de los Trajes

El proyecto incluye soporte **Docker** para servir el sitio **estático** con **Nginx**. Es la forma más simple y robusta de desplegar la web (sin Node necesario en producción).

---

## Contenido

- `docker/Dockerfile` — imagen Nginx que copia `sitio/` como raíz del documento.
- `docker/nginx.conf` — configuración de Nginx (serve estático, caché y SPAs de una sola página).
- `docker-compose.yml` — orquesta el contenedor (en la raíz).
- `.dockerignore` — excluye lo que no debe entrar a la imagen (git, docs locales, etc.).

---

## Requisitos

- **Docker** y **Docker Compose** instalados.

---

## Cómo usarlo

### 1) Construir y levantar

```bash
docker compose up --build
```

- El sitio queda servido en `http://localhost:8080`.
- `sitio/` es la **raíz del documento**; `index.html` se sirve en `/`.

### 2) Detener

```bash
docker compose down
```

### 3) Solo construir la imagen

```bash
docker build -t el-bodegon-trajes -f docker/Dockerfile .
```

---

## Detalles de la imagen

- Imagen base: `nginx:alpine` (ligera).
- Copia el contenido estático de `sitio/` a `/usr/share/nginx/html`.
- Aplica la configuración `docker/nginx.conf`.
- Expone el puerto **80** (mapeado al 8080 en `docker-compose.yml`).

```
Docker build contexto
├── sitio/            -> /usr/share/nginx/html
└── docker/nginx.conf -> /etc/nginx/conf.d/default.conf
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

- Esta es una web **estática**; el panel de administración y los asistentes funcionan en el navegador. La **sincronización de contenido** usa un endpoint serverless (Vercel) y GitHub (ver [`ADMIN.md`](ADMIN.md)); no requiere servicios Docker extra.
- Para desarrolladores, tambiés se puede servir sin Docker con el servidor estático de Node (ver [`README.md`](../README.md)).
