# Estructura de directorios — El Bodegón de los Trajes

Estructura organizada **alrededor** del sitio funcional (sin modificar su código).

```
el bodeogn de los trajes20262/
├── README.md                  # Vista general, cómo ejecutar, índices de documentación
├── docker-compose.yml         # Orquesta el contenedor (Nginx + PHP-FPM, puerto 8095)
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
│   └── ADMIN.md               #   Panel de administración y sincronización
│
├── docker/                    # # CONTENEDOR (Nginx + PHP-FPM: sitio y API)
│   ├── Dockerfile.php         #   Imagen principal (php-fpm + nginx + supervisord)
│   ├── Dockerfile             #   Variante opcional solo estática (Nginx)
│   ├── nginx-php.conf         #   Configuración de Nginx (estático + PHP + rewrites)
│   ├── nginx.conf             #   Configuración de Nginx (solo estático)
│   └── supervisord.conf       #   Levanta nginx y php-fpm en el mismo contenedor
│
├── scripts/                   # # HERRAMIENTAS DE DESARROLLO
│   └── dev-server.js          #   Servidor estático local (Node, sin dependencias)
│
└── sitio/                     # # EL SITIO FUNCIONAL (no modificar el código)
    ├── index.html             #   Página única (SPA estática)
    ├── assets/img/            #   Fotografías del catálogo
    ├── css/                   #   Estilos (app, admin, seasons, contact, responsive…)
    ├── data/                  #   Datos y mensajes (temporadas, consultas…)
    └── js/                    #   Lógica (app, admin, chat, contact, assistant…)
```

---

## Notas importantes

- **`sitio/` es la raíz web.** El servidor (Node local o Nginx/Docker) sirve **`sitio/`** como documento raíz, por lo que `index.html` se carga en `/`.
- **No mover los archivos de `sitio/`**: cambiar su ubicación rompería las rutas que ya conectan la SPA (CSS, JS, imágenes y datos). Por eso la organización se hace en **capas alrededor** de `sitio/` (docos, docker, scripts), no reordenando el sitio mismo.
- **Imágenes:** todas las fotografías viven únicamente en `sitio/assets/img/`. La carpeta duplicada `img/` de la raíz fue eliminada (T4.6) tras verificar por hash SHA256 que sus 30 archivos eran copias idénticas; si hiciera falta recuperarla, está en el historial de Git (`git show 71408bc:img/<archivo>`).
- La documentación se centraliza en `docs/` y el despliegue reproducible en `docker/` + `docker-compose.yml`.
