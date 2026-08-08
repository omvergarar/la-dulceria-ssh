<?php
defined('ABSPATH') || exit;

// Reset OPcache al cargar el tema (temporal hasta confirmar deploy estable)
if (function_exists('opcache_reset')) { opcache_reset(); }

// ── Forzar template page-my-account.php en la página de WooCommerce ──
add_filter('template_include', function ($template) {
    if (is_account_page() && !is_wc_endpoint_url()) {
        $custom = get_template_directory() . '/page-my-account.php';
        if (file_exists($custom)) return $custom;
    }
    return $template;
});

// ── Desactivar caché en páginas de cuenta ────────────────────
add_action('send_headers', function () {
    if (is_page('my-account') || is_account_page()) {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('X-LiteSpeed-Cache-Control: no-cache');
    }
});

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
// Forzar opción via filtro directo (más confiable que update_option)
add_filter('pre_option_woocommerce_registration_generate_password', function() { return 'no'; });
update_option('woocommerce_registration_generate_password', 'no');

// ── Dirección de envío diferente: desmarcado por defecto ─────
add_filter('woocommerce_ship_to_different_address_checked', '__return_false');

// ── Zona de entrega: dropdown propio + ocultar billing_postcode ──
add_filter('woocommerce_checkout_fields', function ($fields) {
    // Construir opciones desde zonas de envío de WooCommerce
    $zonas_raw = WC_Shipping_Zones::get_zones();
    $opciones  = ['' => 'Selecciona tu zona de entrega…'];
    foreach ($zonas_raw as $zona) {
        $nombre            = $zona['zone_name'];
        $opciones[$nombre] = $nombre;
    }

    // Agregar campo select propio en la sección billing
    $fields['billing']['ld_zona_entrega'] = [
        'type'     => 'select',
        'label'    => 'Zona de entrega',
        'required' => true,
        'options'  => $opciones,
        'class'    => ['form-row-wide'],
        'priority' => 85,
    ];

    // Ocultar el campo billing_postcode nativo (WooCommerce no permite eliminarlo)
    if (isset($fields['billing']['billing_postcode'])) {
        $fields['billing']['billing_postcode']['required'] = false;
        $fields['billing']['billing_postcode']['class']    = ['hidden'];
        $fields['billing']['billing_postcode']['label']    = '';
    }

    return $fields;
});

// Ocultar el wrapper del postcode con CSS
add_action('wp_head', function () {
    if (!is_checkout()) return;
    echo '<style>#billing_postcode_field { display:none !important; }</style>';
});

// Validar que se haya seleccionado zona
add_action('woocommerce_checkout_process', function () {
    if (empty($_POST['ld_zona_entrega'])) {
        wc_add_notice('Por favor selecciona tu <strong>zona de entrega</strong>.', 'error');
    }
});

// Guardar zona en meta de la orden
add_action('woocommerce_checkout_create_order', function ($order) {
    if (!empty($_POST['ld_zona_entrega'])) {
        $zona = sanitize_text_field(wp_unslash($_POST['ld_zona_entrega']));
        $order->update_meta_data('_ld_zona_entrega', $zona);
        // Sincronizar también en billing_postcode para compatibilidad
        $order->set_billing_postcode($zona);
    }
});

// Mostrar en el panel admin del pedido
add_action('woocommerce_admin_order_data_after_billing_address', function ($order) {
    $zona = $order->get_meta('_ld_zona_entrega');
    if ($zona) {
        echo '<p><strong>Zona de entrega:</strong> ' . esc_html($zona) . '</p>';
    }
});

// Incluir en emails
add_filter('woocommerce_email_order_meta_fields', function ($fields, $sent_to_admin, $order) {
    $zona = $order->get_meta('_ld_zona_entrega');
    if ($zona) {
        $fields['ld_zona_entrega'] = [
            'label' => 'Zona de entrega',
            'value' => $zona,
        ];
    }
    return $fields;
}, 10, 3);

// ── Forzar Wompi disponible en checkout ──────────────────────
add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    if (isset($gateways['wompi'])) return $gateways;
    $all = WC()->payment_gateways()->payment_gateways();
    if (isset($all['wompi'])) {
        $gateways['wompi'] = $all['wompi'];
    }
    return $gateways;
});

// Garantizar que la contraseña del POST se use siempre  
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

// Redirigir al inicio después del registro
add_filter('woocommerce_registration_redirect', function () {
    return home_url('/');
});

