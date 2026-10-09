# ESPECIFICACIÓN DE ARQUITECTURA TÉCNICA DE SOFTWARE: CST BODEGÓN TRAJES

## 1. Ficha Técnica Oficial del Stack

* **Lenguaje & Runtime Backend:** TypeScript 5.7+ / Node.js 20 LTS
* **Framework Principal Backend:** NestJS 11.x
* **Persistencia & ORM:** PostgreSQL 16 Alpine + TypeORM 1.0.x (Migraciones CLI con `data-source.ts`)
* **Seguridad & Auth:** Passport-JWT + bcrypt (12 salt rounds) + Guards jerárquicos (`RolesGuard`, `JwtAuthGuard`)
* **Lenguaje & Runtime Frontend:** TypeScript 5.7+ / React 19.x / Vite 8.x
* **Librerías UI & Estilos:** Ant Design 6.x (`antd`), Tailwind CSS 4.x, `@ant-design/icons`
* **Estado & Data Fetching:** TanStack React Query 5.x + Axios 1.x
* **Infraestructura & Contenedores:** Docker Compose multi-stage build + Nginx Alpine (Reverse Proxy & Static Server en puerto 3080)

---

## 2. Patrón Arquitectónico & Diagrama de Capas

El sistema implementa **Clean Architecture (Arquitectura Limpia)** con separación estricta en 4 capas por módulo funcional (`auth`, `empleado`, `cliente`, `elemento`, `factura`, `alerta`, `dashboard`):

```text
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                   │
│   • Controllers HTTP (NestJS) / DTOs de entrada        │
│   • Pages & Components React (Ant Design / Tailwind)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    APPLICATION LAYER                   │
│   • Casos de Uso (Use Cases) orquestadores             │
│   • Interfaces de entrada y salida (DTOs / Mappers)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      DOMAIN LAYER                      │
│   • Entidades de Negocio puras (Factura, Empleado...)  │
│   • Value Objects (Dinero, EstadoFactura, Rol...)      │
│   • Interfaces de Repositorios (Puertos / Contratos)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 INFRASTRUCTURE LAYER                   │
│   • Implementación TypeORM de Repositorios (Adaptador) │
│   • Entidades de Persistencia (TypeORM Entities)       │
│   • Servicios externos (JWT, bcrypt, cron scheduler)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Decisiones de Diseño & Hardening de Estabilidad

1. **Concurrencia Atómica en Facturas:**
   - La numeración de facturas (`FACT-0001`) se delega a una secuencia de base de datos PostgreSQL (`factura_numero_seq`) para evitar race conditions en entornos concurrentes.
2. **Desacoplamiento entre Módulos:**
   - Ningún controlador de presentación debe inyectar repositorios de otros módulos. El enriquecimiento de datos cruzados (ej. asociar nombre de cliente a factura) se realiza a través de casos de uso o servicios de aplicación.
3. **Manejo Estandarizado de Errores:**
   - Todos los errores HTTP siguen el estándar **RFC 9457 (Problem Details for HTTP APIs)** mediante `ProblemDetailsFilter`.
4. **Protección de Sesión Frontend:**
   - La expiración de token de sesión se gestiona con eventos desacoplados hacia un modal reactivo de Ant Design, evitando manipulación directa del DOM.
