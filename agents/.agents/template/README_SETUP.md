# 🚀 GUÍA DE REUTILIZACIÓN DEL SQUAD IA & FRAMEWORK SDD
## Cómo trasladar y utilizar este ecosistema en cualquier nuevo proyecto

Este directorio `.agents/` contiene todo el motor de trabajo, las reglas inviolables de Git Flow, el protocolo de seguimiento dinámico (TRACKING) y el squad de especialistas políglotas.

---

## 📦 1. ¿Cómo trasladar este ecosistema a un nuevo repositorio?

Simplemente **copia y pega la carpeta `.agents/`** en la raíz de tu nuevo proyecto (ya sea Spring Boot, Node.js, Astro, React, Python o Go):

```bash
# Ejemplo: clonar el motor en un proyecto nuevo
cp -r /ruta/proyecto-origen/.agents /ruta/nuevo-proyecto/
```

La raíz de tu proyecto se mantendrá 100% limpia para el código fuente (`src/`, `pom.xml`, `package.json`, etc.), mientras que toda la inteligencia artificial y gobernanza residirán en `.agents/`.

---

## 🛠️ 2. Estructura que encontrarás en `.agents/`

```text
.agents/
├── rules/                               # Reglas automáticas que Antigravity lee
│   ├── 01_git_flow_policy.md            # Regla de oro: Git Flow + Cero commits sin permiso
│   ├── 02_sdd_consultative_workflow.md  # Metodología Consultiva (Fase 1 Opciones -> Fase 2 Consolidación)
│   └── 03_tracking_gates_protocol.md    # Protocolo de Tablero TRACKING y Puertas Humanas
│
├── skills/                              # Roles del Squad IA (Invocables por slash commands)
│   ├── tech-lead-cto/                   # Director Técnico & Arquitecto de Soluciones
│   ├── product-owner-ba/                # Extracción y formalización de requerimientos
│   ├── agile-scrum-lead/                # Scrum Master, Gestión de Sprints y Tracking
│   ├── software-architect/              # Arquitecto Universal (Spring Boot, Node, Astro, etc.)
│   ├── uiux-cro-designer/               # Diseño UI/UX, Design System y CRO
│   ├── devops-engineer/                 # Contenedores, VPS, Portainer, CI/CD
│   └── seo-copy-specialist/             # SEO técnico y redacción persuasiva
│
├── governance/                          # Documentación viva del proyecto activo
│   ├── TRACKING.md                      # Tablero en vivo con barras de progreso y Gates
│   ├── COMPENDIO_SPEC.md                # Especificación técnica maestra aprobada
│   ├── roles/                           # Fichas de rol y contratos de salida
│   └── respuestas/                      # Entregables aprobados de cada especialista
│
└── template/                            # Plantillas vírgenes para iniciar nuevos proyectos
    ├── TRACKING_TEMPLATE.md
    ├── COMPENDIO_SPEC_TEMPLATE.md
    └── README_SETUP.md
```

---

## 📋 3. Flujo de Trabajo para Iniciar un Nuevo Proyecto

1. **Paso 1: Inicializar Gobernanza**
   * Copia `.agents/template/TRACKING_TEMPLATE.md` en `.agents/governance/TRACKING.md`.
   * Copia `.agents/template/COMPENDIO_SPEC_TEMPLATE.md` en `.agents/governance/COMPENDIO_SPEC.md`.
   * Limpia la carpeta `.agents/governance/respuestas/`.

2. **Paso 2: Fase de Negocio (`/product-owner-ba`)**
   * Pásale al agente tu documento inicial (PRD, brief, PDF o descripción de requerimientos).
   * El agente analizará los datos, te planteará preguntas de clarificación, te presentará el borrador y te preguntará si estás 100% satisfecho antes de consolidarlo en `.agents/governance/respuestas/respuesta_requerimientos_negocio.md`.

3. **Paso 3: Fase Ágil (`/agile-scrum-lead`)**
   * El agente te consultará el ritmo de trabajo y número de sprints deseados.
   * Tras tu aprobación, configurará el backlog y el tablero dinámico `.agents/governance/TRACKING.md`.

4. **Paso 4: Fase de Arquitectura & Especialistas (`/software-architect`, etc.)**
   * El `software-architect` se adaptará a tu stack (Spring Boot, Node.js, Astro, Python, Go).
   * Te presentará opciones de arquitectura (Clean Architecture, MVC, microservicios, etc.) con sus pros y contras.
   * Te preguntará si estás plenamente satisfecho con el borrador antes de guardarlo en `.agents/governance/respuestas/respuesta_arquitecto_software.md`.
   * Los demás roles (`uiux-cro-designer`, `devops-engineer`) harán lo propio con su área.

5. **Paso 5: Dictamen del CTO (`/tech-lead-cto`)**
   * El CTO auditará la coherencia de todos los especialistas y generará `.agents/governance/COMPENDIO_SPEC.md` tras tu visto bueno.

6. **Paso 6: Desarrollo Sprint por Sprint con Human Gates**
   * Se crea la rama `feature/sprint-1` a partir de `develop`.
   * Se ejecutan las tareas atómicas actualizando la barra de progreso de `TRACKING.md`.
   * Al concluir el Sprint, la IA se detiene en el **Human Verification Gate**.
   * Tú inspeccionas en tu entorno local (`localhost:PUERTO`) y apruebas el Gate.
   * La IA te solicita permiso para hacer commit, merge a `develop` y continuar al Sprint 2.
