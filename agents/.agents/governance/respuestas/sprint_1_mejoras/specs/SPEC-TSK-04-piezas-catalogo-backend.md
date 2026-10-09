# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-04 & TSK-05 (FULLSTACK BLINDADA)
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-04]` (Backend) + `[TSK-05]` (Frontend)  
**Título:** Persistencia de `piezas jsonb`, Plantilla en Catálogo, Checklist Individual de Devolución y Retención de Depósito  
**Rama Git Unificada:** `feature/TSK-04-piezas-catalogo`  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-Software-Architect`, `Bodegon-UIUX-Designer` y `Bodegon-QA-Security-Auditor`)  
**Estado:** 🟢 **100% BLINDADA CON DECISIONES DE NEGOCIO VALIDADAS**  

---

### 1. Contexto y Alcance Fullstack (Context & Boundary)
* **Objetivo General:** 
  1. Permitir que cada prenda alquilada en una factura tenga un desglose explícito de sus componentes o accesorios (`piezas`: array de strings, ej: `["Saco", "Pantalón", "Chaleco", "Corbatín"]`), ingresados ágilmente con teclado (`Enter`).
  2. Implementar la regla de negocio de **Auto-Poblado de Catálogo (REQ-05)**: cuando se agregue un elemento personalizado que no exista en el inventario general, se registra automáticamente en `elementos_catalogo` de forma idempotente con su nombre, precio y sus piezas como **plantilla predeterminada**.
  3. Al seleccionar un traje del catálogo, sus piezas predeterminadas se precargan en el editor, permitiendo al dependiente **añadir o remover piezas libremente** si el cliente lleva más o menos accesorios.
  4. En el proceso de devolución (`cambio-estado-modal.tsx`), presentar un **checklist táctil individualizado** (desglosado por prenda, incluso cuando `cantidad > 1`), con medidor de completitud. Si falta una pieza, permitir **retener parte o la totalidad del depósito** y registrar la observación obligatoria, sincronizando la salida real de dinero con el módulo de **Caja**.
  5. Soportar facturas heredadas sin piezas mediante paso directo no bloqueante.

* **Fuentes de Datos:**
  - Tabla `factura_elementos`: Columna `piezas jsonb DEFAULT '[]'::jsonb`.
  - Tabla `elementos_catalogo`: Columna `piezas jsonb DEFAULT '[]'::jsonb` (plantilla sugerida).
  - Tabla `historial_factura`: Detalle inmutable con `piezasDevueltas`, `depositoOriginal`, `montoDevolucionDeposito`, `montoRetenido` y `observaciones`.

* **Ubicación en el Sistema:**
  - Migración Backend: `backend/src/migrations/1727300000000-AddPiezasToFacturaElementosAndCatalogo.ts`
  - Entidades TypeORM: `factura-elemento.typeorm-entity.ts`, `elemento-catalogo.typeorm-entity.ts`
  - Entidad de Dominio: `factura.entity.ts` (`FacturaElemento.piezas: string[]`)
  - Casos de Uso Backend: `factura.use-cases.ts` (`AgregarElementoUseCase`, `DevolverFacturaUseCase`)
  - DTOs: `factura.dto.ts` (`AgregarElementoDto`, `DevolverFacturaDto`)
  - Helpers de Caja: `calculos-caja.helper.ts` (computa la salida real de caja según `montoDevolucionDeposito`)
  - Componentes Frontend:
    - `frontend/src/modules/factura/presentation/components/piezas-tag-editor.tsx` (Editor con `Enter` y tags)
    - `frontend/src/modules/factura/presentation/components/factura-elementos-editor.tsx` (Pre-carga de plantilla y edición)
    - `frontend/src/modules/factura/presentation/components/cambio-estado-modal.tsx` (Checklist individualizado, retención de depósito y observaciones)
    - `frontend/src/modules/factura/domain/entities/factura.entity.ts` (Tipos TypeScript de piezas)

---

### 2. Definición Funcional y Reglas de Negocio Validadas

* **Narrativa de Usuario:**
  > **Como** dependiente de mostrador,  
  > **Quiero** que al elegir un traje del catálogo se precarguen sus piezas sugeridas pero pudiendo quitar o agregar accesorios si el cliente lo requiere, y que las prendas nuevas se guarden solas en el catálogo con sus piezas,  
  > **Y como** encargado de devoluciones, quiero revisar cada pieza individualmente en un checklist táctil y, si falta alguna, retener el valor correspondiente del depósito,  
  > **Para** que la tienda nunca pierda prendas sin compensación y la gaveta de caja cuadre exactamente con el dinero reintegrado.

