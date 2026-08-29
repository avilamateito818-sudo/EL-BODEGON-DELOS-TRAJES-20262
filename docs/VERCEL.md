# Despliegue en Vercel — El Bodegón de los Trajes

Este proyecto está preparado para **Vercel**: sitio web estático (raíz `sitio/`) **+** funciones serverless en `api/` que alimentan los asistentes y la sincronización del panel de administración.

---

## Qué incluye

- `vercel.json` — configuración de despliegue:
  - `outputDirectory: "sitio"` → la web se sirve desde `sitio/` (`index.html` en `/`).
  - Funciones serverless en `api/**`.
- `api/save-content.js` — guarda el contenido editado del admin de vuelta en **GitHub** (repo de este proyecto), archivo `sitio/data/admin-content.js`.
- `api/chat-ask.js` — recibe las consultas del bot del cliente y las guarda en `data/consultas.json` (mismo repo), devolviendo OK.

---

## Pasos para publicar

### 1. Importar el proyecto

1. Ve a **https://vercel.com** e inicia sesión con la cuenta que quería (recomendado: `avilamateito818-sudo`).
2. **Add New → Project → Import Git Repository**.
3. Selecciona **`EL-BODEGON-DELOS-TRAJES-20262`** y haz clic en **Import**.

### 2. Configurar variables de entorno

En **Settings → Environment Variables** (o en la pantalla de importación, sección "Environment Variables") crea:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GITHUB_TOKEN` | Un token PAT de la cuenta dueña con scope **`repo`** | Autoriza escribir de vuelta el contenido en GitHub |

> ⚠️ **Importante:** el token se guarda como secreto en Vercel; **no** se expone al navegador. Sin `GITHUB_TOKEN`, el sitio funciona, pero el guardado en nube del admin y el registro de consultas **no** se persistirán (degradan con gracia).

Opcionales:
| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `GITHUB_REPO` | `avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262` | Repo donde se guarda el contenido. |
| `GITHUB_BRANCH` | `main` | Rama de escritura. |

### 3. Desplegar

Clic en **Deploy**. Vercel publica la web **y** las funciones `/api/*` automáticamente en cada push a `main`.

La URL quedaría similar a `https://el-bodegon-delos-trajes-20265-s5qo.vercel.app`.

---

## Verificar que funciona

- **Sitio:** abre la URL raíz → debe cargar la página (sin error).
- **Bot del cliente:** abre el chat y completa una consulta → debe responder "Tu consulta fue enviada". La consulta queda en `data/consultas.json` en GitHub.
- **Admin → Sincronizar:** entra al panel, edita algo → el indicador ☁ debe mostrar "Sincronizado con GitHub". El contenido se guarda en `sitio/data/admin-content.js` en el repo.

---

## Notas

- El **formulario de contacto** usa **Formspree** (`sitio/email/config.js`), independiente de Vercel.
- Las funciones son sin estado (serverless); la persistencia se hace a través de **GitHub**, no en disco.
- Para hacer pruebas locales de las funciones: `vercel dev` (instala `npm i -g vercel` y ejecuta `vercel dev` en la raíz). El sitio se sirve en localhost y `/api/*` funciona.

---

## Notificaciones de alerta al administrador (por correo)

El panel envía **alertas por correo** al admin (a `avilamateito818@gmail.com`) cuando algo requiere su atención. Usan el mismo **Formspree** del formulario de contacto (`formspreeId` en `sitio/email/config.js`), así que **llegan al mismo correo configurado en Formspree**.

### Qué eventos generan una alerta

| Evento | Correo que llega |
|--------|------------------|
| **Espacio de almacenamiento lleno** en un dispositivo (fallo de guardado) | ⚠️ Almacenamiento lleno del panel |
| **Sin conexión** con cambios guardados sin subir a GitHub | ⚠️ Sin conexión: hay cambios sin subir |
| **Token de GitHub no configurado** (sincronización desactivada) | ⚠️ Token de GitHub no configurado |
| **Restauración de un respaldo** (acción del admin) | ✅ Respaldo restaurado |

### Cómo funciona

- El envío se hace desde el navegador (el admin) vía `POST` a Formspree, igual que el formulario de contacto. No se necesita ningún servidor adicional.
- Las notificaciones tienen **límite de frecuencia** para no saturar el correo: mínimo 5 a 15 minutos entre avisos del mismo tipo (según el evento). Se almacena el último envío en el navegador (`bodegon_notif_log`).
- Si no hay conexión en ese momento, la alerta no se envía por correo (se sigue mostrando el aviso en pantalla) y el siguiente evento del mismo tipo lo reintentará tras el intervalo.

### Configuración

1. Asegúrate de que el formulario de Formspree (`formspreeId` en `sitio/email/config.js`) está configurado para **enviar a `avilamateito818@gmail.com`**.
2. No hay variables de entorno extra: reutiliza el Formspree existente.
3. Si el navegador del admin no tiene `EMAIL_CONFIG` cargado (config.js ausente), las alertas por correo simplemente no se envían sin romper nada.

