# El Bodegón de los Trajes

Sitio web de **El Bodegón de los Trajes** (Tunja, Boyacá): disfraces, uniformes, batas y alta costura a la medida. Es una aplicación web **estática** (HTML + CSS + JS) con un panel de administración integrado. El contacto con los clientes es por **WhatsApp** y la persistencia de contenido usan **Vercel + GitHub**.

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
├── docs/                   # 📘 Documentación (arquitectura, SOLID, Git Flow, Docker, Vercel)
├── docker/                 # 🐳 Dockerfile y configuración de Nginx
├── api/                    # ☁️ Funciones serverless (Vercel): save-content (y endpoints de datos en GitHub)
├── scripts/                # 🔧 Utilidades del proyecto (dev, build, docker…)
├── .github/workflows/      # ⚙️ (opcional) CI/CD
├── docker-compose.yml      # Orquesta el contenedor (sitio estático)
├── vercel.json             # ☁️ Configuración de despliegue en Vercel
├── .gitignore
└── README.md
```

---

## Requisitos

- **Node.js** 18+ (para servir en desarrollo con un servidor estático sencillo).
- **Docker** (opcional, para despliegue contenerizado con Nginx).
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

### 2) Con Docker (Nginx)

```bash
docker compose up --build
# -> http://localhost:8080
```

El contenedor sirve el contenido estático de `sitio/` con Nginx (configuración en `docker/nginx.conf`).

### 3) En producción (Vercel)

El sitio se publica con **Vercel** (raíz `sitio/` + funciones serverless en `api/` para la persistencia y la sincronización del panel con GitHub). Ver [`docs/VERCEL.md`](docs/VERCEL.md) para importar el proyecto y configurar la variable `GITHUB_TOKEN`.

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
| Despliegue en Vercel (sincronización con GitHub) | [`docs/VERCEL.md`](docs/VERCEL.md) |

---

## Ramas (Git Flow)

- `main` — producción estable.
- `develop` — integración.
- `feature/*` — nuevas funciones (salir de `develop`).
- `hotfix/*` — correcciones urgentes a `main`.

Ver [`docs/GIT_FLOW.md`](docs/GIT_FLOW.md) para los comandos.

---

## Contenido administrable

El panel de administración persiste en `data/admin-content.js`. La edición visual (fotos, títulos, párrafos) se sincroniza en la nube mediante un endpoint serverless (`/api/save-content`) y GitHub. Ver [`docs/ADMIN.md`](docs/ADMIN.md).
