import {VIDEOS,HERO_CLIP,HERO_CAPTION,embedUrl} from './media-config.mjs';
import {loadYouTubeAPI} from './youtube-api.mjs';
export function setupVideo(container,scope,{loadAPI=loadYouTubeAPI,beforePlay=()=>{}}={}){
  const host=container.querySelector('[data-video-stage]'),poster=container.querySelector('[data-video-poster]'),toggle=container.querySelector('[data-video-toggle]'),sound=container.querySelector('[data-video-sound]'),close=container.querySelector('[data-video-close]'),status=container.querySelector('[data-video-status]'),title=container.querySelector('[data-video-title]'),select=container.querySelector('select');
  const clip=container.getAttribute('data-video')==='preview',reduced=scope.matchMedia('(prefers-reduced-motion: reduce)'),connection=scope.navigator?.connection;
  let choice=clip?HERO_CLIP.id:(select?.value||VIDEOS[0].id),generation=0,frame=null,player=null,watchdog=null,clock=null,looping=false;
  let phase='idle',inView=!scope.IntersectionObserver,userPaused=false,policyPaused=false,autoSuppressed=false,muted=true,automatic=false,attempted=new Set();
  function label(){if(title)title.textContent=clip?HERO_CAPTION:(choice==='live'?'Sunday live channel':VIDEOS.find(v=>v.id===choice)?.title||'Recorded service');}
  function controls(){toggle.textContent=phase==='playing'?'Pause video':phase==='loading'?'Loading video…':phase==='ended'?'Replay video':'Play video';toggle.disabled=phase==='loading';sound.hidden=!player;sound.textContent=muted?'Turn sound on':'Mute sound';close.hidden=!frame&&phase!=='loading';}
  function clearWork(){scope.clearTimeout(watchdog);scope.clearInterval(clock);watchdog=clock=null;}
  function dispose(message,next='idle',focus=false){
    const active=scope.document.activeElement,restore=focus||active===frame||active===close||active===sound;
    generation++;clearWork();looping=false;try{player?.destroy();}catch{}player=null;frame?.remove();frame=null;
    phase=next;host.setAttribute('data-state','idle');host.setAttribute('aria-busy','false');poster.setAttribute('aria-hidden','false');
    if(message)status.textContent=message;controls();if(restore)toggle.focus();
  }
  function pause(reason='manual'){
    if(reason==='manual')userPaused=true;
    if(reason==='policy'||reason==='other')autoSuppressed=true;
    if(phase==='loading'){dispose('Video paused. Press Play when you’re ready.');return;}
    if(player&&phase==='playing'){phase='paused';scope.clearInterval(clock);clock=null;player.pauseVideo();controls();status.textContent=reason==='manual'?'Video paused.':'Video paused while it is out of view or page motion is paused.';}
  }
  function canAuto(){return Boolean(scope.IntersectionObserver)&&inView&&!scope.document.hidden&&!reduced.matches&&!connection?.saveData&&!policyPaused&&!userPaused&&!autoSuppressed&&!['blocked','error','ended'].includes(phase);}
  function showPlayer(){host.setAttribute('data-state','video');poster.setAttribute('aria-hidden','true');}
  function finish(){
    if(clip&&automatic&&canAuto()&&player){
      if(looping)return;looping=true;player.mute();muted=true;player.seekTo(HERO_CLIP.start,true);player.playVideo();controls();status.textContent='Recorded service preview · Sound muted.';return;
    }
    autoSuppressed=true;dispose(clip?'Preview finished. Replay it or watch a full service.':'Service finished. Choose another message or replay it.','ended');
  }
  function fail(message,allowFallback=true){
    const prior=choice;dispose(message,'error');autoSuppressed=true;
    if(allowFallback&&!clip){
      const backup=VIDEOS.find(v=>!attempted.has(v.id));
      if(backup){choice=backup.id;if(select)select.value=choice;label();phase='idle';autoSuppressed=false;userPaused=false;void start(false,`The ${prior==='live'?'live channel':'selected recording'} is unavailable here. Showing a recorded service instead.`);return;}
    }
    status.textContent=message+' You can watch on the church’s YouTube channel below.';
  }
  async function start(manual=false,notice=''){
    if(scope.document.hidden||phase==='loading'||phase==='playing')return;
    if(!manual&&!canAuto())return;
    if(manual){userPaused=false;autoSuppressed=false;attempted.clear();}
    if(player&&phase==='paused'){
      beforePlay();automatic=!manual;if(automatic){player.mute();muted=true;}player.playVideo();controls();return;
    }
    if(frame)dispose('', 'idle');
    let url;try{url=embedUrl(choice,scope.location.origin,clip);}catch{status.textContent='Choose a church service from the list.';return;}
    beforePlay();automatic=!manual;attempted.add(choice);const ticket=++generation;phase='loading';muted=true;
    host.setAttribute('aria-busy','true');status.textContent=notice||'Starting muted on YouTube…';controls();
    watchdog=scope.setTimeout(()=>{if(ticket===generation)fail('The player did not load.',false);},12000);
    try{
      const api=await loadAPI(scope);
      if(ticket!==generation)return;
      if(scope.document.hidden||(!manual&&!canAuto())){dispose('Video paused. Press Play to start.');return;}
      const current=scope.document.createElement('iframe');frame=current;current.title=clip?'Covenant Embassy recorded service preview':'Covenant Embassy '+(choice==='live'?'live channel':'recorded service');
      current.src=url;current.referrerPolicy='strict-origin-when-cross-origin';current.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');current.setAttribute('allowfullscreen','');host.append(current);controls();
      const valid=()=>ticket===generation&&frame===current;
      player=new api.Player(current,{events:{
        onReady(event){
          if(!valid())return;
          scope.clearTimeout(watchdog);phase='paused';host.setAttribute('aria-busy','false');event.target.mute();muted=true;controls();
          watchdog=scope.setTimeout(()=>{if(valid()&&phase!=='playing')fail('Playback did not start.',choice==='live');},12000);
          if(clip)event.target.loadVideoById({videoId:choice,startSeconds:HERO_CLIP.start,endSeconds:HERO_CLIP.end});else event.target.playVideo();
        },
        onStateChange(event){
          if(!valid())return;
          if(event.data===1){
            if(phase==='blocked'||userPaused){automatic=false;autoSuppressed=false;userPaused=false;}
            scope.clearTimeout(watchdog);watchdog=null;phase='playing';showPlayer();controls();
            if(clip){scope.clearInterval(clock);clock=scope.setInterval(()=>{if(!valid()||phase!=='playing')return;const time=player.getCurrentTime();if(looping&&time<HERO_CLIP.end)looping=false;if(time>=HERO_CLIP.end)finish();},500);}
            status.textContent=notice||(choice==='live'?'Check the player for the church’s broadcast.':'Recorded service · '+(muted?'Sound muted.':'Sound on.'));
            if(scope.document.hidden||!inView||policyPaused||(automatic&&(reduced.matches||connection?.saveData)))pause('viewport');
          }else if(event.data===2&&phase==='playing'){phase='paused';userPaused=true;scope.clearInterval(clock);clock=null;controls();status.textContent='Video paused.';}
          else if(event.data===0)finish();
        },
        onAutoplayBlocked(){if(valid()){scope.clearTimeout(watchdog);scope.clearInterval(clock);watchdog=clock=null;phase='blocked';autoSuppressed=true;showPlayer();controls();status.textContent='Tap Play in the YouTube player, or use Play video here.';}},
        onError(){if(valid())fail(choice==='live'?'The live channel is unavailable here.':'This recording could not play here.');}
      }});
    }catch{if(ticket===generation)fail('YouTube could not load.',false);}
  }
  function sync(){if(!inView||scope.document.hidden||policyPaused||(automatic&&(reduced.matches||connection?.saveData)))pause(policyPaused?'policy':'viewport');else if(canAuto())void start(false);}
  toggle.hidden=false;toggle.addEventListener('click',()=>{if(phase==='playing')pause('manual');else void start(true);});
  sound.addEventListener('click',()=>{if(!player)return;muted=!muted;if(muted)player.mute();else player.unMute();controls();});
  close.addEventListener('click',()=>{userPaused=true;autoSuppressed=true;dispose('Video closed. Press Play to open it again.','idle',true);});
  select?.addEventListener('change',()=>{dispose('Selection changed. Playback starts muted when in view.');choice=select.value;userPaused=false;autoSuppressed=false;attempted.clear();label();sync();});
  scope.document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{if(reduced.matches){autoSuppressed=true;pause('policy');}});
  connection?.addEventListener?.('change',()=>{if(connection.saveData){autoSuppressed=true;pause('policy');}});
  if(scope.IntersectionObserver){const observer=new scope.IntersectionObserver(entries=>{const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.4;if(!visible&&inView&&!userPaused&&!['ended','error','blocked'].includes(phase))autoSuppressed=false;inView=visible;sync();},{threshold:[0,.4],rootMargin:'-72px 0px 0px 0px'});observer.observe(host);}
  label();controls();
  return {pause,stop(){autoSuppressed=true;dispose('Video stopped. Press Play to start again.');},setMotionPaused(value){policyPaused=value;if(value)pause('policy');},getState:()=>({phase,choice,inView,userPaused,muted,automatic})};
}
