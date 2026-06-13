<?php get_header(); ?>
<?php
global $wpdb;

// Carrusel
$carrusel = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ld_carrusel WHERE activo=1 ORDER BY orden ASC");

// Productos destacados
$args = ['post_type'=>'product','posts_per_page'=>4,'meta_query'=>[['key'=>'_stock_status','value'=>'instock']],'orderby'=>'date','order'=>'DESC'];
$productos_query = new WP_Query($args);

// Reseñas aprobadas
$resenas = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ld_resenas WHERE aprobada=1 ORDER BY creado_en DESC LIMIT 20");

// Stats
$total_productos = wp_count_posts('product')->publish;
$categorias      = get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,'exclude'=>get_option('default_product_cat')]);
$num_categorias  = count($categorias);
$promedio_raw    = $wpdb->get_var("SELECT AVG(estrellas) FROM {$wpdb->prefix}ld_resenas WHERE aprobada=1");
$promedio        = $promedio_raw ? round($promedio_raw, 1) : 4.9;
$num_resenas     = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ld_resenas WHERE aprobada=1");

// Config
$config = get_option('ld_config', []);
$codigo_promo = $config['codigo_promo'] ?? 'DULCE15';
$descuento    = $config['descuento_porcentaje'] ?? 15;
?>

<!-- Modal de bienvenida -->
<?php if (!is_user_logged_in()): ?>
<div class="ld-modal-overlay" id="ldWelcomeModal" style="display:none;">
  <div class="ld-modal">
    <button class="ld-modal-close" id="ldModalClose">✕</button>
    <div class="ld-modal-icon">🎁</div>
    <h2>¡Bienvenida a La Dulcería!</h2>
    <p>Descubre regalos únicos y personalizados para cada ocasión especial.</p>
    <div class="ld-modal-code">
      <p style="font-size:.8rem;color:var(--text-light);margin-bottom:6px;">Tu código de descuento:</p>
      <span style="font-family:monospace;font-size:1.5rem;font-weight:700;color:var(--accent-dark);letter-spacing:.1em;"><?= esc_html($codigo_promo) ?></span>
      <p style="font-size:.8rem;color:var(--text-medium);margin-top:4px;"><?= esc_html($descuento) ?>% de descuento en tu primera compra</p>
    </div>
    <div class="ld-modal-actions">
      <a href="<?= home_url('/tienda') ?>" class="btn-primary">Ver catálogo 🛍️</a>
      <a href="<?= wc_get_page_permalink('myaccount') ?>" class="btn-outline">Registrarme</a>
      <button id="ldModalCerrar" style="background:none;border:none;color:var(--text-light);font-size:.875rem;cursor:pointer;margin-top:4px;">Continuar sin registrarme</button>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Carrusel de fotos -->
<?php if (!empty($carrusel)): ?>
<div class="ld-carrusel" id="ldCarrusel">
  <div class="ld-carrusel-slides" id="ldSlides">
    <?php foreach ($carrusel as $foto): ?>
    <div class="ld-carrusel-slide">
      <img src="<?= esc_url($foto->url) ?>"
           alt="<?= esc_attr($foto->titulo ?? 'La Dulcería') ?>"
           loading="lazy">
      <?php if ($foto->titulo): ?>
      <div class="ld-carrusel-caption">
        <h3><?= esc_html($foto->titulo) ?></h3>
        <?php if ($foto->descripcion): ?>
          <p><?= esc_html($foto->descripcion) ?></p>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>
    <?php endforeach; ?>
  </div>
  <button class="ld-carrusel-btn ld-carrusel-prev" id="ldPrev">&#8249;</button>
  <button class="ld-carrusel-btn ld-carrusel-next" id="ldNext">&#8250;</button>
  <div class="ld-carrusel-dots" id="ldDots">
    <?php foreach ($carrusel as $i => $foto): ?>
      <button class="ld-carrusel-dot <?= $i === 0 ? 'active' : '' ?>" data-slide="<?= $i ?>"></button>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>

