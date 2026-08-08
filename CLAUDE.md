# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Despliegue

Todo cambio se despliega a Hostinger vía **GitHub Actions** — no hay build local ni CLI de FTP. El único mecanismo de despliegue es:

1. Hacer commit y push a `main`
2. Ejecutar manualmente el workflow **"Despliegue Completo a Hostinger"** desde GitHub Actions (`.github/workflows/deploy-full.yml`)

El workflow sube por FTP los 5 directorios en este orden, cada uno con `dangerous-clean-slate: true`:
1. `themes/la-dulceria/` → `wp-content/themes/la-dulceria/`
2. `themes/la-dulceria/woocommerce/` → `wp-content/themes/la-dulceria/woocommerce/`
3. `plugins/dulceria-features/` → `wp-content/plugins/dulceria-features/`
4. `plugins/dulceria-wompi/` → `wp-content/plugins/dulceria-wompi/`
5. `mu-plugins/` → `wp-content/mu-plugins/`

Al final purga el caché del servidor via REST: `GET /wp-json/ld/v1/purge-cache?key=ld_purge_k9x2m4r8`

## Arquitectura crítica

### Must-use plugin: `ld-wompi-force.php`

**Este es el archivo más importante del proyecto.** Los mu-plugins se cargan antes que cualquier plugin normal y no pueden ser desactivados desde el admin. Contiene:

- **SMTP**: hook `phpmailer_init` — configura `smtp.hostinger.com:465` con credencial `LD_SMTP_PASS` definida en `wp-config.php`
- **Webhook de Wompi** (priority 1): corre antes del handler del plugin. Verifica firma SHA256, busca la orden por `_wompi_referencia`, llama `payment_complete()` y envía email al admin. Logs en `wp-content/wompi-logs/webhook-YYYY-MM-DD.log`
- **Inyección de CSS de tema**: en `wp_head` priority 5 — lee colores guardados en `wp_options` (`ld_tema_color_*`) y los emite como variables CSS `:root { --primary: ...; }`
- **Panel de temas**: override del callback de la página admin via hook `current_screen` (no `admin_menu`)
- **Emails al crear orden**: hook `woocommerce_checkout_order_created` — dispara `WC_Email_New_Order` (admin) y email de cliente

### Claves en `wp-config.php` (solo en Hostinger, NO en repo)

```
WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_KEY, WOMPI_EVENTS_SECRET
LD_SMTP_PASS, WHATSAPP_NUMBER, ADMIN_EMAIL_NOTIF
```

### Flujo de pago Wompi

1. `process_payment()` en el plugin genera referencia única `DULCERIA-XXXXX-timestamp` y la guarda como meta `_wompi_referencia`
2. `receipt_page()` renderiza el widget de Wompi con firma de integridad: `SHA256(referencia + monto_centavos + "COP" + integrity_key)`
3. Wompi llama al webhook `POST /wc-api/wompi_webhook`
4. El mu-plugin (priority 1) intercepta primero, verifica firma: `SHA256(transaction.id + status + amount_in_cents + sent_at + evt_secret)` — actualmente hay bypass temporal si la firma no coincide
5. `payment_complete()` actualiza el pedido; `wp_mail()` notifica al admin

### Tema: `la-dulceria`

- `front-page.php` — página principal con hero, stats, features, productos destacados, reseñas y formulario de reseña
- `woocommerce/archive-product.php` — catálogo con hero y navegación sticky de categorías
- `single-product.php` — página de producto individual
- `functions.php` — todos los hooks del tema: AJAX para reseñas, endpoint de purga de caché, mensajes de carrito, hooks de invalidación de caché al editar categorías
- `assets/css/theme.css` — único archivo CSS; variables en `:root`, sin preprocesador
- `assets/js/theme.js` — JavaScript del tema (vanilla)
- `partials/product-card.php` — tarjeta de producto reutilizable

### Base de datos custom

- `wp_ld_resenas` — reseñas de clientes (nombre, texto, estrellas, aprobada, creado_en). Se crean en `dulceria-features.php` y en `functions.php` vía `register_activation_hook`
- `wp_ld_codigos_usados` — registro de cupones usados por usuario

### OPcache en Hostinger (PHP-FPM multi-worker)

Los archivos en `mu-plugins/` siempre se ejecutan frescos. Los plugins normales y el tema pueden quedar cacheados. Ante comportamientos extraños donde el código actualizado no surte efecto, el endpoint de purga resetea OPcache vía `opcache_reset()`.

## Convenciones del proyecto

- Prefijo `ld_` para todas las funciones, hooks, meta keys y opciones custom
- Colores del tema guardados en `wp_options` como `ld_tema_color_primary`, `ld_tema_color_accent`, etc.
- Variables CSS: `--primary`, `--primary-dark`, `--primary-deeper`, `--accent`, `--accent-dark`, `--text-dark`, `--text-medium`, `--text-light`, `--bg-soft`, `--bg-cream`
- El plugin `dulceria-wompi` registra el gateway con id `wompi`; el mu-plugin fuerza su disponibilidad vía `woocommerce_available_payment_gateways` priority 999