* **Reglas Deterministas de Negocio:**
  1. **Plantilla en Catálogo & Flexibilidad en Mostrador:**
     - `elementos_catalogo.piezas` actúa únicamente como **sugerencia/plantilla**.
     - Cuando el dependiente selecciona un traje del catálogo en `factura-elementos-editor.tsx`, sus piezas se cargan en la fila.
     - El dependiente puede pulsar `(x)` en cualquier tag para quitarlo (ej: cliente no llevará chaleco), o escribir con `Enter` accesorios adicionales (ej: tirantas, fajín).
     - Lo que se guarda en `factura_elementos.piezas` es exactamente lo que el cliente físicamente se llevó.
  2. **Auto-Guardado Inteligente en Catálogo (REQ-05):**
     - Si se añade un ítem con `nombrePersonalizado` y no viene `catalogoId`:
     - Búsqueda en `elementos_catalogo` por `LOWER(TRIM(nombre)) = LOWER(TRIM(:nombrePersonalizado))`.
     - **Si NO existe:** Se crea automáticamente en el catálogo con:
       * `id = randomUUID()`
       * `nombre = nombrePersonalizado.trim()`
       * `precioSugerido = precioUnitario`
       * `piezas = sanitizedPiezas` (guarda las piezas digitadas como plantilla futura)
       * `activo = true`
     - **Si YA existe:** Reutiliza el ID existente en catálogo.
  3. **Checklist de Devolución Individualizado (`cantidad > 1`):**
     - Si un elemento tiene `cantidad = 2` y piezas `["Saco", "Pantalón"]`, el checklist desglosa 4 casillas independientes:
       - `[x] Traje 1 - Saco`
       - `[x] Traje 1 - Pantalón`
       - `[x] Traje 2 - Saco`
       - `[x] Traje 2 - Pantalón`
     - Todas las casillas inician marcadas `[x]` por defecto.
     - Barra de completitud:  
       $$\text{Porcentaje} = \left(\frac{\text{Piezas Marcadas}}{\text{Total Piezas}}\right) \times 100$$
  4. **Retención de Depósito & Sincronización con Caja (Opción A):**
     - **Si 100% de piezas marcadas:**
       * El monto a devolver es por defecto el 100% del depósito en custodia.
     - **Si alguna pieza se desmarca (< 100%):**
       * La barra cambia a color ámbar/rojo con aviso de *"Prendas faltantes detectadas"*.
       * El campo `montoDevolucionDeposito` se vuelve editable para que el dependiente ingrese el dinero que realmente devuelve (ej: de $50.000 devuelve $30.000).
       * El campo `observaciones` se vuelve **obligatorio** para auditar el motivo de la retención ($20.000 por corbatín extraviado).
       * **Impacto en Caja:** El reintegro registrado en la caja diaria será exactamente por los $30.000 devueltos (no los $50.000 originales), garantizando que el dinero físico en mano coincida con el esperado.
  5. **Compatibilidad con Facturas Antiguas (Sin Piezas):**
     - Si una factura no tiene piezas desglosadas, se muestra:  
       *"ℹ️ Esta factura no tiene desglose de piezas registrado."*
     - El empleado puede proceder a la devolución del depósito de forma estándar sin bloqueos.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### A. DTO Agregar Elemento a Factura (`POST /api/v1/facturas/:id/elementos`)
```typescript
export class AgregarElementoDto {
  @IsOptional() @IsUUID() catalogoId?: string;
  @IsOptional() @IsString() nombrePersonalizado?: string;
  @IsNumber() @Min(0) precioUnitario: number;
  @IsOptional() @IsInt() @Min(1) cantidad?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) piezas?: string[];
}
```

#### B. DTO Devolver Factura (`PATCH /api/v1/facturas/:id/devolver`)
```typescript
export class DevolverFacturaDto {
  @IsNotEmpty() metodoPagoDevolucionDeposito: string;
  @IsOptional() @IsString() referenciaDevolucionDeposito?: string;
  @IsOptional() @IsNumber() @Min(0) montoDevolucionDeposito?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) piezasDevueltas?: string[];
  @IsOptional() @IsString() observaciones?: string;
}
```

#### C. Detalle de Auditoría en Historial (`historial_factura.detalle`)
```json
{
  "depositoOriginal": 50000,
  "montoDevolucionDeposito": 30000,
  "montoRetenido": 20000,
  "metodoPagoDevolucion": "EFECTIVO",
  "referenciaDevolucionDeposito": null,
  "piezasDevueltas": ["Traje 1 - Saco", "Traje 1 - Pantalón"],
  "piezasFaltantes": ["Traje 1 - Corbatín"],
  "observaciones": "Cliente extravió el corbatín de satín negro. Se retienen $20.000 de penalidad."
}
```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Prenda nueva se auto-registra en catálogo con piezas como plantilla
* **Dado** que no existe "Disfraz Goku" en el catálogo,
* **Cuando** el empleado lo agrega con precio $40.000 y piezas `["Kimono Naranja", "Cinturón Azul", "Muñequeras"]`,
* **Entonces** se crea automáticamente en `elementos_catalogo` con ese nombre, precio sugerido y las 3 piezas como plantilla.

