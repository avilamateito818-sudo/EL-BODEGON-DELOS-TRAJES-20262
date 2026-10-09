# COMPENDIO TÉCNICO CONSOLIDADO: SPRINT 1
## PROYECTO: CST BODEGÓN TRAJES — GESTIÓN Y ALQUILER DE TRAJES

**Consolidador:** `Bodegon-CTO-Lead` (Líder Técnico & Arquitecto de Software Principal)  
**Sprint:** Sprint 1 — Mejoras Operativas de Mostrador, Control de Dinero & Seguridad  
**Estado de Especificación:** 🟢 **ESPECIFICACIÓN COMPLETA & VALIDADA POR EL HUMANO**  
**Fecha de Cierre de Diseño:** 2026-09-28  
**Estrategia Git Flow:** Ramas Atómicas por Tarea (`feature/TSK-XX-<slug>`) nacidas de `develop`  
**Rama Activa Inmediata:** `feature/TSK-01-metodos-pago`  

---

## 1. Resumen Ejecutivo del Sprint 1

El Sprint 1 tiene como misión optimizar integralmente la operación de mostrador de **CST Bodegón Trajes**, dotando a los empleados y administradores de herramientas ágiles para el control de efectivo físico y billeteras digitales, eliminando pérdidas de piezas accesorias en trajes, previniendo accesos indebidos mediante control de turnos y sesión única, y brindando a los clientes un portal móvil de autoconsulta con comprobante PDF al vuelo sin consumir almacenamiento en el servidor.

---

## 2. Acuerdos y Decisiones Técnicas Consolidadas del Squad

### 2.1. Product Owner & Negocio (`product-owner-ba`)
* Métodos de pago colombianos soportados: `EFECTIVO`, `NEQUI`, `DAVIPLATA`, `BRE_B`. Trazabilidad en separación (abono), entrega (saldo + depósito) y devolución (reintegro de depósito).
* Cuadre de caja diario con permisos jerárquicos: vista propia para empleados y selector/consolidado para administradores.
* Desglose de piezas libre por traje (`Enter` sin catálogo cerrado) y checklist al devolver.
* Auto-poblado orgánico de prendas nuevas al catálogo al facturar.
* Consulta de clientes por celular (`/mis-alquileres`) con PDF generado en navegador y botón de WhatsApp.

### 2.2. Arquitectura de Software Backend (`software-architect`)
* Migración TypeORM para métodos de pago y referencias en `facturas`.
* Columna `piezas jsonb DEFAULT '[]'::jsonb` en `factura_elementos`.
* Módulo `src/modules/caja/` con use cases para empleado y administración.
* Auto-guardado en `elementos_catalogo` en `AgregarElementoUseCase` mediante búsqueda case-insensitive.
* Control de turnos (`activo: boolean`) y sesión única (`session_id: varchar`) en `empleados`.
* Flujo de login con confirmación de sesión (Opción 2) y validación en `JwtStrategy`.

### 2.3. Arquitectura Frontend React (`frontend-architect`)
* Generador de comprobantes PDF vectorial client-side con `jspdf` y `jspdf-autotable` (Zero VPS Storage).
* Modal reactivo de conflicto de sesión activa en `LoginPage` (Opción 2: aviso y confirmación).
* Interacción ágil de piezas con teclado (`Enter`) y chips removibles.
* Comparador de cuadre de caja con cálculo en tiempo real de diferencia (Esperado vs. Real Contado).
* Gestión de estado y caché optimista mediante **TanStack Query 5.x**.

### 2.4. Diseño UI/UX & Ergonomía de Mostrador (`uiux-designer`)
* Hero Card verde esmeralda para el Efectivo Físico en Cajón.
* Semáforo de arqueo al cierre de turno: Verde (Cuadrada), Rojo (Faltante), Azul (Sobrante).
* Tarjetas cromáticas institucionales para Nequi (`#7000FF`), Daviplata (`#ED1C24`) y Bre-B (`#0284C7`).
* Tabla de auditoría con badges por tipo de movimiento financiero.
* Portal móvil `/mis-alquileres` con `inputMode="numeric"` para apertura automática de teclado numérico.
* Botón de WhatsApp institucional (`#25D366`).

