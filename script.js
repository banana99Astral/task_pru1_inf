/* ============ BARRA, MENÚ FLOTANTE, PROGRESO Y SECCIÓN ACTUAL ============ */
(function () {
  const cabecera = document.getElementById('cabecera');
  const flot = document.getElementById('menuFlot');
  const btn = document.getElementById('menuBtn');
  const progreso = document.getElementById('progreso');
  const enlaces = [...document.querySelectorAll('nav a, .menu-panel a')];
  const secciones = [...document.querySelectorAll('main section[id]')];
  [...document.querySelectorAll('.menu-panel a, .panel-tema')].forEach((el, i) => el.style.setProperty('--i', i));

  function cerrar() { flot.classList.remove('abierto'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menú'); }
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const abierto = flot.classList.toggle('abierto');
    btn.setAttribute('aria-expanded', abierto); btn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('click', e => { if (!flot.contains(e.target)) cerrar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  document.querySelectorAll('.menu-panel a').forEach(a => a.addEventListener('click', cerrar));

  function actualizar() {
    const y = window.scrollY;
    const abajo = y > 120;
    // arriba: barra normal. Al bajar: la barra se va y aparece el botón de menú en la esquina
    cabecera.classList.toggle('oculta', abajo);
    cabecera.classList.toggle('scroll', y > 10);
    flot.classList.toggle('visible', abajo);
    if (!abajo) cerrar();
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progreso.style.transform = 'scaleX(' + (total > 0 ? Math.min(y / total, 1) : 0) + ')';
    let actual = secciones[0].id;
    secciones.forEach(sec => { if (sec.getBoundingClientRect().top <= 140) actual = sec.id; });
    enlaces.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + actual));
  }
  window.addEventListener('scroll', actualizar, { passive: true });
  window.addEventListener('resize', actualizar);
  actualizar();
})();

/* ============ MODO CLARO / OSCURO (botón de la barra y del menú) ============ */
(function () {
  const raiz = document.documentElement;
  const botones = [document.getElementById('tema'), document.getElementById('tema2')];
  function pintar() {
    const oscuro = raiz.dataset.tema === 'oscuro';
    botones[0].textContent = oscuro ? '☀️' : '🌙';
    botones[0].setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    botones[1].textContent = oscuro ? '☀️ Modo claro' : '🌙 Modo oscuro';
  }
  botones.forEach(b => b.addEventListener('click', () => {
    raiz.dataset.tema = raiz.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
    try { localStorage.setItem('tema', raiz.dataset.tema); } catch (e) {}
    pintar();
  }));
  pintar();
})();

/* ============ ANIMACIONES AL BAJAR: aparecer, contador ============ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const objetivos = document.querySelectorAll('.tarjeta, .grid>.mini, .versus>.mini, section>.etiqueta, section>h2, section>.intro, section>h3, section>.foto, .carrusel, .conclusion, .destacado, .cinta');
  objetivos.forEach(el => {
    el.classList.add('rv');
    const pos = [...el.parentNode.children].indexOf(el);
    el.style.setProperty('--d', Math.min(pos, 4) * 90 + 'ms');
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in'); io.unobserve(el);
    // al terminar, se quitan las clases para que el efecto hover vuelva a ser rápido
    setTimeout(() => { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 1500);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  objetivos.forEach(el => io.observe(el));

  // contador animado (+70%)
  document.querySelectorAll('.dato').forEach(el => {
    const m = el.textContent.match(/^(\D*)(\d+)(\D*)$/); if (!m) return;
    const fin = +m[2]; el.textContent = m[1] + '0' + m[3];
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting) return; ob.disconnect();
      const t0 = performance.now();
      (function paso(t) {
        const k = Math.min((t - t0) / 1400, 1);
        el.textContent = m[1] + Math.round(fin * (1 - Math.pow(1 - k, 3))) + m[3];
        if (k < 1) requestAnimationFrame(paso);
      })(t0);
    }), { threshold: .6 }).observe(el);
  });
})();

/* ============ CARRUSEL DE HERRAMIENTAS (JavaScript vanilla) ============ */
(function () {
  const pista   = document.getElementById('pista');
  const slides  = pista.children;
  const puntos  = document.getElementById('puntos');
  const carrusel = document.getElementById('carrusel');
  let actual = 0, temporizador;

  // Crea un punto de navegación por cada slide
  for (let i = 0; i < slides.length; i++) {
    const p = document.createElement('button');
    p.className = 'punto';
    p.setAttribute('aria-label', 'Ir a la herramienta ' + (i + 1));
    p.addEventListener('click', () => { ir(i); reiniciar(); });
    puntos.appendChild(p);
  }

  // Muestra el slide indicado (con vuelta al inicio / final)
  function ir(n) {
    actual = (n + slides.length) % slides.length;
    pista.style.transform = 'translateX(' + (-100 * actual) + '%)';
    [...slides].forEach((sl, i) => sl.classList.toggle('activa', i === actual));
    [...puntos.children].forEach((p, i) => p.classList.toggle('activo', i === actual));
  }

  // Avance automático cada 6 s (se pausa al pasar el cursor)
  function iniciar() { temporizador = setInterval(() => ir(actual + 1), 6000); }
  function reiniciar() { clearInterval(temporizador); iniciar(); }

  document.getElementById('next').addEventListener('click', () => { ir(actual + 1); reiniciar(); });
  document.getElementById('prev').addEventListener('click', () => { ir(actual - 1); reiniciar(); });
  carrusel.addEventListener('mouseenter', () => clearInterval(temporizador));
  carrusel.addEventListener('mouseleave', reiniciar);

  // Flechas del teclado cuando el carrusel tiene el foco
  carrusel.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { ir(actual + 1); reiniciar(); }
    if (e.key === 'ArrowLeft')  { ir(actual - 1); reiniciar(); }
  });

  // Deslizar con el dedo en celulares
  let inicioX = null;
  carrusel.addEventListener('touchstart', e => { inicioX = e.touches[0].clientX; }, { passive: true });
  carrusel.addEventListener('touchend', e => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 40) { ir(actual + (dx < 0 ? 1 : -1)); reiniciar(); }
    inicioX = null;
  });

  ir(0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) iniciar();
})();
