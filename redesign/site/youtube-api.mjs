const requests=new WeakMap();
export function loadYouTubeAPI(scope){
  if(scope.YT?.Player)return Promise.resolve(scope.YT);
  if(requests.has(scope))return requests.get(scope);
  const promise=new Promise((resolve,reject)=>{
    const script=scope.document.createElement('script'),previous=scope.onYouTubeIframeAPIReady;
    let settled=false,timer;
    function finish(error){
      if(settled)return;settled=true;scope.clearTimeout(timer);
      if(scope.onYouTubeIframeAPIReady===ready)scope.onYouTubeIframeAPIReady=previous;
      if(error){script.remove();requests.delete(scope);reject(error);}else resolve(scope.YT);
    }
    function ready(){try{previous?.();}catch{}finish(scope.YT?.Player?null:new Error('YouTube API unavailable.'));}
    scope.onYouTubeIframeAPIReady=ready;
    script.src='https://www.youtube.com/iframe_api';script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';
    script.addEventListener('error',()=>finish(new Error('YouTube API could not load.')),{once:true});
    timer=scope.setTimeout(()=>finish(new Error('YouTube API timed out.')),10000);
    scope.document.head.append(script);
  });
  requests.set(scope,promise);return promise;
}
