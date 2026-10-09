# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-05
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-05]`  
**Título:** UI de Desglose de Piezas (`Enter` + Tags) y Checklist Táctil de Devolución  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-QA-Security-Auditor` y `Bodegon-UIUX-Designer`)  
**Estado:** 🟢 **COMPLETADA ✅**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** Construir la experiencia de usuario en mostrador para registrar piezas escribiendo y presionando `Enter` sin despegar las manos del teclado, y el checklist visual táctil con medidor de completitud durante el retorno de prendas.
* **Out of Scope:** Reconocimiento de imágenes o escáneres RFID de prendas.
* **Ubicación en el Sistema:**
  - `frontend/src/modules/factura/presentation/components/factura-elementos-editor.tsx`
  - `frontend/src/modules/factura/presentation/components/piezas-tag-editor.tsx`
  - `frontend/src/modules/factura/presentation/components/devolucion-modal.tsx`
* **Dependencias:** Ant Design (`Tag`, `Input`, `Checkbox`, `Progress`, `Modal`, `Alert`).

---

### 2. Definición Funcional y Reglas de Negocio
* **Narrativa de Usuario:**
  > **Como** dependiente en mostrador,  
  > **Quiero** digitar rápido las piezas que entrego y marcarlas al recibir el traje devuelto,  
  > **Para** evitar devolver depósitos si el cliente olvidó el corbatín o estropeó una prenda.

* **Reglas Deterministas de Interfaz:**
  1. **Editor con Tecla Enter:**
     - En la tabla de factura, la celda de la prenda muestra las piezas existentes como pastillas (`<Tag color="processing">`).
     - Al hacer clic en la celda o botón `+ Piezas`, se despliega el input con autofocus.
     - Cada pulsación de `[Enter]` valida que el texto no esté en blanco, le aplica `trim()` y lo añade a la lista local.
     - Cada pieza tiene botón `(x)` para removerla en un clic.
  2. **Checklist de Devolución:**
     - Al abrir el modal de devolución (`devolucion-modal.tsx`), las piezas guardadas en la factura se presentan en un `Checkbox.Group`.
     - Por defecto, todas las piezas inician marcadas `[x]`.
     - Medidor superior:  
       $$\text{Porcentaje} = \left(\frac{\text{Piezas Marcadas}}{\text{Total Piezas}}\right) \times 100$$
     - Si todas están marcadas: Barra verde al 100% y mensaje *"Prendas completas: Depósito listo para reintegro íntegro"*.
     - Si alguna se desmarca: Barra en color ámbar/rojo y se despliega un campo de texto obligatorio *"Observación de prenda faltante o averiada"* para justificar la retención.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)
* **Props `PiezasTagEditor`:**
  ```typescript
  interface PiezasTagEditorProps {
    piezas: string[];
    onChange: (nuevasPiezas: string[]) => void;
    readOnly?: boolean;
  }
  ```
* **Payload en Devolución:** Envía `piezasDevueltas: string[]`, `metodoPagoDevolucionDeposito: string` y `observaciones?: string`.

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)
*Co-diseñados y auditados junto con el **Auditor QA & Seguridad (`Bodegon-QA-Security-Auditor`)**:*

#### Escenario 1: Empleado agrega 4 piezas en 5 segundos con teclado (Happy Path)
* **Dado** que el empleado está agregando un traje en el editor de factura,
* **Cuando** escribe `"Saco"` [Enter], `"Pantalón"` [Enter], `"Chaleco"` [Enter] y `"Corbata"` [Enter],
* **Entonces** se renderizan 4 tags visuales independientes sin perder el foco del campo de texto.

#### Escenario 2: Empleado borra una pieza agregada por error
* **Dado** un traje con las piezas `["Saco", "Pantalón", "Corbatín"]`,
* **Cuando** el empleado pulsa la cruz `(x)` del tag `"Corbatín"`,
* **Entonces** la pieza desaparece inmediatamente del listado y el contador actualiza a 2 piezas.

#### Escenario 3: Cliente devuelve traje completo (Happy Path Devolución)
* **Dado** un alquiler con 3 piezas registradas (`Saco`, `Pantalón`, `Fajín`),
* **Cuando** el empleado abre el modal de devolución con las 3 casillas marcadas,
* **Entonces** el sistema indica `3/3 (100% completo)` y habilita el botón de reintegro de depósito.

#### Escenario 4: Cliente olvida una pieza en la devolución (Retención Justificada)
* **Dado** un alquiler con piezas `["Saco", "Pantalón", "Chaleco"]`,
* **Cuando** el empleado desmarca `"Chaleco"` porque no fue devuelto,
* **Entonces** la barra cambia a color ámbar `2/3`, aparece una advertencia en pantalla y el campo de observaciones se vuelve obligatorio para registrar el cobro por la prenda perdida.

---

### 5. Restricciones Técnicas y Calidad (Constraints & Non-Functional)
* **Touch-Friendly:** En dispositivos móviles y tablets, el área de pulsación de los checkboxes debe medir mínimo `44x44 px` para evitar pulsaciones erróneas.

---

### 6. Plan de Ejecución y Verificación Realizado (WBS)
- [x] `[TSK-05.1-UI]` **Componente `PiezasTagEditor`:** Input ágil con tecla `Enter`, chips removibles `(x)`, validación de duplicados/vacíos y modo `readOnly`.
- [x] `[TSK-05.2-UI]` **Integración en Editor de Mostrador (`factura-elementos-editor.tsx`):** Precarga de plantilla desde catálogo y libertad total para quitar/agregar accesorios.
- [x] `[TSK-05.3-UI]` **Checklist Táctil y Retención en Devolución (`cambio-estado-modal.tsx`):**
  - Desglose individual de piezas para `cantidad > 1` (ej. `Traje 1 - Saco`, `Traje 2 - Saco`).
  - Botones táctiles de min `44px` para tablets/móviles.
  - Barra de progreso dinámica (Verde 100% / Ámbar con aviso de faltantes).
  - Ajuste de `montoDevolucionDeposito` y cálculo de retención.
  - Validación de observaciones obligatorias en caso de piezas faltantes o retención.
  - Soporte no bloqueante para facturas históricas sin piezas.
- [x] `[TSK-05.4-UI]` **Visualización en Detalle de Factura (`factura-detail-page.tsx`):** Tags en tabla de prendas y panel de Depósito rediseñado (responsive, métricas limpias, cero amontonamiento).
- [x] `[TSK-05.5-UI]` **Trazabilidad en Historial (`factura-historial-table.tsx`):** Desglose de depósito original, monto devuelto, badge de retención, piezas devueltas y observaciones.

