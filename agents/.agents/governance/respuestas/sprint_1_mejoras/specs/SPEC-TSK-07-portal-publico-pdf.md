# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-07
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-07]`  
**Título:** Portal Público de Autoconsulta (`/mis-alquileres`), Validación con PIN de 4 Dígitos, Membrete Dinámico de Sedes y Comprobantes PDF al Vuelo  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-Software-Architect`, `Bodegon-QA-Security-Auditor` y `Bodegon-Frontend-Architect`)  
**Estado:** 🟢 **100% BLINDADA CON DECISIONES DE NEGOCIO Y SEGURIDAD VALIDADAS**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo Principal:**
  1. Permitir a cualquier cliente consultar sus alquileres activos e históricos ingresando su **número de celular (10 dígitos)** y los **últimos 4 dígitos de su Cédula/Documento** (Alternativa 2A - 2FA Ligero sin costo de SMS) en una ruta pública (`/mis-alquileres`).
  2. Al estar verificado con el documento, el portal muestra con total confianza el **Nombre Completo del Cliente**, estado de alquiler, fecha y horario límite de entrega/devolución (**antes de las 6:00 PM**) y semáforo visual con días faltantes o vencidos.
  3. Desglose detallado de prendas y **checklist de piezas** individuales que debe devolver.
  4. Generador de **Comprobantes PDF en el navegador del cliente** con `jspdf` y `jspdf-autotable` (Zero Storage en VPS), con opción de descarga directa y botón alternativo *"Ver en pantalla"* (Blob URL) para compatibilidad con iOS Safari y Android.
  5. **Membrete de Recibo Dinámico & Editable por Sede:** Módulo y tabla de persistencia `configuracion_tienda` para que el Administrador o Propietario pueda actualizar en tiempo real el nombre comercial, sede, dirección, teléfono y pie de página del recibo conforme se abran nuevos puntos físicos.
* **Exclusiones (Out of Scope):** Facturas con estado `CANCELADA` (se excluyen de la consulta pública para no generar reclamos ni ruidos por errores de mostrador).
* **Ubicación en el Sistema:**
  - Backend:
    - Migración: `backend/src/migrations/1727500000000-CreateConfiguracionTiendaTable.ts`
    - Módulo Configuración: `backend/src/modules/configuracion/...` (Entidad, Repositorio, Use Cases, Controller público y patch protegido)
    - Facturas Públicas: `backend/src/modules/factura/infrastructure/controllers/facturas.controller.ts`, `obtener-facturas-publicas.use-case.ts`, `factura-publica.dto.ts`
    - Seguridad: `public-rate-limit.guard.ts` (10 req/min con extracción de IP real vía `X-Forwarded-For`)
  - Frontend:
    - Portal Público: `frontend/src/modules/factura/presentation/pages/mis-alquileres-page.tsx`
    - Generador PDF: `frontend/src/modules/factura/presentation/utils/factura-pdf.generator.ts`
    - Configuración de Recibo (Admin): Modal o componente de ajuste de membrete para Admin/Propietario.
    - Router: `frontend/src/App.tsx` (Ruta pública `/mis-alquileres`)

---

### 2. Definición Funcional y Reglas de Negocio Validadas

* **Narrativa de Usuario:**
  > **Como** cliente de Bodegón Trajes,  
  > **Quiero** ingresar a `/mis-alquileres` con mi celular y los últimos 4 dígitos de mi cédula,  
  > **Para** ver mis trajes alquilados, saber qué piezas debo devolver antes de las 6:00 PM y descargar mi comprobante oficial en PDF sin riesgo de que extraños vean mis datos.

