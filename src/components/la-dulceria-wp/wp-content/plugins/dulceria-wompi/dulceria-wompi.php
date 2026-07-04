<?php
/**
 * Plugin Name: La Dulcería — Pasarela Wompi
 * Description: Integración de Wompi como pasarela de pago para WooCommerce.
 * Version: 1.0.0
 * Author: La Dulcería
 * Requires Plugins: woocommerce
 */
defined('ABSPATH') || exit;

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) return;

    class WC_Gateway_Wompi extends WC_Payment_Gateway {

        public $pub_key        = '';
        public $prv_key        = '';
        public $evt_secret     = '';
        public $integrity_key  = '';
        public $sandbox        = true;

        public function __construct() {
            $this->id                 = 'wompi';
            $this->icon               = '';
            $this->has_fields         = false;
            $this->method_title       = 'Wompi';
            $this->method_description = 'Acepta pagos con tarjeta de crédito, débito, Nequi y PSE a través de Wompi.';
            $this->supports           = ['products'];

            $this->init_form_fields();
            $this->init_settings();

            $this->title       = $this->get_option('title');
            $this->description = $this->get_option('description');
            $this->pub_key        = $this->get_option('pub_key') ?: (defined('WOMPI_PUBLIC_KEY') ? WOMPI_PUBLIC_KEY : '');
            $this->prv_key        = $this->get_option('prv_key') ?: (defined('WOMPI_PRIVATE_KEY') ? WOMPI_PRIVATE_KEY : '');
            $this->evt_secret     = $this->get_option('evt_secret') ?: (defined('WOMPI_EVENTS_SECRET') ? WOMPI_EVENTS_SECRET : '');
            $this->integrity_key  = $this->get_option('integrity_key') ?: '';
            $this->sandbox        = $this->get_option('sandbox') === 'yes';

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
            add_action('woocommerce_api_wompi_webhook', [$this, 'handle_webhook']);
            add_action('woocommerce_receipt_wompi', [$this, 'receipt_page']);
        }

        public function init_form_fields() {
            $this->form_fields = [
                'enabled'     => ['title'=>'Habilitar','type'=>'checkbox','label'=>'Habilitar pago con Wompi','default'=>'yes'],
                'sandbox'     => ['title'=>'Modo pruebas','type'=>'checkbox','label'=>'Usar llaves de staging (pruebas)','default'=>'yes'],
                'title'       => ['title'=>'Título','type'=>'text','default'=>'Tarjeta, Nequi o PSE — Wompi'],
                'description' => ['title'=>'Descripción','type'=>'textarea','default'=>'Paga de forma segura con tu tarjeta de crédito/débito, Nequi o PSE.'],
                'pub_key'       => ['title'=>'Llave pública','type'=>'text','description'=>'pub_prod_... o pub_stag_...'],
                'prv_key'       => ['title'=>'Llave privada','type'=>'password','description'=>'prv_prod_... o prv_stag_...'],
                'integrity_key' => ['title'=>'Llave de integridad','type'=>'password','description'=>'prod_integrity_... — Desarrolladores → Llaves en comercios.wompi.co'],
                'evt_secret'    => ['title'=>'Secret de eventos','type'=>'password','description'=>'Para verificar webhooks de Wompi'],
            ];
        }

        public function is_available() {
            if ($this->enabled !== 'yes') return false;
            if (empty($this->pub_key)) return false;
            if (get_woocommerce_currency() !== 'COP') return false;
            return true;
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            $order->update_status('pending', 'Esperando confirmación de pago Wompi.');

            // Generar referencia única
            $referencia = 'DULCERIA-' . strtoupper(substr(uniqid(), -6)) . '-' . time();
            $order->update_meta_data('_wompi_referencia', $referencia);
            $order->save();

            return [
                'result'   => 'success',
                'redirect' => $order->get_checkout_payment_url(true),
            ];
        }

        public function receipt_page($order_id) {
            $order       = wc_get_order($order_id);
            $referencia  = $order->get_meta('_wompi_referencia');
            $total_cop   = intval($order->get_total() * 100); // en centavos
            $pub_key     = $this->pub_key;
            $redirect_url = $this->get_return_url($order);

            // Firma de integridad: referencia + monto_centavos + moneda + llave_integridad
            $cadena = $referencia . $total_cop . 'COP' . $this->integrity_key;
            $firma  = hash('sha256', $cadena);
            ?>
            <div style="text-align:center;padding:32px;">
              <p style="color:var(--text-medium);margin-bottom:24px;">Serás redirigido a Wompi para completar tu pago de forma segura.</p>
              <script src="https://checkout.wompi.co/widget.js"
                data-render="button"
                data-public-key="<?= esc_attr($pub_key) ?>"
                data-currency="COP"
                data-amount-in-cents="<?= $total_cop ?>"
                data-reference="<?= esc_attr($referencia) ?>"
                data-signature:integrity="<?= esc_attr($firma) ?>"
                data-redirect-url="<?= esc_url($redirect_url) ?>">
              </script>
              <p style="font-size:.75rem;color:var(--text-light);margin-top:16px;">🔒 Pago 100% seguro procesado por Wompi</p>
            </div>
            <?php
        }

        public function handle_webhook() {
            $payload = file_get_contents('php://input');
            $log_dir = WP_CONTENT_DIR . '/wompi-logs';
            if (!is_dir($log_dir)) mkdir($log_dir, 0755, true);
            $log_file = $log_dir . '/webhook-' . date('Y-m-d') . '.log';

            $data = json_decode($payload, true);

            // Log every incoming webhook for diagnosis
            file_put_contents($log_file, date('H:i:s') . ' PAYLOAD: ' . $payload . "\n", FILE_APPEND);

            if (!$data || $data['event'] !== 'transaction.updated') {
                file_put_contents($log_file, date('H:i:s') . ' SKIP: evento=' . ($data['event'] ?? 'null') . "\n", FILE_APPEND);
                status_header(200); exit;
            }

            // Verificar firma solo si evt_secret está configurado
            $evt_secret     = $this->evt_secret;
            $checksum_event = $data['signature']['checksum'] ?? ''; // correcto: signature.checksum
            $transaction    = $data['data']['transaction'] ?? [];

            if (!empty($evt_secret)) {
                // Wompi firma: transaction.id + transaction.status + transaction.amount_in_cents + sent_at + secret
                $cadena = $transaction['id'] . $transaction['status'] . $transaction['amount_in_cents']
                        . $data['sent_at'] . $evt_secret;
                $firma_esperada = hash('sha256', $cadena);
                if (!hash_equals($firma_esperada, $checksum_event)) {
                    file_put_contents($log_file, date('H:i:s') . ' FIRMA INVALIDA esperada=' . $firma_esperada . ' recibida=' . $checksum_event . "\n", FILE_APPEND);
                    status_header(401); exit;
                }
            } else {
                file_put_contents($log_file, date('H:i:s') . ' ADVERTENCIA: evt_secret vacío, omitiendo verificación de firma' . "\n", FILE_APPEND);
            }

            $referencia = $transaction['reference'] ?? '';
            $orders = wc_get_orders(['meta_key'=>'_wompi_referencia','meta_value'=>$referencia,'limit'=>1]);

            if (empty($orders)) {
                file_put_contents($log_file, date('H:i:s') . ' ORDEN NO ENCONTRADA referencia=' . $referencia . "\n", FILE_APPEND);
                status_header(200); exit;
            }

            $order  = $orders[0];
            $estado = $transaction['status'] ?? '';
            file_put_contents($log_file, date('H:i:s') . ' PROCESANDO orden=' . $order->get_id() . ' estado=' . $estado . "\n", FILE_APPEND);

            if ($estado === 'APPROVED') {
                $order->payment_complete($transaction['id']);
                $order->add_order_note('Pago Wompi aprobado. ID transacción: ' . $transaction['id']);
                WC()->mailer()->emails['WC_Email_New_Order']->trigger($order->get_id());
                file_put_contents($log_file, date('H:i:s') . ' OK: orden ' . $order->get_id() . ' marcada como pagada, correo enviado' . "\n", FILE_APPEND);
            } elseif (in_array($estado, ['DECLINED', 'ERROR', 'VOIDED'])) {
                $order->update_status('failed', 'Pago Wompi rechazado/fallido. Estado: ' . $estado);
                file_put_contents($log_file, date('H:i:s') . ' FALLIDO: orden ' . $order->get_id() . "\n", FILE_APPEND);
            }

            status_header(200); exit;
        }
    }

    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'WC_Gateway_Wompi';
        return $gateways;
    });

    // Registrar endpoint del webhook
    add_action('init', function () {
        add_rewrite_rule('^wc-api/wompi_webhook/?$', 'index.php?wc-api=wompi_webhook', 'top');
    });
});

// Diagnóstico temporal — remover después
add_action('rest_api_init', function () {
    register_rest_route('ld/v1', '/wompi-debug', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            $settings  = get_option('woocommerce_wompi_settings', []);
            $gateways  = WC()->payment_gateways()->payment_gateways();
            $available = WC()->payment_gateways()->get_available_payment_gateways();
            return new WP_REST_Response([
                'wompi_settings'    => $settings,
                'registered'        => isset($gateways['wompi']),
                'available'         => isset($available['wompi']),
                'currency'          => get_woocommerce_currency(),
                'all_gateways'      => array_keys($gateways),
                'available_gateways'=> array_keys($available),
            ], 200);
        },
    ]);
});
