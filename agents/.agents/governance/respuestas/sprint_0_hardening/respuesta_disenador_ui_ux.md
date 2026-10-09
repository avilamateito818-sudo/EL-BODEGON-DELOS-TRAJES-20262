# ESPECIFICACIÓN DE DISEÑO UI/UX & RESPONSIVE: CST BODEGÓN TRAJES

## 1. Sistema Visual y Design System
* **Librería Base:** Ant Design 6 con tema corporativo configurado en `ConfigProvider`.
* **Tokens Visuales:**
  - Color Primario: Azul Corporativo (`#1677ff` / `#0958d9`).
  - Estados de Facturas:
    * `SEPARADA`: Badge Naranja / Warn (`#faad14`).
    * `ALQUILADA`: Badge Azul / Processing (`#1677ff`).
    * `DEVUELTA`: Badge Verde / Success (`#52c41a`).
    * `CANCELADA`: Badge Rojo / Default (`#ff4d4f`).
* **Tipografía:** Sistema nativo de fuentes sans-serif de alta legibilidad (`Inter`, `system-ui`).

---

## 2. Hoja de Ruta de Adaptabilidad Responsive (`Plan-Desarrollo-Responsive.md`)

### Diagnóstico de Pantallas
El sistema cuenta con 22 pantallas. El objetivo de la estrategia responsive es asegurar usabilidad total tanto en computadoras de mostrador como en teléfonos móviles y tablets:

1. **Modales Dinámicos:**
   - Evitar `width={560}` o anchos fijos en píxeles que desborden en pantallas móviles `< 480px`.
   - Implementación de hook `useModalWidth(maxWidth)` que retorne el valor mínimo entre el ancho objetivo y el 92% del viewport móvil.
2. **Tablas con Columnas Adaptativas:**
   - En pantallas móviles y tablets, las columnas secundarias (ej. Email, Teléfono, Empleado, Historial Detalle) se ocultan automáticamente mediante la propiedad `responsive: ['md']` o `responsive: ['lg']` de Ant Design Table.
   - Activación de scroll horizontal suave con `scroll={{ x: 'max-content' }}` para evitar recortes.
3. **Headers y Barras de Acciones:**
   - Contenedores de botones con `flex flex-col sm:flex-row gap-2` para que los botones de acción (`Volver`, `Crear Factura`, `Editar`) se apilen verticalmente en teléfonos.
4. **Layout de Detalles:**
   - Componentes `Descriptions` configurados con grid adaptativo (`column={{ xs: 1, sm: 2, md: 3 }}`) para evitar desbordes de texto.