* **Reglas Deterministas de Negocio y Seguridad:**
  1. **Autenticación Ligera Anti-Scraping (2FA Zero Cost):**
     - Input 1: Celular colombiano de 10 dígitos (regex `^3[0-9]{9}$`).
     - Input 2: Últimos 4 dígitos del documento de identidad (regex `^[0-9]{4}$`).
     - El backend busca al cliente comparando:
       - `REGEXP_REPLACE(c.telefono, '[^0-9]', '', 'g') LIKE :celularTail`
       - `RIGHT(REGEXP_REPLACE(c.documento, '[^0-9]', '', 'g'), 4) = :doc4`
     - Si no coincide ambos datos, responde HTTP 404/200 vacío impidiendo adivinar celulares o cédulas.
  2. **Exclusión Estricta de Facturas Canceladas:**
     - La consulta filtra explícitamente `WHERE f.estado != 'CANCELADA'`.
  3. **Horario Límite y Semáforo de Devolución:**
     - Hora estipulada de devolución en tienda: **Antes de las 6:00 PM** (18:00 Colombia).
     - Semáforo visual en frontend:
       - 🟢 **Verde:** Faltan 2 o más días para la fecha de devolución.
       - 🟡 **Amarillo:** Se entrega o vence hoy (alerta: *"Devolver hoy antes de las 6:00 PM"*).
       - 🔴 **Rojo:** Fecha vencida (alerta: *"Retraso en devolución de X días"*).
  4. **Membrete Dinámico de Tienda (Sedes):**
     - Parámetros configurables en BD (`configuracion_tienda`):
       - `nombre_negocio` (Default: *"CST Bodegón Trajes"*)
       - `sede_nombre` (Default: *"Sede Principal"*)
       - `direccion` (Default: *"Pasto, Nariño"*)
       - `telefono` (Default: *"310 123 4567"*)
       - `pie_pagina` (Default: *"El depósito en garantía será reembolsado al devolver la totalidad de las prendas y piezas en perfecto estado antes de las 6:00 PM."*)
     - Solo usuarios con rol `admin` o `propietario` pueden modificar estos campos.
  5. **Doble Mecanismo de PDF en Móvil (Zero Storage en VPS):**
     - Botón principal: `[ 📥 Descargar Comprobante PDF ]` (dispara `pdf.save(...)`).
     - Botón alternativo: `[ 👁️ Ver en Pantalla ]` (genera `pdf.output('bloburl')` y lo abre en ventana nueva para sortear bloqueos de descarga en iOS Safari).
  6. **Rate Limiting Anti-Ataque:**
     - Máximo 10 peticiones por minuto por IP real (inspeccionando cabeceras `X-Forwarded-For` o `X-Real-IP`). Responde HTTP 429 con cabecera `Retry-After: 60`.
  7. **Obligatoriedad de Documento y Teléfono con Label Informativo:**
     - En los formularios de creación y edición de clientes (`ClienteFormModal`, `ClienteEditModal` y checkout de alquiler):
       - Los campos **Documento (Cédula/DNI)** y **Teléfono / Celular** pasan a ser **estrictamente obligatorios**.
       - Validación: Documento mínimo 4 dígitos numéricos; Teléfono formato celular de 10 dígitos (`^3[0-9]{9}$`).
       - Debajo del campo Documento se incluye un texto/label informativo visible:
         > *"Requerido: Sus últimos 4 dígitos servirán como clave de acceso del cliente para consultar sus alquileres y comprobantes en el portal web."*
       - Debajo del campo Teléfono se incluye:
         > *"Requerido: Celular donde el cliente recibirá sus enlaces de WhatsApp y consultará sus comprobantes."*
       - En backend (`CreateClienteDto`, `UpdateClienteDto`): Validación `@IsNotEmpty()` y `@MinLength(4)` para documento.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### Endpoint 1: Consulta de Facturas Públicas
* **Ruta:** `POST /api/v1/facturas/publica/consulta` *(POST para enviar celular y doc4 en body seguro)*
* **Headers:** Públicos (Sin JWT).
* **Request Payload:**
  ```json
  {
    "celular": "3101234567",
    "doc4": "4567"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "cliente": {
      "nombre": "Carlos Alberto Pérez"
    },
    "facturas": [
      {
        "numero": "FACT-0045",
        "estado": "ALQUILADA",
        "fechaCreacion": "2026-09-28",
        "fechaEntrega": "2026-09-28",
        "fechaDevolucion": "2026-10-02",
        "horaLimite": "06:00 PM",
        "valorTotal": 85000,
        "abono": 40000,
        "saldoPendiente": 0,
        "deposito": 50000,
        "elementos": [
          {
            "nombre": "Traje Smoking Negro",
            "cantidad": 1,
            "piezas": ["Saco", "Pantalón", "Chaleco", "Corbatín", "Fajón"]
          }
        ]
      }
    ]
  }
  ```

