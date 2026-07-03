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
