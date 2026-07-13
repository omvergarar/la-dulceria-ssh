<?php
/**
 * Catálogo de productos — La Dulcería
 * Override: woocommerce/archive-product.php
 */
defined('ABSPATH') || exit;

get_header();

// Categoría activa
$current_cat = get_queried_object();
$current_cat_slug = ($current_cat instanceof WP_Term && $current_cat->taxonomy === 'product_cat')
    ? $current_cat->slug : '';

// Categorías de primer nivel con productos
$categorias = get_terms([
    'taxonomy'   => 'product_cat',
    'hide_empty' => true,
    'parent'     => 0,
    'orderby'    => 'name',
]);

// Título de la sección
$titulo = $current_cat_slug
    ? esc_html($current_cat->name)
    : 'Nuestro Catálogo';

$descripcion = $current_cat_slug && !empty($current_cat->description)
    ? esc_html($current_cat->description)
    : 'Regalos pensados con amor, para cada momento especial';
?>

<!-- HERO CATÁLOGO -->
<section class="ld-shop-hero">
  <div class="ld-shop-hero-inner">
    <p class="ld-shop-hero-eyebrow">La Dulcería</p>
    <h1 class="ld-shop-hero-title"><?= $titulo ?></h1>
    <p class="ld-shop-hero-desc"><?= $descripcion ?></p>
  </div>
</section>

<!-- NAVEGACIÓN POR CATEGORÍAS -->
<nav class="ld-cat-nav" aria-label="Categorías">
  <div class="ld-cat-nav-inner">

    <a href="<?= esc_url(wc_get_page_permalink('shop')) ?>"
       class="ld-cat-chip <?= !$current_cat_slug ? 'active' : '' ?>">
      <span class="ld-cat-chip-icon">✨</span>
      <span class="ld-cat-chip-label">Todos</span>
    </a>

    <?php foreach ($categorias as $cat):
      $thumb_id  = get_term_meta($cat->term_id, 'thumbnail_id', true);
      $thumb_url = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'thumbnail') : '';
      $is_active = ($current_cat_slug === $cat->slug);
      $cat_url   = get_term_link($cat);
    ?>
    <a href="<?= esc_url($cat_url) ?>"
       class="ld-cat-chip <?= $is_active ? 'active' : '' ?>">
      <?php if ($thumb_url): ?>
        <img src="<?= esc_url($thumb_url) ?>" alt="" class="ld-cat-chip-img">
      <?php else: ?>
        <span class="ld-cat-chip-icon">🎁</span>
      <?php endif; ?>
      <span class="ld-cat-chip-label"><?= esc_html($cat->name) ?></span>
      <span class="ld-cat-chip-count"><?= $cat->count ?></span>
    </a>
    <?php endforeach; ?>

  </div>
</nav>

<!-- PRODUCTOS -->
<div class="ld-shop-body">
  <div class="ld-shop-toolbar">
    <p class="ld-shop-count">
      <?php woocommerce_result_count(); ?>
    </p>
    <div class="ld-shop-sort">
      <?php woocommerce_catalog_ordering(); ?>
    </div>
  </div>

  <?php if (woocommerce_product_loop()): ?>

    <div class="ld-products-grid">
      <?php while (have_posts()): the_post();
        global $product;
        $product = wc_get_product(get_the_ID());
        include get_template_directory() . '/partials/product-card.php';
      endwhile; ?>
    </div>

    <div class="ld-shop-pagination">
      <?php woocommerce_pagination(); ?>
    </div>

  <?php else: ?>
    <div class="ld-shop-empty">
      <div class="ld-shop-empty-icon">🎁</div>
      <h3>No encontramos productos en esta categoría</h3>
      <p>Prueba con otra categoría o explora todo el catálogo.</p>
      <a href="<?= esc_url(wc_get_page_permalink('shop')) ?>" class="btn-primary">Ver todos los productos</a>
    </div>
  <?php endif; ?>
</div>

<?php get_footer(); ?>
