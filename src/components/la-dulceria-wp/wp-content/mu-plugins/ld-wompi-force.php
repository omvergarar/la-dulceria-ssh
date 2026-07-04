<?php
/**
 * La Dulcería — Forzar Wompi en checkout
 * Must-use plugin: se carga automáticamente, sin necesidad de activarlo.
 */
defined('ABSPATH') || exit;

// ── SMTP para wp_mail (evita el mail() bloqueado de Hostinger) ──
add_action('phpmailer_init', function ($phpmailer) {
    if (!defined('LD_SMTP_PASS') || !LD_SMTP_PASS) return;
    $phpmailer->isSMTP();
    $phpmailer->Host       = 'smtp.hostinger.com';
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = 465;
    $phpmailer->SMTPSecure = 'ssl';
    $phpmailer->Username   = 'administracion@ladulceriaregalos.com';
    $phpmailer->Password   = LD_SMTP_PASS;
    $phpmailer->From       = 'administracion@ladulceriaregalos.com';
    $phpmailer->FromName   = 'La Dulcería';
});

// Garantizar que el correo de admin de WooCommerce apunte a la cuenta correcta
add_filter('woocommerce_email_recipient_new_order', function () {
    return 'administracion@ladulceriaregalos.com';
});

// ── Helpers de manipulación de color ─────────────────────────
function ld_hex_to_rgb(string $hex): array {
    $hex = ltrim($hex, '#');
    return [hexdec(substr($hex,0,2)), hexdec(substr($hex,2,2)), hexdec(substr($hex,4,2))];
}
function ld_lighten(string $hex, int $amount): string {
    [$r,$g,$b] = ld_hex_to_rgb($hex);
    return sprintf('#%02x%02x%02x', min(255,$r+$amount), min(255,$g+$amount), min(255,$b+$amount));
}
function ld_darken(string $hex, int $amount): string {
    [$r,$g,$b] = ld_hex_to_rgb($hex);
    return sprintf('#%02x%02x%02x', max(0,$r-$amount), max(0,$g-$amount), max(0,$b-$amount));
}
function ld_tint(string $hex, float $ratio): string { // mezcla con blanco (ratio 0-1)
    [$r,$g,$b] = ld_hex_to_rgb($hex);
    return sprintf('#%02x%02x%02x',
        intval($r + (255-$r)*$ratio), intval($g + (255-$g)*$ratio), intval($b + (255-$b)*$ratio));
}

// ── Inyectar variables CSS del tema activo en el frontend ─────
add_action('wp_head', function () {
    $defaults = ['primary'=>'#fbddf9','accent'=>'#c96bc4','accent_dark'=>'#a3509e','text_dark'=>'#2d1a2b'];
    $t = get_option('ld_tema_activo', $defaults);
    $p  = $t['primary']     ?? $defaults['primary'];
    $a  = $t['accent']      ?? $defaults['accent'];
    $ad = $t['accent_dark'] ?? $defaults['accent_dark'];
    $td = $t['text_dark']   ?? $defaults['text_dark'];
    echo '<style id="ld-tema-vars">:root{'
        . '--primary:'       . esc_attr($p)              . ';'
        . '--primary-dark:'  . esc_attr(ld_darken($p,15)). ';'
        . '--primary-deeper:'. esc_attr(ld_darken($p,35)). ';'
        . '--accent:'        . esc_attr($a)              . ';'
        . '--accent-dark:'   . esc_attr($ad)             . ';'
        . '--text-dark:'     . esc_attr($td)             . ';'
        . '--text-medium:'   . esc_attr(ld_lighten($td,47)). ';'
        . '--text-light:'    . esc_attr(ld_lighten($td,109)). ';'
        . '--bg-soft:'       . esc_attr(ld_tint($p,0.55)). ';'
        . '--bg-cream:'      . esc_attr(ld_tint($p,0.85)). ';'
        . '--shadow-soft:0 4px 24px rgba(0,0,0,0.10);'
        . '--shadow-hover:0 8px 32px rgba(0,0,0,0.18);'
        . '}</style>' . "\n";
}, 5); // priority 5 — antes del CSS del tema

add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    if (isset($gateways['wompi'])) {
        return $gateways;
    }
    $all = WC()->payment_gateways()->payment_gateways();
    if (isset($all['wompi'])) {
        $gateways['wompi'] = $all['wompi'];
    }
    return $gateways;
}, 999);

