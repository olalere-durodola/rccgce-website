export const SITE_ORIGIN='https://covenant-embassy-redesign.deephaven17.chatgpt.site';
export const CHANNEL_ID='UC2SWEy5owK5IbCjth4xZMTQ';
export const VIDEOS=Object.freeze([
  {id:'ZLl7B5PcLmA',title:'Sunday service · October 11, 2026',detail:'Recorded service from Covenant Embassy'},
  {id:'Wonec0jyv74',title:'Sunday service · August 16, 2026',detail:'Recorded service from Covenant Embassy'},
  {id:'tQdeTvujE54',title:'Sunday service · August 9, 2026',detail:'Recorded service from Covenant Embassy'},
  {id:'shYPLGaY4_0',title:'What is the Kingdom of God?',detail:'Pastor Shola Adeyemo · Recorded message'}
]);
export const HERO_CLIP=Object.freeze({id:'ZLl7B5PcLmA',start:3600,end:3630});
export const HERO_CAPTION=VIDEOS.find(video=>video.id===HERO_CLIP.id).title+' · 30-second preview';
export function requestedRecording(search){const id=new URLSearchParams(search).get('service');return VIDEOS.some(video=>video.id===id)?id:null;}
export function embedUrl(selection,origin=SITE_ORIGIN,clip=false){
  const site=new URL(origin);
  if(site.protocol!=='https:'||site.origin!==origin)throw new Error('Use the current HTTPS site origin.');
  if(selection!=='live'&&!VIDEOS.some(video=>video.id===selection))throw new Error('Choose a published church recording.');
  if(clip&&selection==='live')throw new Error('A recorded excerpt cannot be live.');
  const url=new URL('https://www.youtube-nocookie.com/embed/'+(selection==='live'?'live_stream':selection));
  for(const [key,value]of Object.entries({enablejsapi:1,autoplay:0,playsinline:1,controls:1,rel:0,origin}))url.searchParams.set(key,value);
  if(selection==='live')url.searchParams.set('channel',CHANNEL_ID);
  if(clip){url.searchParams.set('start',HERO_CLIP.start);url.searchParams.set('end',HERO_CLIP.end);}
  return url.href;
}
