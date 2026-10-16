# Plan Maestro de Mejora Integral: El Bodegón de los Trajes

**Versión:** 2.0 (Producción 2026)  
**Coordinación:** Consejo de Agentes de Gobernanza (`.agents/governance/roles/`)

---

## 1. Acciones Inmediatas Ejecutadas

| Problema Reportado | Causa Técnica | Solución Implementada | Estado |
| :--- | :--- | :--- | :--- |
| **Eliminar Vercel por completo** | Archivos residuales en `.vercel/` y tracking local | Eliminación recursiva forzada de la carpeta `.vercel` y confirmación en `.gitignore`. Proyecto 100% independiente en Docker/PHP/Apache. | ✅ **Completado** |
| **Página no carga o queda en negro en iPhone** | Dependencia estricta de `IntersectionObserver` con clase `.reveal` que mantenía `opacity: 0` y `transform: translateY(26px)` si el scroll inicial no disparaba. | Se añadió un temporizador de salvaguarda (1.5s) que garantiza la visibilidad total y un fallback nativo sin bloquear la pantalla. | ✅ **Completado** |
| **Contenido recortado en celulares / tablets / iPhone** | Uso de `max-width: 100vw` que en Safari/iOS genera desbordamiento horizontal debido a la barra de scroll y el viewport dinámico (`dvh`/`svh`). | Se migró `max-width: 100vw` a `max-width: 100%` en `html`, `body` y contenedores de secciones en `base.css` y `responsive.css`. | ✅ **Completado** |
| **El administrador no podía borrar prendas** | En el panel `/admin/`, dentro del modal de edición no existía el botón explícito de eliminación rápida. | Se incorporó el botón **"🗑️ Eliminar Prenda"** (`#btn-modal-delete-traje`) en el pie del modal de `/admin/`, conectado directamente con el endpoint seguro `DELETE /api/catalogo?id=...`. | ✅ **Completado** |

---

## 2. Plan de Mejora Integral con el Equipo de Agentes

Cada agente del sistema asume un rol de optimización continua:

### 🎭 1. Arquitecto Frontend & Diseñador UI/UX (`03_arquitecto_frontend.md` & `05_disenador_ui_ux_responsive.md`)
- **Adaptabilidad iPhone (iOS Safari):** Implementación de `safe-area-inset` en cabecera y pie de página para iPhones con Notch e Isla Dinámica.
- **Rendimiento Visual:** Carga progresiva y nativa de imágenes WebP para evitar bloqueos del hilo principal en dispositivos móviles.
- **Previsualización de Catálogo:** Ajuste dinámico de aspecto de tarjetas según formato carta (3:4), cuadrado (1:1) o panorámico (16:9).

### 🛠️ 2. Arquitecto Backend & Auditor de Seguridad (`03_arquitecto_software_backend.md` & `06_auditor_qa_seguridad.md`)
- **Gestión CRUD del Catálogo:** Asegurar que las eliminaciones generen copias de respaldo automáticas en `sitio/data/` antes de aplicar cambios en `catalogo.json`.
- **Persistencia Atómica:** Escritura segura con locks (`LOCK_EX`) en PHP para evitar colisiones cuando múltiples administradores editen al mismo tiempo.
- **Seguridad de Sesión:** Validación reforzada de tokens CSRF y cabeceras `X-Session-ID` en todas las rutas mutantes (`POST`, `PUT`, `DELETE`).

### 🚀 3. Ingeniero DevOps & Infraestructura (`04_ingeniero_devops_infraestructura.md`)
- **Despliegue Limpio:** Ejecución en contenedor Docker bajo PHP 8.2 y Apache, sin dependencias externas de plataformas cerradas tipo Vercel.
- **Caché Inteligente:** Parámetros de versión (`?v=20261016_v1`) en hojas de estilo y scripts para que las actualizaciones se reflejen de inmediato en los teléfonos de los clientes sin exigir borrado manual de historial.

---

## 3. Instrucciones para el Administrador

1. **Borrado desde el Panel Principal (`/admin/`):**
   - Inicia sesión en `/admin/`.
   - Puedes hacer clic en el botón rojo **"🗑️ Eliminar"** directamente sobre la tarjeta de la prenda, o pulsar **"✏️ Editar"** y usar el botón **"🗑️ Eliminar Prenda"** en la parte inferior izquierda de la ventana modal.
2. **Borrado en Vivo desde la Portada:**
   - Si tienes sesión iniciada en la página principal, haz clic en el ícono de lápiz flotante de la prenda deseada y selecciona **"🗑️ Eliminar Prenda"**.
