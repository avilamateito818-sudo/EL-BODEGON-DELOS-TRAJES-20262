# ESPECIFICACIÓN DE DISEÑO UI/UX & ERGONOMÍA RESPONSIVE: SPRINT 1
## PROYECTO: CST BODEGÓN TRAJES — GESTIÓN Y ALQUILER DE TRAJES

**Rol:** `Bodegon-UIUX-Designer` (Diseñador Visual de Producto & Ergonomía de Mostrador)  
**Sprint:** Sprint 1 — Mejoras Operativas de Mostrador, Control de Dinero & Seguridad  
**Carpeta Oficial:** `.agents/governance/respuestas/sprint_1_mejoras/`  
**Rama de Trabajo:** `feature/sprint-1-mejoras`  
**Estado:** ✅ **APROBADO POR EL USUARIO HUMANO**  
**Fecha de Aprobación:** 2026-09-28  

---

## 1. Visión de Experiencia de Usuario (UX)

El diseño del Sprint 1 se enfoca en dos experiencias diferenciadas y optimizadas:
1. **Mostrador Operativo (Empleados & Administrador):** Velocidad máxima en teclado, cero clics innecesarios, trazabilidad clara de efectivo y control de prendas entregadas.
2. **Cliente Final (Smartphones / WhatsApp):** Consulta sin registro previo, interfaz limpia estilo ticket digital, teclado numérico automático y descarga directa del comprobante PDF.

---

## 2. Componentes e Interacciones Diseñadas

### 2.1. Pantalla de Cuadre de Caja (`/cuadre-caja`)

* **Hero Card — Efectivo Físico Esperado en Cajón:**
  - Ubicación: Cabecera superior izquierda.
  - Estilo: Borde y acento en verde esmeralda (`#10B981` / `#059669`), fondo blanco puro, tipografía en `text-3xl font-extrabold`.
  - Comportamiento: Se calcula en tiempo real con cada movimiento financiero registrado en la tienda. No requiere ninguna acción por parte del empleado durante el turno.

* **Comparador de Cierre de Turno (Semáforo de Arqueo):**
  - **Momento de Uso:** Únicamente al finalizar la jornada o al entregar el turno.
  - **Interacción:** El empleado cuenta el dinero físico del cajón y escribe el monto en la casilla *"Efectivo Real Contado"*.
  - **Feedback Inmediato en Pantalla:**
    - `Verde (Caja Cuadrada):` Si coincide con el esperado ➔ `✅ ¡Caja Cuadrada Perfecta! ($0 de diferencia)`.
    - `Rojo Carmesí (Faltante):` Si falta dinero ➔ `⚠️ Faltante en Caja: -$X.XXX`.
    - `Azul Informativo (Sobrante):` Si sobra dinero ➔ `ℹ️ Sobrante en Caja: +$X.XXX`.

* **Tarjetas de Canales Digitales:**
  - Acentos cromáticos institucionales:
    - **Nequi:** Borde morado `#7000FF` / `#4A154B`.
    - **Daviplata:** Borde rojo `#ED1C24`.
    - **Bre-B:** Borde azul fintech `#0284C7`.
  - Muestran el total recaudado por cada billetera digital para fácil conciliación bancaria.

* **Tabla de Auditoría de Movimientos del Turno:**
  - Listado cronológico de transacciones: `Hora` | `Factura #` | `Cliente` | `Concepto` | `Método` | `Monto`.
  - Badges semánticos de color: Abono (Azul), Saldo de Entrega (Cian), Depósito en Custodia (Naranja), Reintegro de Depósito (Púrpura).
  - Scroll horizontal suave (`overflow-x-auto`) adaptado para tablets de mostrador.

---

### 2.2. Ergonomía de Piezas de Trajes

* **Editor Rápido en Facturación (`factura-elementos-editor.tsx`):**
  - Al pulsar sobre el nombre del traje, se abre un popover ágil sobre el renglón.
  - Input con autofoco: *"Escribe pieza y pulsa Enter (ej. Saco, Pantalón, Capa)..."*.
  - Al pulsar `[Enter]`, la pieza se convierte de inmediato en un tag visual removible (`<Tag color="processing" closable>`).
  - En la tabla principal, las piezas se visualizan como pastillas compactas para verificación rápida.

* **Checklist Táctil en Devolución (`devolucion-modal.tsx`):**
  - Checkboxes amplios de fácil pulsación táctil (44x44 px).
  - Medidor de completitud superior: `[████████████████████] 3 de 3 piezas devueltas (100% completo)`.
  - Al desmarcar una pieza no devuelta, el medidor cambia a color ámbar y despliega el campo para detallar la penalización sobre el depósito.

---

### 2.3. Portal Móvil del Cliente (`/mis-alquileres`)

* **Experiencia Mobile-First:**
  - Cabecera limpia con el logo de **Bodegón Trajes** sin barras de navegación internas.
  - Input de celular centrado con `inputMode="numeric"` y `pattern="[0-9]*"`, levantando automáticamente el teclado numérico en teléfonos móviles.
  - Tarjetas de alquiler tipo ticket con fechas límite destacadas, desglose de piezas prestadas y botón primario de ancho completo: `[ 📥 Descargar Comprobante PDF ]`.

---

### 2.4. Switch de Turnos y Botón de WhatsApp

* **Switch de Turno en Administrador (`empleados-page.tsx`):**
  - Control visual tipo interruptor con feedback cromático: Verde (Turno Activo) / Gris (Turno Inactivo).
  - Tooltip explicativo del impacto en el acceso del empleado.

* **Botón de WhatsApp (`factura-detail-page.tsx`):**
  - Botón con tono verde oficial (`#25D366`) e icono de WhatsApp.
  - Genera automáticamente el mensaje para WhatsApp Web o app móvil con el enlace público hacia `/mis-alquileres`.
