# 🏛️ Squad de Especialistas: Roles & Gobernanza para El Bodegón de los Trajes

El equipo opera bajo la metodología **Spec-Driven Development (SDD)** con separación estricta de competencias para la **Landing Page Comercial & Panel Administrativo CRUD de Catálogo (Opción A)**:

```text
FASE 0: ORQUESTACIÓN Y DIRECCIÓN TÉCNICA
└── /tech-lead-cto           ──► Coordina el Compendio Maestro y el Tablero de Tracking

FASE 1: REQUERIMIENTOS Y ESPECIFICACIONES
├── /product-owner-ba        ──► Define la experiencia de cliente y los 4 módulos de negocio
└── /spec-engineer           ──► Contratos I/O, DTOs y criterios de aceptación Gherkin

FASE 2: ARQUITECTURA TÉCNICA Y DISEÑO
├── /software-architect      ──► Backend PHP 8.3 REST, persistencia atómica y seguridad
├── /frontend-architect      ──► HTML5 semántico, CSS modular y renderizador de catálogo
└── /uiux-responsive-designer──► Experiencia visual de 12 temporadas y UI simple del panel

FASE 3: INFRAESTRUCTURA Y CALIDAD
├── /devops-engineer         ──► Contenedor Docker Compose (Nginx + PHP-FPM) y hardening
└── /qa-security-auditor     ──► Cero contraseñas expuestas, tests automatizados y Core Web Vitals
```

---

## ⚡ Directorio Oficial de Roles

| Rol / Arquetipo | Especialidad | Archivo de Rol | Entregable Oficial |
| :--- | :--- | :--- | :--- |
| **Tech Lead / CTO** | Director Técnico & Consolidador | [`01_lider_proyecto_cto.md`](01_lider_proyecto_cto.md) | `COMPENDIO_SPEC.md` |
| **Product Owner / BA** | Requerimientos de Negocio y PRD | [`02_product_owner_ba.md`](02_product_owner_ba.md) | Historias de Usuario de los 4 Módulos |
| **Scrum Master Senior** | Planificación Ágil y Fases | [`02_scrum_master_agile.md`](02_scrum_master_agile.md) | `TRACKING.md` |
| **Arquitecto Frontend** | HTML5, CSS Modular & JS Ligero | [`03_arquitecto_frontend.md`](03_arquitecto_frontend.md) | `catalog-renderer.js` & Panel UI |
| **Arquitecto Backend** | PHP 8.3 REST API & Persistencia | [`03_arquitecto_software_backend.md`](03_arquitecto_software_backend.md) | `/api/catalogo`, `/api/auth`, `/api/leads` |
| **Diseñador UI/UX & Responsive**| 12 Temporadas & Panel Intuitivo | [`05_disenador_ui_ux_responsive.md`](05_disenador_ui_ux_responsive.md) | Diseño de componentes y Mobile-First |
| **Ingeniero DevOps** | Docker Compose & Nginx | [`04_ingeniero_devops_infraestructura.md`](04_ingeniero_devops_infraestructura.md) | `docker-compose.yml` & `nginx.conf` |
| **Auditor QA & Seguridad** | Hardening, OWASP & Testing | [`06_auditor_qa_seguridad.md`](06_auditor_qa_seguridad.md) | Suites de verificación en `scripts/` |
| **Ingeniero de Specs** | Contratos I/O & Escenarios Gherkin | [`07_ingeniero_especificaciones_specs_hu.md`](07_ingeniero_especificaciones_specs_hu.md) | Especificaciones de los 4 Módulos |

---

## 📜 Reglas de Oro del Proyecto
1. **Cero Manipulación Destructiva del DOM:** Prohibidos scripts que inyecten parches CSS sobre el DOM público.
2. **Cero Credenciales en Frontend:** La contraseña de administración nunca debe residir en archivos servidos al cliente.
3. **Persistencia Estructurada:** Los trajes viven en un JSON limpio (`catalogo.json`), no en selectores CSS `:nth-child`.
4. **Git Flow & Human-in-the-Loop:** Todo cambio técnico pasa por validación y registro en `TRACKING.md`.
