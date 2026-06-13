# La Dulcería — Versión WordPress

## Requisitos
- PHP 8.1+
- MySQL 5.7+ / MariaDB 10.3+
- WordPress 6.4+
- WooCommerce 8.0+

## Instalación en Hostinger

### 1. Instalar WordPress
- hPanel → Websites → Add Website → WordPress

### 2. Instalar WooCommerce
- WordPress Admin → Plugins → Add New → buscar "WooCommerce" → Install & Activate

### 3. Subir el tema
- Comprimir la carpeta `wp-content/themes/la-dulceria/` en un ZIP
- WordPress Admin → Appearance → Themes → Add New → Upload Theme → seleccionar el ZIP
- Activate

### 4. Subir los plugins
- Comprimir `wp-content/plugins/dulceria-wompi/` en ZIP y subir como plugin
- Comprimir `wp-content/plugins/dulceria-features/` en ZIP y subir como plugin
- Activar ambos plugins

### 5. Configurar WooCommerce
- WooCommerce → Settings → General:
  - País: Colombia
  - Moneda: Peso Colombiano (COP)
- WooCommerce → Settings → Payments → Wompi: configurar llaves API

### 6. Importar categorías
Crear en WooCommerce → Products → Categories:
- Cumpleaños
- Amor y amistad
- Bodas y XV años
- Bebés y maternidad
- Navidad
- Corporativos
- Ocasiones especiales

### 7. Configurar páginas
WordPress crea automáticamente las páginas de WooCommerce (Tienda, Carrito, Checkout, Mi Cuenta).
Crear adicionalmente:
- Inicio → asignar template "Front Page"
- Catálogo → asignar template "Catálogo"

### 8. Variables de entorno (wp-config.php)
Agregar antes de "That's all, stop editing!":
```php
define('WOMPI_PUBLIC_KEY', 'pub_prod_...');
define('WOMPI_PRIVATE_KEY', 'prv_prod_...');
define('WOMPI_EVENTS_SECRET', '...');
define('WHATSAPP_NUMBER', '573123501815');
define('ADMIN_EMAIL_NOTIF', 'tu@email.com');
```

### 9. Permalinks
Settings → Permalinks → Post name → Save

## Estructura de archivos
```
wp-content/
├── themes/
│   └── la-dulceria/         ← Tema principal
│       ├── style.css
│       ├── functions.php
│       ├── header.php
│       ├── footer.php
│       ├── front-page.php   ← Página de inicio
│       ├── page-catalogo.php
│       ├── single-product.php
│       ├── woocommerce/     ← Overrides de WooCommerce
│       └── assets/
│           ├── css/theme.css
│           └── js/theme.js
└── plugins/
    ├── dulceria-wompi/      ← Pasarela de pago Wompi
    └── dulceria-features/   ← Funcionalidades extra
```