// Redirigir al inicio en el auto-login post-registro
add_filter('woocommerce_login_redirect', function ($redirect, $user) {
    if (!empty($_POST['register'])) {
        return home_url('/');
    }
    return $redirect;
}, 10, 2);

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
    $css_ver = filemtime(get_template_directory() . '/assets/css/theme.css');
    $js_ver  = filemtime(get_template_directory() . '/assets/js/theme.js');
    wp_enqueue_style(
        'la-dulceria-theme',
        get_template_directory_uri() . '/assets/css/theme.css',
        [], $css_ver
    );
    wp_enqueue_script(
        'la-dulceria-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        [], $js_ver, true
    );
    wp_localize_script('la-dulceria-js', 'ldConfig', [
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('ld_nonce'),
        'cartUrl'   => wc_get_cart_url(),
        'homeUrl'   => home_url('/'),
        'whatsapp'  => defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '573123501815',
        'currency'  => get_woocommerce_currency_symbol(),
    ]);
    wp_localize_script('la-dulceria-js', 'ldAjax', ['url' => admin_url('admin-ajax.php')]);
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

// ── Formulario de contacto → envío de email ──────────────────
add_action('wp_ajax_ld_contacto',        'ld_ajax_contacto');
add_action('wp_ajax_nopriv_ld_contacto', 'ld_ajax_contacto');
function ld_ajax_contacto(): void {
    check_ajax_referer('ld_contacto', 'ld_contacto_nonce');

    $nombre   = sanitize_text_field(wp_unslash($_POST['ld_nombre']           ?? ''));
    $contacto = sanitize_text_field(wp_unslash($_POST['ld_contacto_data']    ?? ''));
    $tipo     = sanitize_text_field(wp_unslash($_POST['ld_tipo']             ?? ''));
    $mensaje  = sanitize_textarea_field(wp_unslash($_POST['ld_mensaje_contacto'] ?? ''));

    if (!$nombre || !$contacto || !$tipo || !$mensaje) {
        wp_send_json_error(['msg' => 'Por favor completa todos los campos.']);
    }

    $destinatario = 'administracion@ladulceriaregalos.com';
    $asunto       = '[La Dulcería] Nuevo mensaje de contacto: ' . $tipo;
    $cuerpo       = "Nuevo mensaje recibido desde el formulario de contacto:\n\n"
                  . "Nombre: {$nombre}\n"
                  . "Contacto: {$contacto}\n"
                  . "Tipo de consulta: {$tipo}\n\n"
                  . "Mensaje:\n{$mensaje}\n";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $nombre . ' <' . $contacto . '>',
    ];

    $enviado = wp_mail($destinatario, $asunto, $cuerpo, $headers);

    if ($enviado) {
        wp_send_json_success(['msg' => '¡Mensaje enviado!']);
    } else {
        wp_send_json_error(['msg' => 'Error al enviar. Por favor intenta de nuevo.']);
    }
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
            $gateways  = WC()->payment_gateways ? WC()->payment_gateways()->payment_gateways() : [];
            $available = WC()->payment_gateways ? WC()->payment_gateways()->get_available_payment_gateways() : [];
            return new WP_REST_Response([
                'ok'                 => true,
                'mensaje'            => 'Caché purgado correctamente',
                'wompi_settings'     => get_option('woocommerce_wompi_settings', []),
                'active_plugins'     => get_option('active_plugins', []),
                'all_gateways'       => array_keys($gateways),
                'available_gateways' => array_keys($available),
                'currency'           => get_woocommerce_currency(),
            ], 200);
        },
    ]);
});

// ── Invalidar caché LiteSpeed al guardar/eliminar categorías ──
add_action('edited_product_cat',  'ld_purge_cat_cache');
add_action('created_product_cat', 'ld_purge_cat_cache');
add_action('delete_product_cat',  'ld_purge_cat_cache');
function ld_purge_cat_cache(): void {
    clean_term_cache(0, 'product_cat');
    wp_cache_flush();
    // Señal a LiteSpeed para purgar la página del catálogo
    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_all();
    } elseif (function_exists('do_cacheaction')) {
        do_cacheaction('purge_all');
    } else {
        // Header directo compatible con LiteSpeed
        @header('X-LiteSpeed-Purge: *');
    }
}

// ── Campo: Fecha y Hora de Entrega ────────────────────────────

