# Regla de Workspace: Política Obligatoria de Git Flow & Control de Versiones

Esta regla rige de manera **estricta e inviolable** el comportamiento de todos los agentes, skills y tareas en este y cualquier proyecto:

---

## 1. Regla Inviolable: Prohibición de Acciones Autónomas en Git

1. **PROHIBIDO TERMINANTEMENTE `git add .`:**
   - Queda estrictamente prohibido usar comodines o `git add .`.
   - Cada archivo debe agregarse de manera explícita e individual (`git add ruta/especifica/archivo.ext`), evitando incluir archivos accidentales, binarios o archivos personales del usuario.

2. **PROHIBIDO COMMITEAR, PUSHEAR O MERGEAR SIN CONSULTA PREVIA:**
   - Ningún agente debe ejecutar `git commit`, `git push`, `git checkout` o `git merge` por iniciativa propia.
   - **Protocolo de Consulta Previa Obligatorio:** Antes de ejecutar cualquier comando de Git, el agente DEBE presentar al usuario:
     * 📁 **Archivos involucrados:** Lista exacta de archivos que se van a preparar (`git add`).
     * 🌿 **Ramas:** Rama de trabajo actual y rama destino.
     * 💬 **Mensaje de commit propuesto:** Formato convencional (`feat:`, `fix:`, `docs:`, `refactor:`).
     * ❓ **Pregunta de autorización explícita:** Solicitar confirmación directa y esperar la respuesta afirmativa del usuario antes de proceder.

---

## 2. Estándar Git Flow Obligatorio: 3 Ramas Permanentes por Entornos

Todos los repositorios del proyecto operan bajo la metodología **Git Flow por Entornos (Environment Branching)** con 3 ramas permanentes:

```text
[main] ──────────────────────────────────────────────● (v1.0.0 Deploy Producción VPS)
  ▲                                                  ▲
  │                                                  │ (Promoción final tras Smoke Test)
  │                                                  │
[release] ───────────────────────●───────────────────┴── (Ambiente Pre-producción / Staging)
  ▲                              ▲
  │                              │ (Merge tras Human Verification Gate)
  │                              │
[develop] ───────────●───────────┴────────────────────── (Integración Continua / Desarrollo)
  ▲                  ▲
  │                  │
  ├── [feature/*] ───┤ (Nuevas funcionalidades)
  └── [fix/*] ───────┘ (Correcciones en desarrollo)
```

### Definición de Ramas Permanentes (Viven siempre):
1. **`main` (Entorno de Producción):**
   - Contiene exclusivamente código productivo, probado, estable y desplegado en servidores vivos (VPS).
   - Solo recibe merges validados desde `release` (al culminar la verificación en staging) o desde `hotfix/*`.
   - Cada integración a `main` se etiqueta con tags semánticos (`v1.0.0`, `v1.1.0`).

2. **`release` (Entorno de Pre-producción / Staging permanente):**
   - Espejo exacto del entorno productivo para pruebas del Humano, pruebas de integración y validación con datos reales sin riesgo para producción.
   - Solo recibe merges validados desde `develop` al superar el **Human Verification Gate** de cada Sprint.
   - Si se detecta un micro-ajuste durante la validación en staging, se realiza directamente o se retroalimenta a `develop`.

3. **`develop` (Entorno de Desarrollo e Integración Continua):**
   - Rama troncal de desarrollo diario donde convergen las características del squad.
   - Es la rama madre de donde nacen todas las ramas efímeras de trabajo (`feature/*` y `fix/*`).

---

### Definición de Ramas Efímeras de Trabajo (Ciclo de Vida por Tarea Atómica):

1. **`feature/TSK-<ID>-<nombre-task>` (Ramas Atómicas por Tarea):**
   - **Regla Estricta:** Queda prohibido agrupar todo un sprint en una sola rama monolítica. Cada tarea del backlog tiene su propia rama efímera.
   - **Flujo de Vida:**
     1. Nace **siempre de `develop`** al iniciar la tarea:  
        `git checkout -b feature/TSK-XX-<slug> develop`
     2. Se implementa el alcance y los tests unitarios correspondientes a esa tarea única.
     3. Previa consulta y autorización del usuario, se hace commit y se integra a `develop`:  
        `git checkout develop && git merge --no-ff feature/TSK-XX-<slug>`
     4. Se elimina la rama efímera local (`git branch -d feature/TSK-XX-<slug>`).
     5. La siguiente tarea (`feature/TSK-(XX+1)-<slug>`) nace del nuevo estado actualizado de `develop`.

2. **`fix/<nombre-bug>` (Corrección en Desarrollo):**
   - Nace de `develop` para solucionar defectos identificados durante desarrollo o QA.
   - Se integra de vuelta a `develop`.

3. **`hotfix/<nombre-incidencia>` (Emergencia en Producción):**
   - Nace **únicamente de `main`** ante caídas o bugs críticos en vivo.
   - Tras validarse, se fusiona a `main`, `release` Y `develop` para mantener la paridad absoluta entre los tres entornos.

---

### Regla de Oro:
**Queda terminantemente prohibido trabajar o hacer commits directamente sobre `main`, `release` o `develop`. Todo trabajo activo debe nacer y desarrollarse en su rama efímera atómica correspondiente (`feature/TSK-XX-*` o `fix/*`).**

