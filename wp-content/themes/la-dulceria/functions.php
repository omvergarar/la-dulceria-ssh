<?php
defined('ABSPATH') || exit;

// ── Catálogo visible para todos sin necesidad de login ────────
add_filter('woocommerce_checkout_redirect_empty_cart', '__return_false');
add_filter('woocommerce_login_url', function() { return home_url('/my-account/'); });
remove_action('template_redirect', array('WC_Shortcode_My_Account', 'redirect_to_dashboard_if_logged_in'));

// ── Deshabilitar modo Coming Soon de WooCommerce ──────────────
add_action('init', function () {
    if (get_option('woocommerce_coming_soon') === 'yes') {
        update_option('woocommerce_coming_soon', 'no');
    }
});
// Eliminar la redirección que WooCommerce aplica a visitantes no logueados
add_action('template_redirect', function () {
    if (class_exists('WC_Coming_Soon_Helper')) {
        remove_action('template_redirect', ['WC_Coming_Soon_Helper', 'coming_soon_redirect'], 10);
        remove_action('template_redirect', ['WC_Coming_Soon_Helper', 'redirect_coming_soon'], 10);
    }
}, 1);

// ── Registro: guardar contraseña y nombre en BD ───────────────
// Forzar que WooCommerce use la contraseña ingresada por el usuario
add_filter('woocommerce_new_customer_data', function ($data) {
    if (!empty($_POST['password'])) {
        $data['user_pass'] = $_POST['password'];
    }
    if (!empty($_POST['first_name'])) {
        $data['first_name'] = sanitize_text_field(wp_unslash($_POST['first_name']));
        $data['display_name'] = $data['first_name'];
    }
    if (!empty($_POST['last_name'])) {
        $data['last_name'] = sanitize_text_field(wp_unslash($_POST['last_name']));
    }
    return $data;
});

// Guardar nombre/apellido en user_meta después de crear el usuario
add_action('woocommerce_created_customer', function ($customer_id) {
    if (!empty($_POST['first_name'])) {
        update_user_meta($customer_id, 'first_name', sanitize_text_field(wp_unslash($_POST['first_name'])));
        update_user_meta($customer_id, 'billing_first_name', sanitize_text_field(wp_unslash($_POST['first_name'])));
    }
    if (!empty($_POST['last_name'])) {
        update_user_meta($customer_id, 'last_name', sanitize_text_field(wp_unslash($_POST['last_name'])));
        update_user_meta($customer_id, 'billing_last_name', sanitize_text_field(wp_unslash($_POST['last_name'])));
    }
});

// Redirigir al completar perfil después del registro
add_filter('woocommerce_registration_redirect', function () {
    return wc_get_account_endpoint_url('edit-account');
});

// ── Soporte del tema ──────────────────────────────────────────
add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    add_theme_support('html5', ['search-form','comment-form','comment-list','gallery','caption']);
    register_nav_menus(['primary' => 'Menú principal']);
});

// ── Encolar estilos y scripts ─────────────────────────────────
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'la-dulceria-theme',
        get_template_directory_uri() . '/assets/css/theme.css',
        [], '1.0.0'
    );
    wp_enqueue_script(
        'la-dulceria-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        [], '1.0.0', true
    );
    wp_localize_script('la-dulceria-js', 'ldConfig', [
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('ld_nonce'),
        'cartUrl'   => wc_get_cart_url(),
        'homeUrl'   => home_url('/'),
        'whatsapp'  => defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '573123501815',
        'currency'  => get_woocommerce_currency_symbol(),
    ]);
});

// ── WooCommerce: quitar estilos por defecto ───────────────────
add_filter('woocommerce_enqueue_styles', '__return_empty_array');

// ── Quitar sidebar de WooCommerce ─────────────────────────────
remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar', 10);

// ── Imagen de producto por defecto ───────────────────────────
add_filter('woocommerce_product_get_image', function ($image, $product, $size, $attr, $placeholder, $image_) {
    if (empty($image_)) {
        return '<div class="ld-product-img-placeholder">🎁</div>';
    }
    return $image;
}, 10, 6);

// ── Número de productos por página ───────────────────────────
add_filter('loop_shop_per_page', fn() => 20);

// ── Breadcrumbs WooCommerce desactivados ─────────────────────
add_action('init', function () {
    remove_action('woocommerce_before_main_content', 'woocommerce_breadcrumb', 20);
});

// ── Helpers de formato ────────────────────────────────────────
function ld_precio(float $precio): string {
    return '$ ' . number_format($precio, 0, ',', '.');
}

function ld_whatsapp_url(string $msg = ''): string {
    $num = defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '573123501815';
    return 'https://wa.me/' . $num . ($msg ? '?text=' . urlencode($msg) : '');
}

// ── Shortcodes útiles ─────────────────────────────────────────
add_shortcode('ld_whatsapp', function () {
    $url = ld_whatsapp_url('Hola! Quiero más información sobre sus productos 🌸');
    return '<a href="' . esc_url($url) . '" target="_blank" rel="noopener" class="btn-primary">Hablar por WhatsApp</a>';
});

// ── Configuración tienda (opción WP) ─────────────────────────
if (!function_exists('ld_config')) {
    function ld_config(string $key, $default = null) {
        $config = get_option('ld_config', []);
        return $config[$key] ?? $default;
    }
}

