# El Bodegón de los Trajes

Sitio web de **El Bodegón de los Trajes** (Tunja, Boyacá): disfraces, uniformes, batas y alta costura a la medida. Es una aplicación web **estática** (HTML + CSS + JS) con un panel de administración integrado. El contacto con los clientes es por **WhatsApp** y la persistencia de contenido se realiza mediante la **API (PHP/Docker) + GitHub**.

Este repositorio aplica **arquitectura limpia (Clean Architecture)**, principios **SOLID**, convención de ramas **Git Flow** y despliegue contenerizado con **Docker**.

> ⚠️ **Importante:** el panel de administración **no almacena ni expone contraseñas, usuarios ni datos internos** en el sitio público. La edición solo es posible con sesión de administrador activa. Nunca se comparten credenciales.

---

## Estructura del proyecto

```
el-bodegon-de-los-trajes/
├── sitio/                  # 🌐 WEB FUNCIONAL (HTML/CSS/JS) — raíz que se sirve
│   ├── index.html          #   Página única
│   ├── assets/img/         #   Imágenes usadas por el sitio
│   ├── css/                #   Hojas de estilo por responsabilidad
│   ├── js/
│   │   ├── app.js          #     Lógica del frontend (nav, pestañas, lightbox…)
│   │   └── admin.js        #     Panel de administración (login/edición)
│   ├── data/admin-content.js  # Contenido administrable persistido
│   ├── api/                #   Endpoints PHP (chat-ask, save-content, contact)
├── docs/                   # 📘 Documentación (arquitectura, SOLID, Git Flow, Docker)
├── docker/                 # 🐳 Docker (Nginx + PHP-FPM, y variante solo estática)
├── scripts/                # 🔧 Utilidades del proyecto (dev, build, docker…)
├── docker-compose.yml      # Orquesta el contenedor (puerto 8095)
├── .gitignore
└── README.md
```

---

## Requisitos

- **Node.js** 18+ (para servir en desarrollo con un servidor estático sencillo).
- **Docker** (para despliegue contenerizado con Nginx y PHP-FPM).
- **Git** para el flujo de ramas.

---

## Cómo ejecutar

### 1) Desarrollo local (sin Docker)

Sirve la carpeta `sitio/` como raíz (así se carga `index.html` en `/`):

```bash
node scripts/dev-server.js sitio
# -> http://localhost:8790
```

> Las rutas del sitio son **relativas a `sitio/`** (`css/…`, `js/…`), por lo que la web debe servirse con `sitio/` como raíz del documento.

### 2) Con Docker (Nginx + PHP)

```bash
docker compose up --build
# -> http://localhost:8095
```

El contenedor `el-bodegon-trajes-php` (puerto **8095**, propio y sin chocar con
otros servicios) sirve el sitio con **Nginx** y ejecuta los endpoints PHP
(`/api/save-content`, `/api/chat-ask`, `/api/contact`) con **php-fpm** — es
decir, el panel de administración y el asistente funcionan de forma completa. Ver [`docs/DOCKER.md`](docs/DOCKER.md).

> Para sincronizar con GitHub desde Docker, define `GITHUB_TOKEN` en un archivo
> `.env` junto a `docker-compose.yml` (sin él, el sitio funciona con fallback a
> WhatsApp).

---

## Documentación

| Tema | Archivo |
|------|---------|
| Arquitectura limpia y capas | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Principios SOLID aplicados | [`docs/SOLID.md`](docs/SOLID.md) |
| Flujo de ramas Git Flow | [`docs/GIT_FLOW.md`](docs/GIT_FLOW.md) |
| Docker / despliegue | [`docs/DOCKER.md`](docs/DOCKER.md) |
| Estructura de carpetas | [`docs/DIRECTORY_STRUCTURE.md`](docs/DIRECTORY_STRUCTURE.md) |
| Credenciales de administración | [`docs/ADMIN.md`](docs/ADMIN.md) |

---

## Ramas (Git Flow)

- `main` — producción estable.
- `develop` — integración.
- `feature/*` — nuevas funciones (salir de `develop`).
- `hotfix/*` — correcciones urgentes a `main`.

Ver [`docs/GIT_FLOW.md`](docs/GIT_FLOW.md) para los comandos.

---

## Contenido administrable

El panel de administración persiste en `data/admin-content.js`. La edición visual (fotos, títulos, párrafos) se sincroniza en la nube mediante el endpoint PHP (`/api/save-content`) y GitHub. Ver [`docs/ADMIN.md`](docs/ADMIN.md).
