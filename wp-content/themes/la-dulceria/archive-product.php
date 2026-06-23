<?php get_header(); ?>
<?php
$categorias = get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,
  'exclude'=>[get_option('default_product_cat')]]);
$cat_actual = isset($_GET['cat']) ? sanitize_text_field($_GET['cat']) : '';
$busqueda   = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';

// Build query
$paged  = max(1, get_query_var('paged'));
$args = [
  'post_type'      => 'product',
  'post_status'    => 'publish',
  'posts_per_page' => 20,
  'paged'          => $paged,
  'tax_query'      => [
    'relation' => 'AND',
    [
      'taxonomy' => 'product_visibility',
      'field'    => 'name',
      'terms'    => ['exclude-from-catalog'],
      'operator' => 'NOT IN',
    ],
  ],
];
if ($cat_actual) {
  $args['tax_query'][] = ['taxonomy'=>'product_cat','field'=>'slug','terms'=>$cat_actual];
}
if ($busqueda) {
  $args['s'] = $busqueda;
}
$loop  = new WP_Query($args);
$total = $loop->found_posts;
?>

<div style="padding:48px 24px;min-height:80vh;background:var(--bg-soft);">
  <div class="ld-container">
    <h1 style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--text-dark);margin-bottom:8px;">Catálogo de regalos 🎁</h1>
    <p style="color:var(--text-medium);margin-bottom:32px;">Encuentra el regalo perfecto para cada ocasión</p>

    <!-- Filtros -->
    <div class="ld-catalogo-header">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <a href="<?= wc_get_page_permalink('shop') ?>"
           class="ld-filtro-btn <?= !$cat_actual ? 'active' : '' ?>">Todos</a>
        <?php foreach ($categorias as $cat): ?>
          <a href="<?= esc_url(add_query_arg('cat', $cat->slug, wc_get_page_permalink('shop'))) ?>"
             class="ld-filtro-btn <?= $cat_actual === $cat->slug ? 'active' : '' ?>">
            <?= esc_html($cat->name) ?>
          </a>
        <?php endforeach; ?>
      </div>
      <form method="get" action="<?= esc_url(wc_get_page_permalink('shop')) ?>" style="display:flex;gap:8px;">
        <?php if ($cat_actual): ?>
          <input type="hidden" name="cat" value="<?= esc_attr($cat_actual) ?>">
        <?php endif; ?>
        <input type="text" name="s" class="ld-busqueda" placeholder="Buscar regalo..."
               value="<?= esc_attr($busqueda) ?>">
        <button type="submit" class="btn-secondary">Buscar</button>
      </form>
    </div>

    <p class="ld-resultados-count" style="margin-bottom:20px;">
      <?= $total ?> producto<?= $total !== 1 ? 's' : '' ?> encontrado<?= $total !== 1 ? 's' : '' ?>
    </p>

    <!-- Grid de productos -->
    <?php if ($loop->have_posts()): ?>
    <div class="ld-products-grid">
      <?php while ($loop->have_posts()): $loop->the_post();
        global $product; $product = wc_get_product(get_the_ID()); ?>
        <div class="fade-in"><?php get_template_part('partials/product', 'card'); ?></div>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>

    <!-- Paginación -->
    <?php if ($loop->max_num_pages > 1): ?>
    <div style="text-align:center;margin-top:40px;">
      <?= paginate_links(['total'=>$loop->max_num_pages,'current'=>max(1,get_query_var('paged')),
        'prev_text'=>'← Anterior','next_text'=>'Siguiente →']); ?>
    </div>
    <?php endif; ?>

    <?php else: ?>
    <div style="text-align:center;padding:80px 20px;">
      <span style="font-size:4rem;display:block;margin-bottom:16px;">🔍</span>
      <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:8px;">Sin resultados</h3>
      <p style="color:var(--text-medium);margin-bottom:24px;">No encontramos productos con ese filtro.</p>
      <a href="<?= wc_get_page_permalink('shop') ?>" class="btn-primary">Ver todos los productos</a>
    </div>
    <?php endif; ?>
  </div>
</div>

<?php get_footer(); ?>
