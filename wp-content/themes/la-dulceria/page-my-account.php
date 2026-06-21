<?php
defined('ABSPATH') || exit;
get_header();
?>

<style>
.ld-auth-wrap {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background: linear-gradient(135deg, #fdf0fd 0%, #fce4fc 100%);
}
.ld-auth-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(201,107,196,.15);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
}
.ld-auth-logo {
  text-align: center;
  padding: 36px 32px 0;
}
.ld-auth-logo img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(201,107,196,.25);
}
.ld-auth-logo p {
  margin: 10px 0 0;
  font-size: .8125rem;
  color: #9a7898;
}
.ld-auth-tabs {
  display: flex;
  margin: 24px 32px 0;
  background: #fdf0fd;
  border-radius: 50px;
  padding: 4px;
}
.ld-auth-tab {
  flex: 1;
  text-align: center;
  padding: 9px 0;
  font-size: .875rem;
  font-weight: 700;
  border-radius: 50px;
  cursor: pointer;
  color: #9a7898;
  transition: all .2s;
  border: none;
  background: transparent;
}
.ld-auth-tab.active {
  background: #fff;
  color: #c96bc4;
  box-shadow: 0 2px 8px rgba(201,107,196,.2);
}
.ld-auth-body {
  padding: 28px 32px 36px;
}
.ld-auth-panel { display: none; }
.ld-auth-panel.active { display: block; }
.ld-fg {
  margin-bottom: 18px;
}
.ld-fg label {
  display: block;
  font-size: .8125rem;
  font-weight: 600;
  color: #5a3d58;
  margin-bottom: 6px;
}
.ld-fg input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #ecd6ec;
  border-radius: 10px;
  font-size: .9375rem;
  color: #2d1a2b;
  background: #fdf8fd;
  box-sizing: border-box;
  transition: border-color .2s;
  outline: none;
}
.ld-fg input:focus {
  border-color: #c96bc4;
  background: #fff;
}
.ld-auth-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #c96bc4 0%, #a855a8 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: .3px;
  transition: opacity .2s, transform .1s;
  margin-top: 4px;
}
.ld-auth-btn:hover { opacity: .9; transform: translateY(-1px); }
.ld-auth-btn:active { transform: translateY(0); }
.ld-auth-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
  color: #c5b0c4;
  font-size: .75rem;
}
.ld-auth-divider::before,
.ld-auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ecd6ec;
}
.ld-lost-pw {
  text-align: right;
  margin-top: -10px;
  margin-bottom: 18px;
}
.ld-lost-pw a {
  font-size: .75rem;
  color: #c96bc4;
  text-decoration: none;
}
.ld-lost-pw a:hover { text-decoration: underline; }
.ld-policy {
  font-size: .7rem;
  color: #9a7898;
  line-height: 1.6;
  margin-top: 14px;
  text-align: center;
}
.ld-policy a { color: #c96bc4; }
.woocommerce-error, .woocommerce-message, .woocommerce-info {
  border-radius: 10px;
  font-size: .875rem;
  margin-bottom: 16px;
}
</style>

<?php if (is_user_logged_in()): ?>

  <?php
  // Usuario logueado: mostrar panel de cuenta WooCommerce
  echo do_shortcode('[woocommerce_my_account]');
  ?>

<?php else: ?>

<div class="ld-auth-wrap">
  <div class="ld-auth-card">

    <div class="ld-auth-logo">
      <img src="<?= get_template_directory_uri() ?>/assets/images/logo.png" alt="La Dulcería">
      <p>Regalos únicos y personalizados 🌸</p>
    </div>

    <div class="ld-auth-tabs">
      <button class="ld-auth-tab active" onclick="ldTab('login',this)">Ingresar</button>
      <button class="ld-auth-tab" onclick="ldTab('registro',this)">Registrarse</button>
    </div>

    <div class="ld-auth-body">

      <?php wc_print_notices(); ?>

      <!-- PANEL INGRESAR -->
      <div id="ld-panel-login" class="ld-auth-panel active">
        <form method="post" class="woocommerce-form woocommerce-form-login">
          <?php do_action('woocommerce_login_form_start'); ?>

          <div class="ld-fg">
            <label for="username">Correo electrónico</label>
            <input type="text" id="username" name="username"
                   placeholder="tucorreo@email.com"
                   value="<?= esc_attr(isset($_POST['username']) ? wp_unslash($_POST['username']) : '') ?>"
                   autocomplete="username email" required>
          </div>

          <div class="ld-fg">
            <label for="password">Contraseña</label>
            <input type="password" id="password" name="password"
                   placeholder="••••••••"
                   autocomplete="current-password" required>
          </div>

          <div class="ld-lost-pw">
            <a href="<?= esc_url(wp_lostpassword_url()) ?>">¿Olvidaste tu contraseña?</a>
          </div>

          <?php do_action('woocommerce_login_form'); ?>

          <input type="hidden" name="redirect" value="<?= esc_url(wc_get_account_endpoint_url('')) ?>">
          <?php wp_nonce_field('woocommerce-login', 'woocommerce-login-nonce'); ?>

          <button type="submit" name="login" value="Ingresar" class="ld-auth-btn">
            Ingresar a mi cuenta
          </button>

          <?php do_action('woocommerce_login_form_end'); ?>
        </form>

        <div class="ld-auth-divider">o</div>
        <button class="ld-auth-btn" onclick="ldTab('registro', document.querySelectorAll('.ld-auth-tab')[1])"
                style="background:linear-gradient(135deg,#fbddf9 0%,#f5bef2 100%);color:#c96bc4;">
          Crear una cuenta nueva
        </button>
      </div>

      <!-- PANEL REGISTRARSE -->
      <div id="ld-panel-registro" class="ld-auth-panel">
        <form method="post" class="woocommerce-form woocommerce-form-register">
          <?php do_action('woocommerce_register_form_start'); ?>

          <?php if ('no' === get_option('woocommerce_registration_generate_username')): ?>
          <div class="ld-fg">
            <label for="reg_username">Nombre de usuario</label>
            <input type="text" id="reg_username" name="username"
                   placeholder="tunombre"
                   value="<?= esc_attr(isset($_POST['username']) ? wp_unslash($_POST['username']) : '') ?>"
                   autocomplete="username" required>
          </div>
          <?php endif; ?>

          <div class="ld-fg">
            <label for="reg_email">Correo electrónico</label>
            <input type="email" id="reg_email" name="email"
                   placeholder="tucorreo@email.com"
                   value="<?= esc_attr(isset($_POST['email']) ? wp_unslash($_POST['email']) : '') ?>"
                   autocomplete="email" required>
          </div>

          <?php if ('no' === get_option('woocommerce_registration_generate_password')): ?>
          <div class="ld-fg">
            <label for="reg_password">Contraseña</label>
            <input type="password" id="reg_password" name="password"
                   placeholder="Mínimo 8 caracteres"
                   autocomplete="new-password" required>
          </div>
          <?php endif; ?>

          <?php do_action('woocommerce_register_form'); ?>

          <?php wp_nonce_field('woocommerce-register', 'woocommerce-register-nonce'); ?>

          <button type="submit" name="register" value="Registrarse" class="ld-auth-btn">
            Crear mi cuenta 🌸
          </button>

          <p class="ld-policy">
            Al registrarte aceptas nuestros
            <a href="<?= esc_url(home_url('/terminos-y-condiciones/')) ?>">Términos y condiciones</a>
            y autorizas el tratamiento de tus datos conforme a la
            <strong>Ley 1581 de 2012</strong> (Colombia).
          </p>

          <?php do_action('woocommerce_register_form_end'); ?>
        </form>
      </div>

    </div>
  </div>
</div>

<script>
function ldTab(panel, btn) {
  document.querySelectorAll('.ld-auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ld-auth-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ld-panel-' + panel).classList.add('active');
}
<?php if (!empty($_GET['register'])): ?>
document.addEventListener('DOMContentLoaded', function() {
  ldTab('registro', document.querySelectorAll('.ld-auth-tab')[1]);
});
<?php endif; ?>
</script>

<?php endif; ?>

<?php get_footer(); ?>
