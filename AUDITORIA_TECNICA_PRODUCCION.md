do# Auditoría Técnica y Diagnóstico Integral de Producción
**Proyecto:** El Bodegón de los Trajes (2026)  
**Rol:** Ingeniero de Software Senior / Tech Lead  
**Fecha de Evaluación:** 7 de Octubre de 2026  
**Estado General:** ⚠️ **No Apto para Producción** (Riesgos Críticos de Seguridad, Lógica y Arquitectura)

---

## 1. Resumen Ejecutivo y Diagnóstico Global

Al asumir el rol de desarrollador Senior para llevar este proyecto a un estándar limpio, robusto y preparado para producción, se ha realizado una inspección exhaustiva de cada módulo del sistema: código frontend (HTML, CSS, JS), backend en PHP, configuración de Docker, Nginx, scripts de soporte, persistencia de datos y documentación.

### Diagnóstico General
Existe una **marcada contradicción entre la documentación técnica del repositorio y la realidad del código fuente**:
- Mientras la documentación (`README.md`, `docs/ARCHITECTURE.md`, `docs/SOLID.md`) promueve una "Arquitectura Limpia", principios SOLID y afirma que *"el panel no almacena ni expone contraseñas en el sitio público"*, el código fuente real presenta **credenciales administrativas quemadas en texto plano en el cliente**, un archivo `admin.js` monolítico de **4.805 líneas (195 KB)**, un endpoint PHP de guardado **totalmente desprotegido**, y la utilización de la **API de GitHub como si fuera una base de datos transaccional en tiempo real**.
- Adicionalmente, se encontró un **error de sintaxis fatal en PHP** que rompe de inmediato las llamadas a cURL, así como violaciones a normativas de protección de datos personales al comitear información de clientes en el historial de Git.

A continuación se desglosan todos los hallazgos categorizados por severidad, impacto y la solución técnica requerida.

---

## 2. Fallas Críticas (Nivel P0 — Bloqueantes de Producción)

Aquellas vulnerabilidades o bugs que provocan caídas del sistema, comprometen la seguridad del servidor y los datos de clientes, o permiten accesos no autorizados.

---

