# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-02
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-02]`  
**Título:** Lógica de Negocio, Base Inicial de Efectivo y Endpoints de Cuadre de Caja Diario (Backend Core & API)  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-QA-Security-Auditor`)  
**Estado:** 🟢 **BLINDADA Y LISTA PARA EJECUCIÓN (Opción B: Base Inicial Incluida)**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** Implementar el módulo backend `caja` que permite al Administrador/Propietario asignar una **base inicial de efectivo** (fondo de cambio y reintegro de depósitos) a cada empleado por día/turno, y consolidar los eventos financieros (entradas y salidas) para calcular con exactitud matemática el efectivo físico esperado en el cajón y el balance de cada billetera digital (`NEQUI`, `DAVIPLATA`, `BRE_B`), bajo huso horario de Colombia (`UTC-5`).
* **Fuentes de Datos:**
  1. **Tabla `caja_base` (`CajaBaseTypeOrmEntity`):** Registra el fondo inicial asignado por el administrador al empleado para una fecha determinada (`empleado_id`, `fecha`, `monto`, `asignado_por`, `notas`).
  2. **Tabla `historial_factura` (`HistorialFacturaTypeOrmEntity`):** Fuente inmutable de los movimientos de mostrador (`created_at`, `empleado_id`, `accion`, `detalle`).
* **Desglose Técnico Fullstack:**
  - **Sub-alcance Backend (Esta Tarea `[TSK-02]`):**
    * Migración TypeORM para crear la tabla `caja_base` con índice único `(empleado_id, fecha)`.
    * Entidad TypeORM `CajaBaseTypeOrmEntity` y repositorio.
    * Casos de uso:
      - `AsignarBaseCajaUseCase` (Solo Admin/Propietario).
      - `ObtenerCuadreCajaEmpleadoUseCase` (Empleado y Admin).
      - `ObtenerCuadreCajaAdminUseCase` (Consolidado tienda y desglose por empleado).
    * Endpoints REST protegidos por JWT y `RolesGuard`.
    * Suite unitaria de pruebas Jest al 100% de cobertura.
  - **Sub-alcance Frontend (`[TSK-03]`):**
    * Pantalla `/cuadre-caja`, modal para que el Admin asigne/edite la base, Hero Card con semáforo comparador en vivo (`Esperado en Cajón = Base + Entradas - Salidas` vs. `Contado Físico`) y tarjetas digitales.
* **Out of Scope:** Apertura de gaveta física por hardware y pasarelas bancarias automáticas.
* **Ubicación en el Sistema:**
  - `backend/src/migrations/1727200000000-CreateCajaBaseTable.ts`
  - `backend/src/modules/caja/domain/` (interfaces y tipos)
  - `backend/src/modules/caja/infrastructure/persistence/` (entidad TypeORM y repositorio)
  - `backend/src/modules/caja/application/` (DTOs y casos de uso)
  - `backend/src/modules/caja/infrastructure/controllers/caja.controller.ts`
  - `backend/src/modules/caja/caja.module.ts`
* **Dependencias Existentes:**
  - `HistorialFacturaTypeOrmEntity`, `FacturaTypeOrmEntity`, `EmpleadoTypeOrmEntity`.
  - Value Object `Dinero` (`dinero.vo.ts`) y Enum `MetodoPago` (`metodo-pago.vo.ts`).
  - `JwtAuthGuard`, `RolesGuard`, `@Roles('admin', 'propietario')`.

---

### 2. Definición Funcional y Reglas de Negocio

* **Narrativa de Usuario:**
  > **Como** administrador o propietario de CST Bodegón Trajes,  
  > **Quiero** asignarle a cada empleado su base inicial de efectivo para que tengan fondo de vueltos y liquidez para devolver depósitos en garantía,  
  > **Y como** empleado, quiero ver mi arqueo diario exacto sumando la base inicial más mis cobros del turno menos mis reintegros,  
  > **Para** que al contar los billetes en la mano, el semáforo de caja cuadre al centavo sin falsas diferencias contables.

* **Catálogo de Conceptos Contables (`ConceptoCaja`):**
  1. `BASE_INICIAL` ➔ **Fondo Inicial (Saldo Apertura):** Dinero en efectivo entregado por el dueño al inicio del turno.
  2. `ABONO_SEPARACION` ➔ **Entrada (+):** Abono recibido al reservar una prenda.
  3. `SALDO_ALQUILER` ➔ **Entrada (+):** Cobro del saldo pendiente al entregar la prenda.
  4. `DEPOSITO_GARANTIA` ➔ **Entrada (+):** Depósito en garantía recibido en custodia.
  5. `REINTEGRO_DEPOSITO` ➔ **Salida (-):** Reintegro del depósito de garantía al devolver la prenda.

