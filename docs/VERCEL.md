# Despliegue en Vercel — El Bodegón de los Trajes

Este proyecto está preparado para **Vercel**: sitio web estático (raíz `sitio/`) **+** funciones serverless en `api/` que hacen la persistencia de datos y la sincronización del panel de administración con GitHub.

---

## Qué incluye

- `vercel.json` — configuración de despliegue:
  - `outputDirectory: "sitio"` → la web se sirve desde `sitio/` (`index.html` en `/`).
  - Funciones serverless en `api/**`.
- `api/save-content.js` — guarda el contenido editado del admin de vuelta en **GitHub** (repo de este proyecto), archivo `sitio/data/admin-content.js`.
- `api/chat-ask.js` y `api/contact.js` — endpoints de persistencia de datos de consultas (`data/consultas.json`) y mensajes (`data/mensajes.json`); se mantienen disponibles aunque el sitio actual no los usa (contacto por WhatsApp).

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

> ⚠️ **Importante:** el token se guarda como secreto en Vercel; **no** se expone al navegador. Sin `GITHUB_TOKEN`, el sitio funciona, pero el guardado en nube del contenido del admin **no** se persistirá (degradan con gracia).

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
- **Contacto por WhatsApp:** el botón flotante y la sección de contacto abren `wa.me/573107706615` → el negocio recibe el mensaje directamente en su WhatsApp.
- **Admin → Sincronizar:** entra al panel, edita algo → el indicador ☁ debe mostrar "Sincronizado con GitHub". El contenido se guarda en `sitio/data/admin-content.js` en el repo.

---

## Notas

- El sitio **no envía correos ni usa formularios externos** y no incluye formularios ni asistentes: el contacto con los clientes es por **WhatsApp** (enlace directo) y la persistencia del contenido usa las funciones serverless de Vercel + GitHub.
- Las funciones son sin estado (serverless); la persistencia se hace a través de **GitHub**, no en disco.
- Para hacer pruebas locales de las funciones: `vercel dev` (instala `npm i -g vercel` y ejecuta `vercel dev` en la raíz). El sitio se sirve en localhost y `/api/*` funciona.

---

## Avisos al administrador (locales, sin correo)

El panel **no envía alertas por correo**: los eventos que requieren atención del admin se muestran como **avisos locales en el panel** (toast del editor), por ejemplo: espacio de almacenamiento lleno, sin conexión con cambios sin subir, token de GitHub no configurado y restauración de un respaldo. Los cambios siempre se persisten localmente y se sincronizan con GitHub automáticamente al reconectar. El botón "Probar alerta" solo muestra un aviso de prueba local.

