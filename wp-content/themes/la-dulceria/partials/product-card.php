<?php
/* Partial: tarjeta de producto. Requiere $product (WC_Product) en scope */
if (!isset($product)) { global $product; }
if (!$product) return;

$img   = $product->get_image('woocommerce_thumbnail', ['class' => 'ld-product-img']);
$stock = $product->get_stock_quantity();
$url   = get_permalink($product->get_id());
?>
<div class="ld-product-card">
  <a href="<?= esc_url($url) ?>">
    <?php if ($product->get_image_id()): ?>
      <?= $img ?>
    <?php else: ?>
      <div class="ld-product-img-placeholder">🎁</div>
    <?php endif; ?>
  </a>
  <div class="ld-product-body">
    <?php if ($stock !== null && $stock === 0): ?>
      <span class="ld-product-badge agotado">Agotado</span>
    <?php elseif ($stock !== null && $stock <= 3): ?>
      <span class="ld-product-badge ultimas">Últimas unidades</span>
    <?php endif; ?>
    <div class="ld-product-cat">
      <?= esc_html(implode(', ', wp_list_pluck(get_the_terms($product->get_id(), 'product_cat') ?: [], 'name'))) ?>
    </div>
    <a href="<?= esc_url($url) ?>">
      <h3 class="ld-product-name"><?= esc_html($product->get_name()) ?></h3>
    </a>
    <div class="ld-product-price"><?= $product->get_price_html() ?></div>
    <?php if ($product->is_in_stock()): ?>
      <button class="ld-product-btn add-to-cart-btn"
              data-product-id="<?= $product->get_id() ?>"
              data-product-url="<?= esc_url($url) ?>">
        Agregar al carrito
      </button>
    <?php else: ?>
      <button class="ld-product-btn" disabled style="background:var(--text-light);cursor:not-allowed;">Agotado</button>
    <?php endif; ?>
  </div>
</div>