// Quitar el sufijo "(opcional)" del campo de fecha de entrega
add_filter('woocommerce_form_field_args', function ($args, $key) {
    if ($key === 'ld_fecha_entrega') {
        $args['label_class'][] = 'ld-no-optional';
    }
    return $args;
}, 10, 2);
add_action('wp_footer', function () {
    if (!is_checkout()) return;
    echo '<style>#ld-entrega-field label .optional { display:none !important; }</style>';
});

// 1. Mostrar el campo en el checkout (antes de las notas del pedido)
add_action('woocommerce_before_order_notes', function ($checkout) {
    $val = $checkout->get_value('ld_fecha_entrega') ?: '';
    ?>
    <div id="ld-entrega-field" class="form-row form-row-wide">
      <h3 style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--accent-dark);margin:24px 0 16px;padding-top:20px;border-top:2px solid var(--primary);">Fecha y Hora de Entrega</h3>
      <label>Fecha y hora de entrega del pedido <span class="required">*</span></label>

      <!-- Input oculto que se envía con el formulario -->
      <input type="hidden" name="ld_fecha_entrega" id="ld_fecha_entrega" value="<?= esc_attr($val) ?>">

      <!-- Selector visual de fecha y hora -->
      <div class="ld-picker-wrap">
        <!-- Fecha -->
        <div class="ld-picker-group">
          <label class="ld-picker-lbl">Día</label>
          <select id="ldPickerDay" class="ld-picker-sel"><option value="">Día</option></select>
        </div>
        <div class="ld-picker-group">
          <label class="ld-picker-lbl">Mes</label>
          <select id="ldPickerMonth" class="ld-picker-sel">
            <option value="">Mes</option>
            <?php
            $meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            foreach ($meses as $i => $m) {
                echo '<option value="' . ($i+1) . '">' . $m . '</option>';
            }
            ?>
          </select>
        </div>
        <div class="ld-picker-group">
          <label class="ld-picker-lbl">Año</label>
          <select id="ldPickerYear" class="ld-picker-sel">
            <option value="">Año</option>
            <?php
            $y = (int) date('Y');
            for ($i = $y; $i <= $y + 2; $i++) echo "<option value='$i'>$i</option>";
            ?>
          </select>
        </div>
        <div class="ld-picker-sep">—</div>
        <!-- Hora -->
        <div class="ld-picker-group">
          <label class="ld-picker-lbl">Hora</label>
          <select id="ldPickerHour" class="ld-picker-sel">
            <option value="">HH</option>
            <?php for ($h = 0; $h < 24; $h++) printf('<option value="%02d">%02d:00</option>', $h, $h); ?>
          </select>
        </div>
        <div class="ld-picker-group">
          <label class="ld-picker-lbl">Minutos</label>
          <select id="ldPickerMin" class="ld-picker-sel">
            <option value="">MM</option>
            <?php foreach ([0,15,30,45] as $m) printf('<option value="%02d">:%02d</option>', $m, $m); ?>
          </select>
        </div>
      </div>

      <p class="ld-entrega-hint">La entrega mínima es 2 horas desde ahora.</p>
    </div>
    <?php
});

// 2. Validar que el campo esté presente y sea una fecha futura
add_action('woocommerce_checkout_process', function () {
    if (empty($_POST['ld_fecha_entrega'])) {
        wc_add_notice('Por favor selecciona la <strong>fecha y hora de entrega</strong> del pedido.', 'error');
        return;
    }
    $ts = strtotime(sanitize_text_field(wp_unslash($_POST['ld_fecha_entrega'])));
    if (!$ts || $ts < time()) {
        wc_add_notice('La fecha y hora de entrega debe ser en el futuro.', 'error');
    }
});

// 3. Guardar en el meta de la orden (compatible con HPOS)
add_action('woocommerce_checkout_create_order', function ($order) {
    if (!empty($_POST['ld_fecha_entrega'])) {
        $val = sanitize_text_field(wp_unslash($_POST['ld_fecha_entrega']));
        $order->update_meta_data('_ld_fecha_entrega', $val);
    }
});

// 4. Mostrar en el panel de administración del pedido
add_action('woocommerce_admin_order_data_after_billing_address', function ($order) {
    $val = $order->get_meta('_ld_fecha_entrega');
    if ($val) {
        $dt = date_create($val);
        $formateado = $dt ? date_format($dt, 'd/m/Y H:i') : $val;
        echo '<p><strong>Fecha y hora de entrega:</strong> ' . esc_html($formateado) . '</p>';
    }
});

