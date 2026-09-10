# Principios SOLID — El Bodegón de los Trajes

Este documento explica cómo se aplican (y cómo se **deberían** aplicar) los principios **SOLID** al código del sitio. El sitio está funcional; esta guía documenta el estado actual y el objetivo de evolución.

> **Contexto:** el proyecto es un frontend sin framework (JS clásico). Los principios SOLID se interpretan aquí en su esencia: **responsabilidad única, abrir/cerrar, sustitución de Liskov, segregación de interfaces e inversión de dependencias**, aplicables a módulos y funciones JavaScript.

---

## S — Single Responsibility Principle (Responsabilidad Única)

> **Una clase/módulo/función debe tener una sola razón para cambiar.**

**Estado actual (cumple parcialmente):** los archivos JS se organizan por área (`app.js` para la presentación, `admin.js` para el panel), lo cual es un buen primer nivel. Sin embargo, `js/app.js` y `js/admin.js` concentran **muchas** responsabilidades (navegación, pestañas, lightbox, guardado en nube, sesión, editor visual…).

**Objetivo:** dividir en módulos con una sola responsabilidad:

| Módulo propuesto | Responsabilidad |
|------------------|-----------------|
| `core/temporadas.js` | Datos y reglas de las 12 temporadas |
| `core/catalogo.js` | Categorías y prendas del negocio |
| `core/disponibilidad.js` | Consulta de disponibilidad y contacto (cliente) |
| `core/sesion.js` | Gestión de sesión del administrador |
| `services/sync.js` | Sincronización con Vercel/GitHub |
| `services/storage.js` | Persistencia local (localStorage / admin-content) |
| `ui/marquee.js` | Cinta de temporadas |
| `ui/lightbox.js` | Visualizador de fotos |
| `ui/editor.js` | Editor visual del administrador |

---

## O — Open/Closed Principle (Abierto/Cerrado)

> **Abierto a extensión, cerrado a modificación.** Debe ser posible añadir nuevas funciones sin modificar el código existente que ya funciona.

**Estado actual:** el proyecto ya demostró la **O** en la práctica: el **panel de administración** y la **sincronización con GitHub** se añadieron como módulos nuevos (`js/admin.js` + `api/save-content.js`) **sin modificar** la presentación existente (`app.js`), conectándolos con su propio `<script>` en vez de reescribir la lógica que ya funcionaba.

**Objetivo:** exponer "puertos" (funciones/contratos) estables (p. ej. `renderTemporada(month)`, `guardarContenido(data)`), de modo que nuevas funciones se conecten a través de ellos sin tocar las implementaciones existentes.

---

## L — Liskov Substitution Principle (Sustitución de Liskov)

> **Los subtipos deben poder sustituir a su tipo base sin alterar el comportamiento.**

**Estudio actual:** en el proyecto, las 12 temporadas se comportan de forma **uniforme** (cada una tiene nombre, etiqueta, subtítulo), incluso el mes de octubre que es "exclusivo" se trata como una temporada más. Esto permite que `app.js` procese las 12 de la misma manera sin casos especiales: buena señal de cumplimiento de LSP.

**Objetivo:** si se crean subtipos (p. ej. `TemporadaExclusiva extends Temporada`), deben poder usarse donde se espera una `Temporada` sin romper `renderTemporada()` ni la marquee.

---

## I — Interface Segregation Principle (Segregación de Interfaces)

> **Es mejor tener muchas interfaces específicas que una interfaz genérica.**

**Estado actual/objetivo:** cada módulo que se exponga debería ofrecer **pocas funciones concretas** en vez de un objeto enorme con todo:

```js
// ❌ Interfaz "todopoderosa" (antipatrón a evitar)
const admin = { login, logout, editarTexto, editarFoto, subirFoto, guardar, sincronizar, exportar, cambiarPassword, ... };

// ✅ Interfaces específicas (objetivo)
const sesionAdmin = { iniciar(usr, pass), cerrar(), estaActiva() };
const editorContenido = { editarTexto(el), reemplazarFoto(img) };
const sincronizador = { guardarLocal(data), sincronizarNube(data) };
```

El **panel de administración** (`admin.js`) ya sigue esto: expone una API mínima (p. ej. `toolApi`, `PX_PROPS`) para disparar la herramienta de edición sin depender del objeto admin completo, y el resto de la app consume solo esas pocas funciones concretas.

---

## D — Dependency Inversion Principle (Inversión de Dependencias)

> **Depender de abstracciones, no de concreciones. Las clases de alto nivel no deben depender de las de bajo nivel.**

**Estado actual (cumple en el diseño del panel):**
- El **panel** (`admin.js`) no conoce los detalles internos del backend: depende de una abstracción de red (**`fetch` a `/api/save-content`**). El endpoint concreto (Vercel → GitHub) es **inyectado** por el despliegue, no construido por el panel. Esto respeta la **D**.
- Al fallar la red, el panel **degrada con gracia**: encola los cambios en localStorage (`bodegon_pending_sync`) y los reintenta al reconectar, sin romper la edición.

**Objetivo:** en refactor futuro, los casos de uso recibirían sus dependencias (repositorio de datos, servicio de envío) **por parámetro** (inyección de dependencias) en lugar de crearlas internamente, facilitando pruebas (se pueden inyectar versiones "falsas"/mock).

---

## Resumen de aplicación por módulo

| Módulo | Responsabilidad (S) | Abierto/Cerrado (O) | LSP (L) | Interfaces (I) | Inversión (D) |
|--------|--------------------|--------------------|---------|-----------------|----------------|
| `app.js` | Navegación + temporadas + lightbox | Extensible vía `<script>`s nuevos | Trata 12 temporadas uniformes | — | — |
| `admin.js` | Editor + sesión + sync | Cerrado por dentro; se integra sin tocar `app.js` | — | Expone `toolApi` mínima | Depende de `fetch` a API; degrada con gracia |

> **Conclusión:** el sitio cumple bien **O** y **D** en la integración del panel, cumple **L** en el manejo uniforme de temporadas, y es donde más conviene evolucionar en **S** e **I** (separar el JS grande en módulos cohesivos). Ver el "Objetivo" en [`ARCHITECTURE.md`](ARCHITECTURE.md).
