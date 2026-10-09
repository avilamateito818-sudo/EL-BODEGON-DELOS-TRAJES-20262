# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-09
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-09]`  
**Título:** Suite de Pruebas Unitarias Jest, Auditoría de Calidad y Verificación Integral  
**Agente Responsable:** `Bodegon-QA-Security-Auditor` (en co-diseño con `Bodegon-Spec-Engineer`)  
**Estado:** 🟡 **LISTA PARA EJECUCIÓN**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** Ejecutar la suite automatizada de pruebas unitarias en Jest cubriendo la lógica financiera y de seguridad del Sprint 1, verificar que no existan regresiones en el código preexistente y validar que tanto el backend NestJS como el frontend React compilen limpiamente a nivel de producción.
* **Out of Scope:** Pruebas de estrés masivo / DDoS con herramientas externas de carga.
* **Ubicación en el Sistema:**
  - `backend/src/modules/caja/application/use-cases/__tests__/cuadre-caja.use-cases.spec.ts`
  - `backend/src/modules/auth/application/use-cases/__tests__/login.use-case.spec.ts`
  - `backend/src/modules/auth/infrastructure/strategies/__tests__/jwt.strategy.spec.ts`
  - `backend/src/modules/factura/domain/entities/__tests__/factura.entity.spec.ts`
  - `backend/src/modules/factura/application/use-cases/__tests__/agregar-elemento.use-case.spec.ts`
* **Comandos de Verificación:** `npm test`, `npm run build` (Backend y Frontend).

---

### 2. Definición Funcional y Reglas de Negocio
* **Narrativa de Calidad:**
  > **Como** Auditor de Calidad y Seguridad,  
  > **Quiero** ejecutar pruebas unitarias automáticas y verificar las compilaciones de TypeScript,  
  > **Para** garantizarle al Humano que el sistema es matemáticamente exacto, seguro y libre de bugs antes de solicitar la apertura del Gate 1.

* **Criterios de Cobertura Obligatorios:**
  1. **Pruebas de Caja:** Cálculos de arqueo con operaciones mixtas, saldo en cajón exacto y segregación por billetera digital.
  2. **Pruebas de Concurrencia de Sesión:** Retorno de 409 en conflicto, toma de sesión con UUID nuevo y expulsión 401 por sesión desactualizada.
  3. **Pruebas de Catálogo:** Inserción automática si el ítem es nuevo y reutilización limpia si ya existe.
  4. **Pruebas de Piezas:** Verificación de inmutabilidad y persistencia de arrays JSONB.
  5. **Pruebas de Gateway WhatsApp (TSK-08B):** Mocking de socket Baileys, verificación de estado de conexión, registro en `whatsapp_mensajes_log` y fallback graceful ante 503.
  6. **Pruebas de Gestor de Turnos (TSK-10):** Generador de secuencias diarias (`A-01`, `R-01`, `D-01`), vinculación a facturas reservadas, cálculo de tiempos de cronómetro/gabela y auditoría obligatoria de cierre.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)
* **Salida de Testing:** Jest reportando suites en verde (`PASS`), con cero tests fallidos (`0 failed`).
* **Salida de Compilación:**
  - Backend: `nest build` exitoso generando `backend/dist/`.
  - Frontend: `tsc -b && vite build` exitoso generando `frontend/dist/`.

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Ejecución completa de la suite de pruebas Jest (Cero Fallos)
* **Dado** el código implementado de las tareas `[TSK-01]` a `[TSK-10]`,
* **Cuando** se ejecuta `npm test` en el backend,
* **Entonces** todas las suites de pruebas pasan satisfactoriamente (`Tests: X passed, X total`) con cero advertencias ni fallos.

#### Escenario 2: Compilación estricta de TypeScript (Zero Type Errors)
* **Dado** el tipado estricto en frontend y backend,
* **Cuando** se ejecuta la orden de compilación de producción,
* **Entonces** el compilador de TypeScript finaliza con código de salida `0` sin errores de tipo ni de importación.

#### Escenario 3: Activación del Human Verification Gate (Gate 1)
* **Dado** que las 11 tareas cumplen con su Definition of Done (DoD),
* **Cuando** finaliza la tarea `[TSK-09]`,
* **Entonces** la IA detiene toda ejecución de código y solicita formalmente la inspección humana del usuario antes de cualquier fusión a ramas permanentes.

---

### 5. Restricciones Técnicas y Calidad (Constraints & Non-Functional)
* **Prohibición de `any`:** Prohibido el uso de tipos `any` para silenciar errores de compilación.
* **Aislamiento de Tests:** Ninguna prueba unitaria debe depender de una base de datos real activa (uso de mocks desacoplados para repositorios).
