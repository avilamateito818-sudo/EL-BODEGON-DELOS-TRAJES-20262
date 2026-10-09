# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-06
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1
**ID de Tarea:** `[TSK-06]`  
**Título:** Control de Sesión Única Activa (Universal con Expiración 10 PM) y Switch ON/OFF de Turnos  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-Software-Architect`, `Bodegon-QA-Security-Auditor` y `Bodegon-UIUX-Designer`)  
**Estado:** 🟢 **100% BLINDADA CON DECISIONES DE NEGOCIO VALIDADAS**  

---

### 1. Contexto y Alcance (Context & Boundary)
* **Objetivo:** 
  1. Impedir el uso simultáneo de una misma cuenta en dos equipos concurrentes (**Opción A: Universal para todos los roles**, incluyendo administradores y empleados), con diálogo de confirmación en 1 clic (**Enfoque A**).
  2. Implementar **Expiración de Fin de Jornada a las 10:00 PM (Colombia UTC-5)**: toda sesión expira automáticamente a las 10:00 PM. A la mañana siguiente, el empleado ingresa directamente con sus credenciales sin ver falsas alertas de conflicto por sesiones de días anteriores.
  3. Dotar al Administrador de un interruptor `[ ON / OFF ]` en la tabla de empleados para suspender turnos, expulsando inmediatamente de la plataforma al usuario desactivado, pero **bloqueando la auto-desactivación** para que ningún administrador se auto-bloquee por error.
  4. Endpoint formal `POST /api/v1/auth/logout` para limpiar la sesión en base de datos al salir voluntariamente.
* **Ubicación en el Sistema:**
  - Migración: `backend/src/migrations/1727400000000-AddSessionIdToEmpleados.ts` (`session_id VARCHAR(100) NULL`, `session_expires_at TIMESTAMPTZ NULL`)
  - Backend Auth:
    - Entidades: `empleado.typeorm-entity.ts`, `empleado.entity.ts`
    - DTO: `login.dto.ts` (`identifier: string`, `password: string`, `forzarCierre?: boolean`)
    - Casos de Uso: `login.use-case.ts` (Login, Logout y RefreshToken)
    - Guardián/Estrategia: `jwt.strategy.ts` (Validación de `sessionId`, `activo` y expiración 10:00 PM)
    - Controlador: `auth.controller.ts` (Login con 409, Logout y Refresh)
    - Control de Turno: `empleados.controller.ts` (`@Patch(':id/toggle')` con guardia de auto-bloqueo)
  - Frontend Auth:
    - `frontend/src/modules/auth/presentation/pages/login-page.tsx` (Manejo de 409 y Modal de confirmación en 1 clic)
    - `frontend/src/modules/auth/presentation/hooks/use-auth.tsx` (Logout con notificación a API y soporte de `forzarCierre`)
  - Frontend Admin:
    - `frontend/src/modules/empleado/presentation/pages/empleados-page.tsx` (Switch desactivado para el propio usuario logueado)

---

### 2. Definición Funcional y Reglas de Negocio Validadas

* **Narrativa de Usuario:**
  > **Como** administrador o empleado de Bodegón Trajes,  
  > **Quiero** que mi cuenta tenga sesión única activa y que las sesiones del día expiren formalmente al terminar la jornada (10:00 PM),  
  > **Y como** administrador, quiero apagar el acceso de empleados que no laboran hoy sin riesgo de bloquear mi propia cuenta,  
  > **Para** blindar el control de caja y proteger los registros financieros contra accesos no autorizados.

* **Reglas Deterministas de Negocio:**
  1. **Expiración de Fin de Jornada (10:00 PM Colombia UTC-5):**
     - Toda sesión generada tiene como límite máximo las **10:00 PM (22:00:00)** del día en curso (hora Colombia `America/Bogota`). Si el login se realiza después de las 10:00 PM, se asignan las 10:00 PM del día siguiente.
     - Si un empleado cerró el navegador anoche y llega hoy a las 8:00 AM, el backend detecta que `new Date() > sessionExpiresAt`. La sesión vieja se considera **expirada** y se permite el ingreso directo sin mostrar conflicto.
  2. **Detección de Sesión Concurrente Viva (Mismo Día / Antes de las 10 PM):**
     - Si `empleado.sessionId !== null` Y `new Date() < sessionExpiresAt`:
       * Si `forzarCierre !== true`: El servidor responde `HTTP 409 Conflict` con:
         ```json
         {
           "type": "https://httpstatuses.com/409",
           "title": "Conflict",
           "status": 409,
           "detail": "Ya existe una sesión activa en otro dispositivo.",
           "requiereConfirmacion": true
         }
         ```
       * Al recibir el 409, el frontend despliega el modal de confirmación en 1 clic (**Enfoque A**):
         * *Título:* **Sesión activa detectada**
         * *Mensaje:* *"Tu cuenta ya tiene una sesión abierta en otro equipo o navegador. ¿Deseas cerrarla para iniciar aquí?"*
         * *Botones:* `[ Cancelar ]` y `[ Sí, cerrar otra sesión e ingresar aquí ]`.
       * Si el usuario confirma, el login se reenvía automáticamente con `forzarCierre: true`.
  3. **Toma de Control y Revocación Remota:**
     - Al enviar `forzarCierre: true` (o al iniciar sesión sin sesión viva):
       * Se genera un nuevo `randomUUID()` criptográfico.
       * Se actualiza en `empleados` el nuevo `session_id` y `session_expires_at`.
       * Se emite un JWT firmado que incluye `{ sub, rol, sessionId }`.
     - **Dispositivo Desplazado:** Conserva el token con el UUID anterior. En su siguiente petición HTTP, `JwtStrategy` compara el token con la BD:
       * Discrepancia detectada ➔ Responde de inmediato `HTTP 401 Unauthorized` (`"Sesión cerrada porque se inició sesión en otro dispositivo"`).
       * El interceptor de Axios captura el 401 y redirige a `/login`.
  4. **Blindaje en `RefreshTokenUseCase`:**
     - El endpoint `/auth/refresh` valida estrictamente que `payload.sessionId === empleado.sessionId` y que `new Date() < empleado.sessionExpiresAt`. Un dispositivo revocado no puede prolongar su sesión.
  5. **Cierre Voluntario de Sesión (`Logout`):**
     - Al hacer clic en *"Cerrar Sesión"*, el frontend envía `POST /api/v1/auth/logout`.
     - El backend limpia `session_id = null` y `session_expires_at = null`, garantizando que la cuenta quede libre inmediatamente.
  6. **Control de Turno y Protección de Auto-Bloqueo:**
     - Si un empleado tiene `activo === false`, no puede hacer login ni ejecutar peticiones (HTTP 401).
     - En `empleados-page.tsx`, la fila que corresponde al usuario autenticado muestra el `<Switch>` deshabilitado (`disabled`) con tooltip *"No puedes desactivar tu propia cuenta"*.
     - En backend, `ToggleEmpleadoUseCase` rechaza con `BadRequestException` si un usuario intenta auto-desactivarse.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### Endpoint Login: `POST /api/v1/auth/login`
* **Request Payload (`LoginDto`):**
  ```typescript
  export class LoginDto {
    @IsString() identifier: string; // Email o Celular
    @IsString() password: string;
    @IsOptional() @IsBoolean() forzarCierre?: boolean;
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": {
      "accessToken": "eyJhbGciOi...",
      "rol": "empleado",
      "nombre": "Carlos Empleado"
    }
  }
  ```

#### Endpoint Logout: `POST /api/v1/auth/logout`
* **Headers:** `Authorization: Bearer <JWT>`
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": {
      "message": "Sesión cerrada exitosamente"
    }
  }
  ```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Empleado ingresa en la mañana tras jornada anterior