#### Escenario 2: Empleado personaliza las piezas de un ítem del catálogo
* **Dado** que "Traje Smoking" tiene en catálogo las piezas `["Saco", "Pantalón", "Chaleco", "Corbatín"]`,
* **Cuando** el empleado lo selecciona en la factura, elimina `"Chaleco"` y agrega `"Tirantas"`,
* **Entonces** la factura guarda exactamente `["Saco", "Pantalón", "Corbatín", "Tirantas"]` sin alterar la plantilla general del catálogo.

#### Escenario 3: Devolución con prenda faltante y retención parcial de depósito (Opción A)
* **Dado** un alquiler con depósito de $50.000 y piezas `["Saco", "Pantalón", "Corbatín"]`,
* **Cuando** el cliente regresa sin el corbatín y el dependiente lo desmarca en el checklist,
* **Entonces** la barra marca 67% (ámbar), el campo de observaciones se hace obligatorio, el dependiente ajusta el reintegro a $30.000 y en el arqueo de Caja la salida de efectivo es exactamente $30.000.

#### Escenario 4: Devolución de factura heredada sin piezas
* **Dado** una factura creada antes de implementar la funcionalidad de piezas,
* **Cuando** el empleado abre el modal de devolución,
* **Entonces** el sistema muestra un banner informativo sin casillas rotas y permite devolver el depósito directamente.

---

### 5. Plan de Ejecución Secuencial por Áreas (WBS)

#### 🗄️ Área 1: Base de Datos & Persistencia (Backend)
- [x] `[TSK-04.1-BD]` **Migración TypeORM:** Crear `backend/src/migrations/1727300000000-AddPiezasToFacturaElementosAndCatalogo.ts` agregando `piezas JSONB DEFAULT '[]'::jsonb` tanto a `factura_elementos` como a `elementos_catalogo`.
- [x] `[TSK-04.2-BD]` **Entidades TypeORM:** Actualizar `factura-elemento.typeorm-entity.ts` y `elemento-catalogo.typeorm-entity.ts` con la columna `piezas: string[]`.
- [x] `[TSK-04.3-BD]` **Repositorio Facturas & Catálogo:** Mapear `piezas` en inserciones y lecturas.

#### ⚙️ Área 2: Dominio & DTOs (Backend Core)
- [x] `[TSK-04.4-DOM]` **Entidad de Dominio:** Actualizar `FacturaElemento` en `factura.entity.ts` con `piezas: string[]`.
- [x] `[TSK-04.5-APP]` **DTOs de Factura:** Actualizar `AgregarElementoDto` y `DevolverFacturaDto` con `montoDevolucionDeposito`, `piezasDevueltas` y `observaciones`.

#### 🧠 Área 3: Casos de Uso & Lógica Contable (Backend Application)
- [x] `[TSK-04.6-APP]` **Auto-Guardado en Catálogo (REQ-05):** En `AgregarElementoUseCase`, auto-insertar prendas nuevas con sus piezas en `elementos_catalogo`.
- [x] `[TSK-04.7-APP]` **Devolución con Retención & Caja:** En `DevolverFacturaUseCase`, soportar `montoDevolucionDeposito`, registrar retención en historial y garantizar que `calculos-caja.helper.ts` use el monto realmente reintegrado.

#### 🎨 Área 4: Frontend & Experiencia de Mostrador (UI/UX)
- [x] `[TSK-05.1-UI]` **Componente `PiezasTagEditor`:** Input ágil con tecla `Enter`, chips removibles y autofocus.
- [x] `[TSK-05.2-UI]` **Integración en Editor de Factura:** Precarga de piezas sugeridas del catálogo en `factura-elementos-editor.tsx` con libertad total de edición.
- [x] `[TSK-05.3-UI]` **Visualización en Detalle de Factura:** Renderizado de tags de piezas en la tabla de prendas de `factura-detail-page.tsx`.
- [x] `[TSK-05.4-UI]` **Checklist de Devolución & Retención:** En `cambio-estado-modal.tsx`:
  - Desglose individual de piezas (manejando `cantidad > 1`).
  - Barra de progreso (Verde 100% / Ámbar faltantes).
  - Campo editable de monto a reintegrar y observaciones obligatorias si hay faltantes.
  - Soporte amigable para facturas antiguas sin piezas.

#### 🧪 Área 5: Calidad & Pruebas Automatizadas (QA)
- [x] `[TSK-04.8-QA]` **Pruebas Unitarias de Backend:** Tests Jest en `factura.use-cases.spec.ts` para guardado de piezas, catálogo y devolución con retención.

#### 🚢 Área 6: Despliegue Local & Verificación (DevOps)
- [x] `[TSK-04.9-OPS]` **Migración y Verificación en Docker:** Ejecutar migración en PostgreSQL container, rebuild de contenedores y verificación del flujo completo en `http://localhost:3080/facturas`.
