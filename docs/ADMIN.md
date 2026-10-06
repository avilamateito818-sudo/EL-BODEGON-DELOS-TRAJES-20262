# Panel de administración — El Bodegón de los Trajes

Documentación de la zona de administración del sitio y sus credenciales de referencia. El sitio no incluye asistentes ni formularios: el contacto con los clientes es por **WhatsApp** y la persistencia usa **DreamHost (endpoints PHP) + GitHub**.

> ⚠️ **Seguridad:** la información de credenciales de este documento es de referencia local para el desarrollo y **no** debe subirse a repositorios públicos. No administrar aquí claves reales.

---

## Sesión de administrador

- **Clave de sesión (localStorage):** `bodegon_admin_session`
- **Rol/Usuario de referencia (desarrollo):** `Ana Avila`
- **Contraseña de referencia (desarrollo):** `ANAISABEL2026`
- **Claves de almacenamiento de contenido:**
  - `bodegon_admin_grid` — contenido de la cuadrícula/catálogo editable.
  - `bodegon_admin_guides` — guías/configuración del editor.

> En producción se recomienda que la sesión y el contenido se gestionen mediante el endpoint PHP del servidor (`api/save-content.php`) y GitHub, y no dejar credenciales en el código de cliente.

---

## Sincronización de contenido (propietario)

El panel **auto-sincroniza** el contenido editado hacia la nube:

1. `autoSave()` — guarda los cambios del editor.
2. `scheduleCloudSync()` — programa la sincronización (con debounce) y, si no hay red, encola en `bodegon_pending_sync` (cola offline de localStorage).
3. `syncToCloud()` — envía a la nube:
   - Endpoint: `CLOUD_SYNC_API = '/api/save-content'` (el `.htaccess` lo reescribe a `api/save-content.php`)
   - Repositorio: `avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262`
4. `fetchFromGitHub()` — al iniciar el admin, intenta cargar el contenido último desde GitHub.

---

## Buenas prácticas de seguridad

- No almacenar contraseñas/claves de API en el código de cliente.
- Tratar `bodegon_admin_session` y las claves de contenido como sensibles.
- No incluir estas credenciales en commits; usar el archivo de configuración del servidor (`~/bodegon-config.php`, fuera del docroot) o `config.local.php` (gitignored) en desarrollo.
