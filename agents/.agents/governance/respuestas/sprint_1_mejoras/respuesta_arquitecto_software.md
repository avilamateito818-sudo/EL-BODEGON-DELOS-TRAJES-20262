# ESPECIFICACIÓN DE ARQUITECTURA TÉCNICA DE SOFTWARE (BACKEND): SPRINT 1
## PROYECTO: CST BODEGÓN TRAJES — GESTIÓN Y ALQUILER DE TRAJES

**Rol:** `Bodegon-Software-Architect` (Arquitecto de Software Principal Backend)  
**Sprint:** Sprint 1 — Mejoras Operativas de Mostrador, Control de Dinero & Seguridad  
**Carpeta Oficial:** `.agents/governance/respuestas/sprint_1_mejoras/`  
**Rama de Trabajo:** `feature/sprint-1-mejoras`  
**Estado:** ✅ **APROBADO POR EL USUARIO HUMANO**  
**Fecha de Aprobación:** 2026-09-27  

---

## 1. Ficha Técnica Oficial del Stack Backend

* **Lenguaje & Runtime:** TypeScript 5.7+ / Node.js 20 LTS
* **Framework Principal:** NestJS 11.x
* **Persistencia & ORM:** PostgreSQL 16 Alpine + TypeORM 0.3.x (Migraciones versionadas estrictas)
* **Seguridad & Auth:** Passport-JWT + Bcrypt (con invalidación de sesión activa y control de turnos)
* **Arquitectura:** Clean Architecture (Domain, Application, Infrastructure) + DDD ligero

---

## 2. Modelado de Persistencia y Migraciones PostgreSQL

Para dar soporte a los requerimientos de mostrador sin alterar la integridad de datos previa, se establecen las siguientes migraciones:

### 2.1. Métodos de Pago Locales en `facturas`
Se añaden columnas para trazabilidad de cada flujo financiero:
* `metodo_pago_abono`: `VARCHAR(30) NULL` (Valores: `EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`)
* `referencia_abono`: `VARCHAR(100) NULL` (Comprobante digital o número de transacción)
* `metodo_pago_saldo`: `VARCHAR(30) NULL`
* `referencia_saldo`: `VARCHAR(100) NULL`
* `metodo_pago_deposito`: `VARCHAR(30) NULL`
* `referencia_deposito`: `VARCHAR(100) NULL`
* `metodo_pago_devolucion_deposito`: `VARCHAR(30) NULL`
* `referencia_devolucion_deposito`: `VARCHAR(100) NULL`

### 2.2. Desglose de Piezas en `factura_elementos`
* `piezas`: `JSONB NOT NULL DEFAULT '[]'::jsonb`  
  *Estructura:* Array de strings con el desglose exacto (ej: `["Saco", "Pantalón", "Chaleco", "Corbata"]`).

### 2.3. Control de Concurrencia y Sesión Única en `empleados`
* `session_id`: `VARCHAR(100) NULL` (UUID de sesión activa)
* `activo`: `BOOLEAN NOT NULL DEFAULT true` (Columna preexistente, activada como gatekeeper en `JwtStrategy`)

---

## 3. Módulos y Casos de Uso del Backend

### 3.1. Módulo `caja` (`src/modules/caja/`)
* **`ObtenerCuadreCajaEmpleadoUseCase`:**
  - Consulta los movimientos de facturas asociados al empleado autenticado en la fecha especificada (por defecto hoy).
  - Devuelve: total entradas efectivo, total salidas efectivo, saldo físico esperado en cajón, y desglose digital (Nequi, Daviplata, Bre-B).
* **`ObtenerCuadreCajaGeneralUseCase`:**
  - Exclusivo para roles `admin` y `propietario`.
  - Permite filtrar por rango de fechas (`fechaInicio`, `fechaFin`) y opcionalmente por `empleadoId` (o consolidado total).
* **Fórmula de Arqueo:**
  - $\text{Entradas Efectivo} = \sum \text{Abonos}_{\text{EFECTIVO}} + \sum \text{Saldos}_{\text{EFECTIVO}} + \sum \text{Depósitos Recibidos}_{\text{EFECTIVO}}$
  - $\text{Salidas Efectivo} = \sum \text{Depósitos Devueltos}_{\text{EFECTIVO}}$
  - $\text{Efectivo Físico en Cajón} = \text{Entradas Efectivo} - \text{Salidas Efectivo}$
  - $\text{Canales Digitales} = \sum \text{Nequi} + \sum \text{Daviplata} + \sum \text{Bre-B}$

