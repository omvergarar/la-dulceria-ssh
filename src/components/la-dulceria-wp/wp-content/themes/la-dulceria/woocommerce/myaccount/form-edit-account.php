<?php defined('ABSPATH') || exit; ?>

<style>
.ld-edit-wrap {
  min-height: 80vh;
  background: linear-gradient(135deg, #fdf0fd 0%, #fce4fc 100%);
  padding: 48px 24px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.ld-edit-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(201,107,196,.15);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
}
.ld-edit-header {
  background: linear-gradient(135deg, #c96bc4 0%, #a855a8 100%);
  padding: 32px;
  text-align: center;
  color: #fff;
}
.ld-edit-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  margin: 0 0 4px;
}
.ld-edit-header p {
  font-size: .875rem;
  opacity: .85;
  margin: 0;
}
.ld-edit-body { padding: 32px; }

.ld-section-title {
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #c96bc4;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #fdf0fd;
}
.ld-fg {
  margin-bottom: 16px;
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
  font-family: inherit;
}
.ld-fg input:focus {
  border-color: #c96bc4;
  background: #fff;
}
.ld-fg .ld-hint {
  font-size: .7rem;
  color: #9a7898;
  margin-top: 4px;
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.input-wrap { position: relative; }
.input-wrap input { padding-right: 42px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  font-size: 1rem; color: #9a7898; padding: 0;
}
.ld-separator {
  border: none;
  border-top: 1.5px solid #fdf0fd;
  margin: 24px 0;
}
.ld-save-btn {
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
  font-family: inherit;
}
.ld-save-btn:hover { opacity: .9; transform: translateY(-1px); }
.ld-back-link {
  display: block;
  text-align: center;
  margin-top: 16px;
  font-size: .875rem;
  color: #9a7898;
  text-decoration: none;
}
.ld-back-link:hover { color: #c96bc4; }
.woocommerce-error, .woocommerce-message {
  border-radius: 10px;
  font-size: .875rem;
  margin-bottom: 20px;
  padding: 12px 16px;
  list-style: none;
}
.woocommerce-message { background: #f0fdf4; color: #16a34a; border-left: 4px solid #16a34a; }
.woocommerce-error  { background: #fff5f5; color: #e53e3e; border-left: 4px solid #e53e3e; }
@media (max-width: 480px) {
  .two-col { grid-template-columns: 1fr; }
  .ld-edit-body { padding: 24px 20px; }
}
</style>

<div class="ld-edit-wrap">
  <div class="ld-edit-card">

    <div class="ld-edit-header">
      <h2>⚙️ Mis datos</h2>
      <p>Mantén tu información actualizada</p>
    </div>

    <div class="ld-edit-body">

      <?php wc_print_notices(); ?>

      <form method="post" id="ldEditAccountForm" onsubmit="return ldValidarCuenta()">

        <!-- Información personal -->
        <p class="ld-section-title">Información personal</p>

        <div class="two-col">
          <div class="ld-fg">
            <label for="account_first_name">Nombre *</label>
            <input type="text" id="account_first_name" name="account_first_name"
                   value="<?= esc_attr($user->first_name) ?>"
                   autocomplete="given-name" required>
          </div>
          <div class="ld-fg">
            <label for="account_last_name">Apellido</label>
            <input type="text" id="account_last_name" name="account_last_name"
                   value="<?= esc_attr($user->last_name) ?>"
                   autocomplete="family-name">
          </div>
        </div>

        <div class="ld-fg">
          <label for="account_display_name">Nombre visible *</label>
          <input type="text" id="account_display_name" name="account_display_name"
                 value="<?= esc_attr($user->display_name) ?>" required>
          <p class="ld-hint">Así aparecerá tu nombre en la tienda</p>
        </div>

        <div class="ld-fg">
          <label for="account_email">Correo electrónico *</label>
          <input type="email" id="account_email" name="account_email"
                 value="<?= esc_attr($user->user_email) ?>"
                 autocomplete="email" required>
        </div>

        <hr class="ld-separator">

        <!-- Cambiar contraseña -->
        <p class="ld-section-title">Cambiar contraseña <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#9a7898;">(opcional)</span></p>

        <div class="ld-fg">
          <label for="password_current">Contraseña actual</label>
          <div class="input-wrap">
            <input type="password" id="password_current" name="password_current"
                   placeholder="Ingresa tu contraseña actual"
                   autocomplete="current-password">
            <button type="button" class="eye-btn" onclick="ldVerPassword('password_current',this)">👁</button>
          </div>
        </div>

        <div class="two-col">
          <div class="ld-fg">
            <label for="password_1">Nueva contraseña</label>
            <div class="input-wrap">
              <input type="password" id="password_1" name="password_1"
                     placeholder="Mínimo 8 caracteres"
                     autocomplete="new-password"
                     oninput="ldFortaleza(this.value)">
              <button type="button" class="eye-btn" onclick="ldVerPassword('password_1',this)">👁</button>
            </div>
            <div id="ldFortWrap" style="display:none;margin-top:6px;">
              <div style="height:4px;border-radius:4px;background:#ecd6ec;overflow:hidden;">
                <div id="ldFortBar" style="height:100%;width:0;border-radius:4px;transition:width .3s,background .3s;"></div>
              </div>
              <p id="ldFortTxt" style="font-size:.7rem;margin:4px 0 0;"></p>
            </div>
          </div>
          <div class="ld-fg">
            <label for="password_2">Confirmar contraseña</label>
            <div class="input-wrap">
              <input type="password" id="password_2" name="password_2"
                     placeholder="Repite la nueva"
                     autocomplete="new-password"
                     oninput="ldCheckMatch()">
              <button type="button" class="eye-btn" onclick="ldVerPassword('password_2',this)">👁</button>
            </div>
            <p id="ldMatchMsg" style="font-size:.7rem;margin-top:4px;display:none;"></p>
          </div>
        </div>

        <?php wp_nonce_field('save_account_details', 'save-account-nonce'); ?>
        <input type="hidden" name="action" value="save_account_details">

        <button type="submit" class="ld-save-btn">Guardar cambios</button>

      </form>

      <a href="<?= esc_url(wc_get_account_endpoint_url('')) ?>" class="ld-back-link">← Volver a mi cuenta</a>

    </div>
  </div>
</div>

<script>
function ldVerPassword(id, btn) {
  const input = document.getElementById(id);
  const ver = input.type === 'password';
  input.type = ver ? 'text' : 'password';
  btn.textContent = ver ? '🙈' : '👁';
}

function ldFortaleza(val) {
  const wrap = document.getElementById('ldFortWrap');
  const bar  = document.getElementById('ldFortBar');
  const txt  = document.getElementById('ldFortTxt');
  if (!val) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;
  const n = [
    { w:'25%',  bg:'#e53e3e', label:'Muy débil' },
    { w:'50%',  bg:'#d97706', label:'Débil' },
    { w:'75%',  bg:'#2563eb', label:'Buena' },
    { w:'100%', bg:'#16a34a', label:'Fuerte 💪' },
  ][Math.max(score - 1, 0)];
  bar.style.width = n.w; bar.style.background = n.bg;
  txt.textContent = n.label; txt.style.color = n.bg;
}

function ldCheckMatch() {
  const p1  = document.getElementById('password_1').value;
  const p2  = document.getElementById('password_2').value;
  const msg = document.getElementById('ldMatchMsg');
  if (!p2) { msg.style.display = 'none'; return; }
  msg.style.display = 'block';
  if (p1 === p2) {
    msg.textContent = '✅ Coinciden'; msg.style.color = '#16a34a';
  } else {
    msg.textContent = '❌ No coinciden'; msg.style.color = '#e53e3e';
  }
}

function ldValidarCuenta() {
  const p1 = document.getElementById('password_1').value;
  const p2 = document.getElementById('password_2').value;
  const pc = document.getElementById('password_current').value;
  if ((p1 || p2) && !pc) {
    alert('Debes ingresar tu contraseña actual para cambiarla.');
    return false;
  }
  if (p1 && p1.length < 8) {
    alert('La nueva contraseña debe tener al menos 8 caracteres.');
    return false;
  }
  if (p1 !== p2) {
    alert('Las contraseñas no coinciden.');
    return false;
  }
  return true;
}
</script>
