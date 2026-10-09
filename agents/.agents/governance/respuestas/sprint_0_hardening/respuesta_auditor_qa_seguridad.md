# ESPECIFICACIÓN DE AUDITORÍA, SEGURIDAD & QA: CST BODEGÓN TRAJES

## 1. Alcance de la Auditoría Técnica Pre-Release
Basado en el informe oficial de auditoría `docs/Auditoria_PRE_RELEASE_v1.0.md`, se estableció un plan de acción para subsanar vulnerabilidades y garantizar la resiliencia operativa del sistema antes de su puesta en producción en VPS.

---

## 2. Matriz de Hallazgos y Estado de Remediación

### 2.1. Problemas Críticos (C1 a C11) — Estado: ✅ Resueltos
* **C1 (`synchronize: true`):** Cambiado a `NODE_ENV=production` y migraciones controladas.
* **C2 (JWT_SECRET débil):** Eliminado fallback inseguro; error obligatorio si falta la variable.
* **C3 (Credenciales Admin por defecto):** Exigidas mediante variables de entorno obligatorias en seed.
* **C4 & C5 (PostgreSQL expuesto):** Credenciales seguras y eliminación de mapeo directo al host `5432:5432`.
* **C6 (Backend expuesto):** Puerto 3000 protegido, accesible únicamente vía Nginx.
* **C7 (`data-source.ts`):** Configuración lista para migraciones CLI de TypeORM.
* **C8 (`dayjs` faltante):** Incluido en `frontend/package.json`.
* **C9 (Healthcheck falso positivo):** `health.controller.ts` retorna HTTP 503 cuando la base de datos no responde.
* **C10 (`empleadoIdFromReq` fallback):** Excepción `UnauthorizedException` estricta sin fallback a `'system'`.
* **C11 (Variables de producción):** Configuración de `.env.production` seguro.

### 2.2. Hardening de Estabilidad & Concurrencia (Sprint 0) — Estado: ✅ Resuelto
* **A9 (Race condition en facturación):** Secuencia atómica PostgreSQL `factura_numero_seq` implementada (`TSK-H01`).
* **A8 (Acoplamiento de controladores):** Eliminación de inyección de entidades ajenas TypeORM en `FacturasController` (`TSK-H02`).
* **A10 (Falta de tests):** Suite de pruebas unitarias Jest para máquina de estados de facturas, Value Objects y Auth (`TSK-H03`).
* **Frontend DOM Bug:** Modal reactivo de expiración de sesión implementado en React (`TSK-H04`).

### 2.3. Pendientes para Sprint 1 (Mejoras Post-Hardening)
* **A1 (Rate Limiting):** Configurar Throttler global para proteger endpoints de abuso.
* **M1 (Documentación de API):** Integrar Swagger / OpenAPI (`/api/docs`).
* **M3 (Backups):** Estrategia y cron de `pg_dump` para PostgreSQL.
* **M5 (Logging):** Logging estructurado en NestJS.
