# 📁 Repositorio Histórico de Respuestas por Sprint (SSOT)

Este directorio almacena el histórico inmutable de respuestas de cada especialista y los compendios técnicos consolidados de cada ciclo de desarrollo para **CST BODEGÓN TRAJES**.

---

## 🗂️ Estructura por Sprints

Para preservar el orden y evitar la sobreescritura entre ciclos, **cada Sprint cuenta con su propia subcarpeta** gestionada por el **CTO Lead**:

```text
.agents/governance/respuestas/
├── README.md                              # Este catálogo general
├── sprint_0_hardening/                    # 🟢 SPRINT 0 (Hardening & Concurrencia) - CERRADO ✅
│   ├── respuesta_lider_proyecto.md
│   ├── respuesta_requerimientos_negocio.md
│   ├── respuesta_scrum_master.md
│   ├── respuesta_arquitecto_software.md
│   ├── respuesta_arquitecto_frontend.md
│   ├── respuesta_disenador_ui_ux.md
│   ├── respuesta_ingeniero_devops.md
│   ├── respuesta_auditor_qa_seguridad.md
│   └── COMPENDIO_TECNICO_SPRINT_0.md      # Compendio consolidado del Sprint 0
│
└── sprint_1_mejoras/                      # 🟡 SPRINT 1 (Mejoras & Seguridad) - EN PROGRESO
    ├── respuesta_*.md                     # Entregables específicos de este ciclo
    └── COMPENDIO_TECNICO_SPRINT_1.md      # Compendio técnico consolidado del Sprint 1
```

---

## 🔄 Protocolo de Inicialización de un Nuevo Sprint
1. **Inicio con el CTO Lead:** Todo nuevo sprint se inicia dialogando con el **CTO Lead (`Bodegon-CTO-Lead`)**.
2. **Creación de Subcarpeta:** El CTO Lead crea la subcarpeta del sprint: `.agents/governance/respuestas/<nombre_sprint>/`.
3. **Generación de Respuestas:** Cada rol consultado durante el sprint deposita su respuesta formal en dicha subcarpeta.
4. **Consolidación del Compendio:** Al concluir la ronda de roles, el CTO Lead compila el archivo `COMPENDIO_TECNICO_SPRINT_N.md` dentro de la subcarpeta del sprint y actualiza el compendio maestro global [COMPENDIO_SPEC.md](file:///c:/Users/sanav/Documents/JirenCompany/cst-bodegon-trajes/.agents/governance/COMPENDIO_SPEC.md).
