/* Landing de Restaurante Acajutla: sucursales, reservas y navegación. Usa los datos de data.js */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => '$' + n.toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waOf = b => b.wa || CENTRAL_WA;
  const byId = id => BRANCHES.find(b => b.id === id) || BRANCHES[0];
  const mapsUrl = b => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(b.q);
  const wazeUrl = b => 'https://waze.com/ul?q=' + encodeURIComponent(b.q) + '&navigate=yes';

  function toast(msg, tone = 'sol') {
    const bar = { sol: '#ffb349', mar: '#209bdf', rose: '#e11d48', wa: '#25d366' }[tone];
    const el = document.createElement('div');
    el.className = 'toast pointer-events-auto bg-white text-tinta rounded-2xl pl-4 pr-5 py-3 text-sm shadow-2xl ring-1 ring-black/5 sm:max-w-sm';
    el.style.borderLeft = `5px solid ${bar}`;
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, 2800);
  }

  /* ---------- Recomendación del chef (enlaza al menú) ---------- */
  const chef = MENU.filter(d => d.chef || ['plato-bocas', 'trio-camarones', 'lomito-camaron', 'pollo-gratinado'].includes(d.id));
  $('#chefRow').innerHTML = chef.map((d, i) => {
    const from = Math.min(...d.opts.map(o => o[1]));
    return `<a href="menu.html#dish-${d.id}" data-reveal="up" style="--d:${Math.min(i, 4) * 110}ms" class="lift shrink-0 w-[78%] sm:w-[19rem] flex flex-col bg-white rounded-3xl overflow-hidden shadow-md shadow-navy/10 ring-1 ring-black/5 group">
      <div class="relative overflow-hidden"><img src="img/${d.img}.webp" alt="${esc(d.name)}" class="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500" loading="lazy">
        ${d.chef ? '<span class="absolute top-3 left-3 rounded-full bg-white/95 text-naranja text-[10px] font-semibold uppercase tracking-widest px-3 py-1">Recomendación del chef</span>' : ''}</div>
      <div class="p-5 flex flex-col flex-1">
        <h3 class="font-serif text-2xl text-navy leading-tight">${esc(d.name)}</h3>
        <p class="mt-1 text-sm text-slate-500 line-clamp-2">${esc(d.desc)}</p>
        <p class="mt-auto pt-4 text-sm text-slate-500">${d.opts.length > 1 ? 'desde ' : ''}<span class="font-serif text-2xl text-navy">${money(from)}</span></p>
      </div></a>`;
  }).join('');
  $$('.chef-nav').forEach(b => b.addEventListener('click', () => $('#chefRow').scrollBy({ left: +b.dataset.scroll * 320, behavior: 'smooth' })));

  /* ---------- Selector inteligente de sucursales ---------- */
  const svHour = () => { const d = new Date(); return ((d.getUTCHours() - 6 + 24) % 24) + d.getUTCMinutes() / 60; }; // El Salvador = UTC-6
  const isOpen = b => { const h = svHour(); return h >= b.open && h < b.close; };
  const fmtH = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? 'PM' : 'AM'; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`; };
  const km = (a, b) => { const R = 6371, t = x => x * Math.PI / 180, dLa = t(b[0] - a[0]), dLo = t(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const ZONES = [
    { id: 'all', label: 'Todas', f: () => true },
    { id: 'ciudad', label: 'San Salvador & Santa Elena', f: b => b.zone === 'ciudad' },
    { id: 'playa', label: 'Playas & Oriente', f: b => b.zone === 'playa' }
  ];
  const st = { zone: 'all', user: null };
  function renderZoneTabs() {
    $('#zoneTabs').innerHTML = ZONES.map(z => `<button type="button" role="tab" data-zone="${z.id}" aria-selected="${st.zone === z.id}" class="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:border-navy hover:text-navy transition ${st.zone === z.id ? 'tab-active' : ''}">${z.label} (${BRANCHES.filter(z.f).length})</button>`).join('');
  }
  $('#zoneTabs').addEventListener('click', e => {
    const t = e.target.closest('[data-zone]'); if (!t) return;
    st.zone = t.dataset.zone; renderZoneTabs(); renderBranches();
  });
  function renderBranches() {
    const z = ZONES.find(x => x.id === st.zone);
    let list = BRANCHES.filter(z.f).map(b => ({ b, d: st.user ? km(st.user, b.geo) : null }));
    if (st.user) list.sort((x, y) => x.d - y.d);
    $('#branchGrid').innerHTML = list.map(({ b, d }, i) => {
      const open = isOpen(b);
      return `<article data-reveal="up" style="--d:${Math.min(i, 5) * 90}ms" class="lift bg-papel rounded-3xl p-6 flex flex-col ring-1 ${st.user && i === 0 ? 'ring-2 ring-sol' : 'ring-black/5'} hover:shadow-xl hover:shadow-navy/10 transition border-t-4 ${b.ceviche ? 'border-sol' : 'border-mar'}">
        ${st.user && i === 0 ? '<span class="self-start -mt-1 mb-3 rounded-full bg-sol text-navy-dark text-[11px] font-semibold uppercase tracking-wider px-3 py-1">La más cercana a ti</span>' : ''}
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-10 h-10 rounded-full bg-mar-light text-navy font-serif text-xl">${b.n}</span>
            <div><h3 class="font-serif text-2xl text-navy leading-tight">${esc(b.name)}</h3>${b.tag ? `<p class="text-xs text-mar font-semibold">${esc(b.tag)}</p>` : ''}</div>
          </div>
          ${b.ceviche ? '<span class="shrink-0 rounded-full bg-sol-light ring-1 ring-sol text-navy-dark text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">Bar de Ceviches</span>' : ''}
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          <span class="rounded-full px-2.5 py-1 font-semibold ${open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">${open ? '● Abierto ahora' : '● Cerrado'} · ${fmtH(b.open)} – ${fmtH(b.close)}</span>
          ${d != null ? `<span class="rounded-full bg-mar-light text-navy px-2.5 py-1">≈ ${d < 10 ? d.toFixed(1) : Math.round(d)} km</span>` : ''}
        </div>
        <p class="mt-4 text-sm text-slate-700 leading-relaxed">${esc(b.addr)}</p>
        <ul class="mt-3 space-y-1.5 text-sm text-slate-500 flex-1">
          <li>📞 ${b.phones.map(p => `<a class="text-tinta hover:text-navy" href="tel:+503${p.replace(/-/g, '')}">${p}</a>`).join(' / ')}</li>
          ${b.wa ? `<li>💬 WhatsApp: <span class="text-[#128c4a] font-semibold">${b.waLabel}</span></li>` : ''}
          ${b.email ? `<li class="break-all">✉️ <a class="hover:text-navy" href="mailto:${b.email}">${b.email}</a></li>` : ''}
        </ul>
        <div class="mt-5 grid grid-cols-2 gap-2">
          <a href="${wazeUrl(b)}" target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#33ccff] hover:brightness-95 text-[#05324a] text-sm font-semibold py-2.5 transition">Waze</a>
          <a href="${mapsUrl(b)}" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-full bg-white ring-1 ring-mar text-navy hover:bg-mar-light text-sm font-semibold py-2.5 transition">Google Maps</a>
          <a href="tel:+503${b.phones[0].replace(/-/g, '')}" class="inline-flex items-center justify-center rounded-full bg-navy hover:bg-navy-dark text-white text-sm py-2.5 transition">Llamar</a>
          <a href="https://wa.me/${waOf(b)}?text=${encodeURIComponent('Hola Restaurante Acajutla ' + b.name + ', quisiera información.')}" target="_blank" rel="noopener" class="btn-wa inline-flex items-center justify-center rounded-full text-sm font-semibold py-2.5 transition">WhatsApp</a>
        </div>
        <a href="menu.html?s=${b.id}" class="mt-3 text-center text-sm text-navy hover:text-mar font-semibold py-1">Ver el menú de esta sucursal →</a>
      </article>`;
    }).join('');
  }
  $('#nearBtn').addEventListener('click', () => {
    if (!('geolocation' in navigator)) { $('#nearNote').textContent = 'Tu navegador no permite usar la ubicación. Elige una zona arriba.'; return; }
    $('#nearNote').textContent = 'Buscando tu ubicación…';
    navigator.geolocation.getCurrentPosition(pos => {
      st.user = [pos.coords.latitude, pos.coords.longitude]; st.zone = 'all'; renderZoneTabs(); renderBranches();
      const best = BRANCHES.slice().sort((a, b) => km(st.user, a.geo) - km(st.user, b.geo))[0];
      $('#nearNote').innerHTML = `La más cercana es <strong class="text-navy">${esc(best.name)}</strong>. Distancias en línea recta, aproximadas.`;
      toast('Sucursal más cercana: <strong class="text-navy">' + esc(best.name) + '</strong>', 'mar');
    }, () => { $('#nearNote').textContent = 'No pudimos obtener tu ubicación. Revisa el permiso del navegador o elige una zona arriba.'; }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  /* ---------- Reservas ---------- */
  $('#resBranch').innerHTML = '<option value="">Selecciona una sucursal…</option>' + BRANCHES.map(b => `<option value="${b.id}">${b.n}. ${esc(b.name)}${b.tag ? ' — ' + esc(b.tag) : ''}</option>`).join('');
  const today = new Date(), pad = n => String(n).padStart(2, '0');
  $('#resDate').min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  $('#resForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = { branch: $('#resBranch').value, type: $('#resType').value, name: $('#resName').value.trim(), people: $('#resPeople').value, date: $('#resDate').value, time: $('#resTime').value, details: $('#resDetails').value.trim() };
    const errEl = $('#resError'), missing = [];
    if (!f.branch) missing.push('sucursal'); if (!f.type) missing.push('tipo de reserva');
    if (!f.name) missing.push('nombre'); if (!f.people || +f.people < 1) missing.push('número de personas');
    if (!f.date) missing.push('fecha'); if (!f.time) missing.push('hora');
    $$('#resForm .field').forEach(el => el.style.borderColor = '');
    if (missing.length) {
      errEl.textContent = 'Por favor completa: ' + missing.join(', ') + '.'; errEl.classList.remove('hidden');
      ['resBranch', 'resType', 'resName', 'resPeople', 'resDate', 'resTime'].forEach(id => { const el = $('#' + id); if (!el.value || (id === 'resPeople' && +el.value < 1)) el.style.borderColor = '#e11d48'; });
      toast('Faltan datos en tu reserva', 'rose'); return;
    }
    errEl.classList.add('hidden');
    const b = byId(f.branch), [y, m, d] = f.date.split('-');
    const msg = ['*SOLICITUD DE RESERVA / EVENTO — RESTAURANTE ACAJUTLA*', `Sucursal: ${b.name}`, `Tipo: ${f.type}`, `Nombre: ${f.name}`, `Personas: ${f.people}`, `Fecha: ${d}/${m}/${y}`, `Hora: ${f.time}`,
      f.details ? `Detalles: ${f.details}` : null, b.wa ? null : `(Solicitud para sucursal ${b.name}, enviada vía WhatsApp central)`].filter(Boolean).join('\n');
    window.open(`https://wa.me/${waOf(b)}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    toast('Abriendo WhatsApp de <strong>' + esc(b.name) + '</strong>…', 'wa');
  });

  /* ---------- Header, menú móvil y animaciones ---------- */
  const mnav = $('#mobileNav'), mt = $('#menuToggle');
  function closeMobile() { mnav.classList.add('hidden'); mt.setAttribute('aria-expanded', 'false'); $('#icoBurger').classList.remove('hidden'); $('#icoClose').classList.add('hidden'); }
  mt.addEventListener('click', () => {
    const open = mnav.classList.toggle('hidden') === false;
    mt.setAttribute('aria-expanded', String(open));
    $('#icoBurger').classList.toggle('hidden', open); $('#icoClose').classList.toggle('hidden', !open);
  });
  $$('.m-link').forEach(a => a.addEventListener('click', closeMobile));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobile(); });
  const header = $('#top');
  const onScroll = () => {
    const s = window.scrollY > 20;
    header.classList.toggle('bg-white', s); header.classList.toggle('shadow-lg', s);
    $('#logoBlanco').classList.toggle('hidden', s); $('#logoColor').classList.toggle('hidden', !s);
    $('#deskNav').classList.toggle('text-navy', s); $('#deskNav').classList.toggle('text-white', !s);
    mt.classList.toggle('text-navy', s); mt.classList.toggle('text-white', !s);
    mt.classList.toggle('bg-mar-light', s); mt.classList.toggle('bg-white/15', !s);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) $$('.nav-link').forEach(a => {
      const on = a.getAttribute('href') === '#' + en.target.id;
      ['font-semibold', 'underline', 'decoration-sol', 'decoration-2', 'underline-offset-8'].forEach(c => a.classList.toggle(c, on));
    });
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'menu', 'ceviches', 'historia', 'sucursales', 'reservas', 'hotel'].forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
  const rev = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); } }), { threshold: 0.08 });
  $$('.fade-up').forEach(el => rev.observe(el));

  $('#year').textContent = new Date().getFullYear();
  renderZoneTabs(); renderBranches();
})();
