# Prompt principal — Tienda de Regalos (Claude Code)

## Contexto del proyecto

Construye una aplicación web completa para una **tienda de regalos en línea** lista para producción. El stack debe ser 100% compatible con **Hostinger Business Plan** y desplegable desde Claude Code vía GitHub.

Este proyecto se desarrolla desde **Visual Studio Code** usando Claude Code. El archivo la-dulceria_prototipo.html se encuentra en la raíz del proyecto y debe usarse como referencia de diseño para la landing page.

---

## Stack tecnológico obligatorio

- **Framework:** Next.js 14 (App Router) con TypeScript
- **Base de datos:** MySQL (conexión vía variables de entorno de Hostinger)
- **ORM:** Prisma
- **Estilos:** Tailwind CSS
- **Autenticación:** NextAuth.js (login con email/contraseña)
- **Pagos:** Wompi (Colombia) — integración con su API REST
- **Imágenes:** almacenamiento local en `/public/uploads/productos/` con Next.js Image
- **Deploy:** compatible con Node.js Web Apps de Hostinger; incluir `package.json` con scripts `build` y `start`

---

## Base de datos — esquema MySQL requerido

Crea y ejecuta las migraciones de Prisma para las siguientes entidades:

**Cliente:** id, nombre, email (único), contraseña (hash), teléfono, dirección, fecha_registro

**Producto:** id, nombre, descripción, precio, stock, categoría, imagen_url, activo, fecha_creación

**Orden:** id, cliente_id (FK), total, estado (pendiente/pagado/enviado/cancelado), fecha, referencia_pago

**DetalleOrden:** id, orden_id (FK), producto_id (FK), cantidad, precio_unitario

---

## Páginas y funcionalidades requeridas

### Públicas (visitantes)
- `/` — Landing page: tomar como referencia visual y de contenido el prototipo existente en `la-dulceria_prototipo.html` (ubicado en la raíz del proyecto). Respetar su estructura, paleta de colores y textos; trasladar fielmente el diseño a componentes Next.js + Tailwind CSS.
- `/catalogo` — Catálogo con filtro por categoría, búsqueda por nombre y ordenamiento por precio
- `/producto/[id]` — Detalle del producto: fotos, descripción, precio, botón agregar al carrito
- `/carrito` — Resumen del carrito con cantidades editables y total
- `/checkout` — Formulario de datos + integración con botón de pago Wompi
- `/login` y `/registro` — Autenticación de clientes

### Privadas (cliente autenticado)
- `/cuenta` — Historial de órdenes con estado de cada una

### Panel de administración (`/admin`)
- Login exclusivo para administrador (usuario hardcodeado en `.env`)
- `/admin/productos` — CRUD completo: crear, editar, eliminar productos y subir foto
- `/admin/ordenes` — Listado de órdenes con cambio de estado
- `/admin/clientes` — Listado de clientes registrados

---

## Variables de entorno

Genera un archivo `.env.example` con estas variables:

```
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/nombre_db
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://tudominio.com
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
ADMIN_EMAIL=admin@tutienda.com
ADMIN_PASSWORD=
```

---

## Archivos de deploy para Hostinger

Genera los siguientes archivos listos para producción:

1. `.github/workflows/deploy.yml` — GitHub Actions con deploy automático vía SSH a Hostinger al hacer push a `main`
2. `ecosystem.config.js` — configuración de PM2 para mantener la app corriendo
3. `.htaccess` o `next.config.js` — configuración de rutas y optimización de imágenes para Hostinger

---

## Requisitos de calidad

- Diseño responsivo (mobile-first) profesional para tienda de regalos: colores cálidos, tipografía clara
- Manejo de errores en formularios con mensajes en español
- Protección de rutas `/admin` y `/cuenta` por rol
- Validación de stock antes de confirmar orden
- Código comentado en español en secciones críticas (auth, pagos, BD)

---

## Entregable esperado

Estructura de carpetas completa lista para `git push` a GitHub y deploy inmediato en Hostinger. Al finalizar, muestra el comando exacto para inicializar la base de datos con `prisma migrate deploy` y cómo configurar PM2.