<!-- HERO -->
<section id="inicio" class="ld-hero">
  <div class="ld-hero-deco" style="width:320px;height:320px;background:#e89ee4;opacity:.35;top:-80px;right:-60px;animation:float 6s ease-in-out infinite;"></div>
  <div class="ld-hero-deco" style="width:180px;height:180px;background:#c96bc4;opacity:.15;bottom:60px;left:-40px;animation:float 8s ease-in-out infinite 1s;"></div>
  <div class="ld-hero-deco" style="width:100px;height:100px;background:#f5bef2;opacity:.35;top:40%;left:55%;animation:float 7s ease-in-out infinite 2s;"></div>

  <div class="ld-hero-content">
    <span class="ld-hero-badge">✨ Regalos únicos en Colombia</span>
    <h1>El regalo perfecto<br>nace en <em>La Dulcería tienda de regalos</em></h1>
    <div class="ld-hero-desc">
      <p style="font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:600;color:var(--text-dark);">Más que regalos, creamos emociones que perduran.</p>
      <p>Lo que comenzó como un sueño lleno de ilusión, hoy se ha convertido en un espacio donde cada detalle cuenta una historia.</p>
      <p>Cada caja, cada diseño y cada creación lleva dedicación, amor y el deseo de hacer sonreír a alguien especial.</p>
      <p class="highlight">Bienvenidos a un lugar donde los detalles se convierten en recuerdos inolvidables.</p>
    </div>
    <div class="ld-hero-actions">
      <a href="<?= home_url('/tienda') ?>" class="btn-primary">Ver catálogo</a>
      <a href="<?= esc_url(ld_whatsapp_url('Hola! Vi su catálogo en La Dulcería y quiero más información 🌸')) ?>"
         target="_blank" rel="noopener" class="btn-outline">Hablar por WhatsApp</a>
    </div>
    <div class="ld-hero-stats">
      <div class="ld-stat"><span class="ld-stat-num"><?= $num_categorias ?></span><span class="ld-stat-label">Categorías</span></div>
      <div class="ld-stat"><span class="ld-stat-num"><?= $total_productos ?></span><span class="ld-stat-label">Productos</span></div>
      <div class="ld-stat"><span class="ld-stat-num"><?= $promedio ?></span><span class="ld-stat-label">⭐ Promedio</span></div>
      <div class="ld-stat"><span class="ld-stat-num"><?= $num_resenas ?></span><span class="ld-stat-label">Reseñas</span></div>
    </div>
  </div>
</section>

<!-- CARACTERÍSTICAS -->
<section class="ld-features">
  <div class="section-header fade-in"><h2>¿Por qué elegirnos?</h2></div>
  <div class="ld-features-grid">
    <?php foreach ([
      ['🎁','Empaques únicos','Cada regalo viene en un empaque especial, pensado con amor y atención al detalle.'],
      ['🚀','Envío rápido','Entrega en Bogotá y área metropolitana. Puntualidad garantizada para tu ocasión especial.'],
      ['💝','Personalización total','Agrega tu mensaje especial a cada regalo. Lo hacemos único para ti.'],
      ['🌸','Productos frescos','Trabajamos con proveedores locales para garantizar la mejor calidad en cada pedido.'],
    ] as [$ico,$tit,$desc]): ?>
    <div class="ld-feature-card fade-in">
      <span class="ld-feature-icon"><?= $ico ?></span>
      <h3><?= $tit ?></h3>
      <p><?= $desc ?></p>
    </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- PRODUCTOS DESTACADOS -->
<?php if ($productos_query->have_posts()): ?>
<section style="padding:80px 24px;background:var(--bg-soft);">
  <div class="ld-container">
    <div class="section-header fade-in">
      <h2>Nuestros Favoritos 🎀</h2>
      <p>Los regalos más amados por nuestra clientela</p>
    </div>
    <div class="ld-products-grid">
      <?php while ($productos_query->have_posts()): $productos_query->the_post();
        global $product; $product = wc_get_product(get_the_ID()); ?>
      <div class="fade-in">
        <?php get_template_part('partials/product', 'card'); ?>
      </div>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>
    <div style="text-align:center;margin-top:40px;" class="fade-in">
      <a href="<?= home_url('/tienda') ?>" class="btn-primary">Ver catálogo completo →</a>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- RESEÑAS -->
<section id="resenas" class="ld-resenas">
  <div class="ld-container">
    <div class="section-header fade-in">
      <h2>Lo que dicen nuestros clientes 💜</h2>
      <p>Reseñas reales de personas que eligieron regalar con amor</p>
    </div>

    <?php if (!empty($resenas)): ?>
    <div id="ldResenasContainer">
      <div class="ld-resenas-grid" id="ldResenasGrid">
        <?php foreach (array_slice($resenas, 0, 3) as $r): ?>
        <div class="ld-resena-card fade-in">
          <div class="ld-resena-stars"><?= str_repeat('★', $r->estrellas) ?></div>
          <p class="ld-resena-texto">"<?= esc_html($r->texto) ?>"</p>
          <div class="ld-resena-autor">
            <div class="ld-resena-avatar"><?= mb_strtoupper(mb_substr($r->nombre, 0, 1)) ?></div>
            <div>
              <div class="ld-resena-nombre"><?= esc_html($r->nombre) ?></div>
              <div class="ld-resena-ciudad"><?= esc_html($r->ciudad ?? 'Colombia') ?></div>
            </div>
          </div>
        </div>
        <?php endforeach; ?>
      </div>
      <?php if (count($resenas) > 3): ?>
      <div class="ld-resenas-nav">
        <button class="ld-resenas-nav-btn" id="ldResPrev" disabled>&#8249;</button>
        <div class="ld-resenas-dots" id="ldResDots"></div>
        <button class="ld-resenas-nav-btn" id="ldResNext">&#8250;</button>
      </div>
      <?php endif; ?>
    </div>
    <?php endif; ?>

    <!-- Formulario de reseña -->
    <div class="fade-in" style="background:var(--bg-soft);border-radius:var(--radius);padding:40px;max-width:560px;margin:48px auto 0;box-shadow:var(--shadow-card);">
      <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--text-dark);margin-bottom:24px;text-align:center;">Déjanos tu reseña ⭐</h3>
      <div id="ldResenaMsg" style="display:none;text-align:center;padding:32px;">
        <span style="font-size:3rem;display:block;margin-bottom:12px;">🌸</span>
        <h4 style="font-family:'Playfair Display',serif;font-size:1.25rem;">¡Gracias por tu reseña!</h4>
        <p style="color:var(--text-medium);margin-top:8px;">Será revisada y publicada pronto.</p>
      </div>
      <form id="ldResenaForm">
        <div class="ld-form-group">
          <label class="form-label">Tu nombre</label>
          <input type="text" class="form-input" name="nombre" placeholder="¿Cómo te llamas?" required>
        </div>
        <div class="ld-form-group">
          <label class="form-label">Calificación</label>
          <div id="ldStarsInput" style="display:flex;gap:8px;">
            <?php for ($i=1;$i<=5;$i++): ?>
              <button type="button" data-star="<?=$i?>"
                style="font-size:1.5rem;background:none;border:none;cursor:pointer;transition:transform .2s;color:<?=$i<=5?'var(--yellow)':'#d1d5db'?>;"
                class="ld-star-btn">★</button>
            <?php endfor; ?>
          </div>
          <input type="hidden" name="estrellas" id="ldStarsValue" value="5">
        </div>
        <div class="ld-form-group">
          <label class="form-label">Tu comentario</label>
          <textarea class="form-input" name="texto" placeholder="Cuéntanos tu experiencia" style="resize:none;height:96px;" minlength="10" required></textarea>
        </div>
        <?php wp_nonce_field('ld_nonce','ld_resena_nonce'); ?>
        <button type="submit" class="btn-primary" style="width:100%;justify-content:center;">Enviar reseña 💌</button>
      </form>
    </div>
  </div>