### [CRÍTICA-01] Error Fatal de Sintaxis PHP en `sitio/api/_config.php`
- **Ubicación:** [`sitio/api/_config.php:145`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/_config.php#L145)
- **Descripción:**
  En la función `gh_http()`, la llamada a cerrar el recurso cURL contiene una errata crítica:
  ```php
  // CÓDIGO ACTUAL:
  $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  ' curl_close  '($ch); // <--- ERROR FATAL
  if (!is_string($out)) {
  ```
- **Impacto:** En PHP, intentar ejecutar una cadena de texto `' curl_close '($ch)` como función variable desencadena de inmediato un error fatal:  
  `Fatal error: Uncaught Error: Call to undefined function ' curl_close '()`.  
  Esto hace que **cualquier petición hacia la API de GitHub falle con error 500**, rompiendo el guardado de contenidos, el formulario de contacto y el asistente.
- **Acción requerida:** Corregir a la llamada nativa estándar `curl_close($ch);`.

---

### [CRÍTICA-02] Credenciales Administrativas Expuestas en Texto Plano en el Frontend
- **Ubicación:** [`sitio/js/admin.js:9-10`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/admin.js#L9-L10) y [`sitio/js/admin.js:3078-3080`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/admin.js#L3078-L3080)
- **Descripción:**
  En el archivo cliente público `admin.js`, están declaradas las constantes de acceso:
  ```javascript
  var DEFAULT_PASSWORD = 'ANAISABEL2026';
  var DEFAULT_USERNAME = 'Ana Avila';
  ```
  La validación de inicio de sesión se realiza completamente en el navegador del usuario utilizando un algoritmo djb2 débil (`hash()` no criptográfico).
- **Impacto:** Cualquier persona que abra las herramientas de desarrollador (F12) o inspeccione el archivo `.js` puede leer el usuario y la contraseña maestra sin ningún esfuerzo.
- **Acción requerida:**
  1. Eliminar cualquier usuario y contraseña del JavaScript del cliente.
  2. Implementar autenticación real del lado del servidor (PHP) mediante sesiones seguras con cookies `HttpOnly`, `SameSite=Lax`, `Secure` o tokens firmados (JWT/paseto).
  3. Aplicar hash criptográfico en servidor (`password_hash` con bcrypt/Argon2id).

---

### [CRÍTICA-03] Endpoint de Guardado `/api/save-content.php` Totalmente Desprotegido
- **Ubicación:** [`sitio/api/save-content.php:1-67`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/save-content.php#L1-L67)
- **Descripción:**
  El endpoint `save-content.php` recibe peticiones `POST`, lee el cuerpo JSON y comitea directamente el archivo `sitio/data/admin-content.js` en el repositorio de GitHub usando el token del servidor.
  **No tiene ninguna verificación de sesión, token de autorización, cabecera de autenticación ni validación de permisos.**
- **Impacto:** Cualquier usuario en Internet que realice una simple petición `POST` mediante `curl` o Postman a `/api/save-content` puede inyectar código JavaScript malicioso en `admin-content.js`, sobreescribir textos o desfigurar el sitio web (Defacement/XSS persistente).
- **Acción requerida:**
  1. El endpoint debe validar una sesión activa de administrador generada en el servidor.
  2. Implementar protección CSRF mediante tokens únicos por sesión.
  3. Rechazar cualquier petición sin encabezado de autorización o cookie de sesión válida con código HTTP `401 Unauthorized`.

---

### [CRÍTICA-04] Anti-patrón Crítico: Uso de Git / GitHub como Base de Datos Transaccional
- **Ubicación:** [`sitio/api/contact.php:56-69`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/contact.php#L56-L69) y [`sitio/api/chat-ask.php:39-53`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/chat-ask.php#L39-L53)
- **Descripción:**
  Cada vez que un cliente envía un mensaje en el formulario de contacto o realiza una consulta en el chatbot web, el backend descarga `data/mensajes.json` o `data/consultas.json` de GitHub, le agrega un elemento y realiza un `git commit` y `git push` a la rama `main` a través de la API REST de GitHub.
- **Impacto Técnico y Operativo:**
  1. **Condiciones de Carrera (Race Conditions):** Si dos usuarios envían formularios simultáneamente, la lectura del `sha` se vuelve obsoleta y GitHub rechaza la segunda petición con HTTP `409 Conflict`, perdiéndose mensajes de clientes.
  2. **Agotamiento de Cuota (Rate Limiting):** La API de GitHub impone un límite de 5.000 peticiones por hora. Si un bot o campaña de marketing genera tráfico, el token se bloquea, deshabilitando el sitio y el panel.
  3. **Contaminación del Historial Git:** El log de Git contiene cientos de commits basura como *"Nuevo mensaje del formulario de contacto"* o *"Nueva consulta del asistente"*, inflando el tamaño del repositorio innecesariamente.
- **Acción requerida:**
  - Migrar la persistencia transaccional (mensajes, leads, consultas) a un mecanismo de almacenamiento de base de datos apropiado: SQLite local seguro (en un volumen persistente de Docker o ruta privada del servidor fuera del docroot), MySQL/PostgreSQL, o un servicio de cola/correo (SMTP con PHPMailer / Sendgrid).

---

### [CRÍTICA-05] Violación de Ley de Protección de Datos Personales (Habeas Data / Ley 1581 de 2012)
- **Ubicación:** [`data/mensajes.json`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/data/mensajes.json) y [`data/consultas.json`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/data/consultas.json)
- **Descripción:**
  Nombres de personas, números de celular privados de WhatsApp, direcciones de correo y consultas personales quedan grabados de forma permanente e inmutable en el historial de commits de Git. Si el repositorio es público o se comparte con terceros, estos datos personales quedan expuestos de forma irreversible.
- **Impacto:** Riesgo legal por incumplimiento de la Ley 1581 de 2012 en Colombia respecto al tratamiento, custodia y derecho al olvido de datos personales.
- **Acción requerida:** Dejar de registrar datos personales de usuarios dentro de archivos controlados por Git. Enviar los leads por correo seguro (SMTP) y almacenar en base de datos local protegida.

---

### [CRÍTICA-06] Exposición de Secretos y Token de GitHub
- **Ubicación:** Archivo `.env` en la raíz y presencia de tokens `ghp_...` en el historial previo de Git.
- **Descripción:**
  El archivo `.env` contiene un Personal Access Token (PAT) con permisos de escritura al repositorio:  
  `GITHUB_TOKEN=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`.
- **Impacto:** Aunque `.env` esté en `.gitignore`, tokens de GitHub han sido registrados en commits históricos del repositorio. Cualquier persona con acceso de lectura puede clonar el repo, extraer el token y tomar control total del repositorio de GitHub.
- **Acción requerida:**
  1. Revocar de inmediato el token `ghp_Tfn6qZ1...` en los ajustes de GitHub.
  2. Generar un nuevo token restringido si se requiere, o prescindir de tokens en favor de autenticación interna en servidor.
  3. Limpiar el historial con `git filter-repo` o BFG Repo-Cleaner antes de publicar el repositorio.

---

## 3. Fallas Moderadas (Nivel P1 — Lógica, Estabilidad y Resiliencia)

---

### [MODERADA-01] Destrucción Forzada de la Sesión en Cada Carga de Página
- **Ubicación:** [`sitio/js/admin.js:4691-4695`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/admin.js#L4691-L4695)
- **Descripción:**
  Al inicializarse el script `admin.js`, se ejecuta el siguiente bloque:
  ```javascript
  try {
    if (localStorage.getItem(SESSION_KEY)) {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {}
  ```
- **Impacto:** Cada vez que el administrador legítimo recarga la página o navega a otra sección, su sesión se borra automáticamente. Si estaba editando contenido o probando cambios, es expulsado de inmediato y debe volver a iniciar sesión cada vez.
- **Acción requerida:** Respetar la persistencia de la sesión mediante cookies de sesión válidas o token temporal con tiempo de expiración razonable.

---

### [MODERADA-02] Generación Masiva de Registros Vacíos en `mensajes.json` y `consultas.json`
- **Ubicación:** [`sitio/api/contact.php:21-28`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/contact.php#L21-L28) y [`sitio/api/chat-ask.php:21-27`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/api/chat-ask.php#L21-L27)
- **Descripción:**
  El backend recibe peticiones sin validar si los campos contienen información útil. Si un rastreador, bot o llamada de prueba envía un JSON vacío `{}` o campos vacíos, el backend crea un registro lleno de strings `""` y lo comitea a Git.
  Esto es visible en `data/mensajes.json` donde los últimos 6 registros consecutivos tienen:
  ```json
  "nombre": "", "correo": "", "whatsapp": "", "mensaje": ""
  ```
- **Impacto:** Desperdicio de almacenamiento, llamadas inútiles a GitHub API y saturación de la bandeja de mensajes con basura.
- **Acción requerida:** Validar obligatoriamente en backend que `mensaje` y al menos un canal de contacto (`whatsapp` o `correo`) no estén vacíos antes de procesar cualquier guardado. Devolver HTTP `422 Unprocessable Entity` si los datos requeridos faltan.

---

### [MODERADA-03] Corrupción de Caracteres (Mojibake UTF-8 vs ISO-8859-1) en Contenido Persistido
- **Ubicación:** [`sitio/data/admin-content.js:8, 20`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/data/admin-content.js#L8)
- **Descripción:**
  En `admin-content.js`, varios textos fueron guardados con doble codificación:
  - `"FELIZ A├æO ,REYES MAGOS, UNIFORMES"` (debería ser "FELIZ AÑO")
  - `"Operaci├│n Retorno"` (debería ser "Operación Retorno")
- **Impacto:** Errores visuales antiestéticos que transmiten falta de profesionalismo al visitante.
- **Acción requerida:** Corregir los caracteres corruptos en `admin-content.js` y asegurar que todas las cabeceras HTTP y lecturas de archivos mantengan `charset=utf-8` uniforme.

---

### [MODERADA-04] Fragilidad Extrema en Selectores CSS de Edición (`:nth-child`)
- **Ubicación:** [`sitio/data/admin-content.js:7, 11, 19, 111, 114`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/data/admin-content.js#L7)
- **Descripción:**
  La persistencia de textos y estilos en `admin.js` se basa en generar rutas CSS automáticas como:
  - `#temporadas > div:nth-child(2) > button:nth-child(1) > span:nth-child(1)`
  - `html > body:nth-child(2) > footer:nth-child(7)`
- **Impacto:** Si un desarrollador agrega un botón, cambia el orden de un párrafo o añade una etiqueta en el HTML, las rutas `:nth-child` se desfasan de inmediato, aplicando títulos y colores a elementos incorrectos o desapareciendo silenciosamente.
- **Acción requerida:** Migrar la asociación de contenidos editables a identificadores semánticos unívocos (ej. atributos `data-editable="enero-hero-title"` o `data-content-key="..."`).

---

### [MODERADA-05] Estilos Fijos en Píxeles que Rompen el Diseño Responsive
- **Ubicación:** [`sitio/data/admin-content.js:111-112`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/data/admin-content.js#L111-L112)
- **Descripción:**
  En `editorStyles` de `admin-content.js` se encuentran reglas inyectadas directamente en el DOM:
  - `"#temporadas > div:nth-child(2) > h2:nth-child(2)": "width: 1029px; height: 157px;"`
  - `"#catalogo-general": "width: 1532px; background-color: rgb(173, 216, 225);"`
- **Impacto:** Forzar anchos rígidos de `1532px` y `1029px` destruye por completo la responsividad en teléfonos móviles y tablets, causando scroll horizontal y layouts cortados.
- **Acción requerida:** Eliminar los anchos fijos inline y utilizar reglas CSS fluidas (`max-width: 100%`, `width: 100%`).

---

### [MODERADA-06] Vulnerabilidad a XSS en el Asistente (`assistant.js`)
- **Ubicación:** [`sitio/js/assistant.js:164`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/assistant.js#L164) y [`sitio/js/assistant.js:250-255`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/assistant.js#L250-L255)
- **Descripción:**
  La función `addMsg()` asigna directamente el contenido mediante `el.innerHTML = text;`.  
  En el flujo de envío del formulario de contacto del asistente:
  ```javascript
  var conf = addMsg([
    '✅ ¡Listo, ' + nombre + '!',
    'Tu mensaje se envió directamente a ' + EMAIL + '.',
    '• Contacto: ' + contacto,
    '• Mensaje: ' + mensaje
  ].join('\n'), 'bot');
  ```
  Las variables `contacto` y `mensaje` provienen del input del usuario y **no están escapadas ni sanitizadas**.
- **Impacto:** Si un usuario o atacante introduce etiquetas HTML o scripts (ej. `<img src=x onerror=alert(1)>`), se ejecutarán en el contexto del navegador.
- **Acción requerida:** Sanitizar con `escapeHtml()` o utilizar `el.textContent` para los mensajes de texto plano.

---

### [MODERADA-07] Enlace Directo (Hotlinking) a Tiendas y Sitios Web Externos
- **Ubicación:** [`sitio/index.html:1201-1272`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/index.html#L1201-L1272)
- **Descripción:**
  Nueve imágenes del catálogo navideño cargan directamente de servidores de tiendas de comercio electrónico de terceros:
  - `ceremoniasanny.com/cdn/shop/files/Vestido_unicornio_5.jpg...`
  - `www.disfracesjarana.com/cdn/shop/files/disfraz-de-papa_noel-deluxe...`
  - `correos-market.ams3.cdn.digitaloceanspaces.com/...`
  - `mercadisfraces.es/cdn/shop/files/disfraz-angel-bebe...`
  - `www.casangel.com/axos/imagenes/...`
  - `www.disfracessimon.com/cdn/shop/files/...`
- **Impacto:** Si alguno de estos sitios activa protección contra hotlinking, cambia sus rutas CDN o elimina el producto, las imágenes de El Bodegón se romperán (mostrando placeholders o imágenes caídas). Además, expone la procedencia de los clientes a sitios competidores.
- **Acción requerida:** Descargar las imágenes locales al repositorio en formato WebP optimizado dentro de `sitio/assets/img/` y referenciarlas localmente.

---

### [MODERADA-08] Inconsistencia en Servidor de Desarrollo (`scripts/dev-server.js`)
- **Ubicación:** [`scripts/dev-server.js:37`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/scripts/dev-server.js#L37)
- **Descripción:**
  `dev-server.js` intercepta `POST /api/(save-content|chat-ask)` devolviendo `{ ok: true, local: true }`. Sin embargo, no contempla `/api/contact`.
- **Impacto:** Al probar el formulario de contacto principal en entorno local sin Docker, la llamada a `/api/contact` falla con error 404.
- **Acción requerida:** Añadir `contact` a la expresión regular de endpoints simulados en `dev-server.js`.

---

## 4. Puntos de Mejora Arquitectónica y Código Limpio (Nivel P2)

---

### [ARQUITECTURA-01] Deconstrucción del Monolito `admin.js` (4.805 líneas / 195 KB)
- **Problema:** Un solo archivo JavaScript concentra:
  1. Compresión de imágenes en Canvas con reintentos iterativos.
  2. Implementación de modales y diálogos emergentes.
  3. Sistema de autenticación y hashing.
  4. Manipulación visual del DOM (edición inline, drags, tooltips).
  5. Sincronización HTTP y llamadas a endpoints en la nube.
  6. Manejo de cola offline y reintentos en `localStorage`.
  7. Lógica de ajuste de proporciones de fotos y vistas de temporada.
- **Impacto:** Viola el principio de Responsabilidad Única (SRP). El código es prácticamente imposible de mantener o auditar de forma segura sin introducir regresiones no deseadas.
- **Solución Senior:** Modularizar en componentes ES6 o submódulos bien delimitados:
  - `admin/auth.js`: Manejo de autenticación y estado de sesión.
  - `admin/image-compressor.js`: Compresor de Canvas aislado y testeable.
  - `admin/sync-service.js`: Capa de persistencia y cola offline.
  - `admin/ui-editor.js`: Eventos de edición visual en el DOM.

---

### [ARQUITECTURA-02] Manipulación Destructiva del DOM en Tiempo de Ejecución (`app.js`)
- **Problema:** En [`sitio/js/app.js:61-82`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/sitio/js/app.js#L61-L82), al cargar la página en el navegador, el script itera sobre cada `.season-panel`, vacía sus nodos hijos y los envuelve dinámicamente en nuevos contenedores `.halloween-content` y `.halloween-landing`.
- **Impacto:**
  - Provoca Layout Thrashing (recalculación masiva del layout y reflow del navegador).
  - Complica el SEO e indexación inicial ya que la estructura DOM cambia drásticamente en JavaScript.
  - Fragilidad en eventos previamente enlazados a esos nodos.
- **Solución Senior:** El marcado HTML debe venir estructurado correctamente desde el servidor o el archivo HTML estático, evitando reestructuraciones agresivas en tiempo de ejecución.

---

### [ARQUITECTURA-03] Duplicación y Deuda Técnica en la Capa CSS
- **Problema:**
  - `seasons.css` tiene **2.473 líneas (75 KB)**, donde se repite el mismo bloque de reglas selector por selector para cada uno de los 12 meses (`#temporadas[data-season="enero"]`, `#temporadas[data-season="febrero"]`, etc.).
  - `responsive.css` tiene **1.107 líneas (28 KB)**, conteniendo estilos base del menú que ya están presentes o se superponen con `navbar.css`.
  - `season-colors.css` tiene **625 líneas (22 KB)** redefiniendo paletas completas.
- **Impacto:** Más de **120 KB de CSS no minificado**, con múltiples capas de especificidad compitiendo entre sí y dificultades para hacer cambios de diseño transversales.
- **Solución Senior:** Unificar mediante CSS Custom Properties (variables). Una sola regla genérica `#temporadas { background: var(--m-bg); ... }` gobernada por las variables de `season-colors.css`, reduciendo el archivo de 75 KB a menos de 15 KB.

---

## 5. Optimizaciones de Rendimiento, Assets y SEO (Nivel P3)

---

### [OPTIMIZACIÓN-01] Tamaño Excesivo de `index.html` (182 KB) por SVGs Embebidos
- **Problema:** `index.html` pesa 182 KB, un tamaño inusualmente alto para un solo archivo HTML. Esto se debe a que las tarjetas de productos sin foto incrustan directamente en el atributo `src` cadenas Data-URI de SVGs de 600 a 800 bytes repetidas cientos de veces (líneas 690-1200).
- **Solución:** Reemplazar los Data-URIs repetitivos por una referencia a un archivo SVG estático externo reutilizable con caché (ej. `assets/img/ph-generico.svg`). Esto reducirá el tamaño del HTML de 182 KB a menos de 60 KB.

---

### [OPTIMIZACIÓN-02] Imágenes Pesadas y Falta de Aprovechamiento de Formatos WebP
- **Problema:**
  - En la carpeta de imágenes existe un archivo de 2.6 MB: `ChatGPT Image 13 ago 2026, 13_46_16.png`.
  - Existen duplicados `.jpg` y `.webp` en disco, pero `index.html` continúa llamando a las versiones pesadas:
    - Línea 595: `assets/img/horror_bg.png` (867 KB) en lugar de `horror_bg.webp` (84 KB) — **ahorro potencial del 90%**.
    - Línea 637: `assets/img/reyes_magos.jpg` (222 KB) en lugar de `reyes_magos.webp` (81 KB).
    - Línea 652: `assets/img/uniforme_colegio.jpg` (166 KB) en lugar de `uniforme_colegio.webp` (82 KB).
    - Línea 668: `assets/img/bata_laboratorio.jpg` (131 KB) en lugar de `bata_laboratorio.webp` (61 KB).
- **Solución:**
  1. Actualizar todas las etiquetas `<img>` para que apunten a los archivos `.webp`.
  2. Eliminar imágenes pesadas no referenciadas o sin optimizar.

---

### [OPTIMIZACIÓN-03] Carpeta Duplicada `img/` en la Raíz
- **Problema:** En la raíz del proyecto existe una carpeta `img/` con 30 imágenes que es un clon parcial de `sitio/assets/img/`. No es servida por Docker ni dev-server.
- **Solución:** Eliminar la carpeta huérfana de la raíz tras verificar que ninguna imagen exclusiva quede por fuera.

---

### [OPTIMIZACIÓN-04] Caché en Nginx Bloqueando Actualizaciones de Contenido
- **Problema:** En [`docker/nginx-php.conf:47-51`](file:///c:/Users/avima/Downloads/el%20bodeogn%20de%20los%20trajes20262/docker/nginx-php.conf#L47-L51):
  ```nginx
  location ~* \.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$ {
      expires 7d;
      add_header Cache-Control "public";
      try_files $uri =404;
  }
  ```
- **Impacto:** Como `sitio/data/admin-content.js` termina en `.js`, Nginx le asigna una expiración de 7 días con caché público. Cuando el administrador edita un texto o foto, los visitantes habituales no ven los cambios hasta que pasan 7 días o limpian la caché del navegador manualmente.
- **Solución:** Excluir `admin-content.js` del caché largo o utilizar directivas de revalidación (`Cache-Control: no-cache, must-revalidate` para archivos de datos dinámicos).

---

## 6. Estrategia y Rediseño de las Capacidades del Administrador (Gestión de Contenido)

Una de las mayores virtudes de negocio de este proyecto es que **el administrador tiene la autonomía de configurar y actualizar la página sin depender de un programador**. 

El objetivo de esta fase de ingeniería **NO es quitarle al administrador estas funciones**, sino **transformar el mecanismo técnico que hay por debajo** para que sea seguro, robusto, fácil de usar y no rompa el diseño responsive.

### 6.1. ¿Qué puede hacer el administrador actualmente?
El sistema actual en `admin.js` le permite:
1. **Editar textos en caliente:** Títulos principales, párrafos, notas de temporada, botones y pies de página.
2. **Gestionar imágenes:** Cambiar fotos de trajes, portadas de cada una de las 12 temporadas y la portada del Hero.
3. **Agregar contenido dinámico:** Crear nuevas tarjetas de trajes (`addCards`), agregar bloques de texto (`addTexts`), títulos (`addTitles`) y secciones enteras (`addSections`).
4. **Eliminar contenido:** Quitar trajes obsoletos o secciones fuera de catálogo (`deleteCards`, `deleteSections`).
5. **Ajustar encuadre y tamaños:** Controles deslizantes para ancho, alto, posición X y posición Y de fotos.
6. **Configuración visual:** Ajustes de colores de temporada y estilos visuales.

### 6.2. ¿Por qué el mecanismo actual es peligroso e inestable?
| Mecanismo Actual (Frágil) | Riesgo en Producción |
|---|---|
| **Persistencia por selectores `:nth-child`:** Guarda rutas fijas del DOM como `#temporadas > div:nth-child(2) > span:nth-child(1)`. | Si se agrega un nuevo botón o se maqueta un elemento nuevo en el HTML, el texto guardado cae en el lugar equivocado o desaparece. |
| **Inyección de estilos CSS inline arbitrarios:** Guarda cadenas como `width: 1532px; background-color: ...`. | Destruye la adaptabilidad responsive en pantallas de celulares y tablets. |
| **Carga de imágenes en Base64 o URLs sin procesar:** Se guardan cadenas gigantes en el archivo JSON. | Degrada drásticamente la velocidad de carga de la web y el rendimiento de memoria. |
| **Persistencia vía Git commits sin autenticación:** Cualquier guardado dispara un commit en GitHub sin verificar sesión. | Cuello de botella, colisiones entre ediciones y riesgo de defacement total. |

---

### 6.3. Solución Propuesta: Modernización del CMS Visual (Arquitectura Senior)

Mantendremos la **experiencia visual in situ** (el administrador hace clic en el botón de edición o sobre el traje y lo modifica directamente), pero reemplazaremos el motor de datos por una arquitectura profesional:

```
[Administrador en Navegador]
       │
       ▼ (Autenticado con Sesión Segura en PHP)
[Editor Visual Amigable] 
       │ 
       ├─► 1. Textos: Edita campos semánticos (data-editable="temporada.enero.titulo")
       ├─► 2. Catálogo: Agrega/edita trajes con campos claros (Nombre, Descripción, Foto, Mes)
       ├─► 3. Fotos: Sube imagen ──► [/api/upload-media.php] ──► Optimiza a WebP y guarda en /uploads/
       │
       ▼ (POST /api/admin/save con Token CSRF)
[Backend PHP + Almacenamiento Estructurado]
       │
       ├─► Guarda en `data/content.json` (o SQLite) fuera del control de Git
       └─► Invalida caché de Nginx para que los clientes vean los cambios al instante
```

#### Pilares de la Nueva Gestión de Contenido:
1. **Identificadores Semánticos en vez de Selectores DOM:**
   Cada elemento editable tendrá una clave fija (por ejemplo, `data-field="enero.hero_subtitle"` o `data-card-id="card-reyes-01"`). Modificar el HTML nunca romperá los textos del cliente.
2. **Entidad "Traje / Producto" Estructurada:**
   Al presionar *"Agregar Traje"*, el administrador llenará un formulario modal limpio:
   - Nombre del traje
   - Temporada / Categoría (Enero, Octubre, Uniformes, etc.)
   - Descripción
   - Fotografía
   - Estado: Visible / Oculto
   Esto crea un registro en un array de productos, garantizando que el diseño visual y la grilla se mantengan impecables.
3. **Procesador y Subida de Imágenes Optimizado (`/api/upload-media`):**
   Al subir una foto desde el celular o computador:
   - El cliente hace una primera compresión ligera.
   - El servidor PHP la convierte a formato `.webp` de alta fidelidad y la guarda en `sitio/assets/img/uploads/`.
   - Se guarda únicamente la ruta relativa limpia (ej. `assets/img/uploads/traje_12.webp`), sin ensuciar la base de datos con cadenas Base64 gigantes.
4. **Límites de Seguridad Visual (Guardrails):**
   Los controles de tamaño y encuadre se restringirán mediante porcentajes o valores relativos (`clamp()`, `max-width: 100%`), impidiendo que un ajuste accidental ensanche la página a 1500px y rompa la vista móvil.
5. **Autenticación y Sesión Real:**
   El botón de edición solo funcionará cuando se inicie sesión contra el backend de PHP. Los cambios se guardan directamente en el servidor sin depender de la API de GitHub ni generar commits transaccionales.

---

## 7. Matriz de Hallazgos y Prioridades

| ID | Área | Categoría | Descripción Breve | Severidad | Esfuerzo Estimado |
|---|---|---|---|---|---|
| **C1** | Backend / PHP | Bug / Runtime | Errata `' curl_close '($ch)` rompe cURL en PHP | **Crítica** | Muy Bajo (5 min) |
| **C2** | Seguridad | Vulnerabilidad | Contraseña admin quemada en texto plano en JS cliente | **Crítica** | Medio (Auth PHP) |
| **C3** | Seguridad | Vulnerabilidad | Endpoint `/api/save-content` sin autenticación | **Crítica** | Medio (Sesión/Token) |
| **C4** | Arquitectura | Anti-patrón | Usar Git commits como base de datos en tiempo real | **Crítica** | Alto (Migrar persistencia) |
| **C5** | Legal / Privacidad | Cumplimiento | PII de clientes (Habeas Data) grabada en Git | **Crítica** | Medio (Limpieza y diseño) |
| **C6** | Seguridad | Credenciales | Token de GitHub en `.env` y en commits previos | **Crítica** | Bajo (Revocación) |
| **M1** | Frontend / Admin | Lógica / UX | Borrado forzado de sesión en cada recarga | **Moderada** | Bajo |
| **M2** | Backend / Datos | Calidad Datos | Inyección de registros vacíos sin validación | **Moderada** | Bajo (Validación) |
| **M3** | Frontend / Contenido | Visual / Codificación | Textos con Mojibake UTF-8 (`A├æO`) | **Moderada** | Bajo (Limpieza datos) |
| **M4** | Frontend / Datos | Resiliencia | Selectores CSS frágiles con `:nth-child` | **Moderada** | Medio |
| **M5** | Frontend / CSS | Responsive | Anchos fijos en px (`1532px`) en `editorStyles` | **Moderada** | Bajo |
| **M6** | Seguridad | Vulnerabilidad | Inyección XSS en `assistant.js` con `innerHTML` | **Moderada** | Bajo (Sanitización) |
| **M7** | Frontend / Rendimiento | Estabilidad | Hotlinking a tiendas externas en catálogo | **Moderada** | Medio (Descargar assets) |
| **M8** | Scripts / Dev | Entorno | Falta endpoint `contact` en `dev-server.js` | **Moderada** | Muy Bajo |
| **A1** | Arquitectura JS | Mantenibilidad | Monolito de 4.805 líneas en `admin.js` | Mejora | Alto (Modularización) |
| **A2** | Arquitectura JS | Rendimiento DOM | Mutación destructiva del DOM en `app.js` | Mejora | Medio |
| **A3** | CSS | Mantenibilidad | 75 KB repetidos por mes en `seasons.css` | Mejora | Medio (Variables CSS) |
| **A4** | Documentación | Consistencia | Discrepancia entre docs y código real | Mejora | Bajo |
| **O1** | HTML | Rendimiento | 182 KB de HTML inflado por SVGs en línea | Optimización | Bajo |
| **O2** | Assets | Rendimiento | PNGs pesados (2.6 MB) sin usar WebP existente | Optimización | Bajo |
| **O3** | Organización | Limpieza | Directorio huérfano `img/` duplicado en raíz | Optimización | Muy Bajo |
| **O4** | Nginx / Docker | Caché | `admin-content.js` cacheado por 7 días | Optimización | Bajo |

---

## 8. Plan de Acción y Hoja de Ruta Senior para Producción

Para sanear este proyecto de forma ordenada y sin romper funcionalidades, se propone el siguiente plan por etapas:

```mermaid
graph TD
    A[Fase 1: Corrección Inmediata y Seguridad Crítica] --> B[Fase 2: Arquitectura de Persistencia y Backend]
    B --> C[Fase 3: Modernización del CMS y Edición de Contenidos]
    C --> D[Fase 4: Optimización Frontend, Assets y Producción]

    subgraph Fase 1
    A1[Fix error sintaxis curl_close]
    A2[Revocar token GitHub expuesto]
    A3[Sanitizar XSS en assistant.js]
    A4[Añadir validaciones obligatorias en backend]
    end

    subgraph Fase 2
    B1[Crear autenticación real de servidor en PHP]
    B2[Proteger endpoint de guardado con sesión y CSRF]
    B3[Desacoplar Git de mensajes y consultas]
    B4[Implementar almacenamiento seguro local SQLite/JSON privado o correo SMTP]
    end

    subgraph Fase 3
    C1[Migrar selectores nth-child a claves semánticas data-field]
    C2[Crear endpoint /api/upload-media para subida de fotos WebP]
    C3[Limpiar anchos fijos y mojibake en el contenido]
    C4[Modularizar admin.js manteniendo la UI visual para el admin]
    end

    subgraph Fase 4
    D1[Reemplazar hotlinks externos por WebP locales]
    D2[Reemplazar imágenes pesadas de index.html por WebP]
    D3[Reducir tamaño de index.html extrayendo SVGs]
    D4[Ajustar reglas de caché en Nginx y validar Docker en :8095]
    end
```

### Próximos Pasos Sugeridos
1. **Validación de la Estrategia de Edición:** Confirmar que la preservación del editor visual con identificadores semánticos y subida de archivos WebP se ajusta a las expectativas operativas del cliente.
2. **Ejecución de la Fase 1:** Resolver los bloqueantes de sintaxis, saneamiento de entradas y seguridad inmediata.
3. **Implementación de las Fases 2 y 3:** Desarrollar el backend seguro y el guardado estructurado del catálogo.