* **Dado** que un empleado cerró el navegador anoche a las 7:00 PM sin hacer logout,
* **Cuando** ingresa hoy a las 8:00 AM con su email y contraseña,
* **Entonces** el sistema detecta que la sesión previa expiró a las 10:00 PM de anoche, renueva el `sessionId` y le da acceso directo sin mostrar alerta de conflicto.

#### Escenario 2: Detección de sesión concurrente en el mismo turno (Opción 2 - Enfoque A)
* **Dado** que un empleado tiene la sesión abierta en el computador de mostrador A a las 2:00 PM,
* **Cuando** intenta ingresar desde una tablet B a las 2:05 PM con credenciales correctas,
* **Entonces** el servidor responde HTTP 409 y la tablet despliega el modal: *"Tu cuenta ya tiene una sesión abierta en otro equipo..."*.
* **Y cuando** pulsa *"Sí, cerrar otra sesión e ingresar aquí"*, la tablet ingresa al sistema y el computador A queda revocado (recibe HTTP 401 en su siguiente clic).

#### Escenario 3: Cierre de sesión voluntario (Logout)
* **Dado** un empleado con sesión activa,
* **Cuando** hace clic en *"Cerrar Sesión"*,
* **Entonces** se llama a `POST /auth/logout`, la base de datos limpia `session_id = null` y al volver a iniciar no requiere confirmación forzada.

