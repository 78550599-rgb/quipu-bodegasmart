(()=>{
 'use strict';const preference=window.matchMedia('(prefers-reduced-motion: reduce)');let paused=false;
 try{paused=localStorage.getItem('quipu-motion-paused-v1')==='yes';}catch{}
 const reduced=()=>paused||preference.matches;
 const label=()=>preference.matches?'Movimiento reducido':paused?'Activar animaciones':'Pausar animaciones';
 const symbol=()=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">${paused?'<path d="m8 4 12 8-12 8Z"/>':'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'}</svg>`;
 function apply(){document.documentElement.dataset.quipuMotion=reduced()?'paused':'running';document.querySelectorAll('[data-motion-toggle]').forEach(b=>{b.innerHTML=symbol();b.setAttribute('aria-label',label());b.title=label();b.setAttribute('aria-pressed',String(paused));b.disabled=preference.matches;});}
 function controls(){return `<button type="button" class="quipu-motion-toggle" data-motion-toggle aria-label="${label()}" title="${label()}" aria-pressed="${paused}" ${preference.matches?'disabled':''}>${symbol()}</button>`;}
 function celebrate(){if(reduced())return;const layer=document.createElement('div');layer.className='quipu-welcome-confetti';layer.setAttribute('aria-hidden','true');for(let i=0;i<20;i++){const dot=document.createElement('i');dot.style.setProperty('--dx',(i-9.5)*19+'px');dot.style.setProperty('--spin',(i%2?1:-1)*(130+i*19)+'deg');dot.style.setProperty('--delay',(i%4)*35+'ms');dot.style.background=['#ffc629','#00a790','#c62c70','#008ba5'][i%4];layer.appendChild(dot);}document.body.appendChild(layer);setTimeout(()=>layer.remove(),1500);}
 document.addEventListener('click',e=>{if(!e.target.closest('[data-motion-toggle]'))return;paused=!paused;try{localStorage.setItem('quipu-motion-paused-v1',paused?'yes':'no');}catch{}apply();});
 document.addEventListener('pointerdown',e=>{const b=e.target.closest('.bs-btn,.jg-btn,.crm-btn,.quipu-prev,.easy-context-strip button');if(!b||b.disabled||reduced()||typeof b.animate!=='function')return;b.animate([{filter:'brightness(1)'},{filter:'brightness(1.15)'},{filter:'brightness(1)'}],{duration:280,easing:'ease-out'});},{passive:true});
 preference.addEventListener('change',apply);document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('quipu-tab-hidden',document.hidden);});
 apply();window.QuipuMotion={controls,celebrate};
})();