#### Endpoint 2: Lectura de Membrete para Recibo
* **Ruta:** `GET /api/v1/config/recibo`
* **Headers:** Públicos.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "nombreNegocio": "CST Bodegón Trajes",
    "sedeNombre": "Sede Principal",
    "direccion": "Pasto, Nariño",
    "telefono": "310 123 4567",
    "piePagina": "El depósito en garantía será reembolsado al devolver la totalidad de las prendas y piezas en perfecto estado antes de las 6:00 PM."
  }
  ```

#### Endpoint 3: Actualización de Membrete (Admin/Propietario)
* **Ruta:** `PATCH /api/v1/config/recibo`
* **Headers:** `Authorization: Bearer <JWT>` (Rol: admin o propietario)
* **Request Payload:** Objeto parcial con los campos a modificar.

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Consulta exitosa de alquiler activo (Happy Path)
* **Dado** que un cliente ingresa a `/mis-alquileres`,
* **Cuando** digita su celular `"3101234567"` y los 4 dígitos `"4567"`,
* **Entonces** la pantalla muestra su nombre completo *"Carlos Alberto Pérez"*, su factura `ALQUILADA`, la fecha límite con semáforo, el balance financiero y la lista de piezas (`Saco`, `Pantalón`, `Chaleco`, `Corbatín`, `Fajón`).

#### Escenario 2: Generación y descarga de PDF formal
* **Dado** la tarjeta del alquiler visible,
* **Cuando** el cliente pulsa `[ 📥 Descargar Comprobante PDF ]`,
* **Entonces** se genera en memoria el PDF formal con el membrete dinámico configurado, tabla de prendas y checklist de piezas, iniciando la descarga sin peticiones de almacenamiento al servidor VPS.

#### Escenario 3: Cliente con facturas canceladas
* **Dado** un cliente que tiene una factura `ALQUILADA` y otra `CANCELADA`,
* **Cuando** realiza la consulta en el portal,
* **Entonces** el sistema solo muestra la factura `ALQUILADA` y omite completamente la `CANCELADA`.

#### Escenario 4: Intento de consulta con 4 dígitos incorrectos
* **Dado** una consulta con un celular registrado pero con los 4 dígitos de cédula equivocados,
* **Cuando** se envía la búsqueda,
* **Entonces** el sistema responde que no se encontraron alquileres para los datos ingresados, protegiendo la identidad del cliente.

#### Escenario 5: Administrador actualiza la dirección y teléfono para una nueva sede
* **Dado** un usuario con rol `admin` autenticado en la plataforma,
* **Cuando** edita los datos del membrete de recibo desde la interfaz administrativa,
* **Entonces** los nuevos comprobantes PDF generados por los clientes reflejan inmediatamente los nuevos datos.

#### Escenario 6: Registro de cliente con documento obligatorio y label explicativo
* **Dado** un empleado en el mostrador abriendo el modal "Agregar Cliente",
* **Cuando** observa el campo "Documento",
* **Entonces** tiene el asterisco de obligatorio, requiere al menos 4 dígitos y muestra el texto explicativo de que servirá como clave de acceso para el portal web del cliente.

---

### 5. Plan de Ejecución Secuencial por Áreas (WBS)

#### 🗄️ Área 1: Base de Datos & Membrete de Sede (Backend)
- [x] `[TSK-07.1-BD]` **Migración:** Crear tabla `configuracion_tienda` con valores iniciales por defecto (Pasto, Nariño, teléfono, pie de página).
- [x] `[TSK-07.2-BD]` **Entidad y Repositorio Config:** Módulo `configuracion` con TypeORM entity y repositorio.

#### ⚙️ Área 2: Lógica de Autenticación Ligera & Endpoints (Backend)
- [x] `[TSK-07.3-APP]` **PublicRateLimitGuard:** Extractor de IP real confiando en `X-Forwarded-For` con límite de 10 req/min por IP.
- [x] `[TSK-07.4-APP]` **ObtenerFacturasPublicasUseCase:** Búsqueda por celular normalizado + últimos 4 dígitos de cédula, excluyendo `CANCELADA` y mapeando a `FacturaPublicaDto`.
- [x] `[TSK-07.5-APP]` **Endpoints en Controllers:** `POST /api/v1/facturas/publica/consulta`, `GET /api/v1/config/recibo` (público) y `PATCH /api/v1/config/recibo` (protegido).
- [x] `[TSK-07.6-APP]` **Validación de Documento en Cliente DTO:** Actualizar `CreateClienteDto` y `UpdateClienteDto` con documento y teléfono requeridos.

#### 🎨 Área 3: Frontend & Portal Mobile-First (UI/UX)
- [x] `[TSK-07.7-UI]` **Instalación de `jspdf` y `jspdf-autotable`:** Integrar dependencias en frontend.
- [x] `[TSK-07.8-UI]` **Documento Obligatorio con Helper Label:** Actualizar `ClienteFormModal` y `ClienteEditModal` con validaciones y label informativo para mostrador.
- [x] `[TSK-07.9-UI]` **Página `/mis-alquileres`:** Diseño responsive mobile-first con input numérico de celular y PIN de 4 dígitos, soporte para query params `?tel=...`.
- [x] `[TSK-07.10-UI]` **Tarjetas de Alquiler con Semáforo:** Visualización de estado, alerta de devolución antes de las 6:00 PM, desglose de piezas y tags.
- [x] `[TSK-07.11-UI]` **Generador de PDF al Vuelo:** Comprobante estilizado con membrete dinámico, tabla de trajes, checklist de piezas y botones de "Descargar" y "Ver en pantalla".
- [x] `[TSK-07.12-UI]` **Modal de Configuración de Membrete:** Componente en módulo de configuración/admin para editar datos del recibo.

#### 🧪 Área 4: Pruebas & Verificación (QA & DevOps)
- [x] `[TSK-07.13-QA]` **Pruebas Unitarias Jest:** Tests para el use case de consulta pública, rate limiter, validación de clientes y exclusión de canceladas.
- [x] `[TSK-07.14-OPS]` **Verificación en Docker:** Ejecutar migración y validar en navegador móvil y de escritorio en `http://localhost:3080/mis-alquileres`.

