/* Efectos visuales de la landing: parallax, apariciones al hacer scroll, títulos animados,
   trazos de olas, contadores, burbujas y barra de progreso. Respeta "reducir movimiento". */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Trazo de ola bajo los subtítulos de cada sección ---------- */
  $$('main section h2 + .subtitulo, main section .subtitulo + h2').forEach(el => {
    const sub = el.classList.contains('subtitulo') ? el : el.previousElementSibling;
    if (!sub || sub.querySelector('.trazo') || sub.closest('#inicio')) return;
    const center = !!sub.closest('.text-center');
    const svg = `<svg class="trazo block mt-3 w-28 h-4 ${center ? 'mx-auto' : ''}" viewBox="0 0 120 16" aria-hidden="true"><path d="M2 9C20 1 40 1 60 9S100 17 118 7" fill="none" stroke="#fdc163" stroke-width="3" stroke-linecap="round"/></svg>`;
    const target = el.classList.contains('subtitulo') ? el : el; // el h2 o el subtítulo que va al final
    target.insertAdjacentHTML('afterend', svg);
  });

  /* ---------- Título del hero palabra por palabra ---------- */
  $$('[data-split]').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="palabra" aria-hidden="true"><span style="--d:${120 + i * 90}ms">${w}</span></span>`).join(' ');
    requestAnimationFrame(() => setTimeout(() => h.classList.add('titulo-listo'), 80));
  });

  /* ---------- Trazos: medir longitud ---------- */
  $$('.trazo path').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2); } catch {} });

  /* ---------- Contadores ---------- */
  function contar(el) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1600;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- Apariciones al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    if (el.matches('[data-reveal]')) el.classList.add('in');
    if (el._wipes) el._wipes.forEach(w => w.classList.add('in'));
    if (el.matches('.trazo')) el.classList.add('dibujado');
    if (el.matches('[data-count]') && !reduce) contar(el);
    io.unobserve(el);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  // un elemento recortado por completo (clip-path) no cuenta como visible: se observa a su contenedor
  const observar = root => $$('[data-reveal]:not(.in), .trazo:not(.dibujado), [data-count]', root).forEach(el => {
    if (el.dataset.reveal === 'wipe') { const p = el.parentElement; (p._wipes = p._wipes || []).push(el); io.observe(p); }
    else io.observe(el);
  });
  observar(document);
  // tarjetas que se dibujan después (recomendación del chef, sucursales)
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches('[data-reveal]')) io.observe(n); observar(n); } })))
    .observe(document.body, { childList: true, subtree: true });

  if (reduce) return; // sin parallax, burbujas ni barra animada

  /* ---------- Burbujas ---------- */
  $$('.burbujas').forEach(box => {
    const n = +(box.dataset.n || 12);
    let html = '';
    for (let i = 0; i < n; i++) {
      const size = 6 + Math.random() * 20, dur = 9 + Math.random() * 12;
      html += `<span class="burbuja" style="left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${-Math.random() * dur}s;--x:${(Math.random() * 60 - 30).toFixed(0)}px"></span>`;
    }
    box.innerHTML = html;
  });

  /* ---------- Parallax + barra de progreso ---------- */
  const items = $$('[data-parallax]').map(el => ({ el, k: parseFloat(el.dataset.parallax) || 0 }));
  const bar = document.getElementById('progreso');
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = window.innerHeight, mobile = window.innerWidth < 768;
    for (const { el, k } of items) {
      const ref = el.parentElement.getBoundingClientRect();
      if (ref.bottom < -200 || ref.top > vh + 200) continue;
      const y = ((ref.top + ref.height / 2) - vh / 2) * k * (mobile ? 0.5 : 1);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
    const max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
