(()=>{'use strict';
 function alerts(snapshot,reference=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima'}).format(reference),items=[];
  for(const p of snapshot.products||[]){
   if(p.stock<=p.minimum_stock)items.push({key:`stock:${p.id}:${p.stock}:${p.minimum_stock}`,category:'existencias',level:p.stock===0?'urgent':'warning',icon:'box',title:p.name,tag:p.stock===0?'Agotado':`Quedan ${p.stock}`,text:`Mínimo: ${p.minimum_stock} unidades. Revisa y prepara tu reposición.`,view:'inventario'});
   const days=p.expiry_date?Math.round((Date.parse(p.expiry_date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000):Infinity;
   if(p.stock>0&&days<=7)items.push({key:`expiry:${p.id}:${p.expiry_date}:${p.stock}`,category:'vencimiento',level:days<0?'urgent':'warning',icon:'calendar',title:p.name,tag:days<0?'Vencido':days===0?'Vence hoy':`Vence en ${days} días`,text:`${p.stock} unidades · ${p.expiry_date}. ${days<0?'Separa el producto de la venta y revisa su estado.':'Coloca delante los productos que vencen primero.'}`,view:'inventario'});
   const candidates=(snapshot.offers||[]).filter(o=>o.product_id===p.id&&o.valid_until>=today&&o.unit_price_cents*10000<p.unit_cost_micros).sort((a,b)=>a.unit_price_cents-b.unit_price_cents);
   if(candidates.length){const o=candidates[0],supplier=(snapshot.suppliers||[]).find(x=>x.id===o.supplier_id);if(supplier&&supplier.enabled)items.push({key:`offer:${p.id}:${o.supplier_id}:${o.unit_price_cents}:${o.valid_until}`,category:'ahorro',level:'saving',icon:'coins',title:p.name,tag:'Precio de compra menor',text:`${supplier.name}: S/ ${(o.unit_price_cents/100).toFixed(2)} por unidad. Mínimo ${o.minimum_quantity} unidades; entrega S/ ${(supplier.delivery_cents/100).toFixed(2)} adicional. Oferta hasta ${o.valid_until}.`,view:'proveedores'});}
  }
  for(const c of snapshot.customers||[])if(c.balance_cents>0)items.push({key:`credit:${c.id}:${c.balance_cents}`,category:'fiados',level:'task',icon:'users',title:c.name,tag:'Saldo por cobrar',text:`S/ ${(c.balance_cents/100).toFixed(2)} pendientes. Registra los abonos cuando los recibas.`,view:'fiados'});
  for(const p of snapshot.purchases||[])if(p.status==='pending')items.push({key:`order:${p.id}`,category:'pedidos',level:'task',icon:'store',title:p.supplier_name,tag:'Pedido pendiente',text:'Confirma la llegada antes de actualizar las existencias.',view:'proveedores'});
  const end=snapshot.business?.subscriptionEndsAt,remaining=end?Math.ceil((Date.parse(end)-reference.getTime())/86400000):Infinity;
  if(remaining>0&&remaining<=3)items.push({key:`subscription:${end}`,category:'tareas',level:'warning',icon:'calendar',title:snapshot.business.trialEndsAt?'Tu prueba gratuita está por terminar':'Tu suscripción está por terminar',tag:`Quedan ${remaining} días`,text:'Revisa tu periodo de acceso. No se realizan cargos automáticos.',view:'suscripcion'});
  return items.sort((a,b)=>({urgent:0,warning:1,saving:2,task:3}[a.level]-{urgent:0,warning:1,saving:2,task:3}[b.level]));
 }
 window.QuipuInsights={alerts};
})();
