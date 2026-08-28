# Arquitectura Limpia — El Bodegón de los Trajes

Este documento explica cómo se aplica **Clean Architecture** (Arquitectura Limpia) al proyecto, cómo se organiza por **capas** y cómo cada módulo respeta la dirección de las dependencias.

El proyecto es una **aplicación web estática** (frontend en `sitio/`) con un panel de administración y asistentes. Por eso, aquí las "capas" de Clean Architecture se mapean a **conceptos dentro del frontend** y a los **límites del sistema** (frontend ↔ backend/Vercel ↔ GitHub).

---

## Principio rector: la Regla de la Dependencia

> El código fuente debe apuntar **hacia adentro** (hacia las capas de dominio/políticas de negocio). Nada de las capas internas debe depender de algo de las capas externas (frameworks, UI, API).

En este proyecto:

```
   UI / Presentación          ->  js/* (app.js, chat.js, admin-ai.js, admin.js)
   Aplicación / Casos de uso  ->  funciones de negocio (cambiar título, colocar foto, confirmar disponibilidad)
   Datos / Persistencia       ->  data/admin-content.js + localStorage + sincronización (Vercel/GitHub)
   Frameworks / Drivers       ->  DOM, fetch, Formspree, Nginx (Docker), servidor estático
```

---

## Capas y su mapeo real en el código

### 1. Capa de Framework / Drivers (la más externa)
Es el mundo externo con el que interactúa la app:
- El **navegador / DOM** y las hojas de estilo (`css/`).
- El **servidor** estático que sirve `sitio/` (`scripts/dev-server.js`) o **Nginx** en Docker.
- Las APIs externas: `Formspree` (formulario), endpoint de sincronización Vercel (`/api/save-content`), y la API de GitHub (lectura de `data/admin-content.js`).
- Nada de las capas internas conoce estos detalles directamente; se acceden a través de una pequeña capa de "adaptadores" en `admin.js` y `email/`.

### 2. Capa de Interfaces / Adaptadores (puertos)
Adapta los datos del mundo externo al formato que la app usa y viceversa:
- `email/config.js` — configuración (Formspree ID, WhatsApp, correo del negocio).
- `email/form-handler.js` — adapta el formulario a la petición de Formspree.
- `data/admin-content.js` — formato de persistencia del contenido administrable (`texts`, `images`, `addCards`, `seasonCovers`, etc.).

### 3. Capa de Aplicación / Casos de uso
Contiene la lógica de las **operaciones** que la app soporta:
- **Admin**: cambiar texto/título de un elemento, reemplazar una foto, gestionar sesión, guardar y sincronizar (`js/admin.js`, `js/admin-ai.js`).
- **Cliente**: consultar disponibilidad por categoría y dejar los datos de contacto (`js/chat.js`).
- **Presentación**: navegación y pestañas de temporadas, lightbox, render (`js/app.js`).

Los casos de uso **orquestan** datos y presentación, pero no deciden detalles de UI ni de persistencia.

### 4. Capa de Entidades / Dominio (la más interna)
Las reglas de negocio esenciales, sin dependencias de framework:
- Conceptos: `Temporada`, `Categoría` (Uniforme, Disfraz, Bata, Toga, Vestido…), `Elemento Editable` (título, párrafo, foto), `Sesión de Admin`, `Mensaje de Disponibilidad`.
- Reglas: *"una temporada tiene nombre + etiqueta + descripción"*, *"editar solo es posible con sesión de administrador activa"*, *"el asistente no expone credenciales"*.

> En un frontend pequeño estas reglas viven hoy dentro de los módulos `app.js` / `admin.js`; la sección "Objetivo" propone extraerlas a módulos propios.

---

## Dirección de las dependencias (en la práctica)

- `app.js`, `chat.js`, `admin-ai.js` **usan** `data/` (persistencia) y `email/` (config), nunca al revés.
- `admin.js` es el único que habla con la nube (Vercel/GitHub); los asistentes **no** lo hacen directamente, lo delegan.
- **Seguridad:** los asistentes nunca acceden a credenciales ni a datos internos del admin. Solo reutilizan la herramienta de edición nativa (caso de uso) cuando la sesión de administrador ya está activa.

---

## ¿Por qué "solo organizar y documentar"?

El sitio está **funcional** y en producción. La decisión de la fase actual es **no modificar el código** (para no romper rutas ni comportamiento), sino:
1. Documentar la arquitectura deseada (este documento).
2. Dejar una estructura de carpetas clara (`docs/`, `docker/`, `scripts/`, `.github/`).
3. Añadir Docker listo para usar y Git Flow.

La **refactorización del código** (extraer módulos SOLID) queda documentada como objetivo futuro en [`docs/SOLID.md`](SOLID.md).

---

## Objetivo (evolución futura recomendada)

A medida que el sitio crezca, separar por responsabilidades:

```
sitio/
├── js/
│   ├── core/            # Dominio y casos de uso (reglas de negocio)
│   │   ├── temporadas.js
│   │   ├── catalogo.js
│   │   ├── disponibilidad.js
│   │   └── sesion.js
│   ├── services/        # Adaptadores (Formspree, sync Vercel, GitHub)
│   ├── ui/              # Presentación (render, lightbox, marquee)
│   └── entry/           # Punto de entrada (bootstrap)
```

Esto mantiene la "Regla de la Dependencia": `entry → ui/services → core`.
