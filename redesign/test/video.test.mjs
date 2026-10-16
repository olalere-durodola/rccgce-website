import test from 'node:test';
import assert from 'node:assert/strict';
import {setupVideo} from '../site/video.mjs';
import {loadYouTubeAPI} from '../site/youtube-api.mjs';
import {embedUrl,VIDEOS,HERO_CLIP,CHANNEL_ID,SITE_ORIGIN,requestedRecording} from '../site/media-config.mjs';
class Element{
 constructor(){this.events={};this.children=[];this.attributes={};this.hidden=false;this.disabled=false;this.value=VIDEOS[0].id;}
 addEventListener(name,handler){(this.events[name]??=[]).push(handler);}
 emit(name){return Promise.all((this.events[name]??=[]).map(handler=>handler()));}
 setAttribute(key,value){this.attributes[key]=value;}
 getAttribute(key){return this.attributes[key];}
 append(child){this.children.push(child);child.parent=this;}
 remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 focus(){this.focused=true;}
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function fixture({preview=false,reduced=false,saveData=false,deferred=false,noObserver=false,beforePlay=()=>{}}={}){
 const names=['[data-video-stage]','[data-video-poster]','[data-video-toggle]','[data-video-sound]','[data-video-close]','[data-video-status]','[data-video-title]','select'];
 const nodes=Object.fromEntries(names.map(name=>[name,new Element()]));const container=new Element();container.attributes['data-video']=preview?'preview':'service';container.querySelector=key=>key==='select'&&preview?null:nodes[key];
 const document=new Element();document.head=new Element();document.hidden=false;
 const elements=[],timers=new Map(),intervals=new Map(),observers=[],players=[];let sequence=0,requests=0,resolve,reject;
 const preference=new Element();preference.matches=reduced;const connection=new Element();connection.saveData=saveData;
 const scope={document,location:{origin:SITE_ORIGIN},navigator:{connection},matchMedia:()=>preference,setTimeout(fn){timers.set(++sequence,fn);return sequence;},clearTimeout(id){timers.delete(id);},setInterval(fn){intervals.set(++sequence,fn);return sequence;},clearInterval(id){intervals.delete(id);},IntersectionObserver:class{constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}observe(element){this.element=element;}}};
 if(noObserver)delete scope.IntersectionObserver;
 document.createElement=name=>{const element=new Element();element.kind=name;elements.push(element);return element;};
 const api={Player:class{constructor(frame,{events}){this.frame=frame;this.events=events;this.time=HERO_CLIP.start;players.push(this);}mute(){this.muted=true;this.muteCalls=(this.muteCalls||0)+1;}unMute(){this.muted=false;}playVideo(){this.playCalls=(this.playCalls||0)+1;}pauseVideo(){this.pauseCalls=(this.pauseCalls||0)+1;}loadVideoById(config){this.clip=config;this.playCalls=(this.playCalls||0)+1;}getCurrentTime(){return this.time;}seekTo(time){this.time=time;this.seekCalls=(this.seekCalls||0)+1;}destroy(){this.destroyed=true;this.frame.remove();}}};
 const promise=deferred?new Promise((a,b)=>{resolve=a;reject=b;}):Promise.resolve(api);
 const controller=setupVideo(container,scope,{loadAPI:()=>{requests++;return promise;},beforePlay});
 return {nodes,scope,players,elements,timers,intervals,observers,preference,connection,controller,api,requests:()=>requests,resolve:()=>resolve?.(api),reject,
 async view(ratio){for(const observer of observers)observer.callback([{isIntersecting:ratio>0,intersectionRatio:ratio}]);await flush();},
 async toggle(){await nodes['[data-video-toggle]'].emit('click');await flush();},
 async close(){await nodes['[data-video-close]'].emit('click');await flush();},
 async choose(value){nodes.select.value=value;await nodes.select.emit('change');await flush();},
 ready(index=players.length-1){const player=players[index];player.events.onReady({target:player});},playing(index=players.length-1){players[index].events.onStateChange({data:1});}};
}
test('embed destinations are allowlisted, privacy enhanced and initially non-playing so mute precedes playback',()=>{
 const recorded=new URL(embedUrl(VIDEOS[0].id));assert.equal(recorded.origin,'https://www.youtube-nocookie.com');assert.equal(recorded.searchParams.get('autoplay'),'0');assert.equal(recorded.searchParams.get('enablejsapi'),'1');assert.equal(recorded.searchParams.get('controls'),'1');assert.equal(recorded.searchParams.get('playsinline'),'1');
 const live=new URL(embedUrl('live'));assert.equal(live.searchParams.get('channel'),CHANNEL_ID);assert.equal(live.pathname,'/embed/live_stream');
 const clip=new URL(embedUrl(HERO_CLIP.id,SITE_ORIGIN,true));assert.equal(Number(clip.searchParams.get('end'))-Number(clip.searchParams.get('start')),30);
 assert.throws(()=>embedUrl('untrusted'));assert.throws(()=>embedUrl(VIDEOS[0].id,'http://example.com'));assert.throws(()=>embedUrl('live',SITE_ORIGIN,true));
});
test('viewport autoplay makes no provider request before substantial visibility and defaults to a recording',async()=>{
 const f=fixture();assert.equal(f.requests(),0);await f.view(.2);assert.equal(f.requests(),0);await f.view(.5);assert.equal(f.requests(),1);assert.equal(f.players.length,1);assert.equal(f.controller.getState().choice,VIDEOS[0].id);
 f.ready();assert(f.players[0].muted);assert.equal(f.players[0].playCalls,1);f.playing();assert.equal(f.controller.getState().phase,'playing');assert.equal(f.nodes['[data-video-stage]'].attributes['data-state'],'video');
 await f.view(.6);assert.equal(f.players.length,1,'repeated visible observations must not rebuild playback');
});
test('leaving the viewport pauses; re-entry resumes muted without replacing the player',async()=>{
 const f=fixture();await f.view(.8);f.ready();f.playing();await f.nodes['[data-video-sound]'].emit('click');assert.equal(f.players[0].muted,false);
 await f.view(0);assert.equal(f.controller.getState().phase,'paused');assert.equal(f.players[0].pauseCalls,1);await f.view(.8);assert.equal(f.players.length,1);assert(f.players[0].muted);assert.equal(f.players[0].playCalls,2);
});
test('manual pause persists through viewport changes until a visitor explicitly plays',async()=>{
 const f=fixture();await f.view(.7);f.ready();f.playing();await f.toggle();assert(f.controller.getState().userPaused);await f.view(0);await f.view(.9);assert.equal(f.players[0].playCalls,1);await f.toggle();assert.equal(f.players[0].playCalls,2);
});
test('provider-native pause is respected and native play restores explicit viewing',async()=>{
 const f=fixture();await f.view(.8);f.ready();f.playing();f.players[0].events.onStateChange({data:2});assert(f.controller.getState().userPaused);f.playing();assert.equal(f.controller.getState().userPaused,false);assert.equal(f.controller.getState().automatic,false);
});
test('reduced-motion and save-data suppress automatic provider loading but allow intentional playback',async()=>{
 for(const option of [{reduced:true},{saveData:true}]){const f=fixture(option);await f.view(.8);assert.equal(f.requests(),0);await f.toggle();f.ready();f.playing();assert.equal(f.controller.getState().phase,'playing');assert.equal(f.controller.getState().automatic,false);}
});
test('changing reduced-motion or pausing page motion stops automatic playback',async()=>{
 const f=fixture();await f.view(.8);f.ready();f.playing();f.preference.matches=true;await f.preference.emit('change');assert.equal(f.controller.getState().phase,'paused');assert.equal(f.players[0].pauseCalls,1);
 const page=fixture();await page.view(.8);page.ready();page.playing();page.controller.setMotionPaused(true);assert.equal(page.controller.getState().phase,'paused');await page.view(.9);assert.equal(page.players[0].playCalls,1);
});
test('a hidden tab pauses playback and a visible tab can resume eligible viewport playback',async()=>{
 const f=fixture();await f.view(.8);f.ready();f.playing();f.scope.document.hidden=true;await f.scope.document.emit('visibilitychange');assert.equal(f.controller.getState().phase,'paused');f.scope.document.hidden=false;await f.scope.document.emit('visibilitychange');assert.equal(f.players[0].playCalls,2);
});
test('closing a pending request invalidates late completions and keeps the text fallback on re-entry',async()=>{
 const f=fixture({deferred:true});await f.view(.8);assert.equal(f.requests(),1);await f.close();f.resolve();await flush();assert.equal(f.players.length,0);assert.equal(f.timers.size,0);assert(f.nodes['[data-video-toggle]'].focused);await f.view(0);await f.view(.8);assert.equal(f.requests(),1);
});
test('scrolling out while the API is pending cannot create a stale offscreen iframe',async()=>{
 const f=fixture({deferred:true});await f.view(.8);await f.view(0);f.resolve();await flush();assert.equal(f.players.length,0);assert.equal(f.controller.getState().phase,'idle');
});
test('an explicitly played hero excerpt returns to its text fallback; stale callbacks cannot revive it',async()=>{
 const f=fixture({preview:true,reduced:true});await f.view(.8);await f.toggle();f.ready();f.playing();assert.deepEqual(f.players[0].clip,{videoId:HERO_CLIP.id,startSeconds:HERO_CLIP.start,endSeconds:HERO_CLIP.end});
 const player=f.players[0];f.scope.document.activeElement=player.frame;player.time=HERO_CLIP.end;for(const tick of [...f.intervals.values()])tick();assert(player.destroyed);assert.equal(f.controller.getState().phase,'ended');assert.equal(f.intervals.size,0);assert(f.nodes['[data-video-toggle]'].focused);
 const status=f.nodes['[data-video-status]'].textContent;player.events.onReady({target:player});player.events.onStateChange({data:1});player.events.onError();assert.equal(f.nodes['[data-video-status]'].textContent,status);assert.equal(f.intervals.size,0);
});
test('an unavailable live embed is unloaded and replaced by an explicitly labelled recording',async()=>{
 const f=fixture();await f.choose('live');await f.view(.8);f.ready();const unavailable=f.players[0];unavailable.events.onError({data:100});await flush();assert(unavailable.destroyed);assert.equal(f.controller.getState().choice,VIDEOS[0].id);assert.equal(f.nodes.select.value,VIDEOS[0].id);assert.equal(f.players.length,2);
 f.ready();f.playing();assert(f.nodes['[data-video-status]'].textContent.includes('recorded service'));assert.equal(f.nodes['[data-video-title]'].textContent,VIDEOS[0].title);
});
test('recording failures try a bounded set of alternatives, then restore a useful text fallback and link recovery',async()=>{
 const f=fixture();await f.view(.8);
 for(let index=0;index<VIDEOS.length;index++){assert.equal(f.players.length,index+1);f.ready();f.players[index].events.onError({data:150});await flush();}
 assert.equal(f.players.length,VIDEOS.length);assert.equal(f.controller.getState().phase,'error');assert.equal(f.nodes['[data-video-stage]'].attributes['data-state'],'idle');assert(f.nodes['[data-video-status]'].textContent.includes('YouTube channel'));
});
test('blocked automatic playback exposes the provider controls and a usable manual play action',async()=>{
 const f=fixture();await f.view(.8);f.ready();f.players[0].events.onAutoplayBlocked();assert.equal(f.controller.getState().phase,'blocked');assert.equal(f.nodes['[data-video-stage]'].attributes['data-state'],'video');assert.equal(f.timers.size,0);assert.equal(f.nodes['[data-video-toggle]'].disabled,false);
});
test('timeouts and API failures clear work without leaving an unavailable iframe',async()=>{
 const stalled=fixture({deferred:true});await stalled.view(.8);for(const timeout of [...stalled.timers.values()])timeout();stalled.resolve();await flush();assert.equal(stalled.players.length,0);assert.equal(stalled.controller.getState().phase,'error');
 const fail=fixture({deferred:true});await fail.view(.8);fail.reject(new Error('offline'));await flush();assert.equal(fail.controller.getState().phase,'error');assert.equal(fail.nodes['[data-video-toggle]'].disabled,false);
});
test('manual playback works when IntersectionObserver is unsupported, with no automatic request',async()=>{
 const f=fixture({noObserver:true});assert.equal(f.requests(),0);await f.toggle();f.ready();f.playing();assert.equal(f.controller.getState().phase,'playing');
});
test('a coordinated player pauses the previous player before starting',async()=>{
 const first=fixture();await first.view(.8);first.ready();first.playing();const second=fixture({beforePlay:()=>first.controller.pause('other')});await second.view(.8);second.ready();second.playing();assert.equal(first.controller.getState().phase,'paused');assert.equal(second.controller.getState().phase,'playing');
});
test('the YouTube API loader shares requests, restores callbacks and supports retry after failure',async()=>{
 const f=fixture();let previous=0;f.scope.onYouTubeIframeAPIReady=()=>previous++;const first=loadYouTubeAPI(f.scope),second=loadYouTubeAPI(f.scope);assert.equal(first,second);assert.equal(f.elements.length,1);assert.equal(f.elements[0].src,'https://www.youtube.com/iframe_api');
 const rejected=assert.rejects(first,/could not load/);await f.elements[0].emit('error');await rejected;assert(f.elements[0].removed);assert.equal(f.timers.size,0);
 const retry=loadYouTubeAPI(f.scope);f.scope.YT=f.api;f.scope.onYouTubeIframeAPIReady();assert.equal(await retry,f.api);assert.equal(previous,1);assert.equal(f.timers.size,0);
});

test('automatic hero playback loops its excerpt muted only while eligible and does not replace the iframe',async()=>{
 const f=fixture({preview:true});await f.view(.8);f.ready();f.playing();const player=f.players[0];player.time=HERO_CLIP.end;for(const tick of [...f.intervals.values()])tick();assert.equal(player.seekCalls,1);assert.equal(player.time,HERO_CLIP.start);assert(player.muted);assert.equal(f.players.length,1);assert.equal(f.controller.getState().phase,'playing');
 await f.view(0);assert.equal(f.controller.getState().phase,'paused');assert.equal(f.intervals.size,0);
});
test('archive deep links accept only published video IDs',()=>{
 assert.equal(requestedRecording('?service='+VIDEOS[1].id),VIDEOS[1].id);assert.equal(requestedRecording('?service=not-published&email=private'),null);assert.equal(requestedRecording(''),null);
});

test('blocked hero playback cancels excerpt polling after an initial successful start',async()=>{
 const f=fixture({preview:true});await f.view(.8);f.ready();f.playing();assert.equal(f.intervals.size,1);f.players[0].events.onAutoplayBlocked();assert.equal(f.intervals.size,0);assert.equal(f.controller.getState().phase,'blocked');
});
