# Regla de Workspace: Protocolo de Tablero TRACKING en Vivo & Human Verification Gates

Esta regla rige el control de avance y la supervisión humana en cualquier proyecto:

---

## 1. El Tablero de Control Dinámico (`.agents/governance/TRACKING.md`)

Todo proyecto debe contar con un archivo de seguimiento en vivo ubicado obligatoriamente en:
`.agents/governance/TRACKING.md`

### Estructura Mandatoria del Tablero:
1. **Barra de Progreso ASCII Global:** Indicador visual dinámico del avance del proyecto:
   ```text
   PROGRESO GLOBAL: [████████████░░░░░░░░] 60% (12 / 20 Tareas)
   ```
2. **Resumen de Sprints:** Estado de cada ciclo (`PENDIENTE`, `EN PROGRESO`, `CERRADO & APROBADO ✅`).
3. **Tareas Atómicas con Criterios de Aceptación:** Cada tarea debe tener su checkbox (`[ ]` o `[x]`), descripción clara, archivo modificado y rol responsable.
4. **Actualización en Tiempo Real:** La IA debe actualizar el `TRACKING.md` inmediatamente después de completar cada tarea atómica.

---

## 2. Human Verification Gates (Puertas de Validación Humana)

Al finalizar la última tarea de cada Sprint, se activa obligatoriamente un **Human Verification Gate**:

```text
[Sprint N en Desarrollo] ──► [Última Tarea Lista] ──► 🛑 HUMAN GATEKEEPER (PAUSA TOTAL)
                                                           │
                                                           ├─► 1. Servidor local encendido
                                                           ├─► 2. Checklist de inspección
                                                           └─► 3. Pregunta de aprobación al Humano
                                                                     │
                                           ┌─────────────────────────┴────────────────────────┐
                                           ▼ (Si hay observaciones)                           ▼ (Si el Humano dice "Aprobado")
                               ┌─────────────────────────────┐                    ┌─────────────────────────────┐
                               │ Ajustes en Sprint N         │                    │ 🔓 Gate N Superado          │
                               │ Se itera en caliente        │                    │ Sprint N: CERRADO ✅        │
                               └─────────────────────────────┘                    │ Se habilita Sprint N+1      │
                                                                                  └─────────────────────────────┘
```

### Reglas Inviolables del Gate:
1. **Detención Obligatoria:** La IA **no puede iniciar tareas del siguiente Sprint** de forma autónoma.
2. **Servidor Local Activo:** El servidor de desarrollo debe estar operativo (ej: `http://localhost:4321` para Astro, `http://localhost:8080` para Spring Boot, `http://localhost:3000` para Node.js) para que el Humano inspeccione el resultado real.
3. **Checklist de Verificación:** La IA debe guiar al usuario indicando los puntos visuales o funcionales específicos que debe validar en pantalla.
4. **Registro del Gate:** Cuando el Humano aprueba, la IA actualiza el `TRACKING.md` marcando:
   `Puerta Humana (Gate N): 🔓 Abierta y aprobada por el Humano el YYYY-MM-DD.`