if (!function_exists('ld_config_set')) {
    function ld_config_set(string $key, $value): void {
        $config = get_option('ld_config', []);
        $config[$key] = $value;
        update_option('ld_config', $config);
    }
}

// ── Inicializar configuración por defecto ─────────────────────
add_action('init', function () {
    if (!get_option('ld_config')) {
        update_option('ld_config', [
            'banner_activo'        => true,
            'codigo_promo'         => 'DULCE15',
            'descuento_porcentaje' => 15,
            'envio_gratis_desde'   => 120000,
        ]);
    }
});

// ── API AJAX: validar cupón ───────────────────────────────────
add_action('wp_ajax_ld_validar_cupon', 'ld_ajax_validar_cupon');
add_action('wp_ajax_nopriv_ld_validar_cupon', 'ld_ajax_validar_cupon');
function ld_ajax_validar_cupon(): void {
    check_ajax_referer('ld_nonce', 'nonce');
    $codigo = strtoupper(sanitize_text_field($_POST['codigo'] ?? ''));
    if (!$codigo) { wp_send_json_error(['msg' => 'Código vacío']); }

    $coupon = new WC_Coupon($codigo);
    if (!$coupon->get_id()) { wp_send_json_error(['msg' => 'Código no válido']); }
    if (!$coupon->is_valid()) { wp_send_json_error(['msg' => 'Código no disponible']); }

    wp_send_json_success([
        'codigo'    => $codigo,
        'descuento' => $coupon->get_amount(),
        'tipo'      => $coupon->get_discount_type(),
    ]);
}

// ── API AJAX: enviar reseña ───────────────────────────────────
add_action('wp_ajax_ld_enviar_resena', 'ld_ajax_enviar_resena');
add_action('wp_ajax_nopriv_ld_enviar_resena', 'ld_ajax_enviar_resena');
function ld_ajax_enviar_resena(): void {
    check_ajax_referer('ld_nonce', 'nonce');
    $nombre    = sanitize_text_field($_POST['nombre'] ?? '');
    $texto     = sanitize_textarea_field($_POST['texto'] ?? '');
    $estrellas = intval($_POST['estrellas'] ?? 5);

    if (!$nombre || !$texto || strlen($texto) < 10) {
        wp_send_json_error(['msg' => 'Datos incompletos']);
    }

    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'ld_resenas', [
        'nombre'    => $nombre,
        'texto'     => $texto,
        'estrellas' => max(1, min(5, $estrellas)),
        'aprobada'  => 0,
        'creado_en' => current_time('mysql'),
    ]);
    wp_send_json_success(['msg' => '¡Gracias por tu reseña!']);
}

// ── Crear tablas custom en activación ────────────────────────
register_activation_hook(__FILE__, 'ld_crear_tablas');
function ld_crear_tablas(): void {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $sqls = [
        "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_resenas (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nombre      VARCHAR(100) NOT NULL,
            ciudad      VARCHAR(100),
            texto       TEXT NOT NULL,
            estrellas   TINYINT NOT NULL DEFAULT 5,
            aprobada    TINYINT NOT NULL DEFAULT 0,
            creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) $charset",

        "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_codigos_usados (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id     BIGINT UNSIGNED NOT NULL,
            codigo      VARCHAR(50) NOT NULL,
            usado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_codigo (user_id, codigo)
        ) $charset",

        "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_carrusel (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            url         VARCHAR(500) NOT NULL,
            titulo      VARCHAR(150),
            descripcion VARCHAR(300),
            orden       INT NOT NULL DEFAULT 0,
            activo      TINYINT NOT NULL DEFAULT 1,
            creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) $charset",
    ];

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    foreach ($sqls as $sql) dbDelta($sql);
}

// ── Número de items en carrito para navbar ────────────────────
add_action('wp_ajax_ld_cart_count', 'ld_ajax_cart_count');
add_action('wp_ajax_nopriv_ld_cart_count', 'ld_ajax_cart_count');
function ld_ajax_cart_count(): void {
    wp_send_json_success(['count' => WC()->cart->get_cart_contents_count()]);
}

// ── Agregar producto al carrito vía AJAX ──────────────────────
add_filter('woocommerce_add_to_cart_fragments', function ($fragments) {
    $count = WC()->cart->get_cart_contents_count();
    $fragments['.ld-cart-count'] = '<span class="ld-cart-count">' . $count . '</span>';
    return $fragments;
});


// ── Endpoint para purgar caché después del deploy ─────────────
add_action('rest_api_init', function () {
    register_rest_route('ld/v1', '/purge-cache', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function (WP_REST_Request $req) {
            $key = $req->get_param('key');
            if ($key !== 'ld_purge_k9x2m4r8') {
                return new WP_Error('forbidden', 'Clave incorrecta', ['status' => 403]);
            }
            // OPcache
            if (function_exists('opcache_reset')) opcache_reset();
            // Caché de objetos de WordPress
            wp_cache_flush();
            // Transients (caché de BD)
            global $wpdb;
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'");
            return new WP_REST_Response(['ok' => true, 'mensaje' => 'Caché purgado correctamente'], 200);
        },
    ]);
});