</section>

<!-- CONTACTO -->
<section id="contacto" style="padding:80px 24px;background:var(--bg-soft);">
  <div style="max-width:520px;margin:0 auto;">
    <div class="section-header fade-in"><h2>Contáctanos 💬</h2></div>
    <div class="fade-in" style="background:#fff;border-radius:var(--radius);padding:32px;box-shadow:var(--shadow-card);">
      <div id="ldContactoMsg" style="display:none;text-align:center;padding:32px;">
        <span style="font-size:3rem;display:block;margin-bottom:12px;">✅</span>
        <h4 style="font-family:'Playfair Display',serif;font-size:1.25rem;">¡Mensaje enviado!</h4>
        <p style="color:var(--text-medium);margin-top:8px;">Te responderemos pronto.</p>
      </div>
      <form id="ldContactoForm">
        <div class="ld-form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" placeholder="Tu nombre" required>
        </div>
        <div class="ld-form-group">
          <label class="form-label">Teléfono o correo</label>
          <input type="text" class="form-input" placeholder="¿Cómo te contactamos?" required>
        </div>
        <div class="ld-form-group">
          <label class="form-label">Tipo de consulta</label>
          <select class="form-input" required>
            <option value="">Selecciona...</option>
            <option>Pedido personalizado</option>
            <option>Información de envíos</option>
            <option>Precios y disponibilidad</option>
            <option>Otro</option>
          </select>
        </div>
        <div class="ld-form-group">
          <label class="form-label">Mensaje</label>
          <textarea class="form-input" style="resize:none;height:96px;" placeholder="Escríbenos..." required></textarea>
        </div>
        <p style="font-size:.7rem;color:var(--text-light);line-height:1.6;margin-bottom:16px;">
          Al enviar este formulario autorizas a <strong>La Dulcería tienda de regalos</strong> el tratamiento de tus datos personales conforme a la <strong>Ley 1581 de 2012</strong> (Colombia).
        </p>
        <button type="submit" class="btn-primary" style="width:100%;">Enviar mensaje 💌</button>
      </form>
    </div>
  </div>
</section>

<!-- CTA REGISTRO -->
<section style="padding:80px 24px;background:linear-gradient(135deg,#fbddf9 0%,#f5bef2 100%);">
  <div style="max-width:380px;margin:0 auto;text-align:center;" class="fade-in">
    <h2 style="font-family:'Playfair Display',serif;font-size:1.875rem;color:var(--text-dark);margin-bottom:12px;">¿Quieres recibir ofertas exclusivas? 🌸</h2>
    <p style="color:var(--text-medium);margin-bottom:32px;">Regístrate y recibe tu código de descuento especial</p>
    <a href="<?= wc_get_page_permalink('myaccount') ?>" class="btn-primary"
       style="font-size:1.1rem;padding:16px 40px;">Registrarme</a>
  </div>
</section>

<!-- Datos de reseñas para JS -->
<script>
var ldResenas = <?= json_encode(array_map(fn($r) => [
  'nombre'   => $r->nombre,
  'ciudad'   => $r->ciudad ?? 'Colombia',
  'texto'    => $r->texto,
  'estrellas'=> (int)$r->estrellas,
], $resenas)) ?>;
</script>

<?php get_footer(); ?>