* **Reglas Deterministas de Cálculo Contable:**
  1. **Base Inicial de Efectivo:**  
     $$\text{Base Inicial} = \text{Monto en } \texttt{caja\_base} \text{ para (empleado, fecha) o } 0 \text{ si no fue asignada}$$
  2. **Entradas de Efectivo del Turno:**  
     $$\text{Entradas Efectivo} = \sum \text{Abonos}_{\text{EFECTIVO}} + \sum \text{Saldos}_{\text{EFECTIVO}} + \sum \text{Depósitos}_{\text{EFECTIVO}}$$
  3. **Salidas de Efectivo del Turno:**  
     $$\text{Salidas Efectivo} = \sum \text{Depósitos Reintegrados}_{\text{EFECTIVO}}$$
  4. **Efectivo Físico Total Esperado en Cajón:**  
     $$\mathbf{\text{Efectivo Esperado en Cajón}} = \mathbf{\text{Base Inicial} + \text{Entradas Efectivo} - \text{Salidas Efectivo}}$$
  5. **Flujo Neto Operativo del Turno (Sin Base):**  
     $$\text{Flujo Neto Operativo} = \text{Entradas Efectivo} - \text{Salidas Efectivo}$$
  6. **Canales Digitales (Conciliación Bancaria por Billetera):**  
     $$\text{Balance Nequi} = \sum \text{Entradas}_{\text{NEQUI}} - \sum \text{Reintegros}_{\text{NEQUI}}$$  
     *(Misma fórmula idéntica e independiente para `DAVIPLATA` y `BRE_B`).*
  7. **Total Digital Conciliado:**  
     $$\text{Total Digital} = \text{Balance Nequi} + \text{Balance Daviplata} + \text{Balance Bre-B}$$
  8. **Total Recaudado Bruto:**  
     $$\text{Total Recaudado} = \text{Flujo Neto Operativo} + \text{Total Digital}$$
  9. **Aislamiento de Reintegros Digitales:**  
     Si un depósito se devuelve por transferencia digital (ej. Nequi), **NO descuenta efectivo físico del cajón**; únicamente afecta el balance de dicha billetera.
  10. **Huso Horario Invariante (Colombia UTC-5):**  
      Toda fecha en formato `YYYY-MM-DD` se evalúa estrictamente en el huso de Colombia (`America/Bogota`):
      - `Inicio del día:` `YYYY-MM-DDT00:00:00-05:00`
      - `Fin del día:` `YYYY-MM-DDT23:59:59.999-05:00`

* **Matriz de Permisos & Seguridad:**
  - `POST /caja/admin/base`: Exclusivo para roles `admin` y `propietario`.
  - `GET /caja/mi-cuadre`: Rol `empleado` solo consulta su propia caja para la fecha especificada (o hoy).
  - `GET /caja/admin/resumen`: Exclusivo para roles `admin` y `propietario`.

* **Casos Borde (Edge Cases):**
  - **Sin base asignada:** `baseInicial` retorna `$0` (no `null`).
  - **Doble asignación de base:** `POST /caja/admin/base` realiza un `upsert` sobre `(empleado_id, fecha)` actualizando el monto y auditoría sin duplicar registros.
  - **Turno sin movimientos:** Retorna `baseInicial` intacta, totales de entradas/salidas en `$0` y `movimientos: []`.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### A. Endpoint Admin: Asignar Base Inicial (`POST /api/v1/caja/admin/base`)
* **Headers:** `Authorization: Bearer <JWT>` (`admin` | `propietario`)
* **Body:**
```json
{
  "empleadoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fecha": "2026-09-28",
  "monto": 150000,
  "notas": "Base inicial para dar vueltos y reintegros de depósitos"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "id": "caja-base-uuid-1",
  "empleadoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "empleadoNombre": "Carlos Mostrador",
  "fecha": "2026-09-28",
  "monto": 150000,
  "notas": "Base inicial para dar vueltos y reintegros de depósitos",
  "asignadoPor": "uuid-admin"
}
```

