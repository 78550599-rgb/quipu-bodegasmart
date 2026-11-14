(() => {
  'use strict';
  let index = 0,
    completed = false,
    replaying = false,
    lastDir = 'next';

  const storageKey = 'quipu-welcome-completed-v5';
  try {
    completed = window.localStorage.getItem(storageKey) === 'yes';
  } catch {}

  const needsIntro = () => !completed || replaying;

  const slides = [
    {
      title: 'Organiza tu bodega<br>o botica fácilmente.',
      text: 'Controla tus ventas, gastos e inventario de productos o medicamentos desde un solo lugar.',
      image: 'wallpapers/slide-1-organiza.jpg?v=8',
      alt: 'Bodega y negocio de barrio organizado con productos en orden',
      pill: 'Tu negocio, bajo control',
      icon: 'trend'
    },
    {
      title: 'Descubre cuánto<br>te queda cada día.',
      text: 'Calcula cuánto ganas realmente después de tus costos de compra y gastos del día.',
      image: 'wallpapers/slide-2-ganancias.jpg?v=8',
      alt: 'Emprendedor viendo sus ganancias netas en su celular junto a billetes y monedas de soles',
      pill: 'Cuentas más claras',
      icon: 'chart'
    },
    {
      title: 'Cuida tus productos.<br>Reduce pérdidas.',
      text: 'Revisa existencias, lotes, códigos de barras y fechas de vencimiento en abarrotes o medicamentos.',
      image: 'wallpapers/slide-3-inventario.jpg?v=8',
      alt: 'Escaneando el código de barras de un producto para revisar existencias y vencimientos',
      pill: 'Cada producto cuenta',
      icon: 'box'
    },
    {
      title: 'Aprende gratis,<br>a tu propio ritmo.',
      text: 'Lecciones cortas, videos y casos prácticos para entender las finanzas de tu negocio.',
      image: 'wallpapers/slide-4-aprende.jpg?v=8',
      alt: 'Emprendedora aprendiendo finanzas con videos y cuaderno en su mostrador',
      pill: 'Aprender es para todos',
      icon: 'book'
    },
    {
      title: 'Cada aprendizaje<br>te acerca a tu meta.',
      text: 'Completa retos interactivos, suma puntos y celebra los avances de tu bodega o botica.',
      image: 'wallpapers/slide-5-metas.jpg?v=8',
      alt: 'Emprendedor celebrando un reto cumplido y sumando puntos en su negocio',
      pill: 'Un paso más cada día',
      icon: 'sprout'
    },
    {
      title: 'Tu negocio<br>crece contigo.',
      text: 'Empieza hoy con educación, herramientas gratuitas y la gestión de tu bodega o botica en línea.',
      image: 'wallpapers/slide-6-crece.jpg?v=8',
      alt: 'Negocio de barrio próspero atendiendo a vecinos felices al atardecer',
      pill: 'Tu camino empieza aquí',
      icon: 'check'
    }
  ];

  // Precargar en segundo plano todas las diapositivas e iconos para cambio instantáneo
  const preloadDone = new Set();
  function preloadAllImages() {
    const urls = slides.map(s => s.image);
    for (let i = 1; i <= 6; i++) {
      urls.push(`wallpapers/bodega-icon-${i}.png`, `wallpapers/farmacia-icon-${i}.png`, `wallpapers/minimarket-icon-${i}.png`);
    }
    urls.push('wallpapers/hero-bodega-farmacia.png');
    urls.forEach(u => {
      if (preloadDone.has(u)) return;
      preloadDone.add(u);
      const img = new Image();
      img.decoding = 'async';
      img.src = u;
    });
  }
  if (typeof window !== 'undefined') {
    setTimeout(preloadAllImages, 150);
  }

  const ic = n => window.BS.icon(n);

  function khipuLogoSvg() {
    return `<svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M7 9h22M11 9v17M18 9v20M25 9v15" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="11" cy="18" r="3" fill="#008978" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="18" cy="21" r="3" fill="#008978" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="25" cy="17" r="3" fill="#008978" stroke="currentColor" stroke-width="2.4"/>
    </svg>`;
  }

  function sunRaysSvg() {
    return `<svg class="ref-sun-rays" viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path d="M38 8 L46 28 L33 31 Z" fill="#f5c230"/>
      <path d="M14 21 L34 34 L26 42 Z" fill="#f5c230"/>
      <path d="M8 42 L30 43 L28 52 Z" fill="#f5c230"/>
    </svg>`;
  }

  function render() {
    const s = slides[index];
    const numStr = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    const dirClass = lastDir === 'prev' ? 'slide-from-left' : 'slide-from-right';
    return `<section id="quipu-carousel" class="ref-onboarding-card" role="region" aria-roledescription="carrusel" aria-label="Presentación de Quipu (${slides.length} diapositivas)" style="--ref-wp:url('${s.image}')">
      <div class="ref-bg-wallpaper" style="background-image:url('${s.image}')" aria-hidden="true"></div>
      <div class="ref-corner-wave top-left" aria-hidden="true"></div>
      <div class="ref-corner-wave bottom-right" aria-hidden="true"></div>

      <div class="ref-slide-inner" role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${slides.length}">
        <header class="ref-brand-header">
          <div class="ref-brand-icon">${khipuLogoSvg()}</div>
          <span class="ref-brand-divider" aria-hidden="true"></span>
          <div class="ref-brand-text">
            <strong>Quipu</strong>
            <small>CRECE CON TU NEGOCIO</small>
          </div>
        </header>

        <div class="ref-swipe-stage ${dirClass}">
          <div class="ref-hero-visual">
            ${sunRaysSvg()}
            <div class="ref-arch-backdrop">
              <img class="ref-wallpaper-img" src="${s.image}" alt="${s.alt}" draggable="false">
            </div>
          </div>

          <div class="ref-pill-badge">
            ${ic(s.icon)}
            <span>${s.pill}</span>
          </div>

          <h1 id="quipu-slide-title" class="ref-title">${s.title}</h1>
          <p class="ref-subtitle">${s.text}</p>
        </div>

        <div class="ref-pagination">
          <button type="button" class="ref-prev-arrow" data-quipu-prev ${index === 0 ? 'disabled' : ''} aria-label="Diapositiva anterior">
            ${ic('arrow')}
          </button>
          <div class="ref-dots" role="group" aria-label="Elegir diapositiva">
            ${slides
              .map(
                (item, i) =>
                  `<button type="button" data-quipu-slide="${i}" aria-label="Diapositiva ${i + 1}: ${item.pill}" aria-current="${
                    index === i ? 'step' : 'false'
                  }"><span></span></button>`
              )
              .join('')}
          </div>
          <span class="ref-counter">${numStr}</span>
        </div>

        <button type="button" class="ref-continue-btn" ${
          index === slides.length - 1 ? 'data-quipu-enter' : 'data-quipu-next'
        }>
          <span>${index === slides.length - 1 ? 'Bienvenido a Quipu' : 'Continuar'}</span>
          ${ic('arrow')}
        </button>

        <button type="button" class="ref-skip-link" data-quipu-enter>
          Saltar introducción
        </button>
      </div>
    </section>`;
  }

  function move(n, focus) {
    const target = Math.max(0, Math.min(slides.length - 1, n));
    if (target === index) {
      const stage = document.querySelector('#quipu-carousel .ref-swipe-stage');
      if (stage) {
        stage.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease';
        stage.style.transform = 'translateX(0px)';
        stage.style.opacity = '1';
      }
      return;
    }
    lastDir = target > index ? 'next' : 'prev';
    index = target;
    const host = document.getElementById('quipu-carousel');
    if (!host) return;
    host.outerHTML = render();
    if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
  }

  function handleClick(e) {
    if (e.target.closest('[data-quipu-next]')) {
      move(index + 1, index + 1 === slides.length - 1 ? '[data-quipu-enter]' : '[data-quipu-next]');
      return true;
    }
    if (e.target.closest('[data-quipu-prev]')) {
      move(index - 1, '[data-quipu-prev]');
      return true;
    }
    const dot = e.target.closest('[data-quipu-slide]');
    if (dot) {
      const n = Number(dot.dataset.quipuSlide);
      if (Number.isInteger(n) && n >= 0 && n < slides.length) move(n, `[data-quipu-slide="${n}"]`);
      return true;
    }
    if (e.target.closest('[data-quipu-enter]')) {
      completed = true;
      replaying = false;
      try {
        window.localStorage.setItem(storageKey, 'yes');
      } catch {}
      window.BS.refresh();
      window.QuipuMotion?.celebrate?.();
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
      return true;
    }
    if (e.target.closest('[data-quipu-replay]')) {
      replaying = true;
      index = 0;
      lastDir = 'next';
      if (location.hash === '#inicio' || !location.hash) window.BS.refresh();
      else location.hash = 'inicio';
      window.scrollTo({ top: 0, behavior: 'instant' });
      return true;
    }
    return false;
  }

  document.addEventListener('keydown', e => {
    if (!e.target.closest('#quipu-carousel') || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    move(index + (e.key === 'ArrowRight' ? 1 : -1));
  });

  // Soporte táctil y arrastre interactivo con el dedo en celulares y mouse en PC
  let dragState = null;

  function onSwipeStart(clientX, clientY, target) {
    if (!target.closest('#quipu-carousel') || target.closest('button, a')) {
      dragState = null;
      return;
    }
    const stage = document.querySelector('#quipu-carousel .ref-swipe-stage');
    dragState = {
      startX: clientX,
      startY: clientY,
      dx: 0,
      dy: 0,
      locked: null, // 'x' | 'y'
      stage
    };
    if (stage) {
      stage.style.transition = 'none';
    }
  }

  function onSwipeMove(clientX, clientY, ev) {
    if (!dragState) return;
    dragState.dx = clientX - dragState.startX;
    dragState.dy = clientY - dragState.startY;

    if (!dragState.locked) {
      if (Math.abs(dragState.dx) > 8 || Math.abs(dragState.dy) > 8) {
        dragState.locked = Math.abs(dragState.dx) >= Math.abs(dragState.dy) ? 'x' : 'y';
      }
    }

    if (dragState.locked === 'x') {
      if (ev && ev.cancelable) ev.preventDefault();
      if (dragState.stage) {
        // Efecto elástico si está en la primera o última diapositiva
        const atEdge = (index === 0 && dragState.dx > 0) || (index === slides.length - 1 && dragState.dx < 0);
        const offset = atEdge ? dragState.dx * 0.28 : dragState.dx * 0.85;
        const fade = Math.max(0.55, 1 - Math.abs(offset) / 340);
        dragState.stage.style.transform = `translateX(${offset.toFixed(1)}px)`;
        dragState.stage.style.opacity = String(fade.toFixed(2));
      }
    }
  }

  function onSwipeEnd() {
    if (!dragState) return;
    const { dx, locked, stage } = dragState;
    dragState = null;

    if (locked === 'x' && Math.abs(dx) > 42) {
      if (dx < 0 && index < slides.length - 1) {
        move(index + 1);
        return;
      }
      if (dx > 0 && index > 0) {
        move(index - 1);
        return;
      }
    }

    if (stage) {
      stage.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease';
      stage.style.transform = 'translateX(0px)';
      stage.style.opacity = '1';
    }
  }

  // Eventos Touch nativos para Android / iOS
  document.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length !== 1) return;
      onSwipeStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    e => {
      if (!dragState || e.touches.length !== 1) return;
      onSwipeMove(e.touches[0].clientX, e.touches[0].clientY, e);
    },
    { passive: false }
  );

  document.addEventListener('touchend', onSwipeEnd, { passive: true });
  document.addEventListener('touchcancel', onSwipeEnd, { passive: true });

  // Eventos Mouse para arrastrar en PC
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    onSwipeStart(e.clientX, e.clientY, e.target);
  });

  document.addEventListener('mousemove', e => {
    if (!dragState) return;
    onSwipeMove(e.clientX, e.clientY, e);
  });

  document.addEventListener('mouseup', onSwipeEnd);

  window.QuipuCarousel = { render, handleClick, needsIntro };
})();
