# ESPECIFICACIÓN DE REQUERIMIENTOS DE NEGOCIO (PRD): CST BODEGÓN TRAJES

## 1. Visión del Negocio y Propósito del Sistema
**CST BODEGÓN TRAJES** es un sistema integral de software diseñado para gestionar el ciclo de vida completo de un negocio de alquiler de trajes, disfraces, accesorios y ropa de fiesta.

El sistema reemplaza registros manuales y hojas de cálculo por una plataforma web segura, multiusuario, con roles jerárquicos y trazabilidad de cada centavo en alquileres y depósitos en garantía.

---

## 2. Módulos Funcionales Centrales

### 2.1. Autenticación y Control de Acceso (`SPEC-003`)
* **Login JWT:** Acceso seguro con email y contraseña, emisión de token con expiración de 24 horas y asignación de rol (`admin`, `empleado`).
* **Protección de Rutas:** Interceptores de autenticación y guardias de roles (`RolesGuard`).
* **Seguridad de Passwords:** Hashing con bcrypt (12 salt rounds).
* **Control de Empleados Desactivados:** Bloqueo inmediato de acceso para empleados inactivos.

### 2.2. Gestión de Empleados (`SPEC-004`)
* **CRUD Administrativo:** Crear, listar, editar y auditar colaboradores.
* **Soft Delete:** Desactivación lógica de cuentas para preservar integridad histórica en facturas y transacciones.
* **Datos Clave:** Nombre, email, celular, dirección, fecha de ingreso, días de pago y rol.

### 2.3. Base de Clientes (`SPEC-001`)
* **Directorio de Clientes:** Búsqueda rápida por nombre, cédula/documento, celular o email.
* **Historial Consolidado:** Vista de 360° por cliente con listado de facturas históricas, alquileres activos, depósitos retenidos y deudas pendientes.

### 2.4. Catálogo de Elementos y Trajes (`SPEC-002`)
* **Inventario de Prendas:** Gestión de trajes, disfraces y accesorios con código, descripción, categoría, talla y color.
* **Control de Disponibilidad:** Estados en tiempo real (Disponible, Alquilado, Mantenimiento/Lavandería, Retirado).
* **Parámetros Económicos:** Precio de alquiler por jornada/evento y valor de depósito en garantía sugerido.

### 2.5. Gestión de Facturación y Ciclo de Alquiler (`SPEC-005`)
* **Máquina de Estados de Facturas:**
  - `SEPARADA`: Factura reservada con abono inicial y fijación de fecha de evento.
  - `ALQUILADA`: Entrega física de las prendas al cliente con cobro del saldo restante y recepción obligatoria del depósito en garantía.
  - `DEVUELTA`: Retorno de prendas a la tienda, inspección de estado físico, liquidación de depósitos y cobro de penalizaciones por mora o daño si aplican.
  - `CANCELADA`: Anulación de la reserva con reversión de inventario.
* **Trazabilidad de Dinero:**
  - Desglose exacto: Valor total de alquiler, valor abonado, saldo pendiente y valor del depósito en garantía.
* **Secuencia Correlativa Segura:** Numeración correlativa automática y atómica (`FACT-XXXX`).

### 2.6. Devoluciones y Liquidación de Depósitos (`SPEC-006`)
* Registro de fecha real de devolución frente a fecha pactada.
* Cálculo automático de días de mora y recargos.
* Devolución neta de depósito: `Depósito a Reintegrar = Depósito Inicial - Cargos por Daño - Cargos por Mora`.

### 2.7. Alertas Automáticas y Cron (`SPEC-007`)
* Detección automática diaria de trajes por devolver hoy.
* Notificación visual de trajes en mora con cálculo de días de atraso.

### 2.8. Dashboard de Control y Métricas (`SPEC-008`)
* Indicadores clave de rendimiento (KPIs): Total facturado del mes, trajes actualmente en alquiler, depósitos en custodia y alertas activas.
* Gráfica de distribución de facturación por empleado y por período.