#### B. Endpoint Empleado: Consultar Arqueo (`GET /api/v1/caja/mi-cuadre?fecha=YYYY-MM-DD`)
* **Headers:** `Authorization: Bearer <JWT>`
* **Query Params:** `fecha` (opcional, formato ISO `YYYY-MM-DD`, default: hoy Colombia).
* **Respuesta Exitosa (200 OK):**
```json
{
  "fecha": "2026-09-28",
  "empleadoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "empleadoNombre": "Carlos Mostrador",
  "resumenEfectivo": {
    "baseInicial": 150000,
    "entradas": 230000,
    "salidas": 50000,
    "flujoNeto": 180000,
    "esperadoEnCajon": 330000
  },
  "resumenDigital": {
    "nequi": 95000,
    "daviplata": 40000,
    "breB": 0,
    "totalDigital": 135000
  },
  "totalRecaudado": 315000,
  "movimientos": [
    {
      "id": "hist-uuid-1",
      "hora": "09:15:32",
      "facturaNumero": "FACT-0021",
      "clienteNombre": "Juan Pérez",
      "concepto": "ABONO_SEPARACION",
      "metodoPago": "EFECTIVO",
      "referencia": null,
      "monto": 50000,
      "esEntrada": true
    },
    {
      "id": "hist-uuid-2",
      "hora": "14:20:10",
      "facturaNumero": "FACT-0015",
      "clienteNombre": "María Gómez",
      "concepto": "REINTEGRO_DEPOSITO",
      "metodoPago": "EFECTIVO",
      "referencia": null,
      "monto": 50000,
      "esEntrada": false
    }
  ]
}
```

#### C. Endpoint Administrador: Consolidado Global (`GET /api/v1/caja/admin/resumen?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&empleadoId=UUID`)
* **Headers:** `Authorization: Bearer <JWT>` (`admin` | `propietario`)
* **Query Params:** `fechaInicio` (obligatorio), `fechaFin` (obligatorio), `empleadoId` (opcional).
* **Respuesta Exitosa (200 OK):**
```json
{
  "rango": {
    "fechaInicio": "2026-09-20",
    "fechaFin": "2026-09-28"
  },
  "filtroEmpleadoId": null,
  "consolidadoTienda": {
    "resumenEfectivo": {
      "baseInicial": 300000,
      "entradas": 1500000,
      "salidas": 300000,
      "flujoNeto": 1200000,
      "esperadoEnCajon": 1500000
    },
    "resumenDigital": {
      "nequi": 450000,
      "daviplata": 200000,
      "breB": 50000,
      "totalDigital": 700000
    },
    "totalRecaudado": 1900000,
    "totalMovimientos": 45
  },
  "porEmpleado": [
    {
      "empleadoId": "uuid-carlos",
      "empleadoNombre": "Carlos Mostrador",
      "baseInicial": 150000,
      "entradasEfectivo": 800000,
      "salidasEfectivo": 150000,
      "flujoNeto": 650000,
      "esperadoEnCajon": 800000,
      "totalDigital": 350000,
      "totalRecaudado": 1000000,
      "totalMovimientos": 22
    }
  ],
  "movimientos": [
    {
      "id": "hist-uuid-1",
      "fecha": "2026-09-28",
      "hora": "09:15:32",
      "empleadoNombre": "Carlos Mostrador",
      "facturaNumero": "FACT-0021",
      "clienteNombre": "Juan Pérez",
      "concepto": "ABONO_SEPARACION",
      "metodoPago": "EFECTIVO",
      "referencia": null,
      "monto": 50000,
      "esEntrada": true
    }
  ]
}
```

#### D. Errores Deterministas (RFC 9457)
* `400 Bad Request` (Fechas invertidas):
  ```json
  {
    "type": "https://httpstatuses.com/400",
    "title": "Bad Request",
    "status": 400,
    "detail": "fechaInicio no puede ser posterior a fechaFin"
  }
  ```
* `403 Forbidden` (Empleado queriendo ver admin):
  ```json
  {
    "type": "https://httpstatuses.com/403",
    "title": "Forbidden",
    "status": 403,
    "detail": "No tienes permisos para consultar el resumen administrativo de caja"
  }
  ```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Empleado con base inicial asignada y operaciones mixtas (Happy Path)
* **Dado** que el administrador asignó una base de $150.000 a Carlos para hoy,
* **Y** Carlos cobró $50.000 en efectivo (abono), $60.000 en Nequi (saldo), recibió $50.000 en efectivo (depósito) y reintegró $20.000 en efectivo (depósito devuelto),
* **Cuando** realiza una petición `GET /api/v1/caja/mi-cuadre`,
* **Entonces** el servidor retorna HTTP 200 con `baseInicial = 150000`, `entradas = 100000`, `salidas = 20000`, `flujoNeto = 80000`, `esperadoEnCajon = 230000`, `nequi = 60000` y 4 movimientos en la lista.

#### Escenario 2: Empleado sin base inicial asignada (Happy Path con $0 base)
* **Dado** un empleado al que no se le asignó base de caja hoy,
* **Cuando** consulta `GET /api/v1/caja/mi-cuadre`,
* **Entonces** el servidor responde HTTP 200 con `baseInicial = 0` y `esperadoEnCajon = entradas - salidas`.

#### Escenario 3: Administrador asigna o actualiza la base inicial de un empleado (Happy Path)
* **Dado** un usuario autenticado con rol `admin` o `propietario`,
* **Cuando** envía `POST /api/v1/caja/admin/base` con `empleadoId = "uuid-carlos"`, `fecha = "2026-09-28"` y `monto = 200000`,
* **Entonces** la base se persiste en la tabla `caja_base` y si ya existía para esa fecha, se actualiza el monto a $200.000 (upsert).

