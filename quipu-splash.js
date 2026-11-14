(() => {
  'use strict';

  const SESSION_KEY = 'quipu-splash-shown-v3';

  function buildSplashSvg() {
    return `<svg class="qp-splash-svg" viewBox="22 22 116 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="qpShimmerGrad" x1="28" y1="28" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fff8d6" stop-opacity="0"/>
          <stop offset="50%" stop-color="#fffdf2" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffd84d" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Sombra tenue inferior (Etapa 5: 1.6s a 2.0s) -->
      <ellipse class="qp-floor-shadow" cx="80" cy="144" rx="42" ry="6" fill="#083b35"/>

      <!-- Halo suave expansivo (Etapa 5: 1.6s a 2.0s) -->
      <rect class="qp-soft-halo" x="28" y="28" width="104" height="104" rx="28" stroke="#008978" stroke-width="2.5" fill="none"/>

      <!-- Etapa 1 (0 a 0.5s): Trazos curvos convergentes turquesa y dorado + destellos discretos -->
      <g class="qp-orbit-group">
        <path class="qp-arc-teal" d="M 30 92 A 52 52 0 0 1 114 36" stroke="#008978" stroke-width="4.2" stroke-linecap="round"/>
        <path class="qp-arc-gold" d="M 130 68 A 52 52 0 0 1 46 124" stroke="#f5c230" stroke-width="4.2" stroke-linecap="round"/>
        <circle class="qp-spark s1" cx="44" cy="44" r="2.6" fill="#008978"/>
        <circle class="qp-spark s2" cx="120" cy="48" r="2.3" fill="#f5c230"/>
        <circle class="qp-spark s3" cx="116" cy="118" r="2.5" fill="#f5c230"/>
      </g>

      <!-- Etapa 2 (0.4 a 0.9s): Base amarilla desplazada hacia abajo y a la derecha -->
      <rect class="qp-gold-offset" x="35" y="35" width="98" height="98" rx="26" fill="#f5c230"/>

      <!-- Etapa 5 (1.6 a 2.0s): Destello dorado que recorre el borde amarillo -->
      <rect class="qp-gold-shimmer" x="35" y="35" width="98" height="98" rx="26" stroke="url(#qpShimmerGrad)" stroke-width="3.2" fill="none"/>

      <!-- Etapa 2 (0.4 a 0.9s): Cuadrado principal verde turquesa con esquinas redondeadas -->
      <rect class="qp-teal-box" x="27" y="27" width="98" height="98" rx="26" fill="#008978"/>

      <!-- Etapa 3 (0.8 a 1.4s): Barra blanca superior y 3 cuerdas verticales (central más larga) -->
      <line class="qp-bar-top" x1="46" y1="52" x2="106" y2="52" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round"/>
      <line class="qp-cord-left" x1="57" y1="52" x2="57" y2="96" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round"/>
      <line class="qp-cord-center" x1="76" y1="52" x2="76" y2="105" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round"/>
      <line class="qp-cord-right" x1="95" y1="52" x2="95" y2="91" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round"/>

      <!-- Etapa 4 (1.2 a 1.7s): Nudos blancos con rebote sutil (centro turquesa y borde blanco fiel al símbolo) -->
      <circle class="qp-knot k1" cx="57" cy="76" r="7.8" fill="#008978" stroke="#ffffff" stroke-width="6.4"/>
      <circle class="qp-knot k2" cx="76" cy="84" r="7.8" fill="#008978" stroke="#ffffff" stroke-width="6.4"/>
      <circle class="qp-knot k3" cx="95" cy="73" r="7.8" fill="#008978" stroke="#ffffff" stroke-width="6.4"/>
    </svg>`;
  }

  function runSplash(force = false) {
    if (!force) {
      try {
        if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {}
    }

    const existing = document.getElementById('qp-splash-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'qp-splash-overlay';
    overlay.className = 'qp-splash-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="qp-splash-stage">${buildSplashSvg()}</div>`;

    document.body.appendChild(overlay);

    let cleaned = false;
    let safetyTimer;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(safetyTimer);
      overlay.style.pointerEvents = 'none';
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const totalMs = reducedMotion ? 300 : 2400;

    overlay.addEventListener('animationend', e => {
      if (e.target === overlay && e.animationName === 'qpSplashFadeOut') {
        cleanup();
      }
    });

    // Salida de seguridad para garantizar que nunca quede bloqueada la web
    safetyTimer = setTimeout(cleanup, totalMs + 350);
    window.addEventListener('pagehide', cleanup, { once: true });
  }

  // ?splash=1 en la URL fuerza la animación (útil para previsualizar); si no, una sola vez por pestaña
  const forced = /[?&]splash=1/.test(location.search);
  const start = () => runSplash(forced);

  // Ejecutar inmediatamente al iniciar la pestaña sin bloquear el renderizado de la página debajo
  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }

  window.QuipuSplash = { replay: () => runSplash(true) };
})();
