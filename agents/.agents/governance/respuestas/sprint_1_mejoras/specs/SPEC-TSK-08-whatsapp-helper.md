# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-08
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-08]`  
**Título:** Botón Rápido de WhatsApp con Mensaje Dinámico Neutro, Recordatorio de PIN y Acceso Inmediato  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-Software-Architect`, `Bodegon-QA-Security-Auditor` y `Bodegon-UIUX-Designer`)  
**Estado:** 🟢 **100% BLINDADA CON DECISIONES DE NEGOCIO Y SEGURIDAD VALIDADAS**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:**
  1. Integrar el protocolo nativo universal de enlaces de WhatsApp (`https://wa.me/57...`) para compartir el comprobante y estado de alquiler en un solo clic, sin costos de APIs de Meta ni consumibles de papel.
  2. Implementar mensajes estructurados en tono **estrictamente neutro, profesional y sobrio** para los estados **`SEPARADA`**, **`ALQUILADA`** y **`DEVUELTA`**.
  3. Incluir en el mensaje el enlace directo hacia `/mis-alquileres?tel={celular}` junto con un **recordatorio sutil** de que la clave de acceso para ver sus prendas y PDF son los **últimos 4 dígitos de su cédula/documento**.
  4. Proveer **Acceso Inmediato** para el empleado de mostrador:
     - Botón inmediato al confirmar el cambio de estado en `cambio-estado-modal.tsx` (para que el empleado no tenga que buscarlo).
     - Botón permanente en la barra superior de acciones de `factura-detail-page.tsx`.
  5. Proveer botón secundario **Copiar al Portapapeles** por si la máquina no tiene WhatsApp Web abierto o los popups están bloqueados.
* **Out of Scope:** APIs de pago WhatsApp Business / Cloud API (se usa el estándar universal `wa.me` sin costes).
* **Ubicación en el Sistema:**
  - Helper: `frontend/src/modules/factura/presentation/utils/whatsapp-share.helper.ts`
  - Componente Botón & Modal: `frontend/src/modules/factura/presentation/components/whatsapp-share-button.tsx`
  - Vistas integradas: `factura-detail-page.tsx` y `cambio-estado-modal.tsx`

---

### 2. Definición Funcional y Reglas de Negocio Validadas

* **Narrativa de Usuario:**
  > **Como** empleado de mostrador de CST Bodegón Trajes,  
  > **Quiero** enviar un WhatsApp inmediato al cliente al separar, entregar o devolver un alquiler,  
  > **Para** que tenga su comprobante digital en el portal web con su fecha límite (antes de las 6:00 PM), prendas y saldos, sin incurrir en costos de papel ni APIs de pago.

* **Reglas Deterministas de Construcción del Mensaje (Tono Neutro):**

  1. **Plantilla Estado `SEPARADA` (Reserva en Tienda):**
     ```text
     Hola {nombreCliente}, confirmamos la reserva de tu alquiler #{numeroFactura} en CST Bodegón Trajes.

     💰 Abono registrado: ${abono} | Saldo pendiente: ${saldoPendiente}
     📅 Fecha estimada de recogida: {fechaRecogida}
     🔗 Consulta tus prendas reservadas y comprobante en: {urlPortal}
     (Tu clave de acceso son los últimos 4 dígitos de tu documento registrado)
     ```

  2. **Plantilla Estado `ALQUILADA` (Prendas Entregadas al Cliente):**
     ```text
     Hola {nombreCliente}, confirmamos la entrega de tu alquiler #{numeroFactura} en CST Bodegón Trajes.

     📅 Fecha límite de devolución: {fechaDevolucion} (antes de las 6:00 PM)
     💵 Depósito en garantía: ${deposito}
     🔗 Consulta el checklist de prendas prestadas y comprobante en: {urlPortal}
     (Tu clave de acceso son los últimos 4 dígitos de tu documento registrado)
     ```

  3. **Plantilla Estado `DEVUELTA` (Recepción de Prendas Finalizada):**
     ```text
     Hola {nombreCliente}, confirmamos la recepción y devolución de las prendas de tu alquiler #{numeroFactura} en CST Bodegón Trajes.

     ✅ Estado: Devolución registrada a satisfacción en tienda.
     🔗 Puedes consultar tu comprobante final en: {urlPortal}
     (Tu clave de acceso son los últimos 4 dígitos de tu documento registrado)
     ```

