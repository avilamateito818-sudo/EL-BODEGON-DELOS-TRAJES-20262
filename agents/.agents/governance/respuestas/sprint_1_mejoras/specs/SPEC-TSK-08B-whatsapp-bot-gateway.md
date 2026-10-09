# SPEC TÉCNICA / HISTORIA DE USUARIO: TSK-08B
## PROYECTO: CST BODEGÓN TRAJES — SPRINT 1 (MEJORAS DE MOSTRADOR)
**ID de Tarea:** `[TSK-08B]`  
**Título:** Gateway de WhatsApp Oficial en Servidor (Bot Baileys con QR en VPS, Persistencia de Sesión, Despacho Autónomo y Auditoría de Envíos)  
**Agente Responsable:** `Bodegon-Spec-Engineer` (en co-diseño con `Bodegon-Software-Architect`, `Bodegon-QA-Security-Auditor`, `Bodegon-Database-Engineer` y `Bodegon-UIUX-Designer`)  
**Estado:** 🟢 **100% BLINDADA CON DECISIONES DE NEGOCIO Y SEGURIDAD VALIDADAS**  

---

### 1. Contexto, Necesidad y Alcance (Context & Boundary)

* **Problema de Negocio Detectado:**
  En la tarea `[TSK-08]`, la apertura de enlaces `web.whatsapp.com` depende del navegador o teléfono particular del empleado de mostrador. Si el empleado accede desde su celular personal o terminal compartida sin la sesión del negocio, el cliente recibe el mensaje desde un número desconocido o personal, exponiendo la privacidad del empleado, perdiendo la trazabilidad central y desvinculando al cliente de la línea corporativa de CST Bodegón Trajes.

* **Objetivo de la Solución:**
  1. Implementar un **Gateway / Bot de WhatsApp Local en el Backend (NestJS)** utilizando la librería socket de bajo consumo **`@whiskeysockets/baileys`** (~50 MB RAM, sin Chromium headless).
  2. Gestionar la conexión y persistencia de sesión en un **volumen persistente de Docker** (`/app/whatsapp_auth`) para que una vez escaneado el QR por el Administrador, la sesión se mantenga viva y se reconecte automáticamente ante reinicios de la VPS.
  3. Crear una **Pantalla de Gestión de Conexión en Administración / Configuración** para que únicamente roles autorizados (`admin`, `propietario`) puedan ver el estado (`🟢 Conectado`, `🟡 Esperando QR`, `🔴 Desconectado`), ver el código QR interactivo o desvincular la línea para cambiar de chip.
  4. Proveer un endpoint de despacho seguro: `POST /api/v1/whatsapp/enviar-factura/:id` que genere el mensaje neutro y lo envíe directamente a través del socket al cliente, sin que el empleado tenga que abrir ninguna pestaña ni manipular su WhatsApp personal.
  5. Registrar cada notificación en la tabla de base de datos **`whatsapp_mensajes_log`** para auditar qué empleado disparó el envío, fecha/hora exacta, estado de entrega y teléfono receptor.
  6. **Mecanismo de Respaldo (Fallback Graceful Degradation):** Si por alguna razón técnica el bot estuviese desconectado (ej. teléfono principal apagado), el frontend ofrece automáticamente el enlace directo o copia al portapapeles para no bloquear la operación de mostrador.

* **Ubicación en el Sistema:**
  - **Backend:**
    - Dependencia: `@whiskeysockets/baileys`, `qrcode`, `pino`
    - Módulo: `backend/src/modules/whatsapp-gateway/`
      - Dominio: `whatsapp-session.entity.ts`, `whatsapp-log.entity.ts`
      - Aplicación: `whatsapp-gateway.service.ts`, `enviar-notificacion-factura.use-case.ts`, `consultar-estado-bot.use-case.ts`
      - Infraestructura: `whatsapp.controller.ts`, `whatsapp-log.repository.ts`, `whatsapp-auth.storage.ts`
    - Migración: `backend/src/migrations/1727600000000-CreateWhatsappMensajesLogTable.ts`
    - Docker: Volumen persistente `./whatsapp_auth:/app/whatsapp_auth` en `docker-compose.yml`
  - **Frontend:**
    - Panel Admin: `frontend/src/modules/configuracion/presentation/components/whatsapp-bot-config-card.tsx`
    - Modales y Detalle: Actualización de `whatsapp-share-button.tsx` y `cambio-estado-modal.tsx` para llamar a la mutación de envío automático con feedback de spinner y confirmación verde.

---

### 2. Decisiones de Arquitectura y Roles Especializados

#### 🏗️ Visión del Software Architect (`Bodegon-Software-Architect`)
1. **Librería de Socket `@whiskeysockets/baileys` vs Puppeteer:**
   - Puppeteer consume entre 400 MB y 800 MB de RAM y requiere dependencias pesadas de Linux (`libnss`, `chromium`). Baileys se conecta directo al WebSocket de WhatsApp Web con Node.js puro, consumiendo apenas ~50 MB de RAM, ideal para VPS modestas.