### 3.2. Módulo `factura` & Auto-Poblado de Catálogo
* **Auto-Poblado Inteligente (REQ-05):**
  - En `AgregarElementoUseCase` y `CrearFacturaUseCase`: si un elemento no posee `catalogoId`, se ejecuta búsqueda en `elementos_catalogo` por coincidencia exacta ignorando mayúsculas/espacios (`LOWER(TRIM(nombre))`).
  - Si no existe en el catálogo, se crea automáticamente un registro en `elementos_catalogo` con `nombre = nombrePersonalizado.trim()`, `precioSugerido = precioUnitario`, y `activo = true`.
  - Se enlaza el nuevo `catalogoId` al elemento de la factura para futuras sugerencias.
* **Consulta Pública Segura para Portal del Cliente:**
  - Endpoint: `GET /api/v1/facturas/publica/cliente/:celular`
  - Filtra facturas por número de celular del cliente.
  - Sanitiza el resultado excluyendo datos sensibles (notas internas de empleados, hashes, IDs de usuarios).

### 3.3. Módulo `auth` — Control de Turnos y Sesión Única (Opción 2)
* **Flujo de Login (`login.use-case.ts`):**
  - Si el empleado tiene `activo === false`, lanza `EmpleadoDesactivadoException` (HTTP 403/401).
  - Si el empleado ya tiene un `sessionId` asignado en base de datos y la petición no incluye `forzarCierre: true`:
    * Retorna respuesta informativa (HTTP 409 Conflict): `{ requiereConfirmacion: true, mensaje: "Ya existe una sesión activa en otro dispositivo." }`.
  - Si el usuario confirma el cierre anterior (`forzarCierre: true`) o no tenía sesión activa:
    * Se genera un nuevo UUID `sessionId`.
    * Se persiste el `sessionId` en la tabla `empleados`.
    * Se emite el token JWT que incorpora `{ sub, rol, sessionId }`.
* **Guardián JWT (`jwt.strategy.ts`):**
  - Valida que `empleado.activo === true`.
  - Valida que `empleado.sessionId === payload.sessionId`.
  - Si alguna validación falla, rechaza inmediatamente con `UnauthorizedException` (cierre automático de la sesión vieja).
* **Endpoint de Gestión de Turno:**
  - `PATCH /api/v1/auth/empleados/:id/toggle-activo` (restringido a roles `admin` y `propietario`).

---

## 4. Diagrama de Secuencia: Sesión Única (Opción 2)

```text
Cliente (Navegador B)             Servidor Backend              Base de Datos
       │                                 │                            │
       ├──── POST /auth/login ──────────>│                            │
       │     (email, password)           ├──── Buscar Empleado ──────>│
       │                                 │<─── Datos + sessionId A ───┤
       │                                 │                            │
       │                                 │ (Detecta sessionId activo) │
       │<─── 409 Conflict ───────────────┤                            │
       │     { requiereConfirmacion }    │                            │
       │                                 │                            │
[Modal: ¿Cerrar sesión anterior?]        │                            │
       │                                 │                            │
       ├──── POST /auth/login ──────────>│                            │
       │     (..., forzarCierre: true)   ├──── Generar nuevo UUID B ──>│
       │                                 │     Actualizar sessionId   │
       │<─── 200 OK (JWT con UUID B) ────┤                            │
       │                                 │                            │
────────────────────────────────────────────────────────────────────────
Dispositivo A hace una petición HTTP:
Dispositivo A                    Servidor Backend              Base de Datos
       │                                 │                            │
       ├──── GET /facturas (JWT UUID A) ─>│                            │
       │                                 ├──── Validar sessionId ────>│
       │                                 │<─── UUID en BD es B ───────┤
       │                                 │ (UUID A != UUID B)         │
       │<─── 401 Unauthorized ───────────┤                            │
       │     (Sesión cerrada)            │                            │
```
