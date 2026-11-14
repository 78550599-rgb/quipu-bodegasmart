'use strict';
const crypto=require('node:crypto');
function createGoogleVerifier({clientId,fetcher=fetch,clock=Date.now}){
 let cache={keys:[],expires:0},pending;
 async function keys(){if(cache.expires>clock())return cache.keys;if(!pending)pending=(async()=>{const response=await fetcher('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('No pudimos verificar tu identidad con Google.');const data=await response.json();if(!Array.isArray(data.keys))throw Error('Las claves de Google no están disponibles.');const seconds=Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||300);cache={keys:data.keys,expires:clock()+Math.min(seconds,3600)*1000};return cache.keys;})();try{return await pending;}finally{pending=null;}}
 return async function verify(credential,nonce){
  if(typeof credential!=='string'||credential.length>16000)throw Error('La credencial de Google no es válida.');
  const parts=credential.split('.');if(parts.length!==3)throw Error('La credencial de Google no es válida.');
  let header,payload;try{header=JSON.parse(Buffer.from(parts[0],'base64url'));payload=JSON.parse(Buffer.from(parts[1],'base64url'));}catch{throw Error('La credencial de Google no es válida.');}
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('La firma de Google no es válida.');
  const jwk=(await keys()).find(k=>k.kid===header.kid&&k.kty==='RSA');
  if(!jwk||!crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),crypto.createPublicKey({key:jwk,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw Error('La firma de Google no es válida.');
  const now=Math.floor(clock()/1000);
  if(!['accounts.google.com','https://accounts.google.com'].includes(payload.iss)||payload.aud!==clientId||!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now+60||payload.nonce!==nonce||typeof nonce!=='string'||!nonce||typeof payload.sub!=='string'||!payload.sub||typeof payload.email!=='string'||payload.email_verified!==true)throw Error('La sesión de Google venció o no corresponde a este acceso.');
  return payload;
 };
}
module.exports={createGoogleVerifier};