2. **Ciclo de Vida en NestJS (`OnModuleInit` & `OnModuleDestroy`):**
   - El servicio `WhatsappGatewayService` inicializa el socket al arrancar el contenedor.
   - Si existen credenciales previas en `/app/whatsapp_auth`, se reconecta de inmediato en silencio (`connection === 'open'`).
   - Si no hay credenciales o expiraron, genera un string de QR y emite el evento para que el frontend lo consulte vía endpoint con polling ligero (cada 3 segundos) o Server-Sent Events / WebSocket.
3. **Manejo de Desconexiones:**
   - Escuchar evento `connection.update`. Si el código de desconexión es `DisconnectReason.loggedOut`, limpiar credenciales y volver a generar QR. Si es desconexión de red transitoria, reintentar conexión con backoff exponencial.

#### 🗄️ Visión del Database Engineer (`Bodegon-Database-Engineer`)
* **Tabla `whatsapp_mensajes_log`:**
  ```sql
  CREATE TABLE whatsapp_mensajes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    telefono_destino VARCHAR(20) NOT NULL,
    estado_factura VARCHAR(20) NOT NULL,
    mensaje_enviado TEXT NOT NULL,
    estado_envio VARCHAR(20) NOT NULL, -- 'ENVIADO', 'FALLIDO', 'PENDIENTE'
    error_detalle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX idx_whatsapp_log_factura ON whatsapp_mensajes_log(factura_id);
  CREATE INDEX idx_whatsapp_log_fecha ON whatsapp_mensajes_log(created_at);
  ```

#### 🛡️ Visión del QA & Security Auditor (`Bodegon-QA-Security-Auditor`)
1. **Seguridad y Control de Acceso (RBAC):**
   - Endpoints de administración (`GET /status`, `GET /qr`, `POST /disconnect`): Protegidos con `JwtAuthGuard` y `RolesGuard(['admin', 'propietario'])`. Un empleado de mostrador no tiene acceso a desvincular la línea ni ver códigos QR.
   - Endpoint de envío (`POST /enviar-factura/:id`): Protegido con `JwtAuthGuard`. Registra en auditoría el `empleado_id` del token JWT.
2. **Protección Anti-Spam y Prevención de Bloqueo de Número:**
   - La tienda no realiza envíos masivos ni promocionales fríos; únicamente notificaciones transaccionales solicitadas por el cliente en el mostrador.
   - Debounce en backend: Si se solicita un envío para la misma factura en un intervalo menor a 15 segundos, se rechaza con `429 Too Many Requests` para evitar doble clic o bombardeo al cliente.
3. **Degradación Elegante (Fallback):**
   - Si Baileys no tiene sesión activa (`status !== 'CONNECTED'`), el backend responde `503 Service Unavailable` con código `WHATSAPP_BOT_NOT_CONNECTED`. El frontend captura este código y le ofrece al empleado: *"La línea oficial no está conectada. ¿Deseas abrir el enlace directo o copiar el texto para no hacer esperar al cliente?"*.

#### 🎨 Visión de UI/UX (`Bodegon-UIUX-Designer`)
1. **Pestaña de Configuración del Bot:**
   - Tarjeta elegante en Configuración con estados:
     - 🟢 **Conectado:** Muestra ícono verde de WhatsApp, número vinculado (ej: `+57 310 123 4567`) y botón *"Desvincular / Cambiar Número"*.
     - 🟡 **Esperando Vinculación:** Muestra el código QR grande y nítido, con botón de refrescar y un paso a paso visual:
       *1. Abre WhatsApp en el celular oficial de CST Bodegón Trajes.*  
       *2. Toca Menú o Ajustes > Dispositivos vinculados.*  
       *3. Toca Vincular un dispositivo y apunta la cámara a esta pantalla.*
     - 🔴 **Desconectado:** Botón llamativo `[ Iniciar Conexión WhatsApp ]`.
2. **Experiencia en Mostrador (Factura y Modal de Cambio de Estado):**
   - El botón principal pasa a llamarse: `[ 💬 Enviar WhatsApp Oficial ]`.
   - Al pulsar, el botón se bloquea con un `Spin` / `loading` de Ant Design durante 1-2 segundos.
   - Al recibir confirmación 200 OK del backend, lanza notificación verde `message.success("✅ Mensaje enviado al cliente desde la línea oficial")`.
   - Se mantiene el botón secundario `[ 📋 ]` (Copiar) como respaldo.

---

### 3. Contratos de Entrada/Salida (I/O Contracts)

#### Endpoint 1: Consultar Estado del Bot (Admin/Propietario)
* **Ruta:** `GET /api/v1/whatsapp/status`
* **Auth:** JWT (`admin`, `propietario`)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "estado": "CONNECTED", // 'CONNECTED' | 'SCAN_QR' | 'DISCONNECTED'
    "telefonoConectado": "573101234567",
    "nombreConectado": "CST Bodegón Trajes",
    "qrCode": null,
    "ultimaActualizacion": "2026-09-29T12:00:00.000Z"
  }
  ```

#### Endpoint 2: Obtener Código QR para Vinculación (Admin/Propietario)
* **Ruta:** `GET /api/v1/whatsapp/qr`
* **Auth:** JWT (`admin`, `propietario`)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "estado": "SCAN_QR",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiraEnSegundos": 45
  }
  ```

