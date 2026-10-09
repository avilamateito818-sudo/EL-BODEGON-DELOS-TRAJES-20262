# ESPECIFICACIÓN DE ARQUITECTURA FRONTEND: CST BODEGÓN TRAJES

## 1. Ficha Técnica del Frontend
* **Runtime & Bundler:** TypeScript 5.7+ / React 19.x / Vite 8.x
* **Librería de Componentes:** Ant Design 6.x (`antd`, `@ant-design/icons`)
* **Framework de Estilos:** Tailwind CSS 4.x
* **Data Fetching & Cache:** TanStack React Query 5.x
* **Cliente HTTP:** Axios 1.x con interceptores de autenticación y manejo de sesión reactivo
* **Enrutamiento:** React Router DOM 7.x

---

## 2. Estructura de Capas Clean Architecture
El frontend organiza su código por módulos funcionales (`auth`, `cliente`, `empleado`, `elemento`, `factura`, `devolucion`, `alerta`, `dashboard`, `shared`):

```text
frontend/src/
├── config/                      # Configuración de Axios, queryClient, constantes
├── modules/                     # Módulos de dominio de negocio
│   ├── auth/
│   │   ├── application/         # Custom hooks (useLogin, useAuthSession)
│   │   ├── domain/              # Interfaces y contratos de tipos (User, LoginCredentials)
│   │   └── presentation/        # Componentes y páginas (LoginPage, ProtectedRoute)
│   ├── cliente/
│   │   ├── application/         # useClientes, useClienteDetail, useCreateCliente
│   │   ├── domain/              # Cliente, CreateClienteDto
│   │   └── presentation/        # ClientesPage, ClienteDetailPage, modales
│   ├── elemento/
│   │   ├── application/         # useElementos, useDisponibilidad
│   │   ├── domain/              # ElementoCatalogo, CategoriaElemento
│   │   └── presentation/        # CatalogoPage, ElementoFormModal
│   ├── factura/
│   │   ├── application/         # useFacturas, useFacturaMutations, useCalculosFactura
│   │   ├── domain/              # Factura, ItemFactura, EstadoFactura, Dinero
│   │   └── presentation/        # FacturasPage, FacturaDetailPage, NuevaFacturaModal
│   └── shared/
│       ├── presentation/        # AppLayout, Navbar, Sidebar, hooks responsivos
│       └── utils/               # Formateadores de moneda (COP), fechas y helpers
└── App.tsx                      # Enrutador principal y proveedores globales
```

---

## 3. Decisiones Clave de Diseño Frontend
1. **Modal Reactivo de Sesión Expirada:**
   - Desacoplado mediante eventos/estado en React; se eliminó toda inyección manual de elementos en el DOM directo.
2. **Estrategia de Caché e Invalidación:**
   - Tras mutaciones de estado de facturas o pagos, React Query invalida automáticamente las queries de listado de facturas, clientes y métricas de dashboard para garantizar sincronía instantánea.
3. **Manejo Estandarizado de Errores (RFC 9457):**
   - Interceptor de Axios que extrae el formato estándar de `problem+json` y lo proyecta en notificaciones legibles de Ant Design (`notification.error()`).
