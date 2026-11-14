(()=>{'use strict';
 const failure=(name,message)=>Object.assign(new Error(message),{name});
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 // Attach and play the stream before loading or running a barcode decoder.
 // A resolved getUserMedia request alone does not mean the video is visible.
 async function startPreview(video,stream,{isCurrent=()=>true,timeoutMs=10000,pollMs=60}={}){
  video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;
  for(const attr of ['autoplay','muted','playsinline'])video.setAttribute(attr,'');
  video.srcObject=stream;
  let playing=false,playError;
  try{Promise.resolve(video.play()).then(()=>{playing=true;},error=>{playError=error;});}catch(error){playError=error;}
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
   if(!isCurrent()||!video.isConnected||video.srcObject!==stream)throw failure('AbortError','La apertura de la cámara fue cancelada.');
   if(playError)throw failure(playError.name==='NotAllowedError'?'PreviewPlaybackBlocked':'PreviewPlaybackError',playError.message);
   if(playing&&video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0)return {width:video.videoWidth,height:video.videoHeight};
   await delay(pollMs);
  }
  throw failure('PreviewNoFrames','La cámara no está entregando imagen.');
 }

 function visibleFrame(video){
  const width=video.videoWidth,height=video.videoHeight;
  const displayRatio=(video.clientWidth||width)/(video.clientHeight||height),sourceRatio=width/height;
  // The preview uses object-fit:cover, centered. Read exactly that visible area.
  if(sourceRatio>displayRatio){const crop=height*displayRatio;return {x:(width-crop)/2,y:0,width:crop,height};}
  const crop=width/displayRatio;return {x:0,y:(height-crop)/2,width,height:crop};
 }

 // Decode a copy of the visible frame. The reader never owns or closes the video.
 function startScanning(video,reader,{onResult,onError,isCurrent=()=>true,intervalMs=200,canvas=document.createElement('canvas')}={}){
  const context=canvas.getContext('2d',{willReadFrequently:true});
  let stopped=false,timer,pending=null;
  const stop=()=>{stopped=true;clearTimeout(timer);};
  const step=async()=>{
   if(stopped||!isCurrent()||!video.isConnected)return stop();
   try{
    if(video.readyState>=2&&!video.paused&&video.videoWidth>0&&video.videoHeight>0){
     const frame=visibleFrame(video),scale=Math.min(1,1920/Math.max(frame.width,frame.height));
     const width=Math.max(1,Math.round(frame.width*scale)),height=Math.max(1,Math.round(frame.height*scale));
     if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
     if(!context)throw Error('No se pudo preparar la lectura de la imagen.');
     context.drawImage(video,frame.x,frame.y,frame.width,frame.height,0,0,width,height);
     const result=await reader.decodeFromCanvas(canvas);
     if(stopped||!isCurrent()||!video.isConnected)return stop();
     const code=String(result?.getText()||'').trim();
     if(code){
      let confirmed=!result.needsConfirmation;
      if(!confirmed){const now=Date.now(),time=video.currentTime;if(pending?.code===code&&now-pending.at<1800&&(!Number.isFinite(time)||time!==pending.time))confirmed=true;else pending={code,at:now,time};}
      if(confirmed){stop();onResult?.(code);return;}
     }
    }
   }catch(error){
    // ZXing's minified UMD errors expose a stable getKind(), not a stable name.
    if(stopped||!isCurrent())return stop();
    const kind=error.getKind?.()||error.constructor?.kind||error.name;
    if(!['NotFoundException','ChecksumException','FormatException'].includes(kind)){stop();onError?.(error);return;}
   }
   timer=setTimeout(step,intervalMs);
  };
  timer=setTimeout(step,0);
  return {stop};
 }
 window.QuipuCamera={startPreview,startScanning,visibleFrame};
})();
