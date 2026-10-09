---
trigger: manual
---

# Regla de Workspace: Metodología Spec-Driven Development (SDD) & Squad de Especialistas

Esta regla aplica a todo el proyecto **CST BODEGÓN TRAJES** y rige la colaboración **Humano + IA**:

## 1. Principio Fundamental
* **Cero código prematuro:** No se escribe código de producción hasta que las especificaciones de todos los roles hayan sido consultadas, aprobadas y consolidadas en el compendio maestro o en el tablero de tracking.
* **Fuente Única de la Verdad (SSOT):** Toda la información de negocio del proyecto se extrae estrictamente de la documentación del sistema (`docs/Funcionalidades Release v1.0.md`, `docs/Auditoria_PRE_RELEASE_v1.0.md`, `docs/Plan-Desarrollo-Responsive.md`). Prohibido inventar reglas de facturación, tarifas o flujos no verificables.

## 2. Invocación de Skills / Agentes Especializados
Cada área debe ser atendida por su respectivo rol profesional:
* **`/tech-lead-cto`**: Visión global del sistema, Clean Architecture, arbitraje técnico y compendio maestro.
* **`/software-architect`**: Arquitectura backend NestJS 11, persistencia TypeORM + PostgreSQL, modelos de dominio y capas.
* **`/frontend-architect`**: Arquitectura frontend React 19 + Vite 8 + Ant Design 6 + Tailwind 4, hooks y React Query.
* **`/devops-engineer`**: Empaquetado Docker Compose multi-stage, Nginx, seguridad en VPS y variables de entorno.
* **`/uiux-responsive-designer`**: Sistema de diseño UI/UX (Ant Design, Tailwind), optimización móvil y pantallas responsive.
* **`/agile-scrum-lead`**: Planificación ágil, definición de sprints, tablero TRACKING y control de Gates humanos.
* **`/qa-security-auditor`**: Auditoría de seguridad (JWT, rate limiting, no-root), suites de tests unitarios/e2e y prevención de vulnerabilidades.
* **`/spec-engineer`**: Especificaciones técnicas ejecutables (HUs) deterministas, contratos I/O, escenarios Gherkin (Given-When-Then) y auditoría previa de ambigüedades.

## 3. Repositorio de Entregas por Sprint (Output SSOT)
Al iniciar cada Sprint con el `/tech-lead-cto`, se crea una subcarpeta dedicada (`.agents/governance/respuestas/<nombre_sprint>/`) para preservar el histórico de decisiones y evitar sobreescrituras:
* `respuestas/<nombre_sprint>/respuesta_lider_proyecto.md`
* `respuestas/<nombre_sprint>/respuesta_requerimientos_negocio.md`
* `respuestas/<nombre_sprint>/respuesta_scrum_master.md`
* `respuestas/<nombre_sprint>/respuesta_arquitecto_software.md`
* `respuestas/<nombre_sprint>/respuesta_arquitecto_frontend.md`
* `respuestas/<nombre_sprint>/respuesta_disenador_ui_ux.md`
* `respuestas/<nombre_sprint>/respuesta_ingeniero_devops.md`
* `respuestas/<nombre_sprint>/respuesta_auditor_qa_seguridad.md`
* `respuestas/<nombre_sprint>/COMPENDIO_TECNICO_SPRINT_N.md`
* `respuestas/<nombre_sprint>/specs/SPEC-<ID>-<nombre>.md` (Especificaciones ejecutables de desarrollo)

Una vez finalizadas las respuestas del ciclo, el `/tech-lead-cto`:
1. Compila el compendio técnico del sprint: `respuestas/<nombre_sprint>/COMPENDIO_TECNICO_SPRINT_N.md`.
2. Actualiza el compendio maestro global: `.agents/governance/COMPENDIO_SPEC.md`.
3. Pasa el testigo al `/spec-engineer` para generar las Specs/HUs ejecutables antes de la codificación.


## 4. Puerta de Control Humano (Human Gatekeeping)
* El usuario actúa como el **Chief Product Officer (CPO) / Product Owner / Aprobador Final**.
* Ninguna tarea de implementación arranca sin la aprobación explícita del Humano sobre el compendio maestro y las puertas de control (Gates).
