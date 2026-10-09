# ESPECIFICACIÓN DE REQUERIMIENTOS DE NEGOCIO (PRD): SPRINT 1
## PROYECTO: CST BODEGÓN TRAJES — GESTIÓN Y ALQUILER DE TRAJES

**Rol:** `Bodegon-Product-Owner` (Product Owner & Business Analyst)  
**Sprint:** Sprint 1 — Mejoras Operativas de Mostrador, Control de Dinero & Seguridad  
**Carpeta Oficial:** `.agents/governance/respuestas/sprint_1_mejoras/`  
**Estado:** ✅ **APROBADO POR EL PRODUCT OWNER HUMANO**  
**Fecha de Aprobación:** 2026-09-27  

---

## 1. Visión y Meta del Sprint 1

El Sprint 1 tiene como misión **empoderar a los empleados en el mostrador**, blindar el control de caja para evitar descuadres de dinero, evitar pérdidas de accesorios en los trajes alquilados y ofrecer un portal moderno de autoconsulta para que los clientes descarguen sus comprobantes sin consumir almacenamiento en el servidor VPS.

---

## 2. Especificación Detallada de Requerimientos

### REQ-01: Múltiples Métodos de Pago Locales (Efectivo, Nequi, Daviplata, Bre-B)
* **Contexto:** Adaptación estricta al mercado colombiano y trazabilidad de ingresos por canal.
* **Métodos Soportados:**
  1. `EFECTIVO`
  2. `NEQUI`
  3. `DAVIPLATA`
  4. `BRE-B` (Nuevo sistema interoperable de pagos inmediatos en Colombia)
* **Momentos de Registro:**
  - **Momento A (Separación):** Monto abonado + Selector de Método + Referencia opcional (ej. comprobante digital).
  - **Momento B (Entrega de Prendas `ALQUILADA`):**
    * Saldo de Alquiler: Monto + Selector de Método + Referencia opcional.
    * Depósito en Garantía: Monto + Selector de Método + Referencia opcional.
    *(Permitir métodos distintos para saldo y depósito en la misma transacción).*
  - **Momento C (Devolución `DEVUELTA`):**
    * Reintegro de depósito: Selector de método con el que se le devuelve el dinero al cliente.

---

### REQ-02: Módulo de Cuadre de Caja Diario (Arqueo de Turno)
* **Objetivo:** Conocer en tiempo real el dinero físico esperado en el cajón y conciliar los pagos digitales.
* **Matriz de Permisos por Rol:**
  - 👤 **Rol `empleado`:** Acceso exclusivo a su propio cuadre de caja del día/turno activo.
  - 👑 **Rol `admin` / `propietario`:** Visualización de la caja individual de cualquier empleado, vista consolidada de toda la tienda y filtros por rango de fechas.
* **Fórmula del Arqueo:**
  - `Total Entradas Efectivo = Abonos (Efectivo) + Saldos (Efectivo) + Depósitos Recibidos (Efectivo) + Cobros por Mora/Daños (Efectivo)`
  - `Total Salidas Efectivo = Depósitos Reintegrados (Efectivo)`
  - 💰 **Efectivo Físico Esperado en Cajón = `Total Entradas Efectivo - Total Salidas Efectivo`**
  - 📱 **Total Digitales = Sumatoria de Nequi + Daviplata + Bre-B**

---

### REQ-03: Desglose y Checklist de Piezas en Elementos del Traje
* **Objetivo:** Registrar las piezas exactas que componen cada traje alquilado sin saturar la tabla principal.
* **Flujo Operativo:**
  - En la tabla de elementos de la factura, al hacer clic sobre el elemento (ej. *"Traje Superman"*):
    * Se abre una sección/modal rápido donde el empleado ingresa las piezas escribiendo y presionando Enter (ej: *Máscara [Enter], Traje [Enter], Capa [Enter]*).
    * Las piezas quedan asociadas a ese elemento (`piezas jsonb` en base de datos).
  - **Al Entregar (`ALQUILADA`):** Todas las piezas registradas quedan marcadas como entregadas al cliente.
  - **Al Devolver (`DEVUELTA`):** El empleado visualiza la lista exacta de piezas con checkboxes `[x]` para marcar lo que el cliente realmente devolvió. Si desmarca una pieza, se registra la observación para cálculo de reposición o penalización sobre el depósito.

---

### REQ-04: Portal de Autoconsulta del Cliente (`/mis-alquileres`) + PDF al Vuelo
* **Objetivo:** Brindar a los clientes acceso 24/7 a su factura/comprobante sin almacenar PDFs en el disco del VPS.
* **Flujo del Cliente:**
  1. El cliente ingresa a la ruta pública `/mis-alquileres`.
  2. Digita su **número de celular**.
  3. El sistema busca y lista sus facturas activas e históricas (Número, Traje, Estado, Saldo, Depósito, Fecha Límite).
  4. El cliente hace clic en **`[ 📥 Descargar Comprobante PDF ]`**.
  5. El navegador del cliente genera el PDF al vuelo en memoria con diseño formal de Bodegón Trajes y lo descarga en su dispositivo (zero storage en VPS).
* **Integración WhatsApp:**
  - En el panel de factura, un botón permite abrir WhatsApp con un mensaje pre-rellenado que incluye el resumen económico, la fecha de devolución y el enlace al portal: `https://.../mis-alquileres`.

---

### REQ-05: Auto-poblado de Elementos Nuevos hacia el Catálogo
* **Objetivo:** Que el inventario crezca de forma orgánica con el uso diario.
* **Regla de Negocio:**
  - Cuando un empleado agrega un elemento en una factura que no está en el catálogo (ej: *"Traje Superman"* por $20.000):
  - El sistema verifica si ya existe en `elementos_catalogo` (insensible a mayúsculas/espacios).
  - Si no existe, lo inserta automáticamente en el catálogo con `precioSugerido: 20000` y `activo: true`.
  - La próxima vez que cualquier empleado empiece a escribir *"Traje Sup..."*, aparecerá sugerido en el autocompletado.

---

### REQ-06: Control de Acceso, Turnos y Sesión Única por Dispositivo
* **Parte A — Interruptor de Turno (Activar/Desactivar Empleados):**
  - Switch visual `[ ON / OFF ]` en la tabla de empleados del Administrador para apagar el acceso de empleados que no trabajan ese día o fuera de horario.
  - Al apagar el switch, cualquier petición activa del empleado es rechazada de inmediato (HTTP 401) expulsándolo al modal de sesión bloqueada.
* **Parte B — Sesión Única Activa (Sin Concurrencia):**
  - Cada empleado solo puede tener **una sesión activa a la vez**.
  - Si un empleado intenta iniciar sesión en el Dispositivo B mientras tiene una sesión viva en el Dispositivo A:
    * El sistema le informa: *"Ya tienes una sesión activa en otro dispositivo. ¿Deseas cerrar la sesión anterior para ingresar en este equipo?"*.
    * Al confirmar con su contraseña (**Opción 2 seleccionada por el Humano**), se cierra e invalida automáticamente la sesión vieja en el Dispositivo A y se autoriza el ingreso en el nuevo equipo.

---

## 3. Criterios de Aceptación (Definition of Ready - DoR)

- [x] Reglas de negocio validadas por el Chief Product Owner (Humano).
- [x] Casos de uso de mostrador mapeados con empatía hacia el empleado.
- [x] Restricciones técnicas y de persistencia identificadas para pasar a fase de diseño con los Arquitectos.
- [x] Listo para descomposición en backlog de tareas atómicas con el **Scrum Master**.
