# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-03
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-03]`  
**Título:** Vista Frontend de Cuadre de Caja y Arqueo de Turno con Semáforo Comparador  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-QA-Security-Auditor` y `Bodegon-UIUX-Designer`)  
**Estado:** 🟡 **LISTA PARA EJECUCIÓN**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** Construir la interfaz de usuario `/cuadre-caja` en React 19 con Ant Design 6 y Tailwind CSS, ofreciendo la Hero Card de efectivo esperado, el semáforo comparador de cierre de turno en vivo, el desglose de billeteras digitales y la tabla responsiva de auditoría de movimientos.
* **Out of Scope:** Impresión en hardware de impresoras de tickets físicas ESC/POS vía serial o bluetooth (se provee botón de impresión del navegador).
* **Ubicación en el Sistema:**
  - `frontend/src/modules/caja/presentation/pages/cuadre-caja-page.tsx`
  - `frontend/src/modules/caja/presentation/components/` (`hero-efectivo-card.tsx`, `comparador-caja.tsx`, `canales-digitales-cards.tsx`, `tabla-auditoria-caja.tsx`, `filtro-turno-bar.tsx`)
  - `frontend/src/modules/caja/application/hooks/use-cuadre-caja.ts`
  - Rutas: `frontend/src/App.tsx`, navegación en `frontend/src/shared/components/layout/sidebar.tsx`
* **Dependencias:** TanStack Query 5 (`useQuery`), Axios client, Ant Design (`Card`, `InputNumber`, `Table`, `Tag`, `DatePicker`, `Select`).

---

### 2. Definición Funcional y Reglas de Negocio
* **Narrativa de Usuario:**
  > **Como** empleado de mostrador o administrador,  
  > **Quiero** ver en pantalla el total de dinero esperado y verificarlo digitando lo que conté en billetes,  
  > **Para** saber en menos de 5 segundos si el turno cerró cuadrado o si existe algún descuadre.

* **Reglas Deterministas de la Interfaz:**
  1. **Hero Card:** Muestra en tipografía destacada (`text-3xl font-extrabold`) el `esperadoEnCajon`.
  2. **Semáforo Comparador en Tiempo Real:**
     - Campo numérico para ingresar `Efectivo Real Contado` (acepta formato de moneda sin decimales).
     - Si `contado === esperado`: Alerta verde con icono `CheckCircleFilled`: *"¡Caja Cuadrada Perfecta! ($0 de diferencia)"*.
     - Si `contado < esperado`: Alerta roja con icono `WarningFilled`: *"Faltante en Caja: -$X.XXX"*.
     - Si `contado > esperado`: Alerta azul informativa: *"Sobrante en Caja: +$X.XXX"*.
     - Si el campo está vacío: No muestra ningún color ni error; queda en estado neutro.
  3. **Control de Acceso Visual:**
     - Si el usuario logueado tiene `rol === 'empleado'`: No se renderiza el selector de empleados ni los filtros de rango de fechas; solo ve su propio turno de hoy.
     - Si el usuario tiene `rol === 'admin'` o `'propietario'`: Se muestra la barra `FiltroTurnoBar` para alternar entre cualquier empleado o la vista consolidada del negocio.

* **Casos Borde (Edge Cases):**
  - **Monto Contado Negativo:** El componente `InputNumber` tiene `min={0}` para impedir números negativos accidentales.
  - **Tabla sin movimientos:** Renderiza el estado vacío amigable de Ant Design (`<Empty description="No hay movimientos registrados en este turno" />`).

---

### 3. Contratos de Entrada/Salida (I/O Contracts)
* **Hook React Query:** `useCuadreCaja({ fecha?: string, empleadoId?: string })`
* **Navegación:** Entrada protegida con `ProtectedRoute` en la ruta `/cuadre-caja` visible en el sidebar tanto para empleados como para administradores.

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)
*Co-diseñados y auditados junto con el **Auditor QA & Seguridad (`Bodegon-QA-Security-Auditor`)**:*

#### Escenario 1: Empleado cuenta el dinero y la caja está cuadrada (Happy Path)
* **Dado** que la Hero Card indica un esperado de $180.000,
* **Cuando** el empleado digita `180000` en la casilla de efectivo contado,
* **Entonces** de forma instantánea aparece el banner verde menta con el texto `"¡Caja Cuadrada Perfecta! ($0 de diferencia)"`.

#### Escenario 2: Empleado cuenta menos dinero del esperado (Detección de Faltante)
* **Dado** un esperado en cajón de $200.000,
* **Cuando** el empleado cuenta físicamente los billetes y digita `185000`,
* **Entonces** la alerta cambia a rojo carmesí mostrando `"Faltante en Caja: -$15.000"`.

#### Escenario 3: Admin selecciona otro empleado en el selector (Reactividad TanStack Query)
* **Dado** que el administrador ingresa a `/cuadre-caja`,
* **Cuando** selecciona al empleado "Lucía Gómez" en el selector desplegable,
* **Entonces** TanStack Query invalida la consulta previa, trae los datos de Lucía en segundo plano y actualiza la pantalla sin parpadeos ni recargas de página.

#### Escenario 4: Empleado intenta forzar inspección de otros dependientes
* **Dado** un usuario autenticado con rol `empleado`,
* **Cuando** carga la ruta `/cuadre-caja`,
* **Entonces** la barra de filtros no existe en el DOM, y cualquier petición interceptada solo viaja con su propio token sin exponer datos de otros turnos.

---

### 5. Restricciones Técnicas y Calidad (Constraints & Non-Functional)
* **Responsive Design:** En móviles (< 640px) las tarjetas se apilan verticalmente (`flex-col`) y la tabla de movimientos utiliza scroll horizontal fluido (`overflow-x-auto`).
* **Caché Inteligente:** Configurar `staleTime: 1000 * 30` (30 segundos) en TanStack Query para evitar peticiones repetitivas al servidor si el empleado cambia de pestaña.
