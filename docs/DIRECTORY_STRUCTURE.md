# Estructura de directorios — El Bodegón de los Trajes

Estructura organizada **alrededor** del sitio funcional (sin modificar su código).

```
el bodeogn de los trajes20262/
├── README.md                  # Vista general, cómo ejecutar, índices de documentación
├── docker-compose.yml         # Orquesta el contenedor Nginx
├── .dockerignore              # Exclusiones para la imagen Docker
├── .gitignore                 # Archivos que no se versionan
├── .gitattributes             # Normalización de saltos de línea / binarios
│
├── docs/                      # # DOCUMENTACIÓN
│   ├── ARCHITECTURE.md        #   Arquitectura y principios (Clean Architecture)
│   ├── SOLID.md               #   Aplicación de principios SOLID
│   ├── GIT_FLOW.md            #   Convención de ramas Git Flow
│   ├── DOCKER.md              #   Cómo desplegar con Docker/Nginx
│   ├── DIRECTORY_STRUCTURE.md #   Este documento
│   └── ADMIN.md               #   Panel de administración y asistentes
│
├── docker/                    # # CONTENEDOR (sirve el sitio de forma estática)
│   ├── Dockerfile             #   Imagen Nginx con sitio/ como raíz
│   └── nginx.conf             #   Configuración de Nginx
│
├── scripts/                   # # HERRAMIENTAS DE DESARROLLO
│   └── dev-server.js          #   Servidor estático local (Node, sin dependencias)
│
├── .github/                   # # (Opcional) automatización
│   └── workflows/             #   GitHub Actions (lint, pruebas, despliegue)
│
├── img/                       # Imágenes sueltas/residuales (sin uso en el sitio)
│
└── sitio/                     # # EL SITIO FUNCIONAL (no modificar el código)
    ├── index.html             #   Página única (SPA estática)
    ├── assets/img/            #   Fotografías del catálogo
    ├── css/                   #   Estilos (app, admin, chat, seasons, admin-ai…)
    ├── data/                  #   Datos (temporadas, inventario…)
    ├── email/                 #   Plantillas / adaptadores de correo
    └── js/                    #   Lógica (app, admin, client helper, assistant…)
```

---

## Notas importantes

- **`sitio/` es la raíz web.** El servidor (Node local o Nginx/Docker) sirve **`sitio/`** como documento raíz, por lo que `index.html` se carga en `/`.
- **No mover los archivos de `sitio/`**: cambiar su ubicación rompería las rutas que ya conectan la SPA (CSS, JS, imágenes y datos). Por eso la organización se hace en **capas alrededor** de `sitio/` (docos, docker, scripts), no reordenando el sitio mismo.
- **`img/` (raíz)** contiene imágenes residuales/sueltas que **no** se usan en el sitio actual; se conservan hasta decidir su destino (mover a `assets/img/` o eliminar) — ver [`ARCHITECTURE.md`](ARCHITECTURE.md).
- La documentación se centraliza en `docs/` y el despliegue reproducible en `docker/` + `docker-compose.yml`.