### 2.5. Infraestructura & DevOps (`devops-engineer`)
* Arquitectura de Doble Ambiente formalizada en Portainer:
  - **Preproducción (Staging):** Conectado a la rama `release` y base de datos `cst_bodegon_staging` para pruebas operativas seguras.
  - **Producción:** Conectado a la rama `main` y base de datos `cst_bodegon`.
* Compromiso de auditoría técnica y hardening de Portainer (stacks, límites de recursos, políticas de reinicio) previo a la salida a producción.
* Enrutamiento SPA seguro en Nginx (`try_files $uri $uri/ /index.html;`) para enlaces directos desde WhatsApp.
* Validación y aprobación de la política zero-storage en VPS.

### 2.6. Seguridad, QA & Hardening (`qa-security-auditor`)
* Throttling en consulta pública por celular configurado a **10 peticiones por minuto por IP**.
* Expresión regular estricta para celulares en Colombia (`^3[0-9]{9}$`).
* DTO público sanitizado sin datos sensibles ni notas internas de empleados.
* Invalidación atómica de sesión mediante UUID v4 en base de datos.
* Cálculos matemáticos de caja blindados con el Value Object inmutable `Dinero`.
* Suite de pruebas unitarias automatizadas en Jest para `[TSK-09]`.

---

## 3. Matriz del Backlog de Construcción

| ID | Tarea Atómica | Estado | Criterio de Éxito (Definition of Done) |
| :--- | :--- | :---: | :--- |
| `[TSK-01]` | Migración y soporte de métodos de pago (`Efectivo`, `Nequi`, `Daviplata`, `Bre-B`) | `PENDIENTE` | Registro de métodos en abono, entrega y devolución con persistencia en BD. |
| `[TSK-02]` | Lógica de negocio y endpoints de Cuadre de Caja Diario | `PENDIENTE` | Casos de uso de empleado y admin con fórmula de efectivo físico vs digital. |
| `[TSK-03]` | Vista Frontend de Cuadre de Caja y Arqueo de Turno | `PENDIENTE` | Hero Card, semáforo de cierre en vivo, desglose digital y tabla de auditoría. |
| `[TSK-04]` | Columna `piezas jsonb` y auto-guardado en catálogo de prendas | `PENDIENTE` | Migración de piezas y auto-insert en catálogo si la prenda es nueva. |
| `[TSK-05]` | UI de Desglose de Piezas y Checklist de Devolución | `PENDIENTE` | Edición con `Enter` en mostrador y checklist táctil con medidor al devolver. |
| `[TSK-06]` | Sesión única activa (Opción 2) y switch ON/OFF de turnos | `PENDIENTE` | Modal de confirmación en login y bloqueo inmediato si el empleado está inactivo. |
| `[TSK-07]` | Portal público de autoconsulta (`/mis-alquileres`) + PDF al vuelo | `PENDIENTE` | Búsqueda por celular (rate limit 10/min) y descarga de PDF con `jspdf`. |
| `[TSK-08]` | Botón de WhatsApp con mensaje inteligente y enlace al portal | `PENDIENTE` | Enlace dinámico con resumen de alquiler y URL hacia `/mis-alquileres`. |
| `[TSK-09]` | Suite de pruebas unitarias Jest y verificación integral | `PENDIENTE` | Cero regresiones, tests unitarios en verde y build limpio de backend/frontend. |

---

## 4. Dictamen del CTO Lead
La fase de especificación, arquitectura y gobernanza del **Sprint 1** queda formalmente **CERRADA Y APROBADA**. Todas las dudas, preferencias y directrices del Humano han sido integradas con total coherencia entre las capas de backend, frontend, diseño, infraestructura y seguridad. 

El squad se declara listo para iniciar la ejecución del código en la rama `feature/sprint-1-mejoras` arrancando con la tarea `[TSK-01]`.