// 5. Incluir en los emails de la orden al cliente y al admin
add_filter('woocommerce_email_order_meta_fields', function ($fields, $sent_to_admin, $order) {
    $val = $order->get_meta('_ld_fecha_entrega');
    if ($val) {
        $dt = date_create($val);
        $formateado = $dt ? date_format($dt, 'd/m/Y \a \l\a\s H:i') : $val;
        $fields['ld_fecha_entrega'] = [
            'label' => 'Fecha y hora de entrega',
            'value' => $formateado,
        ];
    }
    return $fields;
}, 10, 3);

// ── Mensaje personalizado por producto en el carrito ──────────

// 1. Mostrar el textarea debajo del nombre de cada ítem
add_action('woocommerce_after_cart_item_name', function ($cart_item, $cart_item_key) {
    $msg      = isset($cart_item['ld_mensaje']) ? esc_textarea($cart_item['ld_mensaje']) : '';
    $palabras = $msg ? count(preg_split('/\s+/', trim($msg), -1, PREG_SPLIT_NO_EMPTY)) : 0;
    $restantes = 100 - $palabras;
    ?>
    <div class="ld-msg-wrap" style="margin-top:10px;">
        <label style="display:block;font-size:.8rem;font-weight:700;color:#5a3d58;margin-bottom:4px;">
            Acompaña tu regalo con un mensaje especial
        </label>
        <textarea
            name="ld_mensaje[<?= esc_attr($cart_item_key) ?>]"
            class="ld-msg-input"
            rows="3"
            data-key="<?= esc_attr($cart_item_key) ?>"
            style="width:100%;padding:8px 10px;border:1.5px solid #ecd6ec;border-radius:10px;font-family:inherit;font-size:.875rem;resize:vertical;color:#2d1a2b;background:#fdf8fd;"
            placeholder="Escribe aquí tu mensaje (opcional, máximo 100 palabras)..."
        ><?= $msg ?></textarea>
        <p class="ld-msg-counter" style="font-size:.75rem;color:#9a7898;margin-top:3px;">
            <span class="ld-palabras-restantes"><?= $restantes ?></span> palabras disponibles
        </p>
    </div>
    <?php
}, 10, 2);

// 2. Guardar el mensaje al actualizar el carrito
add_action('woocommerce_before_calculate_totals', function ($cart) {
    if (is_admin() && !defined('DOING_AJAX')) return;
    if (empty($_POST['ld_mensaje']) || !is_array($_POST['ld_mensaje'])) return;
    foreach ($cart->get_cart() as $key => $item) {
        if (isset($_POST['ld_mensaje'][$key])) {
            $raw   = sanitize_textarea_field(wp_unslash($_POST['ld_mensaje'][$key]));
            $words = preg_split('/\s+/', trim($raw), -1, PREG_SPLIT_NO_EMPTY);
            if (count($words) > 100) $raw = implode(' ', array_slice($words, 0, 100));
            $cart->cart_contents[$key]['ld_mensaje'] = $raw;
        }
    }
    WC()->session->set('cart', $cart->cart_contents);
}, 10, 1);

// 3. Pasar el mensaje al ítem de la orden
add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values, $order) {
    if (!empty($values['ld_mensaje'])) {
        $item->add_meta_data('Mensaje personalizado', $values['ld_mensaje'], true);
    }
}, 10, 4);

// 4. JS: contador de palabras en tiempo real
add_action('wp_footer', function () {
    if (!is_cart()) return;
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function () {
        function ldContarPalabras(t) { return t.trim() === '' ? 0 : t.trim().split(/\s+/).length; }
        document.querySelectorAll('.ld-msg-input').forEach(function (ta) {
            var counter = ta.closest('.ld-msg-wrap').querySelector('.ld-palabras-restantes');
            ta.addEventListener('input', function () {
                var n = ldContarPalabras(ta.value);
                var restantes = 100 - n;
                if (restantes < 0) {
                    ta.value = ta.value.trim().split(/\s+/).slice(0, 100).join(' ');
                    restantes = 0;
                }
                counter.textContent = restantes;
                counter.style.color = restantes <= 10 ? '#e53e3e' : '#9a7898';
            });
        });
    });
    </script>
    <?php
});
