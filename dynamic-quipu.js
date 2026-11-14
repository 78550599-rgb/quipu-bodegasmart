(() => {
  'use strict';

  let audioCtx = null;
  function playBeep(type = 'add') {
    try {
      if (localStorage.getItem('quipu-sound-muted') === '1') return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      if (type === 'sale') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch {}
  }

  function launchConfetti() {
    const colors = ['#008979', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];
    for (let i = 0; i < 34; i++) {
      const el = document.createElement('div');
      el.className = 'qp-confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[i % colors.length];
      el.style.animationDelay = (Math.random() * 0.45) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  }

  function formatLimaTime() {
    return new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function getLimaGreeting() {
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Lima',
        hour: 'numeric',
        hour12: false
      }).format(new Date())
    );
    if (hour >= 5 && hour < 12) return '☀️ ¡Buenos días!';
    if (hour >= 12 && hour < 19) return '🌤️ ¡Buenas tardes!';
    return '🌙 ¡Buenas noches!';
  }

  function enhanceTopBar() {
    const barActions = document.querySelector('.qp-top-actions');
    if (barActions && !barActions.querySelector('[data-qp-live-pill]')) {
      const pill = document.createElement('span');
      pill.className = 'qp-live-pill';
      pill.setAttribute('data-qp-live-pill', '');
      pill.innerHTML = `<i class="qp-live-dot"></i><span>Supabase en vivo · <b data-qp-clock>${formatLimaTime()}</b></span>`;
      barActions.prepend(pill);
    }

    const adminHeader = document.querySelector('.qa-header');
    if (adminHeader && !adminHeader.querySelector('[data-qp-live-pill]')) {
      const pill = document.createElement('span');
      pill.className = 'qp-live-pill';
      pill.setAttribute('data-qp-live-pill', '');
      pill.innerHTML = `<i class="qp-live-dot"></i><span>Base de datos en tiempo real · <b data-qp-clock>${formatLimaTime()}</b></span>`;
      adminHeader.insertBefore(pill, adminHeader.lastElementChild);
    }
  }

  // Mejorar el Hero Banner de Mi Negocio (#gestion) con Wallpapers Reales seleccionables
  function enhanceWelcomeBanner() {
    const welcome = document.querySelector('.qp-crm-welcome');
    if (!welcome) return;
    const savedWp = localStorage.getItem('quipu-crm-wallpaper') || 'wallpapers/bodega-market.jpg';
    welcome.style.setProperty('--crm-wp', `url('${savedWp}')`);

    if (welcome.querySelector('[data-qp-hero-badges]')) return;
    const textCol = welcome.querySelector('div');
    if (!textCol) return;

    const eyebrow = textCol.querySelector('.bs-eyebrow');
    if (eyebrow && !eyebrow.dataset.greeted) {
      eyebrow.dataset.greeted = '1';
      eyebrow.textContent = `${getLimaGreeting()} · ${eyebrow.textContent}`;
    }

    const badges = document.createElement('div');
    badges.className = 'qp-hero-badges';
    badges.setAttribute('data-qp-hero-badges', '');
    badges.innerHTML = `
      <button type="button" class="qp-hero-badge" data-qp-view="ventas">⚡ Venta rápida</button>
      <button type="button" class="qp-hero-badge" data-qp-view="escanear">📷 Escanear código</button>
      <button type="button" class="qp-hero-badge" data-qp-view="inventario">📦 Inventario</button>
      <button type="button" class="qp-hero-badge" data-qp-view="reportes">📊 Reportes PDF</button>
      <button type="button" class="qp-hero-badge" data-qp-cycle-wp title="Cambiar imagen de fondo">🖼️ Cambiar Wallpaper</button>
    `;
    textCol.appendChild(badges);
  }

  const CRM_WALLPAPERS = [
    'wallpapers/bodega-market.jpg',
    'wallpapers/andes-peru.jpg',
    'wallpapers/inventario-fresco.jpg',
    'wallpapers/emprendedor-metas.jpg',
    'wallpapers/comunidad-crece.jpg',
    'wallpapers/cuentas-claras.jpg'
  ];

  setInterval(() => {
    const time = formatLimaTime();
    document.querySelectorAll('[data-qp-clock]').forEach(el => {
      el.textContent = time;
    });
  }, 1000);

  // Rotación automática suave de Wallpapers en la Portada (#inicio)
  let heroWpIdx = 0;
  setInterval(() => {
    const heroBg = document.querySelector('[data-qp-hero-bg]');
    if (!heroBg) return;
    heroWpIdx = (heroWpIdx + 1) % CRM_WALLPAPERS.length;
    const nextWp = CRM_WALLPAPERS[heroWpIdx];
    heroBg.style.backgroundImage = `url('${nextWp}')`;
    document.querySelectorAll('[data-qp-set-wp]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.qpSetWp === nextWp);
    });
  }, 6500);

  // Meta diaria interactiva + Khipu Digital en Vivo en la vista Resumen
  function enhanceSummaryView() {
    const viewRoot = document.getElementById('qp-view');
    if (!viewRoot) return;
    const statGrid = viewRoot.querySelector('.qp-stat-grid');
    if (!statGrid) return;

    const emojis = ['💰', '📦', '🧾', '✨'];
    statGrid.querySelectorAll('article').forEach((art, idx) => {
      if (!art.hasAttribute('data-stat-emoji')) {
        art.setAttribute('data-stat-emoji', emojis[idx % emojis.length]);
      }
    });

    if (viewRoot.querySelector('[data-qp-goal-banner]')) return;
    const firstCardTitle = statGrid.querySelector('article small')?.textContent || '';
    if (!firstCardTitle.includes('Ventas de hoy')) return;

    const cards = Array.from(statGrid.querySelectorAll('article strong')).map(el => el.textContent || 'S/ 0.00');
    const parseAmount = txt => Number(String(txt).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    const currentSales = parseAmount(cards[0]);
    const savedGoal = Number(localStorage.getItem('quipu-daily-goal') || 150);
    const pct = Math.min(100, Math.round((currentSales / Math.max(1, savedGoal)) * 100));

    const banner = document.createElement('section');
    banner.className = 'qp-goal-banner';
    banner.setAttribute('data-qp-goal-banner', '');
    banner.innerHTML = `
      <div class="qp-goal-top">
        <h3>🎯 Meta de ventas de hoy: <span data-qp-goal-pct>${pct}%</span> completada</h3>
        <div class="qp-goal-controls">
          <label for="qp-daily-goal-input">Mi meta hoy (S/)</label>
          <input id="qp-daily-goal-input" type="number" min="10" step="10" value="${savedGoal}" data-qp-goal-input>
        </div>
      </div>
      <div class="qp-goal-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="qp-goal-fill" data-qp-goal-fill style="width:${pct}%"></div>
      </div>
      <div class="qp-goal-foot">
        <span>Vendido hoy: <b>S/ ${currentSales.toFixed(2)}</b></span>
        <span data-qp-goal-msg>${
          pct >= 100
            ? '🎉 ¡Felicidades! Superaste tu meta del día.'
            : `Te faltan S/ ${Math.max(0, savedGoal - currentSales).toFixed(2)} para llegar a tu meta.`
        }</span>
      </div>
    `;
    viewRoot.prepend(banner);

    const input = banner.querySelector('[data-qp-goal-input]');
    input?.addEventListener('input', () => {
      const goalVal = Math.max(1, Number(input.value) || 100);
      localStorage.setItem('quipu-daily-goal', String(goalVal));
      const newPct = Math.min(100, Math.round((currentSales / goalVal) * 100));
      banner.querySelector('[data-qp-goal-pct]').textContent = `${newPct}%`;
      banner.querySelector('[data-qp-goal-fill]').style.width = `${newPct}%`;
      banner.querySelector('[data-qp-goal-msg]').textContent =
        newPct >= 100
          ? '🎉 ¡Felicidades! Superaste tu meta del día.'
          : `Te faltan S/ ${Math.max(0, goalVal - currentSales).toFixed(2)} para llegar a tu meta.`;
      if (newPct >= 100) launchConfetti();
    });

    if (!viewRoot.querySelector('[data-qp-live-khipu]')) {
      const cords = [
        {
          id: 'ventas',
          label: 'Ventas hoy',
          value: cards[0] || 'S/ 0.00',
          color: '#008979',
          length: '155px',
          desc: 'Todo lo vendido hoy en efectivo, Yape, Plin, tarjeta o fiado.',
          cta: 'Ir a Punto de Venta →',
          view: 'ventas'
        },
        {
          id: 'costo',
          label: 'Costo vendido',
          value: cards[1] || 'S/ 0.00',
          color: '#008ba5',
          length: '132px',
          desc: 'Lo que te costaron los productos que entregaste hoy a tus clientes.',
          cta: 'Revisar Inventario →',
          view: 'inventario'
        },
        {
          id: 'gastos',
          label: 'Gastos hoy',
          value: cards[2] || 'S/ 0.00',
          color: '#df512e',
          length: '115px',
          desc: 'Pagos operativos del día (bolsas, luz, transporte o limpieza).',
          cta: 'Anotar un Gasto →',
          view: 'gastos'
        },
        {
          id: 'ganancia',
          label: 'Ganancia neta',
          value: cards[3] || 'S/ 0.00',
          color: '#d99b00',
          length: '165px',
          desc: 'Lo que realmente queda para ti hoy después de costos y gastos.',
          cta: 'Ver Reportes detallados →',
          view: 'reportes'
        },
        {
          id: 'proveedores',
          label: 'Proveedores',
          value: 'Comparar precios',
          color: '#7043b6',
          length: '125px',
          desc: 'Compara ofertas de tus distribuidores y recibe pedidos fácilmente.',
          cta: 'Abrir Proveedores →',
          view: 'proveedores'
        },
        {
          id: 'fiados',
          label: 'Clientes y Fiados',
          value: 'Cuentas claras',
          color: '#c62c70',
          length: '140px',
          desc: 'Lleva el control de los saldos pendientes y abonos de tus vecinos.',
          cta: 'Ver Clientes y Fiados →',
          view: 'fiados'
        }
      ];

      const khipuSection = document.createElement('section');
      khipuSection.className = 'kh-board';
      khipuSection.setAttribute('data-qp-live-khipu', '');
      khipuSection.innerHTML = `
        <header>
          <p>✦ KHIPU DIGITAL INTERACTIVO EN VIVO</p>
          <h2>Toca cada cuerda para explorar los nudos de tu bodega</h2>
          <span>Cada cuerda de color resume un área viva de tu negocio conectada a Supabase.</span>
        </header>
        <div class="kh-layout">
          <div class="kh-cords" role="tablist" aria-label="Cuerdas del Khipu">
            ${cords
              .map(
                (c, i) => `
              <button type="button" role="tab" aria-pressed="${i === 0 ? 'true' : 'false'}" data-kh-idx="${i}" style="--cord:${c.color};--length:${c.length}">
                <span class="kh-label">${c.label}</span>
                <span class="kh-thread" aria-hidden="true"><i></i><i></i></span>
                <span class="kh-node">✦</span>
                <span class="kh-touch">Tocar</span>
              </button>
            `
              )
              .join('')}
          </div>
          <div class="kh-detail" data-kh-detail style="--cord:${cords[0].color}">
            <span data-kh-tag>${cords[0].label.toUpperCase()}</span>
            <strong data-kh-val>${cords[0].value}</strong>
            <p data-kh-desc>${cords[0].desc}</p>
            <a href="#gestion" data-qp-view="${cords[0].view}" data-kh-cta>${cords[0].cta}</a>
          </div>
        </div>
      `;
      statGrid.insertAdjacentElement('afterend', khipuSection);

      khipuSection.querySelectorAll('[data-kh-idx]').forEach(btn => {
        const selectCord = () => {
          const idx = Number(btn.dataset.khIdx);
          const c = cords[idx];
          if (!c) return;
          khipuSection.querySelectorAll('[data-kh-idx]').forEach(b => {
            b.setAttribute('aria-pressed', String(b === btn));
          });
          const detail = khipuSection.querySelector('[data-kh-detail]');
          detail.style.setProperty('--cord', c.color);
          detail.querySelector('[data-kh-tag]').textContent = c.label.toUpperCase();
          detail.querySelector('[data-kh-val]').textContent = c.value;
          detail.querySelector('[data-kh-desc]').textContent = c.desc;
          const cta = detail.querySelector('[data-kh-cta]');
          cta.textContent = c.cta;
          cta.setAttribute('data-qp-view', c.view);
        };
        btn.addEventListener('click', () => {
          playBeep('add');
          selectCord();
        });
        btn.addEventListener('mouseenter', selectCord);
      });
    }
  }

  function enhanceHomeSimulator() {
    const slider = document.querySelector('.viva-hero #viva-sales');
    if (!slider || slider.dataset.bound) return;
    slider.dataset.bound = '1';
    const updateSim = () => {
      const sales = Number(slider.value) || 0;
      const cost = sales * 0.6;
      const expense = sales * 0.15;
      const profit = sales - cost - expense;
      const fmt = n => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const outSales = document.getElementById('viva-sales-value');
      const outCost = document.getElementById('viva-cost');
      const outExp = document.getElementById('viva-expense');
      const outProf = document.getElementById('viva-profit');
      if (outSales) outSales.textContent = fmt(sales);
      if (outCost) outCost.textContent = fmt(cost);
      if (outExp) outExp.textContent = fmt(expense);
      if (outProf) outProf.textContent = fmt(profit);
    };
    slider.addEventListener('input', updateSim);
  }

  function enhanceTables() {
    const viewRoot = document.getElementById('qp-view');
    if (!viewRoot) return;

    const cards = viewRoot.querySelectorAll('.qp-card');
    cards.forEach(card => {
      const h2 = card.querySelector('h2');
      const table = card.querySelector('table');
      if (!h2 || !table || card.querySelector('[data-qp-table-filter]')) return;

      if (h2.textContent.includes('Mis productos') || h2.textContent.includes('Últimas ventas') || h2.textContent.includes('Deudas pendientes')) {
        const toolbar = document.createElement('div');
        toolbar.className = 'qp-inv-toolbar';
        toolbar.setAttribute('data-qp-table-filter', '');
        toolbar.innerHTML = `
          <input type="search" class="qp-inv-search" placeholder="🔎 Filtrar en tiempo real por nombre, código o estado…" aria-label="Filtrar tabla en tiempo real">
          <small data-qp-filter-count>${table.querySelectorAll('tbody tr').length} registros</small>
        `;
        h2.insertAdjacentElement('afterend', toolbar);

        const searchInput = toolbar.querySelector('input');
        const countEl = toolbar.querySelector('[data-qp-filter-count]');
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim().toLowerCase();
          let visible = 0;
          table.querySelectorAll('tbody tr').forEach(row => {
            const match = !q || row.textContent.toLowerCase().includes(q);
            row.hidden = !match;
            if (match) visible++;
          });
          countEl.textContent = `${visible} registros`;
        });
      }
    });
  }

  const observer = new MutationObserver(() => {
    enhanceTopBar();
    enhanceWelcomeBanner();
    enhanceSummaryView();
    enhanceHomeSimulator();
    enhanceTables();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  enhanceTopBar();
  enhanceWelcomeBanner();
  enhanceSummaryView();
  enhanceHomeSimulator();
  enhanceTables();

  document.addEventListener('click', e => {
    // Cambiar Wallpaper en #inicio
    const wpBtn = e.target.closest('[data-qp-set-wp]');
    if (wpBtn) {
      const wp = wpBtn.dataset.qpSetWp;
      const heroBg = document.querySelector('[data-qp-hero-bg]');
      if (heroBg) heroBg.style.backgroundImage = `url('${wp}')`;
      document.querySelectorAll('[data-qp-set-wp]').forEach(b => b.classList.toggle('active', b === wpBtn));
      playBeep('add');
      return;
    }

    // Cambiar Wallpaper en #gestion
    const cycleBtn = e.target.closest('[data-qp-cycle-wp]');
    if (cycleBtn) {
      const current = localStorage.getItem('quipu-crm-wallpaper') || CRM_WALLPAPERS[0];
      const next = CRM_WALLPAPERS[(CRM_WALLPAPERS.indexOf(current) + 1) % CRM_WALLPAPERS.length];
      localStorage.setItem('quipu-crm-wallpaper', next);
      const welcome = document.querySelector('.qp-crm-welcome');
      if (welcome) welcome.style.setProperty('--crm-wp', `url('${next}')`);
      playBeep('add');
      return;
    }

    const posBtn = e.target.closest('[data-qp-quick-add]');
    if (posBtn) {
      playBeep('add');
    }
    const checkoutBtn = e.target.closest('.qp-checkout-sale');
    if (checkoutBtn && !checkoutBtn.disabled) {
      setTimeout(() => {
        playBeep('sale');
        launchConfetti();
      }, 250);
    }
  });

  window.QuipuDynamic = { playBeep, launchConfetti };
})();
