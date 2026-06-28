<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="profile" href="https://gmpg.org/xfn/11">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
$cart_count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
$user       = wp_get_current_user();
$logged_in  = is_user_logged_in();
$is_admin   = current_user_can('manage_options') || current_user_can('administrator');
?>

<!-- Navbar -->
<nav class="ld-navbar">
  <div class="ld-navbar-inner">
    <!-- Logo -->
    <a href="<?= home_url('/') ?>" class="ld-navbar-logo">
      <img src="<?= get_template_directory_uri() ?>/assets/images/logo.png"
           alt="La Dulcería tienda de regalos" width="52" height="52">
    </a>

    <!-- Links desktop -->
    <div class="ld-navbar-links">
      <a href="<?= home_url('/') ?>">Inicio</a>
      <a href="<?= 'https://ladulceriaregalos.com/shop/' ?>">Catálogo</a>
      <a href="<?= home_url('/#resenas') ?>">Reseñas</a>
      <a href="<?= home_url('/#contacto') ?>">Contacto</a>
    </div>

    <!-- Acciones -->
    <div class="ld-navbar-actions">
      <!-- Carrito -->
      <a href="<?= wc_get_cart_url() ?>" class="ld-cart-btn" aria-label="Ver carrito">
        🛒
        <?php if ($cart_count > 0): ?>
          <span class="ld-cart-count"><?= $cart_count ?></span>
        <?php endif; ?>
      </a>

      <!-- Auth -->
      <?php if ($logged_in):
        $nombre = $user->first_name ?: $user->display_name;
        $nombre = mb_strtolower($nombre, 'UTF-8');
        $nombre = mb_strtoupper(mb_substr($nombre, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($nombre, 1, null, 'UTF-8');
      ?>
        <div class="ld-navbar-auth" style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:.875rem;font-weight:600;color:var(--accent);">Hola, <?= esc_html($nombre) ?></span>
          <a href="<?= wc_get_account_endpoint_url('') ?>"
             style="font-size:.875rem;font-weight:600;color:var(--text-medium);">Mi cuenta</a>
          <a href="<?= wp_logout_url(home_url('/')) ?>"
             style="font-size:.875rem;font-weight:600;color:var(--text-light);">Salir</a>
        </div>
      <?php else: ?>
        <a href="<?= wc_get_page_permalink('myaccount') ?>" class="ld-navbar-btn">Ingresar</a>
      <?php endif; ?>

      <!-- Hamburger -->
      <button class="ld-hamburger" id="ldHamburger" aria-label="Abrir menú">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- Menú móvil -->
<div class="ld-mobile-menu" id="ldMobileMenu">
  <button class="ld-mobile-close" id="ldMobileClose">✕</button>
  <img src="<?= get_template_directory_uri() ?>/assets/images/logo.png" alt="La Dulcería" width="80" height="80" style="border-radius:50%;">
  <a href="<?= home_url('/') ?>">Inicio</a>
  <a href="<?= 'https://ladulceriaregalos.com/shop/' ?>">Catálogo</a>
  <a href="<?= home_url('/#resenas') ?>">Reseñas</a>
  <a href="<?= home_url('/#contacto') ?>">Contacto</a>
  <a href="<?= wc_get_cart_url() ?>">Carrito 🛒</a>
  <?php if ($logged_in): ?>
    <?php if (!$is_admin): ?>
      <a href="<?= wc_get_account_endpoint_url('') ?>" style="font-size:1.5rem;color:var(--text-medium);">Mi cuenta</a>
    <?php endif; ?>
    <a href="<?= wp_logout_url(home_url('/')) ?>" style="font-size:1.1rem;color:var(--text-light);">Cerrar sesión</a>
  <?php else: ?>
    <a href="<?= wc_get_page_permalink('myaccount') ?>"
       style="background:var(--accent);color:#fff;padding:12px 32px;border-radius:50px;font-weight:700;font-size:1.1rem;">Ingresar</a>
  <?php endif; ?>
</div>

<!-- WhatsApp flotante -->
<a href="<?= esc_url(ld_whatsapp_url('Hola! Vi su catálogo en La Dulcería y quiero más información 🌸')) ?>"
   target="_blank" rel="noopener noreferrer" class="ld-whatsapp" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
</a>