#### Escenario 4: Administrador intenta auto-desactivarse
* **Dado** un administrador visualizando la tabla de empleados,
* **Cuando** observa su propio registro,
* **Entonces** el switch `Activo` se encuentra bloqueado/deshabilitado impidiendo su auto-bloqueo.

---

### 5. Plan de Ejecución Secuencial por Áreas (WBS)

#### 🗄️ Área 1: Base de Datos & Persistencia (Backend)
- [x] `[TSK-06.1-BD]` **Migración TypeORM:** Crear `backend/src/migrations/1727400000000-AddSessionIdToEmpleados.ts` agregando `session_id VARCHAR(100) NULL` y `session_expires_at TIMESTAMPTZ NULL` a `empleados`.
- [x] `[TSK-06.2-BD]` **Entidades TypeORM & Dominio:** Actualizar `empleado.typeorm-entity.ts` y `empleado.entity.ts` con `sessionId` y `sessionExpiresAt`.
- [x] `[TSK-06.3-BD]` **Repositorio Empleado:** Mapear `sessionId` y `sessionExpiresAt` en lectura y guardado.

#### ⚙️ Área 2: Lógica de Autenticación & Seguridad (Backend Application)
- [x] `[TSK-06.4-APP]` **Cálculo de Expiración a las 10 PM:** Helper horario para calcular las 22:00:00 UTC-5 Colombia.
- [x] `[TSK-06.5-APP]` **LoginUseCase con 409 & forzarCierre:** Validación de sesión viva y control de concurrencia.
- [x] `[TSK-06.6-APP]` **LogoutUseCase:** Endpoint y caso de uso para limpiar `sessionId` en BD.
- [x] `[TSK-06.7-APP]` **Blindaje en JwtStrategy & RefreshToken:** Validar `sessionId` y expiración en tiempo real.
- [x] `[TSK-06.8-APP]` **Prevención de Auto-Desactivación:** Validar en `ToggleEmpleadoUseCase` que el usuario no se desactive a sí mismo.

#### 🎨 Área 3: Frontend & Experiencia de Usuario (UI/UX)
- [x] `[TSK-06.9-UI]` **Modal de Sesión Activa en `login-page.tsx`:** Modal Ant Design con confirmación en 1 clic y reenvío con `forzarCierre: true`.
- [x] `[TSK-06.10-UI]` **Integración de Logout en `use-auth.tsx`:** Notificar a `POST /auth/logout` al cerrar sesión.
- [x] `[TSK-06.11-UI]` **Protección de Switch en `empleados-page.tsx`:** Deshabilitar switch en la fila del usuario autenticado con tooltip explicativo.

#### 🧪 Área 4: Calidad & Despliegue Local (QA & DevOps)
- [x] `[TSK-06.12-QA]` **Pruebas Unitarias Jest:** Tests para login concurrente, logout y revocación en `login.use-case.spec.ts`.
- [x] `[TSK-06.13-OPS]` **Migración y Verificación en Docker:** Ejecutar migración y validar el flujo completo en `http://localhost:3080/login`.

