(()=>{
  'use strict';
  const BS=window.BS,ic=BS.icon,esc=BS.escape;
  const app=document.getElementById('app'),dialog=document.getElementById('detail-dialog');
  const stores=[];
  const saveStores=()=>window.QuipuLocal.write('stores',stores);
  let lastTrigger=null,toastTimer,route='inicio',section='',pendingStore=null;
  const businessPages={resumen:['Resumen','dashboard'],semana:['Mi primera semana','sprout'],ventas:['Ventas y gastos','arrows'],inventario:['Inventario','box'],escanear:['Escanear producto','scan'],proveedores:['Proveedores','store'],clientes:['Clientes','users'],fiados:['Fiados','coins'],caja:['Cierre de caja','wallet'],alertas:['Centro de alertas','alert'],reportes:['Reportes','chart']};
  const learningPages={inicio:['Mi ruta','sprout'],simulador:['Calculadora','chart'],historias:['Retos con historias','lightbulb'],guia:['Guía del aplicativo','dashboard'],finanzas:['Educación financiera','coins'],formalizacion:['Formaliza tu bodega','shield'],videos:['Videos','play'],blog:['Blog','book']};
  const logo=()=>`<a class="bs-logo" href="#inicio" aria-label="Quipu, inicio"><span><svg class="quipu-logo-mark" viewBox="0 0 28 34" fill="none" aria-hidden="true"><path d="M3 5h22M6 5v17m8-17v24m8-24v19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="6" cy="16" rx="3" ry="2" stroke="currentColor" stroke-width="2"/><ellipse cx="14" cy="20" rx="3" ry="2" stroke="currentColor" stroke-width="2"/><ellipse cx="22" cy="17" rx="3" ry="2" stroke="currentColor" stroke-width="2"/></svg></span><span>Quipu<small>CRECE CON TU NEGOCIO</small></span></a>`;
  const btn=(label,href,secondary=false)=>`<a class="bs-btn ${secondary?'secondary':''}" href="${href}">${label}${ic('arrow')}</a>`;
  function header(){return `<header class="bs-header"><div class="bs-wrap bs-header-inner">${logo()}<nav class="bs-public-nav" aria-label="Navegación principal"><a href="#nosotros">Quiénes somos</a><a href="#aprender/inicio">Quiero aprender</a><a href="#herramientas">Herramientas</a><a href="#aprender/blog">Blog</a><a href="#gestion">Mi negocio</a></nav><div class="bs-auth-links"><a class="bs-btn" href="#aprender/inicio">Aprender gratis ${ic('arrow')}</a></div><button class="bs-mobile-nav-toggle" data-public-menu aria-label="Abrir navegación" aria-expanded="false">${ic('menu')}</button></div><nav class="bs-mobile-nav" id="public-mobile-nav" aria-label="Navegación móvil"><a href="#nosotros">Quiénes somos</a><a href="#aprender/inicio">Quiero aprender</a><a href="#herramientas">Herramientas</a><a href="#aprender/blog">Blog</a><a href="#gestion">Mi negocio</a></nav></header>`;}
  function footer(){return `<footer class="bs-footer"><div class="bs-wrap bs-footer-inner"><div><strong>Quipu</strong><p>Gestión sencilla. Aprendizaje para crecer.</p></div><div class="bs-footer-links"><a href="#herramientas">Herramientas</a><a href="#nosotros">Quiénes somos</a><a href="#aprender/inicio">Aprende gratis</a><a href="#aprender/blog">Blog</a><a href="#gestion">Mi negocio</a><a href="#admin">Administración</a><button data-quipu-replay>Ver bienvenida</button>${window.QuipuMotion.controls()}</div></div></footer>`;}
  function storeCards(){return "";}
  function paths(){return availability();}
  const bizPresets={
    bodega:{
      modeLabel:'Modo Bodega',
      modeIcon:'store',
      hint:'Personalizado para bodegas: control diario de abarrotes, bebidas, fiados y ganancias.',
      scrollSub:'Gestiona tu bodega de forma simple y eficiente.',
      step2:'Personaliza tu bodega en minutos.',
      cards:[
        {img:'wallpapers/bodega-icon-1.png',title:'Escáner de códigos de barras',desc:'Usa la cámara de tu celular para registrar abarrotes y bebidas.'},
        {img:'wallpapers/bodega-icon-2.png',title:'Control de stock',desc:'Mantén el control diario de tus abarrotes y lácteos.'},
        {img:'wallpapers/bodega-icon-3.png',title:'Vencimientos',desc:'Recibe alertas de productos próximos a vencer.'},
        {img:'wallpapers/bodega-icon-4.png',title:'Ventas y caja (Yape/Plin)',desc:'Ofrece múltiples formas de pago en tu bodega.'},
        {img:'wallpapers/bodega-icon-5.png',title:'Reportes PDF',desc:'Analiza el rendimiento diario de tu bodega.'},
        {img:'wallpapers/bodega-icon-6.png',title:'Proveedores',desc:'Mantén tus pedidos de distribuidores al día.'}
      ]
    },
    botica:{
      modeLabel:'Modo Farmacia',
      modeIcon:'cross',
      hint:'Personalizado para boticas y farmacias: control de lotes, vencimientos y venta por blíster o caja.',
      scrollSub:'Gestiona tu farmacia de forma simple y eficiente.',
      step2:'Configura los lotes y alertas de tu botica.',
      cards:[
        {img:'wallpapers/farmacia-icon-1.png',title:'Escáner de códigos de barras',desc:'Usa la cámara de tu celular para registrar productos.'},
        {img:'wallpapers/farmacia-icon-2.png',title:'Control de stock',desc:'Mantén el control de tus medicamentos.'},
        {img:'wallpapers/farmacia-icon-3.png',title:'Vencimientos',desc:'Recibe alertas de medicamentos por vencer.'},
        {img:'wallpapers/farmacia-icon-4.png',title:'Ventas y caja',desc:'Registra tus ventas de forma rápida.'},
        {img:'wallpapers/farmacia-icon-5.png',title:'Reportes PDF',desc:'Analiza el rendimiento de tu farmacia.'},
        {img:'wallpapers/farmacia-icon-6.png',title:'Proveedores',desc:'Gestiona tus proveedores y compras.'}
      ]
    },
    minimarket:{
      modeLabel:'Modo Minimarket',
      modeIcon:'cart',
      hint:'Personalizado para minimarkets: atención rápida en caja, múltiples categorías y control de stock.',
      scrollSub:'Gestiona tu minimarket de forma simple y eficiente.',
      step2:'Personaliza las áreas de tu minimarket.',
      cards:[
        {img:'wallpapers/minimarket-icon-1.png',title:'Escáner de códigos de barras',desc:'Atiende rápido escaneando con celular o lectora USB.'},
        {img:'wallpapers/minimarket-icon-2.png',title:'Control de stock',desc:'Controla múltiples categorías y reposición de góndolas.'},
        {img:'wallpapers/minimarket-icon-3.png',title:'Vencimientos y lotes',desc:'Evita pérdidas por vencimiento en lácteos y perecibles.'},
        {img:'wallpapers/minimarket-icon-4.png',title:'Ventas y caja (Yape/Plin)',desc:'Cuadra tu cierre de caja con Yape, Plin, Tarjeta y Efectivo.'},
        {img:'wallpapers/minimarket-icon-5.png',title:'Reportes PDF',desc:'Exporta reportes ejecutivos en PDF para tu negocio.'},
        {img:'wallpapers/minimarket-icon-6.png',title:'Proveedores',desc:'Coordina entregas y órdenes de compra con proveedores.'}
      ]
    }
  };
  let selectedBizType=localStorage.getItem('quipu-home-biz-type')||'botica';
  if(!bizPresets[selectedBizType])selectedBizType='botica';
  let flipCount=0;
  function modeBadgeSvg(type){
    if(type==='cross')return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#e04f5f"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>`;
    if(type==='cart')return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.5L22 7H6"/></svg>`;
    return ic('store');
  }
  function renderCardFaceContent(c){
    return `<div class="quipu-rope-card-art"><img src="${c.img}" alt="${esc(c.title)}"></div><div class="quipu-rope-card-body"><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p></div>`;
  }
  function renderMedallions(cards){
    return cards.map((c,idx)=>`
      <div class="quipu-hanging-slot slot-${idx}" style="--slot-idx:${idx}">
        <span class="quipu-cord-bridge" aria-hidden="true">
          <u class="q-main-knot k-color-${idx%3}"></u>
          <i class="q-vert-rope"></i>
          <b class="q-top-clasp"></b>
        </span>
        <article class="quipu-flip-card" data-flip-card="${idx}">
          <div class="quipu-flip-inner" data-flip-inner="${idx}">
            <div class="quipu-card-face face-front" data-face="front">
              ${renderCardFaceContent(c)}
            </div>
            <div class="quipu-card-face face-back" data-face="back">
              ${renderCardFaceContent(c)}
            </div>
          </div>
        </article>
        <span class="q-bottom-clasp" aria-hidden="true"></span>
      </div>`).join('');
  }
  function landing(){
    const bp=bizPresets[selectedBizType];
    return `${header()}<main id="main-content" class="quipu-ref-home" tabindex="-1"><div class="bs-wrap">
      <section class="quipu-ref-hero">
        <div class="quipu-ref-hero-copy">
          <div class="quipu-ref-badge-wrap">
            <span class="quipu-ref-badge-pink">BIENVENIDO A QUIPU</span>
            <svg class="quipu-ref-pink-rays" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 9L14 3M8 16L22 12M7 22L19 22" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>
          </div>
          <h1>Aprende hoy.<br>Decide mejor.</h1>
          <p>Cursos, herramientas y consejos para hacer crecer tu negocio.</p>
          <div class="quipu-ref-hero-actions">
            <a class="quipu-ref-btn-primary" href="#aprender/inicio">${ic('book')}<span>Quiero aprender</span>${ic('arrow')}</a>
            <a class="quipu-ref-btn-secondary" href="#herramientas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="16" y2="18"/></svg><span>Herramientas</span></a>
          </div>
        </div>
        <div class="quipu-ref-hero-art">
          <img src="wallpapers/hero-bodega-farmacia.png" alt="Bodega y Farmacia conectadas con escáner de código de barras en el celular">
        </div>
      </section>

      <section class="quipu-ref-bizbar" aria-label="Selecciona tu tipo de negocio">
        <div class="quipu-ref-bizbar-info">
          <div class="quipu-ref-bizbar-icon">${ic('store')}</div>
          <div>
            <h2>¿Qué negocio tienes?</h2>
            <p data-biz-hint>${esc(bp.hint)}</p>
          </div>
        </div>
        <div class="quipu-ref-bizbar-pills" role="group" aria-label="Tipo de negocio">
          <button type="button" class="quipu-ref-biz-pill ${selectedBizType==='bodega'?'active':''}" data-biz-type="bodega" aria-pressed="${selectedBizType==='bodega'}">
            ${ic('store')}<span>Bodega</span><span class="quipu-ref-biz-check" aria-hidden="true">✓</span>
          </button>
          <button type="button" class="quipu-ref-biz-pill ${selectedBizType==='botica'?'active':''}" data-biz-type="botica" aria-pressed="${selectedBizType==='botica'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>
            <span>Botica / Farmacia</span><span class="quipu-ref-biz-check" aria-hidden="true">✓</span>
          </button>
          <button type="button" class="quipu-ref-biz-pill ${selectedBizType==='minimarket'?'active':''}" data-biz-type="minimarket" aria-pressed="${selectedBizType==='minimarket'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.5L22 7H6"/></svg>
            <span>Minimarket</span><span class="quipu-ref-biz-check" aria-hidden="true">✓</span>
          </button>
        </div>
      </section>

      <section class="quipu-rope-showcase" data-biz-mode="${selectedBizType}" aria-labelledby="ref-features-heading">
        <div class="quipu-rope-header">
          <div class="quipu-mode-pill-wrap">
            <span class="quipu-mode-pill" data-mode-pill>
              <span class="quipu-mode-pill-icon" data-mode-icon>${modeBadgeSvg(bp.modeIcon)}</span>
              <span data-mode-label>${esc(bp.modeLabel)}</span>
            </span>
            <svg class="quipu-mode-rays" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 8L14 3M7 15L21 12M6 22L18 22" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>
          </div>
          <h2 id="ref-features-heading">Todo lo que incluye Quipu</h2>
          <p data-biz-scroll-sub>${esc(bp.scrollSub)}</p>
        </div>

        <div class="quipu-rope-assembly">
          <div class="quipu-rope-bar-wrap" aria-hidden="true">
            <span class="quipu-rope-tail left"></span>
            <div class="quipu-main-braid">
              <span class="quipu-knot sub k-mid-1"></span>
              <span class="quipu-knot sub k-mid-2"></span>
            </div>
            <span class="quipu-rope-tail right"></span>
          </div>

          <div class="quipu-hanging-grid" data-medallions-grid>
            ${renderMedallions(bp.cards)}
          </div>
        </div>
      </section>

      <section class="quipu-ref-steps-banner" aria-labelledby="ref-steps-heading">
        <div class="quipu-ref-steps-header">
          <div class="quipu-ref-steps-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
            <h2 id="ref-steps-heading">Empieza en 3 pasos simples</h2>
          </div>
          <button type="button" class="bs-btn secondary" data-quipu-replay style="padding:8px 16px;font-size:0.88rem">Ver bienvenida ${ic('play')}</button>
        </div>
        <div class="quipu-ref-steps-row">
          <div class="quipu-ref-step-pill">
            <span class="quipu-ref-step-num">1</span>
            <div class="quipu-ref-step-text">
              <strong>Crea tu cuenta</strong>
              <span>Es rápido y gratis.</span>
            </div>
          </div>
          <span class="quipu-ref-step-connector" aria-hidden="true">→</span>
          <div class="quipu-ref-step-pill">
            <span class="quipu-ref-step-num">2</span>
            <div class="quipu-ref-step-text">
              <strong>Configura tu negocio</strong>
              <span data-biz-step2>${esc(bp.step2)}</span>
            </div>
          </div>
          <span class="quipu-ref-step-connector" aria-hidden="true">→</span>
          <div class="quipu-ref-step-pill">
            <span class="quipu-ref-step-num">3</span>
            <div class="quipu-ref-step-text">
              <strong>Empieza a registrar</strong>
              <span>Lleva el control desde tu celular.</span>
            </div>
          </div>
          <a class="quipu-ref-register-cta" href="#gestion"><span>Registrarme</span>${ic('arrow')}</a>
        </div>
      </section>
    </div></main>${footer()}`;
  }
  function availability(){return `${header()}<main id="main-content" class="bs-wrap qp-server-main" tabindex="-1"><div id="quipu-business-root" aria-live="polite"><p>Cargando tu espacio…</p></div></main>${footer()}`;}
  function herramientas(){return `${header()}<main id="main-content" class="qp-tools-page" tabindex="-1"><div class="bs-wrap"><header class="qp-tools-heading"><span class="bs-eyebrow">GRATIS · SIN REGISTRO</span><h1>Herramientas</h1><p>Aprende probando. Calcula tus precios y ganancias.</p></header><section class="quipu-home-tools"><div><span class="bs-eyebrow">APRENDE PROBANDO</span><h2>Una cuenta. Una idea más clara.</h2><p>Ingresa tus ventas, costos y gastos. Descubre cuánto te queda al instante.</p><button class="easy-home-prompt" data-easy-help>Ayúdame a elegir mi siguiente paso →</button></div><div class="viva-calculator"><div class="viva-calc-heading"><span>PRUÉBALO AQUÍ</span><b>¿Cuánto te queda?</b></div><div class="calculator-autoplay"><span data-calculator-mode>Tus números · Edita los importes</span><button type="button" data-calculator-auto aria-pressed="false">Ver caso práctico automático</button></div><div class="take-home-fields"><label><span>Ventas totales (S/)</span><input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" data-take-home="sales" value="100" aria-describedby="viva-calc-note"></label><label><span>Costo de lo vendido (S/)</span><input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" data-take-home="cost" value="60" aria-describedby="take-home-cost-help"></label><label><span>Gastos del negocio (S/)</span><input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" data-take-home="expense" value="15"></label></div><p id="take-home-cost-help" class="take-home-help">Incluye el costo de los productos que vendiste; las compras que siguen en inventario no se restan aquí.</p><p class="take-home-error" data-take-home-error role="alert" hidden></p><label for="viva-sales">Si vendes <output id="viva-sales-value" for="viva-sales">S/ 100.00</output></label><input id="viva-sales" type="range" min="0" max="1000" step="0.01" value="100" aria-label="Ajustar ventas totales" aria-describedby="viva-calc-note"><div class="viva-calc-bars" aria-hidden="true"><i class="viva-cost-bar"></i><i class="viva-expense-bar"></i><i class="viva-profit-bar"></i></div><div class="viva-calc-result"><span><i></i>Costo <b id="viva-cost">S/ 60.00</b></span><span><i></i>Gasto <b id="viva-expense">S/ 15.00</b></span><strong><span id="viva-profit-label">Te quedan</span><output id="viva-profit" aria-live="polite" aria-atomic="true">S/ 25.00</output></strong></div><p class="take-home-formula" data-take-home-formula>S/ 100.00 − S/ 60.00 − S/ 15.00 = S/ 25.00</p><small id="viva-calc-note">Usa importes del mismo día, semana o mes. Estimación antes de impuestos y otros ajustes. No registra operaciones en tu negocio.</small><button type="button" class="take-home-reset" data-take-home-reset>Restablecer caso práctico</button></div></section>${window.QuipuMargin.render()}</div></main>${footer()}`;}
  function bodegas(){return availability();}
  function authPage(){return availability();}
  function choose(){return availability();}
  function businessShell(){return availability();}
  function learnShell(page){const shortcuts=[['inicio','sprout','Mi ruta'],['simulador','chart','Practicar'],['videos','play','Videos'],['blog','book','Blog']];return `${header()}<div class="bs-learning-free">Educación gratuita · Sin tarjeta · Aprende a tu ritmo</div><nav class="easy-learning-nav" aria-label="Aprendizaje"><div class="bs-wrap"><div class="easy-learning-links">${shortcuts.map(([key,icon,label])=>`<a href="#aprender/${key}" class="${page===key?'active':''}" ${page===key?'aria-current="page"':''}>${ic(icon)}${label}</a>`).join('')}</div><details ${['guia','finanzas','formalizacion','historias'].includes(page)?'open':''}><summary>Todos los temas de aprendizaje</summary><div class="easy-all-topics">${Object.entries(learningPages).map(([key,v])=>`<a href="#aprender/${key}" ${page===key?'aria-current="page"':''}>${v[0]}</a>`).join('')}</div></details></div></nav><main class="bs-learning-main" id="main-content" tabindex="-1">${['simulador','historias'].includes(page)?window.BodegaLab.render(page):window.BodegaLearning.render(page)}</main>${footer()}`;}
  function nosotros(){return `${header()}<main id="main-content" class="bs-wrap bs-about-page" tabindex="-1"><section class="bs-about-hero"><div><p class="bs-eyebrow">${ic('sprout')}QUIÉNES SOMOS</p><h1>Al lado de quienes<br>hacen crecer el barrio.</h1><p>Ayudamos a los bodegueros a organizar su negocio y entender sus ganancias.</p><p>Gestión sencilla + educación financiera práctica.</p><a class="bs-btn secondary" href="#aprender/inicio">Conoce nuestra ruta de aprendizaje ${ic('arrow')}</a></div><div class="bs-about-art"><span class="bs-about-art-label">${ic('book')}Gestión + aprendizaje</span><img src="store-illustration.svg" alt="Ilustración de una bodega de colores entre montañas y terrazas"><span class="bs-about-art-caption">Pequeños negocios. Grandes posibilidades.</span></div></section><section class="bs-about-purpose" aria-label="Nuestro propósito"><article><span>${ic('sprout')}</span><div><p class="bs-eyebrow">NUESTRA MISIÓN</p><h2>Hacer sencilla la gestión de tu bodega.</h2><p>Brindar herramientas prácticas para controlar ventas, gastos e inventario, junto con educación financiera gratuita para tomar mejores decisiones.</p></div></article><article><span>${ic('trend')}</span><div><p class="bs-eyebrow">NUESTRA VISIÓN</p><h2>Bodegas que crecen con confianza.</h2><p>Ser un aliado digital de los bodegueros del Perú, conectando tecnología accesible, aprendizaje y oportunidades de crecimiento.</p></div></article></section><section class="bs-about-team" aria-labelledby="about-team-title"><div class="bs-section-heading"><div><p class="bs-eyebrow">NUESTRO EQUIPO</p><h2 id="about-team-title">Las personas detrás de Quipu.</h2><p>Roles propuestos para organizar el desarrollo y la educación del proyecto.</p></div></div><div class="bs-about-team-grid"><article class="bs-team-person"><div class="bs-team-photo"><div class="bs-team-photo-window"><img src="equipo-quipu.png" width="776" height="420" loading="lazy" alt="Luis Alejandro Games" style="--photo-x:0px;--photo-y:6px"></div></div><h3>Luis Alejandro Games</h3><div class="bs-team-role">${ic('layers')}<span>Desarrollo y tecnología</span></div><p>Construye las herramientas de gestión y cuida su funcionamiento.</p></article><article class="bs-team-person"><div class="bs-team-photo"><div class="bs-team-photo-window"><img src="equipo-quipu.png" width="776" height="420" loading="lazy" alt="Rina Cristel Llavilla Guzmán" style="--photo-x:294px;--photo-y:10px"></div></div><h3>Rina Cristel Llavilla Guzmán</h3><div class="bs-team-role">${ic('calendar')}<span>Coordinación del proyecto</span></div><p>Organiza las tareas y acompaña el avance del equipo.</p></article><article class="bs-team-person"><div class="bs-team-photo"><div class="bs-team-photo-window"><img src="equipo-quipu.png" width="776" height="420" loading="lazy" alt="Yomira Mayely Segovia Oviedo" style="--photo-x:566px;--photo-y:10px"></div></div><h3>Yomira Mayely Segovia Oviedo</h3><div class="bs-team-role">${ic('lightbulb')}<span>Diseño y experiencia de usuario</span></div><p>Diseña pantallas claras y fáciles de usar desde el celular.</p></article><article class="bs-team-person"><div class="bs-team-photo"><div class="bs-team-photo-window"><img src="equipo-quipu.png" width="776" height="420" loading="lazy" alt="Sheila Carolay Urpi Quispe" style="--photo-x:131px;--photo-y:195px"></div></div><h3>Sheila Carolay Urpi Quispe</h3><div class="bs-team-role">${ic('book')}<span>Educación financiera y contenidos</span></div><p>Prepara lecciones, guías y consejos para aprender a gestionar.</p></article><article class="bs-team-person"><div class="bs-team-photo"><div class="bs-team-photo-window"><img src="equipo-quipu.png" width="776" height="420" loading="lazy" alt="Clara Vilma Yana Salazar" style="--photo-x:428px;--photo-y:188px"></div></div><h3>Clara Vilma Yana Salazar</h3><div class="bs-team-role">${ic('store')}<span>Investigación y comunidad</span></div><p>Recoge necesidades de bodegueros y propone mejoras para Quipu.</p></article></div></section><section class="bs-about-goals" aria-labelledby="about-goals-title"><div class="bs-section-heading"><div><p class="bs-eyebrow">NUESTRAS METAS</p><h2 id="about-goals-title">Lo que queremos lograr contigo.</h2></div></div><div class="bs-about-goal-grid"><article><span>${ic('chart')}</span><div><h3>Cuentas claras</h3><p>Ayudar a conocer las ganancias por día, semana y mes.</p></div></article><article><span>${ic('shield')}</span><div><h3>Menos pérdidas</h3><p>Prevenir faltantes y detectar productos próximos a vencer.</p></div></article><article><span>${ic('book')}</span><div><h3>Aprender para crecer</h3><p>Acercar educación financiera gratuita con lecciones cortas y prácticas.</p></div></article><article><span>${ic('store')}</span><div><h3>Compras inteligentes</h3><p>Facilitar la comparación de proveedores y el control de pedidos.</p></div></article></div></section><section class="bs-about-ods" aria-labelledby="about-ods-title"><div class="bs-section-heading"><div><p class="bs-eyebrow">OBJETIVOS DE DESARROLLO SOSTENIBLE</p><h2 id="about-ods-title">Quipu y los ODS.</h2><p>Son 17 objetivos globales para mejorar la vida de las personas y cuidar el planeta. Nuestra propuesta busca aportar a tres de ellos.</p></div></div><div class="bs-about-ods-grid"><article class="ods-4"><div class="ods-card-top"><span>ODS <b>4</b></span>${ic('book')}</div><div class="ods-card-body"><h3>Educación de calidad</h3><p>Lecciones y retos gratuitos para fortalecer las habilidades financieras de los bodegueros.</p><a href="#aprender/inicio">Aprender gratis ${ic('arrow')}</a></div></article><article class="ods-8"><div class="ods-card-top"><span>ODS <b>8</b></span>${ic('trend')}</div><div class="ods-card-body"><h3>Trabajo decente y crecimiento económico</h3><p>Gestión sencilla y orientación para la formalización, buscando apoyar el crecimiento de las bodegas.</p><a href="#aprender/formalizacion">Conocer la formalización ${ic('arrow')}</a></div></article><article class="ods-12"><div class="ods-card-top"><span>ODS <b>12</b></span>${ic('sprout')}</div><div class="ods-card-body"><h3>Producción y consumo responsables</h3><p>Alertas de vencimiento y control de existencias para ayudar a prevenir desperdicios y compras innecesarias.</p><a href="#negocio/inventario">Cuidar mi inventario ${ic('arrow')}</a></div></article></div><p class="ods-source">Agenda 2030 · <a href="https://www.undp.org/es/sustainable-development-goals" target="_blank" rel="noopener noreferrer">Conoce los 17 ODS en el PNUD ↗</a></p></section><section class="bs-about-audience"><div><p class="bs-eyebrow">PENSADO PARA TI</p><h2>Para quienes están detrás<br>del mostrador, cada día.</h2><p>No necesitas experiencia digital. Empieza con tu primera venta y aprende a tu ritmo.</p></div><ul><li>${ic('check')}Entender cuánto vendes, cuánto cuesta y cuánto queda.</li><li>${ic('check')}Organizar productos y revisar fechas de vencimiento.</li><li>${ic('check')}Aprender con casos prácticos y pasos fáciles de seguir.</li></ul></section><section class="bs-about-values"><div class="bs-section-heading"><div><p class="bs-eyebrow">LO QUE NOS GUÍA</p><h2>Lo sencillo también puede cambiar tu negocio.</h2></div></div><div class="bs-about-value-grid"><article><span>01</span>${ic('lightbulb')}<h3>Sencillez</h3><p>Pasos claros. Sin complicaciones.</p></article><article><span>02</span>${ic('book')}<h3>Aprendizaje práctico</h3><p>Retos cortos con casos prácticos de tu día a día.</p></article><article><span>03</span>${ic('shield')}<h3>Cuidado del negocio</h3><p>Revisa vencimientos y entiende tus resultados.</p></article></div></section><section class="bs-about-cta"><div><p class="bs-eyebrow">TU NEGOCIO CRECE CONTIGO</p><h2>Gestiona. Aprende. Da tu siguiente paso.</h2><p>Elige lo que tu bodega necesita hoy.</p></div><div>${btn('Quiero aprender','#aprender/inicio')}${btn('Iniciar con mi negocio',BS.state.authenticated?'#negocio/resumen':'#login',true)}</div></section></main>${footer()}`;}
  function plans(){return availability();}
  function businessContent(page){if(page==='escanear')return window.QuipuScanner.render();if(page==='proveedores')return window.QuipuSuppliers.render();if(page==='semana')return window.BodegaFirstWeek.render();if(page==='alertas')return window.BodegaSupport.renderAlerts();return window.BodegaCRM.render(page);}
  function render(scroll=true){
    window.QuipuCalculator?.stop();
    window.QuipuScanner?.stop();
    const path=location.hash.slice(1).split('/');route=path[0]||'inicio';section=path[1]||'';BS.state.authenticated=false;if(['negocio','login','registro','elegir','bodegas','planes'].includes(route)){route='gestion';section='';}
    document.body.classList.toggle('quipu-admin',route==='admin');
    const showIntro=route!=='admin'&&window.QuipuCarousel.needsIntro();document.body.classList.toggle('quipu-onboarding',showIntro);
    if(showIntro){app.innerHTML=`<main id="main-content" class="quipu-onboarding-page" tabindex="-1"><header class="quipu-onboarding-header">${logo()}<div>${window.QuipuMotion.controls()}</div></header>${window.QuipuCarousel.render()}</main>`;document.title='Bienvenido a Quipu';if(scroll){window.scrollTo({top:0,behavior:'instant'});document.getElementById('main-content')?.focus({preventScroll:true});}return;}
    if(route==='negocio'&&!BS.state.authenticated){route='login';}
    if(route==='elegir'&&!BS.state.authenticated){route='login';}
    if(route==='admin'){app.innerHTML=availability();document.title='Administración · Quipu';}
    else if(route==='negocio'&&window.QuipuAdmin.isSuspended(BS.state.businessId)){app.innerHTML=header()+window.QuipuAdmin.blocked()+footer();document.title='Acceso suspendido · Quipu';}
    else if(route==='negocio'&&!window.BodegaPlans.isActive()){app.innerHTML=plans(true);document.title='Desbloquea Mi Negocio · Quipu';}
    else if(route==='negocio'){section=businessPages[section]?section:'resumen';window.BodegaSupport.recordVisit(section);app.innerHTML=businessShell(section);document.title=businessPages[section][0]+' · '+BS.state.businessName+' · Quipu';}
    else if(route==='aprender'||route==='aprende'){route='aprender';section=learningPages[section]?section:'inicio';window.BodegaSupport.recordVisit(section);app.innerHTML=learnShell(section);document.title=learningPages[section][0]+' · Aprende · Quipu';}
    else{const pages={gestion:availability,inicio:landing,bodegas,nosotros,herramientas,planes:()=>plans(),login:()=>authPage(false),registro:()=>authPage(true),elegir:choose};if(!pages[route])route='inicio';app.innerHTML=pages[route]();document.title=({gestion:'Mi negocio',inicio:'Tu negocio crece contigo',herramientas:'Herramientas',planes:'Planes y precios',bodegas:'Nuestras bodegas',nosotros:'Quiénes somos',login:'Inicia sesión',registro:'Súmate',elegir:'Elige tu espacio'})[route]+' · Quipu';}
    window.QuipuBusiness?.mount();
    updateSidebarAccess();
    window.BodegaAndes?.mount();
    window.BodegaEase.mount();
    window.QuipuScanner?.mount();
    window.QuipuCalculator?.mount();
    if(scroll){window.scrollTo({top:0,behavior:'instant'});document.getElementById('main-content')?.focus({preventScroll:true});}
  }
  function refresh(){const y=window.scrollY;render(false);document.getElementById('main-content')?.focus({preventScroll:true});window.scrollTo({top:y,behavior:'instant'});}
  function openDialog(html){if(!dialog.open)lastTrigger=document.activeElement;document.getElementById('dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.body.style.overflow='hidden';dialog.querySelector('[data-close], [data-crm-action="close"],button,input,a')?.focus();}
  function closeDialog(){if(dialog.open)dialog.close();}
  function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);}
  Object.assign(BS,{openDialog,closeDialog,toast,refresh,getActivityState:()=>window.BodegaSupport.getActivityState(),awardLearning:(key,amount)=>window.BodegaJourney.awardXP(key,amount)});
  function modal(title,body){return `<div class="bs-modal"><div class="bs-modal-top"><h2 id="dialog-title">${title}</h2><button class="bs-close" data-close aria-label="Cerrar ventana">${ic('close')}</button></div>${body}</div>`;}
  function about(){location.hash='nosotros';}
  function switchBusiness(){location.hash='gestion';}
  BS.adminStores=()=>stores.map(s=>({...s}));
  BS.adminUpdateStore=(id,patch)=>{if(!window.QuipuAdmin.isAuthenticated())return false;const s=stores.find(s=>s.id===id);if(!s)return false;Object.assign(s,{name:String(patch.name).slice(0,50),owner:String(patch.owner).slice(0,30),place:String(patch.place).slice(0,60)});if(BS.state.businessId===id)Object.assign(BS.state,{businessName:s.name,ownerName:s.owner});saveStores();return true;};
  BS.completeRegistration=()=>false;
  function selectStore(){location.hash="gestion";}
  function updateSidebarAccess(){const side=document.getElementById('business-sidebar');if(side)side.inert=window.matchMedia('(max-width:760px)').matches&&!side.classList.contains('open');}
  function closeSidebar(){const side=document.getElementById('business-sidebar');if(side?.contains(document.activeElement)&&window.matchMedia('(max-width:760px)').matches)document.querySelector('[data-business-menu]')?.focus();side?.classList.remove('open');document.getElementById('sidebar-scrim')?.classList.remove('open');document.querySelector('[data-business-menu]')?.setAttribute('aria-expanded','false');updateSidebarAccess();}
  document.addEventListener('click',e=>{
    const bizBtn=e.target.closest('[data-biz-type]');
    if(bizBtn){
      const nextType=bizBtn.dataset.bizType;
      if(bizPresets[nextType] && nextType!==selectedBizType){
        selectedBizType=nextType;
        try{localStorage.setItem('quipu-home-biz-type',nextType);}catch{}
        const bp=bizPresets[nextType];
        document.querySelectorAll('[data-biz-type]').forEach(b=>{
          const active=b.dataset.bizType===nextType;
          b.classList.toggle('active',active);
          b.setAttribute('aria-pressed',String(active));
        });
        const setTxt=(sel,val)=>{const el=document.querySelector(sel);if(el)el.textContent=val;};
        setTxt('[data-biz-hint]',bp.hint);
        setTxt('[data-biz-scroll-sub]',bp.scrollSub);
        setTxt('[data-biz-step2]',bp.step2);
        setTxt('[data-mode-label]',bp.modeLabel);
        const modeIconEl=document.querySelector('[data-mode-icon]');
        if(modeIconEl)modeIconEl.innerHTML=modeBadgeSvg(bp.modeIcon);

        const showcase=document.querySelector('.quipu-rope-showcase');
        if(showcase){
          showcase.dataset.bizMode=nextType;
          showcase.classList.remove('is-pulling');
          void showcase.offsetWidth;
          showcase.classList.add('is-pulling');
        }

        flipCount++;
        const isOdd=(flipCount%2===1);
        const targetFace=isOdd?'back':'front';
        const deg=flipCount*180;

        bp.cards.forEach((c,idx)=>{
          const cardEl=document.querySelector(`[data-flip-card="${idx}"]`);
          const innerEl=document.querySelector(`[data-flip-inner="${idx}"]`);
          if(innerEl){
            const faceEl=innerEl.querySelector(`[data-face="${targetFace}"]`);
            if(faceEl)faceEl.innerHTML=renderCardFaceContent(c);
            innerEl.style.setProperty('--flip-deg',`${deg}deg`);
          }
          if(cardEl){
            cardEl.classList.remove('is-swinging');
            void cardEl.offsetWidth;
            cardEl.classList.add('is-swinging');
          }
        });
      }
      return;
    }
    const clickedCard=e.target.closest('[data-flip-card]');
    if(clickedCard){
      clickedCard.classList.remove('is-swinging');
      void clickedCard.offsetWidth;
      clickedCard.classList.add('is-swinging');
      return;
    }
    if(e.target.closest('[data-plan-confirm],[data-plan-start],[data-admin-action],[data-store],[data-switch-business]')){e.preventDefault();location.hash='gestion';return;}if(window.QuipuAdmin.handleClick(e))return;
    if(window.QuipuCarousel.handleClick(e))return;
    if(window.BodegaEase.handleClick(e))return;
    if(window.BodegaPlans.handleClick(e))return;
    if(window.BodegaAndes?.handleClick(e))return;
    if(window.QuipuScanner?.handleClick(e))return;
    if(window.QuipuSuppliers.handleClick(e))return;
    if(window.BodegaCRM.handleClick(e))return;
    if(window.BodegaSupport.handleClick(e))return;
    if(window.BodegaLab?.handleClick(e))return;
    if(window.BodegaLearning.handleClick(e))return;
    if(e.target.closest('[data-close]')){closeDialog();return;}
    if(e.target.closest('[data-about]')){about();return;}
    const store=e.target.closest('[data-store]');if(store){pendingStore=store.dataset.store;location.hash='login';return;}
    if(e.target.closest('[data-switch-business]')){switchBusiness();return;}
    if(e.target.closest('[data-logout]')){BS.state.authenticated=false;window.BodegaPlans.reset();location.hash='inicio';toast('Saliste de la sesión de práctica.');return;}
    const menu=e.target.closest('[data-public-menu]');if(menu){const open=document.getElementById('public-mobile-nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(open));return;}
    const businessMenu=e.target.closest('[data-business-menu]');if(businessMenu){const side=document.getElementById('business-sidebar'),open=side.classList.toggle('open');side.inert=!open;document.getElementById('sidebar-scrim').classList.toggle('open',open);businessMenu.setAttribute('aria-expanded',String(open));if(open)side.querySelector('[aria-current]')?.focus();return;}
    if(e.target.closest('#sidebar-scrim')){closeSidebar();return;}
    const a=e.target.closest('a[href^="#"]');if(a&&dialog.open)closeDialog();if(a){closeSidebar();document.querySelector('.bs-mobile-nav')?.classList.remove('open');document.querySelector('[data-public-menu]')?.setAttribute('aria-expanded','false');}
    if(a?.getAttribute('href')==='#main-content'){e.preventDefault();document.getElementById('main-content')?.focus();}
  });
  document.addEventListener('submit',e=>{if(e.target.matches('[data-auth-form],[data-switch-form],[data-admin-form],[data-crm-form]')){e.preventDefault();location.hash='gestion';return;}
    if(window.QuipuAdmin.handleSubmit(e))return;

    if(e.target.matches('[data-switch-form]')){e.preventDefault();selectStore(new FormData(e.target).get('businessId'));closeDialog();refresh();toast('Cambiaste a '+BS.state.businessName+'.');return;}
    if(window.QuipuScanner?.handleSubmit(e))return;
    if(window.QuipuSuppliers.handleSubmit(e))return;
    if(window.BodegaCRM.handleSubmit(e))return;
    if(window.BodegaLab?.handleSubmit(e))return;
  });
  document.addEventListener('input',e=>{if(window.QuipuScanner?.handleInput(e))return;if(window.QuipuSuppliers.handleInput(e))return;if(window.BodegaCRM.handleInput?.(e))return;window.BodegaLab?.handleInput(e);});
  document.addEventListener('change',e=>{if(window.QuipuSuppliers.handleChange(e))return;if(window.BodegaCRM.handleChange?.(e))return;window.BodegaLab?.handleChange(e);});
  document.addEventListener('bodegasmart:activity',e=>{if(e.detail?.type==='reset')window.BodegaSupport.resetBusiness();if(e.detail?.type==='simulator')window.BodegaSupport.recordVisit('simulador');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSidebar();document.querySelector('.bs-mobile-nav')?.classList.remove('open');document.querySelector('[data-public-menu]')?.setAttribute('aria-expanded','false');}});
  dialog.addEventListener('close',()=>{document.body.style.overflow='';document.getElementById('dialog-content').innerHTML='';if(lastTrigger?.isConnected)lastTrigger.focus();else document.getElementById('main-content')?.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  window.addEventListener('hashchange',()=>{closeDialog();render();});
  window.matchMedia('(max-width:760px)').addEventListener('change',closeSidebar);
  render();
})();


