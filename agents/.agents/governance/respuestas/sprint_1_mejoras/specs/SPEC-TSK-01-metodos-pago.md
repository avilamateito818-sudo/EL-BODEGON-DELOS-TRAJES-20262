# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-01
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-01]`  
**Título:** Migración y Soporte Fullstack de Métodos de Pago Locales (`EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`)  
**Agente Responsable:** `Bodegon-Spec-Engineer`  
**Estado:** 🟢 **COMPLETADA & VALIDADA POR EL HUMANO ✅**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** Permitir el registro determinista del método de pago (`EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`) y una referencia opcional en los 3 momentos financieros de la factura: Separación (abono), Entrega (saldo de alquiler y depósito en garantía independientes) y Devolución (reintegro de depósito), conectando tanto la persistencia en backend como la captura interactiva en el frontend.
* **Desglose Técnico Fullstack:**
  - **Sub-alcance Backend:**
    * Migración TypeORM para 8 columnas en tabla `facturas`.
    * Value Object y helper `MetodoPago` (`metodo-pago.vo.ts`).
    * Métodos de dominio en `Factura` (`separar`, `entregar`, `devolver`).
    * DTOs de aplicación con `@IsEnum(MetodoPago)` y sanitización de referencias.
    * Mapeo en repositorio y registro en auditoría (`HistorialService`).
  - **Sub-alcance Frontend:**
    * Mapeo de campos de pago en la entidad de cliente `Factura`.
    * Actualización del modal interactivo `CambioEstadoModal` con selectores de método (`EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`) e inputs de referencia en los flujos de Separación, Entrega y Devolución.
    * Visualización de badges de métodos de pago en el detalle de la factura (`FacturaDetailPage`).
* **Out of Scope (Fuera de Alcance):** 
  - Integración vía API con pasarelas de pago externas (no hay webhooks bancarios; es registro y conciliación de mostrador).
  - Pantalla dedicada de cuadre de caja (corresponde a `[TSK-03]`).
* **Ubicación en el Sistema:**
  - Backend: `backend/src/modules/factura/` (dominio, aplicación, persistencia, migraciones).
  - Frontend: `frontend/src/modules/factura/` (dominio, repositorio API, `CambioEstadoModal`, `FacturaDetailPage`).
* **Dependencias Existentes a Reutilizar:**
  - Backend: Value Object `Dinero`, `FacturaTypeOrmEntity`, `FacturaRepository`.
  - Frontend: Ant Design (`Select`, `Form`, `Input`, `Tag`), TanStack Query hooks `useSepararFactura`, `useEntregarFactura`, `useDevolverFactura`.

---

### 2. Definición Funcional y Reglas de Negocio
* **Narrativa de Usuario:**
  > **Como** empleado de mostrador,  
  > **Quiero** registrar con qué método (Efectivo, Nequi, Daviplata o Bre-B) y referencia paga el cliente en cada etapa,  
  > **Para** que la caja quede cuadrada y el dueño pueda conciliar el dinero del banco vs. el cajón.

* **Reglas Deterministas de Negocio:**
  1. **Valores Válidos:** El método de pago debe pertenecer estrictamente a: `'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BRE_B'`. Cualquier otro valor debe ser rechazado con HTTP 400.
  2. **Momento Separación:** Si `abono > 0`, `metodoPagoAbono` es obligatorio. Si `abono == 0`, `metodoPagoAbono` es `null`.
  3. **Momento Entrega (`ALQUILADA`):**
     - Si existe saldo pendiente (`saldoPendiente > 0`), `metodoPagoSaldo` es obligatorio.
     - `metodoPagoDeposito` es obligatorio para la custodia de la garantía.
     - Se permite explícitamente que `metodoPagoSaldo` y `metodoPagoDeposito` sean diferentes en la misma entrega (ej. saldo en Nequi y depósito en Efectivo).
  4. **Momento Devolución (`DEVUELTA`):**
     - `metodoPagoDevolucionDeposito` registra cómo se le devuelve el dinero al cliente.

* **Casos Borde (Edge Cases):**
  - **Facturas Históricas:** Columnas en BD deben ser `NULLABLE` para no romper facturas previas. Si son nulas, se interpretan como `EFECTIVO` por compatibilidad.
  - **Referencias:** El campo `referencia` debe sanitizarse (`trim()`). Si viene vacío o solo espacios, persistirse como `null`.
  - **Inmutabilidad:** Una vez pagado el abono o el saldo, su método no puede ser sobreescrito sin una acción de reversión auditada.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### A. DTO Crear Factura / Separación (`CrearFacturaDto`)
```typescript
{
  clienteId: string; // UUID v4 obligatorio
  abono?: number; // Opcional, min: 0
  metodoPagoAbono?: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BRE_B'; // Obligatorio si abono > 0
  referenciaAbono?: string; // Opcional, max 100 caracteres
  // ... campos existentes preservados
}
```

#### B. DTO Entregar Prendas (`EntregarPrendasDto`)
```typescript
{
  metodoPagoSaldo?: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BRE_B'; // Obligatorio si valor - abono > 0
  referenciaSaldo?: string; // Opcional, max 100 caracteres
  metodoPagoDeposito: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BRE_B'; // Obligatorio
  referenciaDeposito?: string; // Opcional, max 100 caracteres
}
```

#### C. DTO Devolver Prendas (`DevolverPrendasDto`)
```typescript
{
  metodoPagoDevolucionDeposito: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'BRE_B'; // Obligatorio
  referenciaDevolucionDeposito?: string; // Opcional
  observaciones?: string;
}
```

#### D. Errores Deterministas (RFC 9457)
* `400 Bad Request`:
  ```json
  {
    "type": "https://httpstatuses.com/400",
    "title": "Bad Request",
    "status": 400,
    "detail": "metodoPagoAbono debe ser uno de los siguientes valores: EFECTIVO, NEQUI, DAVIPLATA, BRE_B"
  }
  ```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)
*Co-diseñados y auditados junto con el **Auditor QA & Seguridad (`Bodegon-QA-Security-Auditor`)** para modelar la realidad del mostrador:*

#### Escenario 1: Separación con abono por Nequi (Happy Path)
* **Dado** que un empleado crea una factura con valor $100.000 y un abono de $40.000,
* **Cuando** envía `metodoPagoAbono = 'NEQUI'` y `referenciaAbono = 'M123456'`,
* **Entonces** la factura se crea en estado `SEPARADA`, con `metodoPagoAbono = 'NEQUI'`, `referenciaAbono = 'M123456'` y saldo pendiente de $60.000.

#### Escenario 2: Separación sin abono inicial ($0 pesos - Reserva en mostrador) (Happy Path)
* **Dado** que un cliente aparta un traje pero no deja abono inmediato (`abono = 0` o no provisto),
* **Cuando** el empleado crea la factura con `abono = 0` y `metodoPagoAbono = null`,
* **Entonces** la factura se persiste en estado `BORRADOR` con saldo pendiente igual al valor total y `metodoPagoAbono = null`.

#### Escenario 3: Abono mayor a cero sin método de pago especificado (Bad Request / 400)
* **Dado** que un empleado intenta crear una factura ingresando un abono de $30.000,
* **Cuando** omite el campo `metodoPagoAbono` o lo envía vacío/nulo,
* **Entonces** el servidor rechaza la solicitud con HTTP 400 Bad Request indicando que `metodoPagoAbono` es obligatorio cuando `abono > 0`, sin persistir nada en BD.

#### Escenario 4: Entrega con métodos combinados (Efectivo para saldo y Daviplata para depósito) (Happy Path)
* **Dado** una factura `SEPARADA` con saldo pendiente de $60.000 y depósito requerido de $50.000,
* **Cuando** el cliente paga el saldo en efectivo y el depósito por Daviplata (`metodoPagoSaldo = 'EFECTIVO'`, `metodoPagoDeposito = 'DAVIPLATA'`, `referenciaDeposito = 'DP-8821'`),
* **Entonces** el estado cambia a `ALQUILADA`, se registran ambos métodos de forma independiente, el saldo pasa a $0 y el depósito queda custodiado.

#### Escenario 5: Intento de entrega sin registrar depósito en garantía (Violación de Regla / 400)
* **Dado** una factura `SEPARADA` con saldo pagado pero sin depósito especificado,
* **Cuando** el empleado intenta ejecutar la entrega enviando `metodoPagoDeposito = null`,
* **Entonces** el servidor rechaza la petición con HTTP 400 (`DepositoRequeridoException`), la factura permanece en `SEPARADA` y las prendas no se marcan como retiradas.

#### Escenario 6: Devolución íntegra con reintegro de depósito por Nequi (Happy Path)
* **Dado** una factura `ALQUILADA` con depósito de $50.000 en custodia,
* **Cuando** el cliente devuelve las prendas completas y el empleado transfiere el reintegro enviando `metodoPagoDevolucionDeposito = 'NEQUI'` y `referenciaDevolucionDeposito = 'REV-9921'`,
* **Entonces** el estado cambia a `DEVUELTA`, `depositoDevuelto` pasa a `true`, y se registra la fecha, empleado y método de devolución.

#### Escenario 7: Intento de registro con método de pago no homologado (Bad Request / 400)
* **Dado** un formulario de cobro o separación en mostrador,
* **Cuando** un cliente o script intenta enviar un método no soportado (ej. `metodoPagoAbono = 'BITCOIN'` o `'CHEQUE'`),
* **Entonces** el servidor rechaza con HTTP 400 Bad Request retornando el listado exacto de métodos permitidos: `EFECTIVO, NEQUI, DAVIPLATA, BRE_B`.

#### Escenario 8: Referencia con espacios en blanco o caracteres vacíos (Sanitización Automática)
* **Dado** que el empleado digita la referencia con espacios accidentales: `"   NQ-7712   "`,
* **Cuando** se procesa la solicitud,
* **Entonces** el backend aplica `trim()`, persistiendo `"NQ-7712"`. Si el empleado solo digitó espacios `"   "`, se persiste como `null`.

#### Escenario 9: Reversión atómica por error de base de datos (Rollback / 500)
* **Dado** un proceso de entrega que actualiza factura, elementos y genera movimiento de caja,
* **Cuando** ocurre un fallo de red o caída en la transacción de base de datos,
* **Entonces** TypeORM ejecuta un `ROLLBACK` completo; no se marcan prendas como alquiladas ni se registran pagos parciales en el arqueo.

#### Escenario 10: Idempotencia en reintento de cobro sobre factura ya alquilada (Conflict / 409)
* **Dado** una factura que ya fue entregada y está en estado `ALQUILADA`,
* **Cuando** un empleado por doble clic o pérdida de conexión reenvía el endpoint de entrega,
* **Entonces** el servidor responde HTTP 409 Conflict (`TransicionInvalidaException: La factura ya se encuentra en estado ALQUILADA`), evitando duplicidad de ingresos en caja.


---

### 5. Restricciones Técnicas y Calidad (Constraints & Non-Functional)
* **Migración TypeORM:** Archivo con timestamp `1727100000000-AddMetodosPagoToFactura.ts`. No usar `dropColumn` destructivo; solo `addColumn` nullable.
* **Testing:** Prueba unitaria en `factura.entity.spec.ts` validando el guardado de los nuevos métodos y prueba en `crear-factura.use-case.spec.ts`.
* **Regla Anti-Rotura:** Mantener compatibilidad estricta con todas las llamadas preexistentes que no envían método (degradación elegante a `null` o valor por defecto).

---

### 6. Plan de Ejecución Secuencial por Áreas (Work Breakdown Structure - WBS)

#### 🗄️ Área 1: Base de Datos & Persistencia (Backend)
- [x] `[TSK-01.1-BD]` **Migración TypeORM:** Crear `1727100000000-AddMetodosPagoToFactura.ts` agregando las 8 columnas `NULLABLE` con `ADD COLUMN IF NOT EXISTS` y `DROP COLUMN IF EXISTS` en `down()`.
- [x] `[TSK-01.2-BD]` **Entidad TypeORM:** Mapear en `factura.typeorm-entity.ts` las 8 columnas de métodos y referencias.
- [x] `[TSK-01.3-BD]` **Mapeo en Repositorio:** Actualizar `factura.repository.impl.ts` en `toDomain()` y `save()` para persistir y cargar los 8 campos.

#### ⚙️ Área 2: Dominio & Aplicación (Backend Core)
- [x] `[TSK-01.4-DOM]` **Value Object MetodoPago:** Crear `metodo-pago.vo.ts` con enum (`EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`), helper de validación y sanitización `trim() -> null`.
- [x] `[TSK-01.5-DOM]` **Entidad de Dominio Factura:** Actualizar `factura.entity.ts` en `separar()`, `entregar()`, `devolver()`, getters y helper `esBorrador()`.
- [x] `[TSK-01.6-APP]` **DTOs de Factura:** Modificar `factura.dto.ts` (`SepararFacturaDto`, `EntregarFacturaDto`, `DevolverFacturaDto`) con validaciones `@IsEnum(MetodoPago)` y `@IsString()`.
- [x] `[TSK-01.7-APP]` **Casos de Uso & Auditoría:** Actualizar `factura.use-cases.ts` para registrar los métodos y referencias en el historial de eventos.

#### 🎨 Área 3: Capa de Datos & Hooks (Frontend Data)
- [x] `[TSK-01.8-FEDATA]` **Entidad Cliente Factura:** Mapear los 8 campos de pago y referencias en `frontend/src/modules/factura/domain/entities/factura.entity.ts`.
- [x] `[TSK-01.9-FEDATA]` **API Client & Hooks:** Actualizar firmas en `factura-api.repository.ts` y tipos en `use-facturas.ts` para enviar los datos al backend.

#### 🖥️ Área 4: Interfaz de Usuario & Experiencia de Mostrador (Frontend UI)
- [x] `[TSK-01.10-FEUI]` **Modal de Operaciones de Mostrador:** Actualizar `cambio-estado-modal.tsx` con selectores `Select` para `EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B` e inputs de referencia en flujos de Separación, Entrega (saldo + garantía independientes) y Devolución.
- [x] `[TSK-01.11-FEUI]` **Detalle de Factura:** Renderizar badges con etiquetas de método y referencia bajo Abono, Saldo y Depósito en `factura-detail-page.tsx`.

#### 🧪 Área 5: Calidad & Pruebas Automatizadas (QA)
- [x] `[TSK-01.12-QA]` **Pruebas Unitarias Value Object:** Crear `metodo-pago.vo.spec.ts` validando el catálogo de métodos y sanitización (8 tests).
- [x] `[TSK-01.13-QA]` **Pruebas Unitarias Entidad Factura:** Actualizar `factura.entity.spec.ts` probando ciclo completo con métodos mixtos.
- [x] `[TSK-01.14-QA]` **Configuración Jest ESM:** Configurar `moduleNameMapper` en `package.json` y `"types": ["jest", "node"]` en `tsconfig.json`. Suite pasando 100% (27/27 tests verdes).

#### 🚢 Área 6: DevOps & Entorno Contenedorizado (DevOps)
- [x] `[TSK-01.15-OPS]` **Docker & Variables de Entorno:** Configurar `.env.example` y crear `.env` local seguro para Docker Compose.
- [x] `[TSK-01.16-OPS]` **Soporte Multiplataforma Windows/Linux:** Convertir `docker-entrypoint.sh` a LF y blindar `backend/Dockerfile` con `sed -i` y `.gitattributes`.
- [x] `[TSK-01.17-OPS]` **Compilación de Contenedor Frontend:** Ejecutar `docker compose up -d --build frontend` para reflejar la UI en `http://localhost:3080`.

