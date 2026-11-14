(()=>{
 'use strict';
 let minimized=false,posterReady=false;
 const widget=document.createElement('div');widget.id='quipu-assistant';widget.className='qp-assistant';
 widget.innerHTML='<button type="button" class="qp-assistant-minimize" aria-label="Minimizar asistente" title="Minimizar asistente">−</button><button type="button" id="easy-launch" class="qp-assistant-button" data-easy-help aria-label="Despertar al asistente virtual de Quipu" aria-haspopup="dialog" aria-expanded="false" title="Tócame para abrir la ayuda de Quipu"><span class="qp-assistant-sleep" aria-hidden="true">Zzz…</span><span class="qp-assistant-art"><img src="robot-sol-dormido.gif" alt="" width="543" height="724"><canvas width="543" height="724" aria-hidden="true" hidden></canvas></span><span class="qp-assistant-caption">Tu asistente</span><span class="qp-assistant-hint" aria-hidden="true">Tócame si necesitas ayuda</span></button>';
 document.body.appendChild(widget);
 const launcher=widget.querySelector('#easy-launch'),image=widget.querySelector('img'),canvas=widget.querySelector('canvas'),minimize=widget.querySelector('.qp-assistant-minimize'),preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 function motion(){const paused=preference.matches||document.documentElement.dataset.quipuMotion==='paused';image.hidden=paused&&posterReady;canvas.hidden=!paused||!posterReady;}
 image.addEventListener('load',()=>{const context=canvas.getContext('2d');if(context){context.drawImage(image,0,0,543,724);posterReady=true;motion();}},{once:true});
 new MutationObserver(motion).observe(document.documentElement,{attributes:true,attributeFilter:['data-quipu-motion']});preference.addEventListener('change',motion);
 function rest(){widget.classList.remove('is-helping');launcher.setAttribute('aria-expanded','false');}
 function expand(){minimized=false;widget.classList.remove('is-minimized');launcher.setAttribute('data-easy-help','');launcher.setAttribute('aria-label','Despertar al asistente virtual de Quipu');minimize.hidden=false;}
 minimize.addEventListener('click',()=>{minimized=true;widget.classList.add('is-minimized');launcher.removeAttribute('data-easy-help');launcher.setAttribute('aria-label','Mostrar asistente virtual de Quipu');minimize.hidden=true;launcher.focus();});
 launcher.addEventListener('click',e=>{if(minimized){e.preventDefault();e.stopPropagation();expand();return;}widget.classList.add('is-helping');launcher.setAttribute('aria-expanded','true');});
 document.addEventListener('close',e=>{if(e.target.id==='detail-dialog')rest();},true);
 motion();
})();

