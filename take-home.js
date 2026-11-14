(()=>{
 'use strict';
 const defaults={sales:'100',cost:'60',expense:'15'},saved=window.QuipuLocal?.read('take-home',null);
 let values={...defaults},timer=null,observer=null,visible=false,playing=false,input=null,direction=1;
 if(saved&&['sales','cost','expense'].every(k=>typeof saved[k]==='string'&&saved[k]!==''&&Number.isFinite(Number(saved[k]))&&Number(saved[k])>=0&&Number(saved[k])<=1000000))values={sales:saved.sales,cost:saved.cost,expense:saved.expense};
 const allowed=()=>document.documentElement.dataset.quipuMotion!=='paused'&&!document.hidden;
 function calculate(v){const valid=['sales','cost','expense'].every(k=>String(v[k]??'').trim()!==''&&Number.isFinite(Number(v[k]))&&Number(v[k])>=0&&Number(v[k])<=1000000);if(!valid)return null;const sales=Math.round(Number(v.sales)*100)/100,cost=Math.round(Number(v.cost)*100)/100,expense=Math.round(Number(v.expense)*100)/100,profit=Math.round((sales-cost-expense)*100)/100,total=Math.max(sales,cost+expense);return {sales,cost,expense,profit,costPercent:total?cost/total*100:0,expensePercent:total?expense/total*100:0,profitPercent:total?Math.max(0,profit)/total*100:0};}
 function save(){if(calculate(values))window.QuipuLocal?.write('take-home',values);}
 function update(){if(!input?.isConnected)return;const box=input.closest('.viva-calculator'),r=calculate(values),money=window.BS.money;
  for(const k of ['sales','cost','expense']){const field=box.querySelector(`[data-take-home="${k}"]`);if(field&&document.activeElement!==field)field.value=values[k];}
  const error=box.querySelector('[data-take-home-error]'),bar=box.querySelector('.viva-calc-bars');error.hidden=!!r;error.textContent=r?'':'Completa los tres importes con números entre S/ 0 y S/ 1,000,000.';
  box.classList.toggle('calculator-loss',!!r&&r.profit<0);box.classList.toggle('calculator-invalid',!r);
  document.getElementById('viva-sales-value').textContent=r?money(r.sales):'—';document.getElementById('viva-cost').textContent=r?money(r.cost):'—';document.getElementById('viva-expense').textContent=r?money(r.expense):'—';document.getElementById('viva-profit').textContent=r?money(r.profit):'—';document.getElementById('viva-profit-label').textContent=r&&r.profit<0?'Pérdida estimada':r&&r.profit===0?'En equilibrio':'Te quedan';
  box.querySelector('[data-take-home-formula]').textContent=r?`${money(r.sales)} − ${money(r.cost)} − ${money(r.expense)} = ${money(r.profit)}`:'Ventas − costo de productos vendidos − gastos';
  for(const [key,prop] of [['costPercent','--cost'],['expensePercent','--expense'],['profitPercent','--profit']])bar.style.setProperty(prop,(r?r[key]:0)+'%');
  if(r){input.max=String(Math.max(1000,Math.ceil(r.sales/100)*100));input.value=String(r.sales);input.setAttribute('aria-valuetext',money(r.sales));}
 }
 function controls(){if(!input?.isConnected)return;const button=document.querySelector('[data-calculator-auto]'),label=document.querySelector('[data-calculator-mode]');button.textContent=playing?'Pausar caso práctico':'Ver caso práctico automático';button.setAttribute('aria-pressed',String(playing));label.textContent=playing?(allowed()?'Caso práctico automático · Puedes editarlo':'Caso práctico en pausa'):'Tus números · Edita los importes';document.getElementById('viva-profit').setAttribute('aria-live',playing?'off':'polite');}
 function sync(){clearInterval(timer);timer=null;if(!input?.isConnected)return;controls();if(playing&&visible&&allowed())timer=setInterval(()=>{if(!input?.isConnected){stop();return;}let n=Number(values.sales)+direction*30;if(n>=200){n=200;direction=-1;}if(n<=50){n=50;direction=1;}values={sales:String(n),cost:String(Math.round(n*.6*100)/100),expense:'15'};update();},2600);}
 function stop(){clearInterval(timer);timer=null;observer?.disconnect();observer=null;input=null;visible=false;}
 function mount(){stop();input=document.getElementById('viva-sales');if(!input)return;const box=input.closest('.viva-calculator');update();observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting||false;sync();},{threshold:.3});observer.observe(box);sync();}
 document.addEventListener('input',e=>{const field=e.target.closest('[data-take-home]');if(!field&&e.target.id!=='viva-sales')return;playing=false;if(field)values[field.dataset.takeHome]=field.value;else values.sales=e.target.value;sync();update();save();});
 document.addEventListener('pointerdown',e=>{if(e.target.closest('[data-take-home]')||e.target.id==='viva-sales'){playing=false;sync();}},{passive:true});
 document.addEventListener('click',e=>{if(e.target.closest('[data-take-home-reset]')){playing=false;values={...defaults};save();update();sync();return;}if(!e.target.closest('[data-calculator-auto]'))return;playing=!playing;if(playing){values={...defaults};update();}else save();sync();});
 document.addEventListener('visibilitychange',sync);new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-quipu-motion']});
 window.QuipuCalculator={mount,stop,calculate};mount();
})();
