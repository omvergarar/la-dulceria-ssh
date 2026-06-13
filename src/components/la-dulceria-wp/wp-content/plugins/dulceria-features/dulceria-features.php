<?php
/**
 * Plugin Name: La Dulceria - Funcionalidades Extra
 * Description: Panel de administracion personalizado: estadisticas, carrusel, resenas, cupones por usuario, temas de color.
 * Version: 1.1.0
 * Author: La Dulceria
 */
defined('ABSPATH') || exit;

if (!function_exists('ld_config')) {
    function ld_config(string $key, $default = null) {
        $config = get_option('ld_config', array());
        return isset($config[$key]) ? $config[$key] : $default;
    }
}

if (!function_exists('ld_config_set')) {
    function ld_config_set(string $key, $value): void {
        $config = get_option('ld_config', array());
        $config[$key] = $value;
        update_option('ld_config', $config);
    }
}

add_action('init', function () {
    if (!get_option('ld_config')) {
        update_option('ld_config', array(
            'banner_activo'        => true,
            'codigo_promo'         => 'DULCE15',
            'descuento_porcentaje' => 15,
            'envio_gratis_desde'   => 120000,
        ));
    }
});

register_activation_hook(__FILE__, function () {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    dbDelta("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_resenas (
        id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nombre    VARCHAR(100) NOT NULL,
        ciudad    VARCHAR(100) DEFAULT NULL,
        texto     TEXT NOT NULL,
        estrellas TINYINT NOT NULL DEFAULT 5,
        aprobada  TINYINT NOT NULL DEFAULT 0,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;");

    dbDelta("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_codigos_usados (
        id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id  BIGINT UNSIGNED NOT NULL,
        codigo   VARCHAR(50) NOT NULL,
        usado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY user_codigo (user_id, codigo)
    ) $charset;");

    dbDelta("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ld_carrusel (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        url         VARCHAR(500) NOT NULL,
        titulo      VARCHAR(150) DEFAULT NULL,
        descripcion VARCHAR(300) DEFAULT NULL,
        orden       INT NOT NULL DEFAULT 0,
        activo      TINYINT NOT NULL DEFAULT 1,
        creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;");
});

add_action('admin_menu', function () {
    $cap = 'manage_options';
    add_menu_page('La Dulceria', 'La Dulceria', $cap, 'ld-dashboard', 'ld_page_dashboard', 'dashicons-heart', 56);
    add_submenu_page('ld-dashboard', 'Dashboard',     'Dashboard',      $cap, 'ld-dashboard',    'ld_page_dashboard');
    add_submenu_page('ld-dashboard', 'Estadisticas',  'Estadisticas',   $cap, 'ld-estadisticas', 'ld_page_estadisticas');
    add_submenu_page('ld-dashboard', 'Resenas',       'Resenas',        $cap, 'ld-resenas',      'ld_page_resenas');
    add_submenu_page('ld-dashboard', 'Carrusel',      'Carrusel',       $cap, 'ld-carrusel',     'ld_page_carrusel');
    add_submenu_page('ld-dashboard', 'Cupones',       'Uso de cupones', $cap, 'ld-cupones',      'ld_page_cupones');
    add_submenu_page('ld-dashboard', 'Configuracion', 'Configuracion',  $cap, 'ld-config',       'ld_page_config');
    add_submenu_page('ld-dashboard', 'Temas',         'Temas de color', $cap, 'ld-temas',        'ld_page_temas');
});

add_action('admin_head', function () {
    $screen = get_current_screen();
    if (!$screen || strpos($screen->id, 'ld-') === false) return;
    echo '<style>
.ld-wrap{padding:20px 0;}
.ld-stats-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;}
.ld-stat{background:#fff;border-radius:10px;padding:20px 24px;box-shadow:0 2px 8px rgba(0,0,0,.06);text-align:center;border-top:4px solid #c96bc4;min-width:130px;}
.ld-stat-num{font-size:1.75rem;font-weight:700;color:#c96bc4;display:block;}
.ld-stat-lbl{font-size:.75rem;color:#9a7898;margin-top:4px;display:block;}
.ld-tbl{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);}
.ld-tbl th{background:#fbddf9;color:#2d1a2b;padding:10px 14px;text-align:left;font-size:.8125rem;font-weight:700;}
.ld-tbl td{padding:10px 14px;border-bottom:1px solid #f5bef2;font-size:.8125rem;color:#5a3d58;}
.ld-tbl tr:hover td{background:#fef6fe;}
.ld-badge{display:inline-block;font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:50px;}
.ld-ok{background:#d1fae5;color:#065f46;}
.ld-pend{background:#fef9c3;color:#92400e;}
.ld-fg{margin-bottom:16px;}
.ld-fg label{display:block;font-weight:600;font-size:.8125rem;margin-bottom:4px;}
.ld-fg input,.ld-fg textarea,.ld-fg select{width:100%;max-width:480px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:.875rem;}
.ld-card{background:#fff;border-radius:10px;padding:24px;max-width:560px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:24px;}
</style>';
});

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ld_page_dashboard(): void {
    $total_prod = wp_count_posts('product')->publish ?? 0;
    $total_users = count_users()['total_users'] ?? 0;
    $ordenes_hoy = 0;
    $total_ventas = 0;

    if (function_exists('wc_get_orders')) {
        $ordenes_hoy = count(wc_get_orders(array(
            'limit'        => -1,
            'return'       => 'ids',
            'date_created' => date('Y-m-d') . '...' . date('Y-m-d', strtotime('tomorrow')),
        )));
        $ventas = wc_get_orders(array(
            'status'       => array('processing', 'completed'),
            'date_created' => date('Y-m-01') . '...' . date('Y-m-t'),
            'limit'        => -1,
        ));
        foreach ($ventas as $o) $total_ventas += $o->get_total();
    }

    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Dashboard — La Dulceria</h1>';
    echo '<div class="ld-stats-row">';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . $total_prod . '</span><span class="ld-stat-lbl">Productos</span></div>';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . $total_users . '</span><span class="ld-stat-lbl">Usuarios</span></div>';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . $ordenes_hoy . '</span><span class="ld-stat-lbl">Ordenes hoy</span></div>';
    echo '<div class="ld-stat" style="border-color:#4caf7d;"><span class="ld-stat-num" style="color:#4caf7d;">$ ' . number_format($total_ventas, 0, ',', '.') . '</span><span class="ld-stat-lbl">Ventas este mes</span></div>';
    echo '</div>';
    echo '<p><a href="' . admin_url('edit.php?post_type=product') . '" class="button button-primary">Ir a Productos</a>';
    if (function_exists('wc_get_orders')) echo ' <a href="' . admin_url('edit.php?post_type=shop_order') . '" class="button">Ver ordenes</a>';
    echo '</p></div>';
}

// ═══════════════════════════════════════════════════════════════
// ESTADISTICAS
// ═══════════════════════════════════════════════════════════════
function ld_page_estadisticas(): void {
    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Estadisticas</h1>';

    if (!function_exists('wc_get_products')) {
        echo '<p>WooCommerce no esta activo.</p></div>';
        return;
    }

    $productos = wc_get_products(array('limit' => -1, 'status' => 'publish'));
    $por_cat = array();
    foreach ($productos as $p) {
        $cats = get_the_terms($p->get_id(), 'product_cat');
        $cat  = (!empty($cats) && !is_wp_error($cats)) ? $cats[0]->name : 'Sin categoria';
        if (!isset($por_cat[$cat])) $por_cat[$cat] = array('total'=>0,'en_stock'=>0,'ultimas'=>0,'agotados'=>0);
        $por_cat[$cat]['total']++;
        $stock = $p->get_stock_quantity();
        if ($stock === null || $stock > 3) $por_cat[$cat]['en_stock']++;
        elseif ($stock >= 1)               $por_cat[$cat]['ultimas']++;
        else                               $por_cat[$cat]['agotados']++;
    }

    $total    = count($productos);
    $en_stock = array_sum(array_column($por_cat, 'en_stock'));
    $ultimas  = array_sum(array_column($por_cat, 'ultimas'));
    $agotados = array_sum(array_column($por_cat, 'agotados'));

    echo '<div class="ld-stats-row">';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . $total . '</span><span class="ld-stat-lbl">Total</span></div>';
    echo '<div class="ld-stat" style="border-color:#4caf7d;"><span class="ld-stat-num" style="color:#4caf7d;">' . $en_stock . '</span><span class="ld-stat-lbl">En stock</span></div>';
    echo '<div class="ld-stat" style="border-color:#f0b429;"><span class="ld-stat-num" style="color:#f0b429;">' . $ultimas . '</span><span class="ld-stat-lbl">Ultimas unidades</span></div>';
    echo '<div class="ld-stat" style="border-color:#e53e3e;"><span class="ld-stat-num" style="color:#e53e3e;">' . $agotados . '</span><span class="ld-stat-lbl">Agotados</span></div>';
    echo '</div>';

    echo '<table class="ld-tbl"><thead><tr><th>Categoria</th><th>Total</th><th>En stock</th><th>Ultimas</th><th>Agotados</th></tr></thead><tbody>';
    foreach ($por_cat as $cat => $d) {
        echo '<tr><td><strong>' . esc_html($cat) . '</strong></td><td>' . $d['total'] . '</td>';
        echo '<td style="color:#065f46;font-weight:600;">' . $d['en_stock'] . '</td>';
        echo '<td style="color:#92400e;font-weight:600;">' . $d['ultimas'] . '</td>';
        echo '<td style="color:#991b1b;font-weight:600;">' . $d['agotados'] . '</td></tr>';
    }
    echo '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════════
// RESENAS
// ═══════════════════════════════════════════════════════════════
function ld_page_resenas(): void {
    global $wpdb;
    $tabla = $wpdb->prefix . 'ld_resenas';

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ld_nonce']) && wp_verify_nonce($_POST['ld_nonce'], 'ld_resena')) {
        if (!empty($_POST['ld_aprobar'])) {
            $wpdb->update($tabla, array('aprobada'=>1), array('id'=>intval($_POST['ld_aprobar'])));
        }
        if (!empty($_POST['ld_rechazar'])) {
            $wpdb->delete($tabla, array('id'=>intval($_POST['ld_rechazar'])));
        }
    }

    $resenas    = $wpdb->get_results("SELECT * FROM {$tabla} ORDER BY creado_en DESC");
    $aprobadas  = count(array_filter($resenas, function($r){ return $r->aprobada; }));
    $pendientes = count($resenas) - $aprobadas;

    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Resenas</h1>';
    echo '<div class="ld-stats-row">';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . count($resenas) . '</span><span class="ld-stat-lbl">Total</span></div>';
    echo '<div class="ld-stat" style="border-color:#4caf7d;"><span class="ld-stat-num" style="color:#4caf7d;">' . $aprobadas . '</span><span class="ld-stat-lbl">Aprobadas</span></div>';
    echo '<div class="ld-stat" style="border-color:#f0b429;"><span class="ld-stat-num" style="color:#f0b429;">' . $pendientes . '</span><span class="ld-stat-lbl">Pendientes</span></div>';
    echo '</div>';

    echo '<table class="ld-tbl"><thead><tr><th>Nombre</th><th>Resena</th><th>Estrellas</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>';
    if (empty($resenas)) {
        echo '<tr><td colspan="6" style="text-align:center;padding:32px;">Sin resenas todavia</td></tr>';
    }
    foreach ($resenas as $r) {
        echo '<tr>';
        echo '<td><strong>' . esc_html($r->nombre) . '</strong></td>';
        echo '<td>' . esc_html(mb_substr($r->texto, 0, 80)) . '...</td>';
        echo '<td style="color:#f0b429;">' . str_repeat('★', intval($r->estrellas)) . '</td>';
        echo '<td><span class="ld-badge ' . ($r->aprobada ? 'ld-ok' : 'ld-pend') . '">' . ($r->aprobada ? 'Aprobada' : 'Pendiente') . '</span></td>';
        echo '<td>' . date('d/m/Y', strtotime($r->creado_en)) . '</td>';
        echo '<td><form method="post" style="display:inline;">';
        wp_nonce_field('ld_resena', 'ld_nonce');
        if (!$r->aprobada) echo '<button name="ld_aprobar" value="' . intval($r->id) . '" class="button button-small button-primary" style="margin-right:4px;">Aprobar</button>';
        echo '<button name="ld_rechazar" value="' . intval($r->id) . '" class="button button-small" onclick="return confirm(\'Eliminar?\')">Eliminar</button>';
        echo '</form></td></tr>';
    }
    echo '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════════
// CARRUSEL
// ═══════════════════════════════════════════════════════════════
function ld_page_carrusel(): void {
    global $wpdb;
    $tabla = $wpdb->prefix . 'ld_carrusel';

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ld_nonce']) && wp_verify_nonce($_POST['ld_nonce'], 'ld_carrusel')) {
        if (!empty($_POST['ld_guardar'])) {
            $url = esc_url_raw($_POST['url'] ?? '');
            if ($url) {
                $wpdb->insert($tabla, array(
                    'url'         => $url,
                    'titulo'      => sanitize_text_field($_POST['titulo'] ?? ''),
                    'descripcion' => sanitize_textarea_field($_POST['descripcion'] ?? ''),
                    'orden'       => intval($_POST['orden'] ?? 0),
                    'activo'      => 1,
                ));
            }
        }
        if (!empty($_POST['ld_toggle'])) {
            $id  = intval($_POST['ld_toggle']);
            $act = intval($_POST['activo_actual'] ?? 0);
            $wpdb->update($tabla, array('activo' => $act ? 0 : 1), array('id' => $id));
        }
        if (!empty($_POST['ld_eliminar'])) {
            $wpdb->delete($tabla, array('id' => intval($_POST['ld_eliminar'])));
        }
    }

    $fotos = $wpdb->get_results("SELECT * FROM {$tabla} ORDER BY orden ASC, id ASC");
    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Carrusel de fotos</h1>';

    echo '<div class="ld-card"><h3>Agregar foto</h3><form method="post">';
    wp_nonce_field('ld_carrusel', 'ld_nonce');
    echo '<div class="ld-fg"><label>URL de la imagen *</label><input type="url" name="url" placeholder="https://..." required><p style="font-size:.75rem;color:#9a7898;margin-top:4px;">Sube en Medios → Agregar nuevo, luego copia la URL.</p></div>';
    echo '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    echo '<div class="ld-fg"><label>Titulo (opcional)</label><input type="text" name="titulo"></div>';
    echo '<div class="ld-fg"><label>Orden</label><input type="number" name="orden" value="0"></div>';
    echo '</div>';
    echo '<div class="ld-fg"><label>Descripcion (opcional)</label><textarea name="descripcion" rows="2"></textarea></div>';
    echo '<button name="ld_guardar" value="1" class="button button-primary">Agregar foto</button>';
    echo '</form></div>';

    echo '<table class="ld-tbl"><thead><tr><th>Vista previa</th><th>Titulo</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    if (empty($fotos)) {
        echo '<tr><td colspan="5" style="text-align:center;padding:32px;">Sin fotos todavia</td></tr>';
    }
    foreach ($fotos as $f) {
        echo '<tr>';
        echo '<td><img src="' . esc_url($f->url) . '" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"></td>';
        echo '<td>' . esc_html($f->titulo ?: '-') . '</td>';
        echo '<td>' . intval($f->orden) . '</td>';
        echo '<td><span class="ld-badge ' . ($f->activo ? 'ld-ok' : 'ld-pend') . '">' . ($f->activo ? 'Activa' : 'Inactiva') . '</span></td>';
        echo '<td><form method="post" style="display:inline;">';
        wp_nonce_field('ld_carrusel', 'ld_nonce');
        echo '<input type="hidden" name="activo_actual" value="' . intval($f->activo) . '">';
        echo '<button name="ld_toggle" value="' . intval($f->id) . '" class="button button-small" style="margin-right:4px;">' . ($f->activo ? 'Desactivar' : 'Activar') . '</button>';
        echo '<button name="ld_eliminar" value="' . intval($f->id) . '" class="button button-small" onclick="return confirm(\'Eliminar?\')">Eliminar</button>';
        echo '</form></td></tr>';
    }
    echo '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════════
// CUPONES
// ═══════════════════════════════════════════════════════════════
function ld_page_cupones(): void {
    global $wpdb;
    $tabla = $wpdb->prefix . 'ld_codigos_usados';

    $usos = $wpdb->get_results("
        SELECT u.*, wu.display_name, wu.user_email
        FROM {$tabla} u
        LEFT JOIN {$wpdb->users} wu ON wu.ID = u.user_id
        ORDER BY u.usado_en DESC
    ");

    $por_codigo = array();
    foreach ($usos as $u) {
        $por_codigo[$u->codigo] = isset($por_codigo[$u->codigo]) ? $por_codigo[$u->codigo] + 1 : 1;
    }

    $busqueda   = sanitize_text_field($_GET['s'] ?? '');
    $filtro_cod = sanitize_text_field($_GET['codigo'] ?? '');

    $filtrados = array_filter($usos, function($u) use ($busqueda, $filtro_cod) {
        $ok_b = !$busqueda || stripos($u->display_name ?? '', $busqueda) !== false || stripos($u->user_email ?? '', $busqueda) !== false || stripos($u->codigo, $busqueda) !== false;
        $ok_c = !$filtro_cod || $u->codigo === $filtro_cod;
        return $ok_b && $ok_c;
    });

    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Uso de cupones</h1>';
    echo '<div class="ld-stats-row">';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . count($por_codigo) . '</span><span class="ld-stat-lbl">Codigos distintos</span></div>';
    echo '<div class="ld-stat"><span class="ld-stat-num">' . count($usos) . '</span><span class="ld-stat-lbl">Total usos</span></div>';
    echo '</div>';

    echo '<form method="get" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">';
    echo '<input type="hidden" name="page" value="ld-cupones">';
    echo '<input type="text" name="s" placeholder="Buscar cliente o codigo..." value="' . esc_attr($busqueda) . '" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;">';
    echo '<select name="codigo" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;">';
    echo '<option value="">Todos los codigos</option>';
    foreach ($por_codigo as $cod => $n) {
        echo '<option value="' . esc_attr($cod) . '" ' . selected($filtro_cod, $cod, false) . '>' . strtoupper($cod) . ' (' . $n . ' usos)</option>';
    }
    echo '</select><button type="submit" class="button">Filtrar</button>';
    if ($busqueda || $filtro_cod) echo '<a href="' . admin_url('admin.php?page=ld-cupones') . '" class="button">Limpiar</a>';
    echo '</form>';

    echo '<table class="ld-tbl"><thead><tr><th>Cliente</th><th>Email</th><th>Codigo</th><th>Fecha</th></tr></thead><tbody>';
    if (empty($filtrados)) {
        echo '<tr><td colspan="4" style="text-align:center;padding:32px;">Sin usos registrados</td></tr>';
    }
    foreach ($filtrados as $u) {
        echo '<tr>';
        echo '<td><strong>' . esc_html($u->display_name ?? 'Sin nombre') . '</strong></td>';
        echo '<td>' . esc_html($u->user_email ?? '-') . '</td>';
        echo '<td><span style="font-family:monospace;font-weight:700;color:#a3509e;background:#fbddf9;padding:2px 8px;border-radius:4px;">' . esc_html(strtoupper($u->codigo)) . '</span></td>';
        echo '<td>' . date('d/m/Y H:i', strtotime($u->usado_en)) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACION
// ═══════════════════════════════════════════════════════════════
function ld_page_config(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ld_nonce']) && wp_verify_nonce($_POST['ld_nonce'], 'ld_config')) {
        ld_config_set('banner_activo',        isset($_POST['banner_activo']));
        ld_config_set('codigo_promo',         strtoupper(sanitize_text_field($_POST['codigo_promo'] ?? 'DULCE15')));
        ld_config_set('descuento_porcentaje', intval($_POST['descuento_porcentaje'] ?? 15));
        ld_config_set('envio_gratis_desde',   intval($_POST['envio_gratis_desde'] ?? 120000));
        echo '<div class="notice notice-success is-dismissible"><p>Configuracion guardada.</p></div>';
    }

    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Configuracion</h1>';
    echo '<div class="ld-card"><form method="post">';
    wp_nonce_field('ld_config', 'ld_nonce');
    echo '<div class="ld-fg"><label><input type="checkbox" name="banner_activo" ' . checked(ld_config('banner_activo', true), true, false) . '> Mostrar banner promocional</label></div>';
    echo '<div class="ld-fg"><label>Codigo de descuento</label><input type="text" name="codigo_promo" value="' . esc_attr(ld_config('codigo_promo', 'DULCE15')) . '"></div>';
    echo '<div class="ld-fg"><label>Porcentaje de descuento (%)</label><input type="number" name="descuento_porcentaje" min="1" max="100" value="' . intval(ld_config('descuento_porcentaje', 15)) . '"></div>';
    echo '<div class="ld-fg"><label>Envio gratis desde (COP)</label><input type="number" name="envio_gratis_desde" value="' . intval(ld_config('envio_gratis_desde', 120000)) . '"></div>';
    echo '<button type="submit" class="button button-primary button-large">Guardar</button>';
    echo '</form></div></div>';
}

// ═══════════════════════════════════════════════════════════════
// TEMAS DE COLOR
// ═══════════════════════════════════════════════════════════════
function ld_page_temas(): void {
    $temas = array(
        array('nombre'=>'Original', 'primary'=>'#fbddf9', 'accent'=>'#c96bc4', 'accent_dark'=>'#a3509e', 'text_dark'=>'#2d1a2b'),
        array('nombre'=>'Azul',     'primary'=>'#dbeafe', 'accent'=>'#3b82f6', 'accent_dark'=>'#1d4ed8', 'text_dark'=>'#1e3a5f'),
        array('nombre'=>'Verde',    'primary'=>'#d1fae5', 'accent'=>'#10b981', 'accent_dark'=>'#065f46', 'text_dark'=>'#064e3b'),
        array('nombre'=>'Naranja',  'primary'=>'#ffedd5', 'accent'=>'#f97316', 'accent_dark'=>'#c2410c', 'text_dark'=>'#431407'),
        array('nombre'=>'Dorado',   'primary'=>'#fef9c3', 'accent'=>'#d97706', 'accent_dark'=>'#92400e', 'text_dark'=>'#451a03'),
    );

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ld_nonce']) && wp_verify_nonce($_POST['ld_nonce'], 'ld_temas')) {
        $idx = intval($_POST['tema_idx'] ?? 0);
        if (isset($temas[$idx])) {
            update_option('ld_tema_activo', $temas[$idx]);
            echo '<div class="notice notice-success is-dismissible"><p>Tema aplicado: <strong>' . esc_html($temas[$idx]['nombre']) . '</strong></p></div>';
        }
    }

    $activo = get_option('ld_tema_activo', $temas[0]);
    echo '<div class="wrap ld-wrap"><h1 style="font-family:Georgia,serif;color:#2d1a2b;">Temas de color</h1>';
    echo '<p style="color:#5a3d58;margin-bottom:20px;">Selecciona la paleta de colores del sitio.</p>';
    echo '<form method="post" style="display:flex;flex-wrap:wrap;gap:16px;">';
    wp_nonce_field('ld_temas', 'ld_nonce');

    foreach ($temas as $i => $t) {
        $sel    = $activo['nombre'] === $t['nombre'];
        $border = $sel ? '3px solid ' . $t['accent'] : '3px solid transparent';
        echo '<div style="background:#fff;border-radius:10px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);border:' . $border . ';min-width:140px;">';
        echo '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;">';
        echo '<div style="width:28px;height:28px;border-radius:50%;background:' . esc_attr($t['primary']) . ';border:1px solid #eee;"></div>';
        echo '<div style="width:28px;height:28px;border-radius:50%;background:' . esc_attr($t['accent']) . ';"></div>';
        echo '<div style="width:28px;height:28px;border-radius:50%;background:' . esc_attr($t['text_dark']) . ';"></div>';
        echo '</div>';
        echo '<strong style="display:block;margin-bottom:10px;color:' . esc_attr($t['text_dark']) . ';">' . esc_html($t['nombre']) . '</strong>';
        if ($sel) {
            echo '<span style="font-size:.75rem;color:' . esc_attr($t['accent']) . ';font-weight:700;">Activo</span>';
        } else {
            echo '<button type="submit" name="tema_idx" value="' . $i . '" style="background:' . esc_attr($t['accent']) . ';color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.8125rem;font-weight:600;">Aplicar</button>';
        }
        echo '</div>';
    }
    echo '</form></div>';
}

// ── Inyectar tema activo en el frontend ───────────────────────
add_action('wp_head', function () {
    $tema = get_option('ld_tema_activo', array());
    if (empty($tema)) return;
    echo '<style>:root{';
    echo '--primary:' . esc_attr($tema['primary'] ?? '#fbddf9') . ';';
    echo '--accent:' . esc_attr($tema['accent'] ?? '#c96bc4') . ';';
    echo '--accent-dark:' . esc_attr($tema['accent_dark'] ?? '#a3509e') . ';';
    echo '--text-dark:' . esc_attr($tema['text_dark'] ?? '#2d1a2b') . ';';
    echo '}</style>';
}, 99);

// ── Registrar uso de cupon al completar orden ─────────────────
add_action('woocommerce_order_status_completed',  'ld_registrar_uso_cupon');
add_action('woocommerce_order_status_processing', 'ld_registrar_uso_cupon');
function ld_registrar_uso_cupon(int $order_id): void {
    if (!function_exists('wc_get_order')) return;
    global $wpdb;
    $order   = wc_get_order($order_id);
    $user_id = $order->get_customer_id();
    if (!$user_id) return;
    foreach ($order->get_coupon_codes() as $codigo) {
        $wpdb->query($wpdb->prepare(
            "INSERT IGNORE INTO {$wpdb->prefix}ld_codigos_usados (user_id, codigo) VALUES (%d, %s)",
            $user_id, strtoupper($codigo)
        ));
    }
}

// ── Bloquear reuso de cupon ───────────────────────────────────
add_filter('woocommerce_coupon_is_valid', 'ld_verificar_uso_cupon', 10, 2);
function ld_verificar_uso_cupon($valid, $coupon) {
    if (!$valid || !is_user_logged_in()) return $valid;
    global $wpdb;
    $ya_usado = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}ld_codigos_usados WHERE user_id=%d AND codigo=%s",
        get_current_user_id(), strtoupper($coupon->get_code())
    ));
    if ($ya_usado > 0) throw new Exception('Este codigo ya fue utilizado por tu cuenta.');
    return true;
}