#### Escenario 4: Reintegro de depósito digital no afecta el efectivo ni la base
* **Dado** una base de $100.000 y un reintegro de depósito por Nequi de $50.000,
* **Cuando** se calcula el arqueo,
* **Entonces** las `salidas` de efectivo permanecen en $0, `esperadoEnCajon` permanece en $100.000 y el balance de Nequi descuenta los $50.000.

#### Escenario 5: Operación nocturna en huso horario Colombia (UTC-5)
* **Dado** un cobro de saldo realizado a las 20:30 hora Colombia (01:30 UTC del día siguiente),
* **Cuando** el empleado consulta su cuadre para la fecha colombiana,
* **Entonces** el cobro se computa en el arqueo de ese día sin desfasarse al día siguiente.

---

### 5. Restricciones Técnicas y Calidad (Constraints & Non-Functional)
* **Inmutabilidad Financiera:** Cálculos aritméticos mediante `Dinero.sumar()` y `Dinero.restar()`.
* **Pruebas Unitarias Obligatorias:** `caja.use-cases.spec.ts` debe alcanzar 100% de cobertura sobre las fórmulas con y sin base inicial.
* **Optimización de Consultas:** Carga de clientes y facturas en bloque con `IN (:...ids)` para evitar N+1 queries.

---

### 6. Plan de Ejecución Secuencial por Áreas (Work Breakdown Structure - WBS)

#### 🗄️ Área 1: Base de Datos & Persistencia (Backend)
- [x] `[TSK-02.1-BD]` **Migración TypeORM:** Crear `backend/src/migrations/1727200000000-CreateCajaBaseTable.ts` para la tabla `caja_base` con constraint única `(empleado_id, fecha)`.
- [x] `[TSK-02.2-BD]` **Entidad TypeORM:** Crear `backend/src/modules/caja/infrastructure/persistence/caja-base.typeorm-entity.ts`.
- [x] `[TSK-02.3-BD]` **Repositorio Caja Base:** Crear interface y repositorio TypeORM para `caja_base` con soporte de `upsert`.

#### ⚙️ Área 2: Dominio & DTOs (Backend Core)
- [x] `[TSK-02.4-DOM]` **Contratos y Enums:** Crear `backend/src/modules/caja/domain/interfaces/cuadre-caja.interface.ts` con enum `ConceptoCaja`, interfaces de resumen con `baseInicial` y contratos de resultado.
- [x] `[TSK-02.5-APP]` **DTOs de Consulta y Asignación:** Crear `backend/src/modules/caja/application/dto/cuadre-caja.dto.ts` con `AsignarBaseCajaDto`, `CuadreCajaEmpleadoDto` y `CuadreCajaAdminDto`.
- [x] `[TSK-02.6-APP]` **Helper de Zona Horaria:** Crear función auxiliar para calcular rangos `UTC-5` (Colombia).

#### 🧠 Área 3: Casos de Uso & Lógica Contable (Application Layer)
- [x] `[TSK-02.7-APP]` **Caso de Uso Asignar Base:** Implementar `AsignarBaseCajaUseCase` exclusivo para administradores.
- [x] `[TSK-02.8-APP]` **Caso de Uso Empleado:** Implementar `ObtenerCuadreCajaEmpleadoUseCase` con la fórmula `baseInicial + entradas - salidas` y conciliación de billeteras digitales.
- [x] `[TSK-02.9-APP]` **Caso de Uso Administrador:** Implementar `ObtenerCuadreCajaAdminUseCase` con consolidado de tienda y desglose por colaborador.

#### 🔌 Área 4: Controladores, Rutas & Módulo (Infrastructure Layer)
- [x] `[TSK-02.10-API]` **Controlador REST:** Crear `CajaController` (`caja.controller.ts`) con rutas `POST /caja/admin/base`, `GET /caja/mi-cuadre` y `GET /caja/admin/resumen`.
- [x] `[TSK-02.11-API]` **Módulo NestJS:** Crear `CajaModule` e importarlo en `AppModule`.

#### 🧪 Área 5: Calidad & Pruebas Automatizadas (QA)
- [x] `[TSK-02.12-QA]` **Suite Jest de Cuadre de Caja:** Crear `caja.use-cases.spec.ts` cubriendo los escenarios Gherkin (con base inicial, sin base, reintegros digitales, validación de fechas y zona horaria).

#### 🚢 Área 6: Despliegue Local & Verificación (DevOps)
- [x] `[TSK-02.13-OPS]` **Verificación en Contenedores:** Recompilar backend en Docker Compose, ejecutar migración y verificar endpoints con token JWT.
