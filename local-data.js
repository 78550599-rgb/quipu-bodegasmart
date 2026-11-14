(()=>{
  'use strict';
  let available=false;
  try{localStorage.setItem('quipu-storage-check','1');localStorage.removeItem('quipu-storage-check');available=true;}catch{}
  const key=name=>'quipu-local-v1:'+name;
  function read(name,fallback){try{const raw=localStorage.getItem(key(name));return raw===null?fallback:JSON.parse(raw);}catch{return fallback;}}
  function write(name,value){try{localStorage.setItem(key(name),JSON.stringify(value));available=true;return true;}catch{available=false;return false;}}
  function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  window.QuipuLocal={read,write,available:()=>available,download};
})();