* **Reglas de Normalización y Seguridad de Números (Colombia):**
  1. Extraer solo caracteres numéricos: `const digits = celular.replace(/\D/g, '')`.
  2. Si tiene 10 dígitos (ej. `3101234567`): anteponer `57` -> `573101234567`.
  3. Si tiene 12 dígitos y empieza por `573` (ej. `573101234567`): se mantiene.
  4. Si no cumple el patrón `^573\d{9}$`: se considera inválido.
  5. URL generada: `https://wa.me/{numeroNormalizado}?text={encodeURIComponent(mensaje)}`.

* **Generación del Enlace al Portal:**
  - Formato: `${window.location.origin}/mis-alquileres?tel=${celular10Digitos}`
  - En la VPS con dominio oficial, `window.location.origin` toma automáticamente el protocolo HTTPS y dominio público (`https://bodegontrajes.com/mis-alquileres?tel=3101234567`).

* **Casos Borde (Edge Cases):**
  - **Cliente sin celular o celular inválido:** El botón de WhatsApp se deshabilita con un `Tooltip`: *"Registra un celular válido de 10 dígitos para habilitar el envío por WhatsApp"*.
  - **Factura en Borrador o Cancelada:** El botón no se muestra.
  - **Navegador bloquea popup de WhatsApp:** El empleado dispone del botón `[ 📋 Copiar ]` para copiar el texto completo al portapapeles y pegarlo en cualquier chat.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

```typescript
export interface DatosWhatsAppFactura {
  numeroFactura: string;
  clienteNombre: string;
  clienteTelefono: string;
  estado: string; // 'separado' | 'entregado' | 'devuelto' o 'SEPARADA' | 'ALQUILADA' | 'DEVUELTA'
  abono: number;
  saldoPendiente: number;
  deposito: number;
  fechaEntrega?: string | null;
  fechaDevolucion?: string | null;
  fechaRecogida?: string | null;
}

export function normalizarCelularColombia(telefonoRaw: string): {
  valido: boolean;
  telefonoInternacional: string;
  telefonoLocal: string;
} {
  // Retorna telefono con 57 y local de 10 digitos
}

export function construirMensajeWhatsApp(datos: DatosWhatsAppFactura): {
  textoMensaje: string;
  urlWhatsApp: string | null;
  urlPortal: string;
} {
  // Construye texto neutro, url codificada y enlace directo al portal
}
```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Compartir alquiler en estado SEPARADA
* **Dado** una factura en estado `separado` con cliente "Santiago" y celular "3101234567",
* **Cuando** el empleado da clic en `[ 💬 Enviar WhatsApp ]`,
* **Entonces** se abre `wa.me` con el mensaje de reserva, abono, saldo pendiente, fecha estimada y recordatorio de PIN.

#### Escenario 2: Compartir alquiler en estado ALQUILADA
* **Dado** una factura en estado `entregado` con cliente y celular válido,
* **Cuando** el empleado pulsa enviar WhatsApp,
* **Entonces** el mensaje incluye fecha límite antes de las 6:00 PM, depósito en garantía y enlace con query `?tel=...`.

#### Escenario 3: Acceso Inmediato tras cambio de estado
* **Dado** que el empleado acaba de registrar un abono para separar o entregó prendas en `cambio-estado-modal.tsx`,
* **Cuando** finaliza exitosamente la mutación,
* **Entonces** se presenta un diálogo inmediato con el botón de WhatsApp y Copiar sin tener que navegar a otra pantalla.

#### Escenario 4: Teléfono inválido o ausente
* **Dado** una factura con cliente sin teléfono,
* **Cuando** el empleado ve el botón,
* **Entonces** permanece deshabilitado con un Tooltip claro informando la razón.

---

### 5. Plan de Ejecución Secuencial (WBS)

- [x] `[TSK-08.1-UI]` **Helper WhatsApp:** Implementar `whatsapp-share.helper.ts` con normalización de celulares, plantillas neutras para `SEPARADA`, `ALQUILADA` y `DEVUELTA`, y recordatorio sutil de PIN.
- [x] `[TSK-08.2-UI]` **Componente Botón WhatsApp:** Crear `whatsapp-share-button.tsx` con estilo oficial (`#25D366`), botón de copiar al portapapeles y tooltips.
- [x] `[TSK-08.3-UI]` **Integración en `factura-detail-page.tsx`:** Agregar botón en la cabecera principal de la factura y panel de acciones.
- [x] `[TSK-08.4-UI]` **Botón Inmediato en `cambio-estado-modal.tsx`:** Modal post-operación para envío en 1 clic tras separar, entregar o devolver.
- [x] `[TSK-08.5-QA]` **Pruebas Unitarias:** Tests para normalización de teléfonos, construcción de plantillas neutras y codificación de URLs (100% PASS).
- [x] `[TSK-08.6-OPS]` **Verificación en Docker:** Build y despliegue exitoso de contenedores `backend` y `frontend`.
