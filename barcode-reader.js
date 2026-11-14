(()=>{'use strict';
 // DecodeHintType.TRY_HARDER = 3 in the bundled ZXing library.
 function createReader(sdk){if(!sdk?.BrowserMultiFormatOneDReader)throw Error('No se pudo cargar el lector de códigos de barras.');return new sdk.BrowserMultiFormatOneDReader(new Map([[3,true]]),{delayBetweenScanAttempts:150,delayBetweenScanSuccess:800});}
 function errorMessage(error){return ({NotAllowedError:'Chrome no tiene permiso para usar la cámara. Permítelo desde el icono junto a la dirección y vuelve a intentarlo.',NotFoundError:'No se encontró una cámara. Puedes leer una foto o escribir el código.',NotReadableError:'La cámara está ocupada. Cierra otras aplicaciones que la estén usando y vuelve a intentarlo.',OverconstrainedError:'Esta cámara no admite la configuración solicitada. Prueba otra cámara.',CameraUnavailable:'La cámara no está disponible aquí. Abre Quipu en Chrome con su dirección https.',PreviewPlaybackBlocked:'Chrome pausó el video. Toca Volver a intentar para mostrar la cámara.',PreviewPlaybackError:'Chrome no pudo reproducir la cámara. Vuelve a intentarlo o cambia de cámara.',PreviewNoFrames:'La cámara no entregó imagen. Cierra otras aplicaciones que la usan y vuelve a intentarlo; también puedes cambiar de cámara.'})[error?.name]||'No se pudo iniciar la cámara. Vuelve a intentarlo, lee una foto o escribe el código.';}
 const isRecognitionMiss=error=>['NotFoundException','ChecksumException','FormatException'].includes(error?.getKind?.()||error?.constructor?.kind||error?.name);
 const formats=['EAN13','EAN8','UPCA','UPCE','Code128','Code39','ITF','Codabar','DataBar','DataBarExpanded'];
 const nativeFormats=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar'];
 const readOptions={formats,tryHarder:true,tryRotate:true,tryInvert:true,tryDownscale:true,tryDenoise:true,minLineCount:2,maxNumberOfSymbols:1,returnErrors:false};
 const localWasmFiles={locateFile:file=>new URL(file.endsWith('.wasm')?'vendor/zxing_reader-3.1.6.wasm':file,document.baseURI).href};
 function bounded(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('El lector tardó demasiado en responder.')),ms);})]).finally(()=>clearTimeout(timer));}
 const value=result=>{const text=String(result?.rawValue??result?.text??'').trim();return result?.isValid!==false&&text&&text.length<=80?text:'';};
 async function createMobileReader({loadScript,Native=window.BarcodeDetector,wasm=window.ZXingWASM,wasmOverrides}={}){
  let detector=null,sdk=wasm,wasmReady=false,wasmError=null;
  const loading=(async()=>{
   if(!sdk){await loadScript('vendor/zxing-wasm-reader-3.1.6.js');sdk=window.ZXingWASM;}
   if(!sdk?.readBarcodes)throw Error('No se pudo cargar el lector.');
   const overrides=wasmOverrides||localWasmFiles;
   await bounded(sdk.prepareZXingModule({overrides,fireImmediately:true}),15000);wasmReady=true;
  })().catch(error=>{wasmError=error;sdk?.purgeZXingModule?.();});
  try{if(Native?.getSupportedFormats){const supported=await bounded(Native.getSupportedFormats(),1200),formats=nativeFormats.filter(format=>supported.includes(format));if(formats.length)detector=new Native({formats});}}catch{}
  if(!detector){await loading;if(!wasmReady)throw Error('No se pudo preparar el lector. Revisa tu conexión y vuelve a activar la cámara.');}
  async function decode(input){
   if(detector){try{const results=await bounded(detector.detect(input),1000),text=results.map(value).find(Boolean);if(text)return {getText:()=>text};}catch{detector=null;}}
   if(!wasmReady&&!detector)await loading;
   if(wasmReady){const image=input.getContext?input.getContext('2d',{willReadFrequently:true}).getImageData(0,0,input.width,input.height):input;let results=await sdk.readBarcodes(image,readOptions),text=results.map(value).find(Boolean);if(!text){results=await sdk.readBarcodes(image,{...readOptions,binarizer:'GlobalHistogram',tryDownscale:false,tryDenoise:false});text=results.map(value).find(Boolean);}if(text)return {getText:()=>text};results=await sdk.readBarcodes(image,{...readOptions,minLineCount:1,tryDownscale:false,tryDenoise:false});text=results.map(value).find(Boolean);return text?{getText:()=>text,needsConfirmation:true}:null;}
   if(!detector)throw wasmError||Error('No se pudo iniciar la lectura.');
   return null;
  }
  return {decodeFromCanvas:decode,async decodeFile(file){await loading;if(wasmReady){const results=await sdk.readBarcodes(file,readOptions),text=results.map(value).find(Boolean);return text?{getText:()=>text}:null;}if(!window.createImageBitmap)throw wasmError||Error('No se pudo leer la foto.');const image=await window.createImageBitmap(file);try{return await decode(image);}finally{image.close();}},get mode(){return detector?(wasmReady?'native+wasm':'native'):'wasm';}};
 }
 window.QuipuBarcode={createReader,errorMessage,isRecognitionMiss,createMobileReader};
})();
