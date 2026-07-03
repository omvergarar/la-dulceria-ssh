<?php
/**
 * La Dulcería — Forzar Wompi en checkout
 * Must-use plugin: se carga automáticamente, sin necesidad de activarlo.
 */
defined('ABSPATH') || exit;

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
