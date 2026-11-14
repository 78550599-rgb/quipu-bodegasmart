(()=>{
const iconPaths = {scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7v10m3-10v10m4-10v10m3-10v10"/>',
  store:'<path d="m3 10 2-7h14l2 7M4 10v11h16V10M9 21v-7h6v7"/><path d="M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M8 3l-1 7m5-7v7m4-7 1 7"/>',
  dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  arrows:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  box:'<path d="m3 7 9-5 9 5v10l-9 5-9-5ZM3 7l9 5 9-5M12 12v10M8 5l9 5"/>',
  chart:'<path d="M3 3v18h18M7 16v-5m5 5V6m5 10v-8"/>',
  book:'<path d="M12 5c-3-2-7-2-10 0v15c3-2 7-2 10 0 3-2 7-2 10 0V5c-3-2-7-2-10 0ZM12 5v15"/>',
  sprout:'<path d="M12 21v-8M12 16C4 16 2 11 3 6c6-1 10 3 9 10ZM12 12c-1-7 4-10 9-10 1 6-3 10-9 10Z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.2 8.5a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5m0 3h.01"/>',
  chevrons:'<path d="m8 8 4-4 4 4m-8 8 4 4 4-4"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  wallet:'<path d="M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h15v12H6a3 3 0 0 1-3-3V6m18 6h-5v6h5M17 15h.01"/>',
  receipt:'<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2ZM9 9h6m-6 4h6"/>',
  trend:'<path d="m3 17 6-6 4 4 8-11m-7 0h7v7"/>',
  lightbulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  shield:'<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  layers:'<path d="m12 2 10 6-10 6L2 8ZM2 12l10 6 10-6M2 16l10 6 10-6"/>',
  alert:'<path d="m10 3-9 16c-.5 1 0 2 1 2h20c1 0 1.5-1 1-2L14 3c-1-2-3-2-4 0ZM12 9v5m0 3h.01"/>',
  coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v4c0 4 12 4 12 0V6M3 10v4c0 3 6 4 10 2M3 14v4c0 4 12 4 12 0v-3"/><path d="M16 9c3 0 5 1 5 3s-2 3-5 3v5c3 0 5-1 5-3v-5"/>'
};
const icon = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;
const hydrateIcons = (root=document) => root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const money = value => value.toLocaleString('es-PE');
const productArt = (type) => {
  if(type==='milk') return '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="m9 10 4-6h9l3 6v24H9Z" fill="#f7f9ef" stroke="#a7b19a" stroke-width="1"/><path d="m13 4 3 6v24m0-24h9" fill="none" stroke="#b6c1aa"/><path d="M9 15h7v12H9m7-11h9v10h-9" fill="#96b1b2"/><path d="m19 6 2 4" stroke="#a7b19a"/></svg>';
  if(type==='yogurt') return '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="m7 10 3 23h13l3-23Z" fill="#f4eadf" stroke="#c5ac93"/><path d="M6 8h21v4H6Z" fill="#c9826f"/><path d="m9 17 1 10h13l1-10Z" fill="#dfb6a6"/><path d="M17 20c-6-4-6 6-1 5 6 1 7-9 1-5" fill="#c78279"/><path d="m16 20 2-4" stroke="#7e956d"/></svg>';
  if(type==='rice') return '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="m9 5-2 7 1 21h18l-1-21-2-7Z" fill="#e3d8b7" stroke="#b7ac89"/><path d="M9 5h14M9 8h14" stroke="#b7ac89"/><path d="M8 16h17v13H8" fill="#8fa78a"/><path d="m17 18-3 9m2-5-3-2m4 0 3-1m-5 5-3-1m4 0 3-1" stroke="#f1ebd6" stroke-linecap="round"/></svg>';
  if(type==='oil') return '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="M13 3h8v7l4 5v19H9V15l4-5Z" fill="#ead897" stroke="#c5b16d"/><path d="M12 3h10v4H12" fill="#9caa7c"/><path d="M9 19h16v10H9Z" fill="#9caf82"/><path d="m17 20-3 4 3 3 3-3Z" fill="#f7edbc"/></svg>';
  return '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="m9 6-2 26h19L24 6Z" fill="#e5d5b1" stroke="#baab8d"/><path d="M8 13h17v12H8" fill="#bd9072"/><path d="M12 17h9m-9 4h7" stroke="#f4ead5"/></svg>';
};

Object.assign(iconPaths,{
 plus:'<path d="M12 4v16M4 12h16"/>',
 users:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m2 4c2 1 3 3 3 5v2"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 play:'<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/>',
 logout:'<path d="M9 3H4v18h5M9 12h13m-4-4 4 4-4 4"/>',
 home:'<path d="m3 10 9-8 9 8v11h-7v-7h-4v7H3Z"/>',
 lock:'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
 location:'<path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 0 1 16 0Z"/><circle cx="12" cy="9" r="3"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>'
});
window.BS={icon,productArt,escape:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money:value=>'S/ '+Number(value).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}),state:{authenticated:false,businessName:'La Esquinita',ownerName:'Lucía',businessId:'esquinita'}};

})();
