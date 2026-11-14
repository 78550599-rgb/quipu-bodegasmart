(()=>{'use strict';
 function quantity(value){if(!Number.isSafeInteger(value)||value<1||value>1000000)throw Error('Ingresa una cantidad entera mayor que cero.');return value;}
 function add(rows,product,amount=1){quantity(amount);if(!product?.id||!Number.isSafeInteger(product.sale_price_cents)||product.sale_price_cents<=0)throw Error('Este producto no tiene un precio de venta válido.');const old=rows.find(x=>x.product.id===product.id),count=(old?.quantity||0)+amount;if(count>product.stock)throw Error('No hay existencias suficientes de '+product.name+'.');if(!old&&rows.length>=100)throw Error('El pedido admite hasta 100 productos diferentes.');return old?rows.map(x=>x.product.id===product.id?{product:{...product},quantity:count}:x):[...rows,{product:{...product},quantity:count}];}
 function set(rows,id,count){quantity(count);return rows.map(x=>{if(x.product.id!==id)return x;if(count>x.product.stock)throw Error('La cantidad supera las existencias disponibles.');return {...x,quantity:count};});}
 const total=rows=>rows.reduce((sum,x)=>sum+x.product.sale_price_cents*x.quantity,0);
 const payload=rows=>rows.map(x=>({productId:x.product.id,quantity:x.quantity,expectedPriceCents:x.product.sale_price_cents}));
 window.QuipuCart={add,set,total,payload};
})();