// ── Reemplazar panel de temas con versión actualizada ─────────
add_action('current_screen', function ($screen) {
    if ($screen->id !== 'la-dulceria_page_ld-temas') return;
    remove_all_actions($screen->id);
    add_action($screen->id, 'ld_page_temas_v2');
});

// Callback actualizado para el panel de temas
function ld_page_temas_v2(): void {
    $presets = array(
        array('nombre'=>'Original', 'primary'=>'#fbddf9', 'accent'=>'#c96bc4', 'accent_dark'=>'#a3509e', 'text_dark'=>'#2d1a2b'),
        array('nombre'=>'Azul',     'primary'=>'#dbeafe', 'accent'=>'#3b82f6', 'accent_dark'=>'#1d4ed8', 'text_dark'=>'#1e3a5f'),
        array('nombre'=>'Verde',    'primary'=>'#d1fae5', 'accent'=>'#10b981', 'accent_dark'=>'#065f46', 'text_dark'=>'#064e3b'),
        array('nombre'=>'Naranja',  'primary'=>'#ffedd5', 'accent'=>'#f97316', 'accent_dark'=>'#c2410c', 'text_dark'=>'#431407'),
        array('nombre'=>'Dorado',   'primary'=>'#fef9c3', 'accent'=>'#d97706', 'accent_dark'=>'#92400e', 'text_dark'=>'#451a03'),
        array('nombre'=>'Fucsia',   'primary'=>'#fce7f3', 'accent'=>'#ec4899', 'accent_dark'=>'#be185d', 'text_dark'=>'#500724'),
    );
    $roles = array(
        'primary'     => array('label'=>'Color Primario',  'desc'=>'Fondos suaves, tarjetas y áreas de hover',         'css'=>'--primary'),
        'accent'      => array('label'=>'Color de Acento', 'desc'=>'Botones, enlaces e íconos interactivos',           'css'=>'--accent'),
        'accent_dark' => array('label'=>'Acento Oscuro',   'desc'=>'Hover de botones, títulos y elementos destacados', 'css'=>'--accent-dark'),
        'text_dark'   => array('label'=>'Texto Principal', 'desc'=>'Color del texto en encabezados y párrafos',        'css'=>'--text-dark'),
    );
    $activo = get_option('ld_tema_activo', $presets[0]);

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ld_nonce']) && wp_verify_nonce($_POST['ld_nonce'], 'ld_temas')) {
        if (isset($_POST['preset_idx']) && $_POST['preset_idx'] !== '' && isset($presets[intval($_POST['preset_idx'])])) {
            $nuevo = $presets[intval($_POST['preset_idx'])];
        } else {
            $nuevo = array('nombre' => 'Personalizado');
            foreach (array_keys($roles) as $key) {
                $val = sanitize_hex_color($_POST[$key] ?? '');
                $nuevo[$key] = $val ?: ($activo[$key] ?? '#cccccc');
            }
        }
        update_option('ld_tema_activo', $nuevo);
        $activo = $nuevo;
        echo '<div class="notice notice-success is-dismissible"><p>Tema <strong>' . esc_html($nuevo['nombre']) . '</strong> aplicado correctamente.</p></div>';
    }
    ?>
    <div class="wrap" style="max-width:900px;">
    <h1 style="font-family:Georgia,serif;color:#2d1a2b;margin-bottom:6px;">Temas de color</h1>
    <p style="color:#5a3d58;margin-bottom:28px;font-size:.9rem;">Selecciona un tema base o personaliza cada color ingresando el código hexadecimal.</p>
    <style>
    .ld-t-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;}
    @media(max-width:800px){.ld-t-grid{grid-template-columns:1fr;}}
    .ld-t-card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.07);padding:18px 20px;border:2px solid #f5bef2;}
    .ld-t-card-top{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
    .ld-t-var{font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:#fbddf9;color:#a3509e;font-family:monospace;}
    .ld-t-card h3{font-size:.95rem;font-weight:700;color:#2d1a2b;margin:0;}
    .ld-t-card p{font-size:.78rem;color:#9a7898;margin:0 0 12px;}
    .ld-t-inputs{display:flex;align-items:center;gap:8px;}
    .ld-t-picker{width:46px;height:46px;border:2px solid #e89ee4;border-radius:8px;cursor:pointer;padding:2px;background:#fff;flex-shrink:0;}
    .ld-t-hex{flex:1;padding:10px 12px;border:1.5px solid #e89ee4;border-radius:8px;font-family:'Courier New',monospace;font-size:.9rem;color:#2d1a2b;background:#fffaff;text-transform:uppercase;letter-spacing:.05em;}
    .ld-t-hex:focus{outline:none;border-color:#c96bc4;box-shadow:0 0 0 2px rgba(201,107,196,.15);}
    .ld-t-strip{width:100%;height:5px;border-radius:3px;margin-top:10px;}
    .ld-t-presets{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;}
    .ld-t-preset{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:8px;border:2px solid #f5bef2;background:#fff;cursor:pointer;font-size:.8rem;font-weight:600;color:#5a3d58;}
    .ld-t-preset:hover,.ld-t-preset.on{border-color:#c96bc4;background:#fef6fe;color:#a3509e;}
    .ld-t-swatches{display:flex;gap:3px;}
    .ld-t-sw{width:13px;height:13px;border-radius:50%;}
    .ld-t-sec{font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9a7898;margin:0 0 10px;}
    </style>

    <p class="ld-t-sec">Temas predefinidos</p>
    <div class="ld-t-presets">
    <?php foreach ($presets as $i => $p):
        $on = ($activo['nombre'] === $p['nombre']); ?>
        <button type="button" class="ld-t-preset <?= $on?'on':'' ?>"
            onclick="ldTP(<?= $i ?>,<?= htmlspecialchars(json_encode($p),ENT_QUOTES) ?>)">
            <div class="ld-t-swatches">
                <div class="ld-t-sw" style="background:<?= esc_attr($p['primary']) ?>"></div>
                <div class="ld-t-sw" style="background:<?= esc_attr($p['accent']) ?>"></div>
                <div class="ld-t-sw" style="background:<?= esc_attr($p['accent_dark']) ?>"></div>
                <div class="ld-t-sw" style="background:<?= esc_attr($p['text_dark']) ?>"></div>
            </div>
            <?= esc_html($p['nombre']) ?><?= $on?' ✓':'' ?>
        </button>
    <?php endforeach; ?>
    </div>

    <p class="ld-t-sec">Editar colores individualmente</p>
    <form method="post">
    <?php wp_nonce_field('ld_temas', 'ld_nonce'); ?>
    <input type="hidden" name="preset_idx" id="ldPresetIdx" value="">
    <div class="ld-t-grid">
    <?php foreach ($roles as $key => $rol):
        $v = esc_attr($activo[$key] ?? '#cccccc'); ?>
        <div class="ld-t-card">
            <div class="ld-t-card-top">
                <span class="ld-t-var"><?= esc_html($rol['css']) ?></span>
                <h3><?= esc_html($rol['label']) ?></h3>
            </div>
            <p><?= esc_html($rol['desc']) ?></p>
            <div class="ld-t-inputs">
                <input type="color" class="ld-t-picker" id="pk-<?= $key ?>"
                    value="<?= $v ?>"
                    oninput="ldTSync('<?= $key ?>',this.value)">
                <input type="text" class="ld-t-hex" id="hx-<?= $key ?>"
                    name="<?= $key ?>" value="<?= $v ?>"
                    maxlength="7" placeholder="#000000"
                    oninput="ldTHex('<?= $key ?>',this.value)">
            </div>
            <div class="ld-t-strip" id="st-<?= $key ?>" style="background:<?= $v ?>"></div>
        </div>
    <?php endforeach; ?>
    </div>
    <button type="submit" class="button button-primary button-large"
        style="background:linear-gradient(135deg,#c96bc4,#a3509e);border-color:#a3509e;font-weight:700;padding:10px 28px;">
        Guardar tema
    </button>
    <span style="margin-left:12px;font-size:.8rem;color:#9a7898;">Los cambios se aplican inmediatamente en el sitio.</span>
    </form>
    </div>
    <script>
    function ldTSync(k,v){
        document.getElementById('hx-'+k).value=v.toUpperCase();
        document.getElementById('st-'+k).style.background=v;
    }
    function ldTHex(k,v){
        if(!/^#[0-9a-fA-F]{6}$/.test(v))return;
        document.getElementById('pk-'+k).value=v;
        document.getElementById('st-'+k).style.background=v;
    }
    function ldTP(i,p){
        document.getElementById('ldPresetIdx').value=i;
        document.querySelectorAll('.ld-t-preset').forEach((b,j)=>b.classList.toggle('on',j===i));
        ['primary','accent','accent_dark','text_dark'].forEach(k=>{
            if(!p[k])return;
            document.getElementById('pk-'+k).value=p[k];
            document.getElementById('hx-'+k).value=p[k].toUpperCase();
            document.getElementById('st-'+k).style.background=p[k];
        });
    }
    </script>
    <?php
}

// ── Ocultar texto "Gratis" en el costo de envío del carrito ──
add_filter('gettext', function ($translated, $text, $domain) {
    if ($domain === 'woocommerce' && $text === 'Free!') {
        return '—';
    }
    return $translated;
}, 10, 3);

// ── Webhook Wompi — handler definitivo (mu-plugin, sin OPcache) ──
add_action('woocommerce_api_wompi_webhook', function () {
    $log_dir  = WP_CONTENT_DIR . '/wompi-logs';
    if (!is_dir($log_dir)) mkdir($log_dir, 0755, true);
    $log_file = $log_dir . '/webhook-' . date('Y-m-d') . '.log';

    $payload = file_get_contents('php://input');
    $data    = json_decode($payload, true);
    file_put_contents($log_file, date('H:i:s') . ' MU-PAYLOAD: ' . substr($payload, 0, 200) . "\n", FILE_APPEND);

    if (!$data || ($data['event'] ?? '') !== 'transaction.updated') {
        file_put_contents($log_file, date('H:i:s') . " MU-SKIP: evento=" . ($data['event'] ?? 'null') . "\n", FILE_APPEND);
        status_header(200); exit;
    }

    $transaction    = $data['data']['transaction'] ?? [];
    $checksum       = $data['signature']['checksum'] ?? '';  // campo correcto
    $evt_secret     = defined('WOMPI_EVENTS_SECRET') ? WOMPI_EVENTS_SECRET
                    : get_option('woocommerce_wompi_settings', [])['evt_secret'] ?? '';

    // Verificar firma solo si hay secret configurado
    if (!empty($evt_secret) && !empty($checksum)) {
        $cadena         = $transaction['id'] . $transaction['status'] . $transaction['amount_in_cents']
                        . $data['sent_at'] . $evt_secret;
        $firma_esperada = hash('sha256', $cadena);
        if (!hash_equals($firma_esperada, $checksum)) {
            file_put_contents($log_file, date('H:i:s') . ' MU-FIRMA INVALIDA esperada=' . $firma_esperada . ' recibida=' . $checksum . "\n", FILE_APPEND);
            status_header(401); exit;
        }
    } else {
        file_put_contents($log_file, date('H:i:s') . " MU-FIRMA OMITIDA secret=" . (empty($evt_secret)?'vacío':'ok') . " checksum=" . (empty($checksum)?'vacío':'ok') . "\n", FILE_APPEND);
    }

    $referencia = $transaction['reference'] ?? '';
    $orders     = wc_get_orders(['meta_key' => '_wompi_referencia', 'meta_value' => $referencia, 'limit' => 1]);

    if (empty($orders)) {
        file_put_contents($log_file, date('H:i:s') . " MU-ORDEN NO ENCONTRADA ref=$referencia\n", FILE_APPEND);
        status_header(200); exit;
    }

    $order  = $orders[0];
    $estado = $transaction['status'] ?? '';
    file_put_contents($log_file, date('H:i:s') . " MU-PROCESANDO orden=" . $order->get_id() . " estado=$estado\n", FILE_APPEND);

    if ($estado === 'APPROVED') {
        $order->payment_complete($transaction['id']);
        $order->add_order_note('Pago Wompi aprobado. ID transacción: ' . $transaction['id']);
        WC()->mailer()->emails['WC_Email_New_Order']->trigger($order->get_id());
        file_put_contents($log_file, date('H:i:s') . " MU-OK: orden " . $order->get_id() . " pagada, correo enviado\n", FILE_APPEND);
    } elseif (in_array($estado, ['DECLINED', 'ERROR', 'VOIDED'])) {
        $order->update_status('failed', 'Pago Wompi rechazado. Estado: ' . $estado);
        file_put_contents($log_file, date('H:i:s') . " MU-FALLIDO: orden " . $order->get_id() . "\n", FILE_APPEND);
    }

    status_header(200); exit;
}, 1); // priority 1 — antes del handler del plugin normal

// Inyectar llave de integridad y desactivar sandbox en el gateway Wompi
add_action('woocommerce_init', function () {
    $gateways = WC()->payment_gateways()->payment_gateways();
    if (isset($gateways['wompi'])) {
        $ik = defined('WOMPI_INTEGRITY_KEY') ? WOMPI_INTEGRITY_KEY : '';
        $gateways['wompi']->integrity_key = $ik;
        $gateways['wompi']->prv_key       = $ik; // código cacheado usa prv_key para la firma
        $gateways['wompi']->sandbox       = false;
    }
});
