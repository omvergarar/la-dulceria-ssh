/* La Dulcería — theme.js */
(function () {
  'use strict';

  // ── Menú móvil ────────────────────────────────────────────
  const hamburger = document.getElementById('ldHamburger');
  const mobileMenu = document.getElementById('ldMobileMenu');
  const mobileClose = document.getElementById('ldMobileClose');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
    mobileClose && mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
  }

  // ── Modal de bienvenida ───────────────────────────────────
  const modal = document.getElementById('ldWelcomeModal');
  if (modal) {
    setTimeout(() => modal.style.display = 'flex', 2500);
    const cerrar = () => modal.style.display = 'none';
    document.getElementById('ldModalClose')?.addEventListener('click', cerrar);
    document.getElementById('ldModalCerrar')?.addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
  }

  // ── Carrusel de fotos ─────────────────────────────────────
  const slides = document.getElementById('ldSlides');
  const dots   = document.querySelectorAll('.ld-carrusel-dot');
  if (slides && slides.children.length > 0) {
    let current = 0;
    const total = slides.children.length;

    const goTo = (n) => {
      current = (n + total) % total;
      slides.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };

    document.getElementById('ldPrev')?.addEventListener('click', () => goTo(current - 1));
    document.getElementById('ldNext')?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    let autoplay = setInterval(() => goTo(current + 1), 5000);
    slides.addEventListener('mouseenter', () => clearInterval(autoplay));
    slides.addEventListener('mouseleave', () => { autoplay = setInterval(() => goTo(current + 1), 5000); });
  }

  // ── Reseñas paginadas ─────────────────────────────────────
  if (typeof ldResenas !== 'undefined' && ldResenas.length > 3) {
    const grid = document.getElementById('ldResenasGrid');
    const prev = document.getElementById('ldResPrev');
    const next = document.getElementById('ldResNext');
    const dotsC = document.getElementById('ldResDots');
    const POR_PAG = 3;
    let pag = 0;
    const total_pag = Math.ceil(ldResenas.length / POR_PAG);

    // Crear dots
    for (let i = 0; i < total_pag; i++) {
      const d = document.createElement('button');
      d.className = 'ld-resenas-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => render(i));
      dotsC.appendChild(d);
    }

    const render = (n) => {
      pag = n;
      const slice = ldResenas.slice(n * POR_PAG, n * POR_PAG + POR_PAG);
      grid.innerHTML = slice.map(r => `
        <div class="ld-resena-card fade-in visible">
          <div class="ld-resena-stars">${'★'.repeat(r.estrellas)}</div>
          <p class="ld-resena-texto">"${escHtml(r.texto)}"</p>
          <div class="ld-resena-autor">
            <div class="ld-resena-avatar">${r.nombre[0].toUpperCase()}</div>
            <div>
              <div class="ld-resena-nombre">${escHtml(r.nombre)}</div>
              <div class="ld-resena-ciudad">${escHtml(r.ciudad || 'Colombia')}</div>
            </div>
          </div>
        </div>`).join('');
      dotsC.querySelectorAll('.ld-resenas-dot').forEach((d, i) => d.classList.toggle('active', i === n));
      prev.disabled = n === 0;
      next.disabled = n === total_pag - 1;
    };

    prev?.addEventListener('click', () => render(pag - 1));
    next?.addEventListener('click', () => render(pag + 1));
    render(0);
  }

  // ── Formulario de reseña ──────────────────────────────────
  const resenaForm = document.getElementById('ldResenaForm');
  if (resenaForm) {
    // Estrellas interactivas
    const stars = resenaForm.querySelectorAll('.ld-star-btn');
    const starsInput = document.getElementById('ldStarsValue');
    stars.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        starsInput.value = idx + 1;
        stars.forEach((s, i) => s.style.color = i <= idx ? 'var(--yellow)' : '#d1d5db');
      });
    });

    resenaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(resenaForm);
      fd.append('action', 'ld_enviar_resena');
      fd.append('nonce', ldConfig.nonce);
      const res = await fetch(ldConfig.ajaxUrl, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        resenaForm.style.display = 'none';
        document.getElementById('ldResenaMsg').style.display = 'block';
      } else {
        alert(data.data?.msg || 'Error al enviar la reseña');
      }
    });
  }

  // ── Formulario de contacto ────────────────────────────────
  const contactoForm = document.getElementById('ldContactoForm');
  if (contactoForm) {
    contactoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactoForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const data = new FormData(contactoForm);
      data.append('action', 'ld_contacto');

      fetch(window.ldAjax?.url || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: data,
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            contactoForm.style.display = 'none';
            document.getElementById('ldContactoMsg').style.display = 'block';
          } else {
            alert(res.data?.msg || 'Error al enviar. Intenta de nuevo.');
            btn.disabled = false;
            btn.textContent = 'Enviar mensaje 💌';
          }
        })
        .catch(() => {
          alert('Error de conexión. Intenta de nuevo.');
          btn.disabled = false;
          btn.textContent = 'Enviar mensaje 💌';
        });
    });
  }

  // ── Fade-in al hacer scroll ───────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
    }, { threshold: 0.1 });
    fadeEls.forEach(el => obs.observe(el));
  }

  // ── Agregar al carrito (catálogo) ─────────────────────────
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id  = this.dataset.productId;
      const url = this.dataset.productUrl;
      this.textContent = 'Agregando...';
      this.disabled = true;

      const fd = new FormData();
      fd.append('action', 'woocommerce_add_to_cart');
      fd.append('product_id', id);
      fd.append('quantity', 1);
      fd.append('nonce', ldConfig.nonce);

      try {
        const res = await fetch(ldConfig.ajaxUrl, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.error) {
          // Producto variable u otro error — ir a la página del producto
          window.location.href = url;
          return;
        }
        this.textContent = '✓ Agregado';
        this.style.background = 'var(--green)';
        // Actualizar contador del carrito
        document.querySelectorAll('.ld-cart-count').forEach(el => {
          el.textContent = parseInt(el.textContent || '0') + 1;
          el.style.display = 'flex';
        });
        setTimeout(() => {
          this.textContent = 'Agregar al carrito';
          this.style.background = '';
          this.disabled = false;
        }, 2000);
      } catch {
        window.location.href = url;
      }
    });
  });

  // ── Helper ────────────────────────────────────────────────
  function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

})();
