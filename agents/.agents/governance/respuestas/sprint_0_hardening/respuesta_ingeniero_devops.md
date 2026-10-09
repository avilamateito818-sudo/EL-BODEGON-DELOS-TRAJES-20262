# ESPECIFICACIÓN DE INFRAESTRUCTURA & DEVOPS: CST BODEGÓN TRAJES

## 1. Topología de Contenedores (Docker Compose)
El despliegue local y en producción (VPS) se gestiona mediante Docker Compose multi-stage con 3 servicios aislados:

```text
                                 Internet / Navegador
                                          │
                                          ▼  [Puerto 3080]
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICIO: frontend (Nginx Alpine Reverse Proxy + React Static Build)         │
│ • Sirve los estáticos compilados de React en /usr/share/nginx/html          │
│ • Proxy inverso en /api/v1/ hacia http://backend:3000                       │
│ • Compresión gzip y Security Headers configurados                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Red Interna Docker
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICIO: backend (NestJS 11 Node.js 20 LTS Alpine)                         │
│ • Expone exclusivamente el puerto interno 3000 (sin mapeo directo al host)  │
│ • Ejecuta con usuario non-root (node) para cumplimiento de seguridad        │
│ • Healthcheck activo en /api/v1/health (retorna 503 en fallo de DB)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Red Interna Docker
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICIO: postgres (PostgreSQL 16 Alpine)                                    │
│ • Puerto 5432 cerrado hacia el exterior (solo accesible entre contenedores) │
│ • Volumen persistente pgdata                                                 │
│ • Secuencia de BD factura_numero_seq para concurrencia atómica               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardening de Infraestructura Aplicado (Auditoría v1.0)
1. **Protección de Puertos:** Se eliminó la exposición directa de los puertos 5432 (Postgres) y 3000 (Backend) en el host del VPS.
2. **Variables de Entorno:**
   - Cero credenciales hardcodeadas en `docker-compose.yml`.
   - `JWT_SECRET` y credenciales de admin inyectadas mediante `.env.production` (excluido de Git).
3. **Migraciones CLI:** `backend/src/data-source.ts` configurado para ejecutar migraciones TypeORM sin requerir `synchronize: true` en producción.
4. **Security Headers en Nginx:** Configurados `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection` y compresión gzip.
