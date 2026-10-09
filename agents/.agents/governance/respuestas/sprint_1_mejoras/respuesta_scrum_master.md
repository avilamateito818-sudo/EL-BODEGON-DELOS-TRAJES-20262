# ESTRATEGIA ÁGIL & BACKLOG DETALLADO: SPRINT 1
## PROYECTO: CST BODEGÓN TRAJES — GESTIÓN Y ALQUILER DE TRAJES

**Rol:** `Bodegon-Scrum-Master` (Scrum Master Senior & Agile Lead)  
**Sprint:** Sprint 1 — Mejoras Operativas de Mostrador, Control de Dinero & Seguridad  
**Carpeta Oficial:** `.agents/governance/respuestas/sprint_1_mejoras/`  
**Rama de Trabajo:** `feature/sprint-1-mejoras`  
**Estado:** 🟡 **LISTO PARA EJECUCIÓN**  
**Fecha de Planificación:** 2026-09-27  

---

## 1. Meta del Sprint 1

Implementar el circuito integral de mostrador aprobado por el Product Owner:
1. Métodos de pago locales (`Efectivo`, `Nequi`, `Daviplata`, `Bre-B`).
2. Módulo de Cuadre de Caja Diario con permisos jerárquicos (Empleado vs. Administrador).
3. Desglose y checklist de piezas de trajes sin fricción operativa.
4. Auto-poblado inteligente de catálogo desde la factura.
5. Control de turnos e invalidación de sesiones concurrentes (sesión única activa).
6. Portal de autoconsulta del cliente por celular con generación de PDF al vuelo en cliente y botón de WhatsApp.

---

## 2. Backlog Atómico de Tareas (Secuenciales)

| ID | Tarea Atómica | Responsable | Archivos Involucrados | Criterio de Éxito (Definition of Done) |
| :--- | :--- | :--- | :--- | :--- |
| `[TSK-01]` | Migración y soporte de métodos de pago (`Efectivo`, `Nequi`, `Daviplata`, `Bre-B`) | Backend | Migración TypeORM, `factura.entity.ts`, DTOs | Registro de método de pago en separación, entrega (saldo + depósito) y devolución. |
| `[TSK-02]` | Lógica de negocio y endpoints de Cuadre de Caja Diario | Backend | `cuadre-caja.use-cases.ts`, `cuadre-caja.controller.ts` | Endpoint para empleado (solo su caja) y para admin (individual/consolidado con filtro de fechas). |
| `[TSK-03]` | Vista Frontend de Cuadre de Caja y Arqueo de Turno | Frontend | `cuadre-caja-page.tsx`, `App.tsx`, Navbar | Visualización del efectivo físico esperado en cajón y total digital por canal. |
| `[TSK-04]` | Columna `piezas jsonb` y auto-guardado en catálogo de prendas | Backend | Migración TypeORM, `factura.use-cases.ts`, `elemento.repository.impl.ts` | Guardar piezas por elemento en factura y registrar automáticamente prendas nuevas en catálogo. |
| `[TSK-05]` | UI de Desglose de Piezas y Checklist de Devolución | Frontend | `factura-elementos-editor.tsx`, `devolucion-modal.tsx` | Al hacer clic en el elemento, modal/drawer para añadir piezas con Enter y checklist en devolución. |
| `[TSK-06]` | Sesión única activa con auto-desconexión y switch ON/OFF de turnos | Backend / Frontend | `jwt.strategy.ts`, `login.use-case.ts`, `empleados-page.tsx` | Switch visual ON/OFF para admin y aviso de sesión activa con confirmación de cierre anterior. |
| `[TSK-07]` | Portal público de autoconsulta por celular (`/mis-alquileres`) + PDF al vuelo | Frontend / Backend | `mis-alquileres-page.tsx`, `App.tsx`, `pdf-generator.ts` | Cliente ingresa celular, ve sus facturas y genera PDF en navegador (zero storage en VPS). |
| `[TSK-08]` | Botón de WhatsApp con mensaje inteligente y enlace al portal | Frontend | `factura-detail-page.tsx`, `whatsapp.utils.ts` | Genera mensaje dinámico según estado con URL hacia `/mis-alquileres`. |
| `[TSK-09]` | Suite de pruebas unitarias Jest y verificación integral | QA / Arquitectura | Tests unitarios, `npm test`, `npm run build` | Cero regresiones, Clean Architecture estricta y compilación exitosa sin errores. |

---

## 3. Human Verification Gate (Gate 1)

* Al completar la tarea `[TSK-09]`, la IA activará una **pausa total obligatoria**.
* El servidor local quedará encendido para que el **Human Gatekeeper (Tú)** pruebe en vivo:
  1. El registro de pagos con Nequi/Daviplata/Bre-B/Efectivo.
  2. El cuadre de caja de tu turno.
  3. El desglose de piezas en trajes nuevos.
  4. La consulta pública por celular y descarga de PDF.
  5. El bloqueo de sesión concurrente.
