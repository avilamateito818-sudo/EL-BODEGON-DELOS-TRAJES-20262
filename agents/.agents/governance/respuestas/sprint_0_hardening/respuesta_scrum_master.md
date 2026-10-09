# ESTRATEGIA ÁGIL & PLAN DE SPRINTS: CST BODEGÓN TRAJES

## 1. Metodología Ágil y Marco de Trabajo
El proyecto opera bajo la metodología **Spec-Driven Development (SDD)** con gobierno estricto de **Human Verification Gates**:
* **Cadencia de Sprints:** Entregas atómicas con validación humana obligatoria antes de avanzar.
* **Supervisión Continua:** Registro en vivo de tareas completadas, porcentaje de avance global y criterios de DoD en `.agents/governance/TRACKING.md`.

---

## 2. Definición de Sprints

### 🏁 SPRINT PREVIO: Core Release v1.0.0 (Completado ✅)
* **Objetivo:** Implementación funcional de todos los módulos base (Auth, Empleados, Clientes, Catálogo de Elementos, Facturación, Devoluciones, Dashboard, Alertas).
* **Resultado:** Sistema 100% operativo en ambiente de desarrollo local.

### 🛡️ SPRINT 0: Hardening, Concurrencia Atómica & Calidad Pre-Feature (Cerrado & Validado ✅)
* **Objetivo:** Blindar la persistencia de datos (secuencia PostgreSQL), desacoplar capas en controladores, crear suite de tests unitarios críticos y modernizar el modal de sesión en frontend.
* **Tareas Atómicas Completadas:**
  - `[TSK-H01]` Migración y secuencia atómica PostgreSQL `factura_numero_seq`.
  - `[TSK-H02]` Desacoplamiento de `FacturasController` y resolución de clientes en use cases.
  - `[TSK-H03]` Suite de pruebas unitarias Jest para entidad `Factura`, Value Objects (`Dinero`) y `LoginUseCase`.
  - `[TSK-H04]` Refactorización reactiva del modal de sesión expirada en frontend con Ant Design.
  - `[TSK-H05]` Verificación integral de contratos, arquitectura limpia y compilación sin errores.
* **Estado:** 🟢 Cerrado & Validado (Gate 0 Listo para integración a `develop`).

### 🚀 SPRINT 1: Mejoras Responsive & Hardening de Seguridad (En Definición / Pendiente)
* **Objetivo:** Abordar las mejoras pendientes identificadas en la auditoría y el plan responsive:
  - Fase 1: Throttling / Rate limiting global en NestJS.
  - Fase 2: Documentación interactiva de la API con OpenAPI / Swagger (`/api/docs`).
  - Fase 3: Ajustes de responsive design en modales y tablas complejas para dispositivos móviles (`Plan-Desarrollo-Responsive.md`).
  - Fase 4: Política de refresh tokens y headers de seguridad avanzados.