#### Endpoint 3: Desconectar / Desvincular Sesión (Admin/Propietario)
* **Ruta:** `POST /api/v1/whatsapp/disconnect`
* **Auth:** JWT (`admin`, `propietario`)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "mensaje": "Sesión de WhatsApp desvinculada exitosamente. Se ha limpiado el almacenamiento local."
  }
  ```

#### Endpoint 4: Enviar Notificación de Factura (Cualquier empleado autenticado)
* **Ruta:** `POST /api/v1/whatsapp/enviar-factura/:id`
* **Auth:** JWT (Cualquier rol activo)
* **Request Payload (Opcional):**
  ```json
  {
    "mensajePersonalizado": null // Si viene null, el backend usa la plantilla neutra oficial
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "exito": true,
    "mensaje": "Mensaje enviado satisfactoriamente al cliente",
    "telefonoDestino": "573134603606",
    "logId": "d3b07384-d113-4f4e-b5f7-4148e24c5208"
  }
  ```
* **Respuesta Error (503 Service Unavailable):**
  ```json
  {
    "statusCode": 503,
    "error": "WHATSAPP_BOT_NOT_CONNECTED",
    "message": "El bot oficial de WhatsApp de la tienda no se encuentra conectado. Notifica al administrador o utiliza el enlace manual."
  }
  ```

---

### 4. Criterios de Aceptación Técnicos (Gherkin / Given-When-Then)

#### Escenario 1: Vinculación inicial de la tienda mediante QR
* **Dado** que el administrador ingresa a Configuración > WhatsApp Oficial,
* **Cuando** el estado del bot está en `SCAN_QR` y escanea el código en pantalla con el celular de la tienda,
* **Entonces** el estado cambia automáticamente a `CONNECTED`, muestra el número oficial vinculado y guarda la sesión en `/app/whatsapp_auth`.

#### Escenario 2: Persistencia tras reinicio de la VPS
* **Dado** que la sesión ya fue vinculada previamente,
* **Cuando** se reinicia el contenedor de Docker o la máquina virtual,
* **Entonces** el backend se reconecta al WebSocket de WhatsApp en segundo plano sin volver a solicitar código QR.

#### Escenario 3: Despacho automático de factura desde cualquier dispositivo
* **Dado** una factura en estado `SEPARADO`, `ENTREGADO` o `DEVUELTO` con cliente y celular válido,
* **Cuando** un empleado (en PC, tablet o celular) presiona `[ Enviar WhatsApp Oficial ]`,
* **Entonces** el backend despacha el mensaje neutro con negritas, emojis y PIN de 4 dígitos a través de la línea corporativa, el cliente recibe el mensaje de inmediato y se inserta un registro en `whatsapp_mensajes_log`.

#### Escenario 4: Degradación elegante si el bot se desconecta
* **Dado** que el celular de la tienda se quedó sin batería o sin internet y el socket se cerró,
* **Cuando** el empleado intenta enviar el WhatsApp desde la factura,
* **Entonces** el sistema captura el error 503, muestra un aviso amigable y le ofrece al empleado abrir WhatsApp Web directamente o copiar el texto para no detener la atención al cliente.

---

### 5. Plan de Ejecución Secuencial (WBS)

- [x] `[TSK-08B.1-BE]` **Instalación y Persistencia:** Instalar `@whiskeysockets/baileys`, `qrcode`, `pino` en el backend y configurar volumen Docker persistente `./whatsapp_auth:/app/whatsapp_auth`.
- [x] `[TSK-08B.2-BE]` **Migración de Base de Datos:** Crear tabla `whatsapp_mensajes_log` para auditoría y trazabilidad.
- [x] `[TSK-08B.3-BE]` **Servicio Gateway Baileys (`WhatsappGatewayService`):** Manejo de socket, eventos de reconexión, generación de QR DataURL y función `sendTextMessage`.
- [x] `[TSK-08B.4-BE]` **Controlador y Casos de Uso:** Endpoints protegidos `/status`, `/qr`, `/disconnect` y endpoint de despacho `/enviar-factura/:id` con plantillas oficiales y control de rate limit.
- [x] `[TSK-08B.5-FE]` **UI de Administración:** Crear `whatsapp-bot-config-card.tsx` en el módulo de Configuración para ver estado, QR en vivo y desvinculación.
- [x] `[TSK-08B.6-FE]` **Integración de Envío en Mostrador:** Conectar botón de WhatsApp en `factura-detail-page.tsx` y `cambio-estado-modal.tsx` al endpoint del servidor con spinner, mensaje de éxito y fallback manual.
- [x] `[TSK-08B.7-QA]` **Pruebas y Validación:** Tests unitarios de los casos de uso, verificación de reconexión y prueba en vivo con WhatsApp real.
