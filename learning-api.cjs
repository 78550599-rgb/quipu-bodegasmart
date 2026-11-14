'use strict';
const crypto=require('node:crypto');
const fields={title:100,short:100,copy:2000,example:1500,question:600,explain:1500};
const icons=new Set(['dashboard','receipt','box','trend','coins','wallet','shield','flag','book','sprout']);
function validateDraft(input,complete=false){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('La lección debe contener un objeto de contenido.');
 const draft={};
 for(const [key,max] of Object.entries(fields)){if(typeof input[key]!=='string')throw Error('Revisa el campo '+key+'.');draft[key]=input[key].trim();if(draft[key].length>max)throw Error('El campo '+key+' supera '+max+' caracteres.');if(complete&&!draft[key])throw Error('Completa el título, la explicación, el ejemplo, la pregunta y la retroalimentación antes de publicar.');}
 if(!Number.isInteger(input.unit)||input.unit<0||input.unit>2)throw Error('Selecciona una unidad válida.');
 if(!Number.isInteger(input.order)||input.order<0||input.order>9999)throw Error('El orden debe ser un número entero entre 0 y 9999.');
 if(!Array.isArray(input.options)||input.options.length!==3||input.options.some(v=>typeof v!=='string'||v.trim().length>300))throw Error('Escribe tres respuestas de hasta 300 caracteres.');
 draft.options=input.options.map(v=>v.trim());
 if(!Number.isInteger(input.answer)||input.answer<0||input.answer>2)throw Error('Marca la respuesta correcta.');
 if(complete&&(draft.options.some(v=>!v)||new Set(draft.options.map(v=>v.toLocaleLowerCase('es'))).size!==3))throw Error('Escribe tres respuestas diferentes y completas.');
 draft.unit=input.unit;draft.order=input.order;draft.answer=input.answer;draft.icon=icons.has(input.icon)?input.icon:'book';
 if(input.source){if(!Array.isArray(input.source)||input.source.length!==2||input.source.some(v=>typeof v!=='string'))throw Error('Revisa la fuente de la lección.');let url;try{url=new URL(input.source[0]);}catch{throw Error('La fuente debe ser una dirección HTTPS válida.');}if(url.protocol!=='https:'||url.username||url.password||url.href.length>1000||!input.source[1].trim()||input.source[1].length>150)throw Error('La fuente debe usar HTTPS y tener una etiqueta de hasta 150 caracteres.');draft.source=[url.href,input.source[1].trim()];}
 return draft;
}
function createLearningApi({dbQuery,dbExec,sqlStr,sendJson,readBody}){
 return async function learningApi(req,res,pathname,session,cookieHeaders={}){
  if(pathname==='learning/lessons'&&req.method==='GET'){
   const rows=await dbQuery(`SELECT id,published AS content FROM quipu.learning_lessons WHERE published IS NOT NULL ORDER BY (published->>'unit')::int,(published->>'order')::int,id`);
   sendJson(res,200,{lessons:rows},cookieHeaders);return true;
  }
  if(pathname!=='admin/lessons')return false;
  if(!session?.user?.isAdmin){sendJson(res,session?403:401,{error:'admin_required',message:'Inicia sesión con una cuenta administradora para gestionar lecciones.'},cookieHeaders);return true;}
  if(!session.googleVerified||!(session.verifiedUntil>Date.now())){sendJson(res,403,{error:'verified_admin_required',message:'Verifica tu cuenta de Google para gestionar y publicar lecciones.'},cookieHeaders);return true;}
  if(req.method==='GET'){
   const lessons=await dbQuery('SELECT id,draft,published,version,updated_at,published_at FROM quipu.learning_lessons ORDER BY (draft->>\'unit\')::int,(draft->>\'order\')::int,id');sendJson(res,200,{lessons},cookieHeaders);return true;
  }
  if(req.method!=='POST'){sendJson(res,405,{message:'Método no permitido.'});return true;}
  if(!session.csrf||req.headers['x-quipu-csrf']!==session.csrf){sendJson(res,403,{error:'invalid_csrf',message:'Tu sesión cambió. Recarga la página antes de guardar.'});return true;}
  if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{}if(origin?.host!==req.headers.host){sendJson(res,403,{message:'El origen de la solicitud no es válido.'});return true;}}
  const body=await readBody(req);let draft;
  if(!['save','publish','unpublish'].includes(body.action)){sendJson(res,400,{message:'Selecciona una acción válida.'});return true;}
  if(body.id!=null&&(typeof body.id!=='string'||!/^core-[0-8]$|^lesson-[0-9a-f-]{36}$/.test(body.id))){sendJson(res,400,{message:'Identificador de lección no válido.'});return true;}
  if(body.action==='unpublish'&&!body.id){sendJson(res,400,{message:'Primero guarda la lección.'});return true;}
  if(body.id&&(!Number.isInteger(body.version)||body.version<1)){sendJson(res,400,{message:'Recarga la lección para obtener su versión actual.'});return true;}
  if(body.action!=='unpublish'){try{draft=validateDraft(body.draft,body.action==='publish');}catch(error){sendJson(res,400,{message:error.message});return true;}}
  const id=body.id||'lesson-'+crypto.randomUUID(),json=draft?sqlStr(JSON.stringify(draft))+'::jsonb':null;
  const action='lesson_'+({save:'draft_saved',publish:'published',unpublish:'unpublished'}[body.action]);
  const change=body.id?`UPDATE quipu.learning_lessons SET ${body.action==='unpublish'?'published=NULL':`draft=${json}${body.action==='publish'?`,published=${json},published_at=now()`:''}`},version=version+1,updated_at=now(),updated_by=${sqlStr(session.user.id)} WHERE id=${sqlStr(id)} AND version=${body.version}; IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='lesson_version_conflict'; END IF;`:`INSERT INTO quipu.learning_lessons(id,draft,published,published_at,updated_by) VALUES(${sqlStr(id)},${json},${body.action==='publish'?json:'NULL'},${body.action==='publish'?'now()':'NULL'},${sqlStr(session.user.id)});`;
  // The content update and its audit record either both commit or both roll back.
  let tag;do{tag='$lesson_'+crypto.randomBytes(16).toString('hex')+'$';}while(change.includes(tag));
  const statement=`DO ${tag} BEGIN ${change} INSERT INTO quipu.audit_log(id,user_id,business_id,action,entity_id,created_at) VALUES(${sqlStr(crypto.randomUUID())},${sqlStr(session.user.id)},NULL,${sqlStr(action)},${sqlStr(id)},now()::text); END ${tag};`;
  try{await dbExec(statement);}catch(error){if(error.code==='40001'){sendJson(res,409,{error:'lesson_version_conflict',message:'Otra persona cambió esta lección. Tus cambios siguen en el formulario; recarga antes de volver a guardar.'});return true;}throw error;}
  const rows=await dbQuery(`SELECT id,draft,published,version,updated_at,published_at FROM quipu.learning_lessons WHERE id=${sqlStr(id)}`);
  sendJson(res,200,{lesson:rows[0]},cookieHeaders);return true;
 };
}
module.exports={createLearningApi,validateDraft};
