# Panel de administración y asistentes — El Bodegón de los Trajes

Documentación de la zona de administración del sitio, sus credenciales de referencia y los dos asistentes (bot del cliente y asistente del admin).

> ⚠️ **Seguridad:** la información de credenciales de este documento es de referencia local para el desarrollo y **no** debe subirse a repositorios públicos. No administrar aquí claves reales.

---

## Sesión de administrador

- **Clave de sesión (localStorage):** `bodegon_admin_session`
- **Rol/Usuario de referencia (desarrollo):** `Ana Avila`
- **Contraseña de referencia (desarrollo):** `ANAISABEL2026`
- **Claves de almacenamiento de contenido:**
  - `bodegon_admin_grid` — contenido de la cuadrícula/catálogo editable.
  - `bodegon_admin_guides` — guías/configuración del editor.

> En producción se recomienda que la sesión y el contenido se gestionen mediante el servicio serverless (Vercel) y GitHub, y no dejar credenciales en el código de cliente.

---

## Sincronización de contenido (propietario)

El panel **auto-sincroniza** el contenido editado hacia la nube:

1. `autoSave()` — guarda los cambios del editor.
2. `scheduleCloudSync()` — programa la sincronización (con debounce) y, si no hay red, encola en `bodegon_pending_sync` (cola offline de localStorage).
3. `syncToCloud()` — envía a la nube:
   - Endpoint local: `CLOUD_SYNC_API = '/api/save-content'`
   - Respaldo: `https://el-bodegon-los-trajes-3-2026.vercel.app/api/save-content`
   - Repositorio: `avimateo2-ui/EL-BODEGON-LOS-TRAJES-3-2026`
4. `fetchFromGitHub()` — al iniciar el admin, intenta cargar el contenido último desde GitHub.

---

## Bot de ayuda al cliente (`js/chat.js` + `css/chat.css`)

- Botón flotante dorado, 9 categorías públicas de consulta.
- Pide **nombre + WhatsApp** antes de enviar.
- Envía a `POST /api/chat-ask` (endpoint backend):
  - Si el backend no está desplegado → respuesta neutra de error (no expone datos de admin).
  - Sin backend (404) se maneja con gracia.
- **Sin acceso a datos del panel** (verificado por auditoría; no filtra credenciales).
- Para activar el envío real, hay que desplegar el endpoint `/api/chat-ask` (Vercel).

---

## Asistente del administrador (`js/admin-ai.js` + `css/admin-ai.css`)

- Botón flotante **púrpura**, visible **solo** cuando el modo edición del admin está activo (`body.admin-edit-mode`).
- Interpreta órdenes por **acción** (foto / título / texto / hito) y **sección** (hero / cabecera / contacto / 12 meses).
- Dispara la **herramienta de edición nativa** del admin:
  - Selectores: `.season-title`, `.season-subtitle`, `.season-milestone`, imagen del hero.
- Abre el modal nativo "Editar texto" / reemplazo de foto.
- Comportamiento verificado por auditoría:
  - Oculto sin sesión; visible con sesión.
  - Abre el modal correcto; **cero fugas de credenciales**; 0 errores de consola.
- `node --check` superado.

---

## Buenas prácticas de seguridad

- No almacenar contraseñas/claves de API en el código de cliente.
- Tratar `bodegon_admin_session` y las claves de contenido como sensibles.
- No incluir estas credenciales en commits; usar `process.env`/secretos serverless en producción.
- Revisar periódicamente que los asistentes no expongan tokens o datos del panel.
