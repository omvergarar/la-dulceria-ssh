<?php get_header(); the_post(); global $product; ?>

<div style="padding:48px 24px;min-height:80vh;background:var(--bg-soft);">
  <div class="ld-container">
    <a href="<?= wc_get_page_permalink('shop') ?>"
       style="color:var(--text-medium);font-size:.875rem;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;">
      ← Volver al catálogo
    </a>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;background:#fff;border-radius:var(--radius);padding:40px;box-shadow:var(--shadow-card);">
      <!-- Galería -->
      <div>
        <?php
        $attachment_ids = $product->get_gallery_image_ids();
        array_unshift($attachment_ids, $product->get_image_id());
        $attachment_ids = array_filter($attachment_ids);
        ?>
        <?php if (!empty($attachment_ids)): ?>
          <img id="ldMainImg"
               src="<?= wp_get_attachment_url($attachment_ids[0]) ?>"
               alt="<?= esc_attr(get_the_title()) ?>"
               style="width:100%;border-radius:var(--radius);object-fit:cover;max-height:480px;">
          <?php if (count($attachment_ids) > 1): ?>
          <div style="display:flex;gap:8px;margin-top:12px;overflow-x:auto;">
            <?php foreach ($attachment_ids as $aid): ?>
              <img src="<?= wp_get_attachment_url($aid) ?>"
                   alt="<?= esc_attr(get_the_title()) ?>"
                   onclick="document.getElementById('ldMainImg').src=this.src"
                   style="width:72px;height:72px;object-fit:cover;border-radius:var(--radius-sm);cursor:pointer;border:2px solid var(--primary-dark);flex-shrink:0;">
            <?php endforeach; ?>
          </div>
          <?php endif; ?>
        <?php else: ?>
          <div class="ld-product-img-placeholder" style="height:400px;border-radius:var(--radius);">🎁</div>
        <?php endif; ?>
      </div>

      <!-- Info -->
      <div>
        <div style="font-size:.75rem;color:var(--accent);font-weight:700;text-transform:uppercase;margin-bottom:8px;">
          <?= esc_html(implode(', ', wp_list_pluck(get_the_terms(get_the_ID(),'product_cat') ?: [],'name'))) ?>
        </div>
        <h1 style="font-family:'Playfair Display',serif;font-size:1.75rem;color:var(--text-dark);margin-bottom:16px;"><?= get_the_title() ?></h1>
        <div style="font-size:1.75rem;font-weight:800;color:var(--accent-dark);margin-bottom:20px;"><?= $product->get_price_html() ?></div>

        <?php
        $stock = $product->get_stock_quantity();
        if ($stock !== null && $stock === 0):
        ?>
          <span class="ld-product-badge agotado" style="font-size:.875rem;padding:6px 16px;margin-bottom:16px;display:inline-block;">Agotado</span>
        <?php elseif ($stock !== null && $stock <= 3): ?>
          <span class="ld-product-badge ultimas" style="font-size:.875rem;padding:6px 16px;margin-bottom:16px;display:inline-block;">Últimas <?= $stock ?> unidades</span>
        <?php endif; ?>

        <div style="color:var(--text-medium);line-height:1.7;margin-bottom:24px;"><?= wpautop(get_the_content()) ?></div>

        <?php if ($product->is_in_stock()): ?>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <label style="font-weight:600;font-size:.875rem;">Cantidad:</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <button onclick="var i=document.getElementById('ldQty');i.value=Math.max(1,+i.value-1);"
                    class="ld-qty-btn">−</button>
            <input id="ldQty" type="number" value="1" min="1" max="<?= $stock ?? 99 ?>"
                   style="width:52px;text-align:center;border:2px solid var(--primary-dark);border-radius:var(--radius-sm);padding:6px;">
            <button onclick="var i=document.getElementById('ldQty');i.value=+i.value+1;"
                    class="ld-qty-btn">+</button>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:.875rem;display:block;margin-bottom:6px;">Mensaje personalizado (opcional):</label>
          <textarea id="ldMensaje" class="form-input" style="resize:none;height:72px;"
                    placeholder="Escribe tu mensaje especial..." oninput="ldContarPalabras(this)"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:4px;">
            <span id="ldPalabrasRestantes" style="font-size:.75rem;color:var(--text-medium);">100 palabras disponibles</span>
          </div>
        </div>

        <button class="btn-primary" style="width:100%;font-size:1rem;"
                onclick="ldAgregarAlCarrito(<?= $product->get_id() ?>)">
          Agregar al carrito 🛍️
        </button>
        <?php else: ?>
          <button class="btn-primary" disabled style="background:var(--text-light);cursor:not-allowed;width:100%;">Agotado</button>
        <?php endif; ?>

        <a href="<?= esc_url(ld_whatsapp_url('Hola! Estoy interesada en el producto: ' . get_the_title())) ?>"
           target="_blank" rel="noopener" class="btn-outline"
           style="width:100%;text-align:center;margin-top:8px;">Preguntar por WhatsApp</a>
      </div>
    </div>
  </div>
</div>

<script>
const LD_MAX_PALABRAS = 100;

function ldContarPalabras(textarea) {
  const palabras = textarea.value.trim() === '' ? [] : textarea.value.trim().split(/\s+/);
  const usadas   = palabras.length;
  const restantes = LD_MAX_PALABRAS - usadas;
  const el = document.getElementById('ldPalabrasRestantes');

  if (restantes < 0) {
    // Recortar al límite
    textarea.value = palabras.slice(0, LD_MAX_PALABRAS).join(' ');
    el.textContent = '0 palabras disponibles';
    el.style.color = '#e53e3e';
    return;
  }

  el.textContent = restantes + (restantes === 1 ? ' palabra disponible' : ' palabras disponibles');
  el.style.color = restantes <= 10 ? '#e53e3e' : restantes <= 25 ? '#d97706' : 'var(--text-medium)';
}

function ldAgregarAlCarrito(productId) {
  const qty = parseInt(document.getElementById('ldQty').value) || 1;
  const msg = document.getElementById('ldMensaje')?.value || '';

  const palabras = msg.trim() === '' ? [] : msg.trim().split(/\s+/);
  if (palabras.length > LD_MAX_PALABRAS) {
    alert('El mensaje no puede superar las 100 palabras.');
    return;
  }

  fetch('<?= admin_url('admin-ajax.php') ?>', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({action:'woocommerce_add_to_cart',product_id:productId,quantity:qty,nonce:'<?= wp_create_nonce('add-to-cart') ?>',mensaje:msg})
  }).then(r => r.json()).then(d => {
    if (d.error) { alert(d.error); return; }
    window.location.href = '<?= wc_get_cart_url() ?>';
  });
}
</script>

<?php get_footer(); ?>
