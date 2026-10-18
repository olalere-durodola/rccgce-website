import {nextSunday,calendar} from './logic.mjs';
import {setupVideo} from './video.mjs';
import {requestedRecording} from './media-config.mjs';
const requestedService=requestedRecording(window.location.search);
if(requestedService){const selection=document.querySelector('[data-video=service] select');if(selection)selection.value=requestedService;}
document.documentElement.classList.add('site-enhanced');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),animations=new Set(),controllers=[];
let paused=false;
function cancel(){for(const animation of animations)animation.cancel();animations.clear();}
function enter(element,delay=0){if(paused||reduced.matches||document.hidden||!element.animate)return;const animation=element.animate([{opacity:.9,transform:'translateY(7px)',filter:'blur(1.5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],{duration:520,delay,easing:'cubic-bezier(.23,1,.32,1)'});animations.add(animation);animation.onfinish=()=>animations.delete(animation);}
const motion=document.querySelector('#motion-toggle');
function updateMotion(){document.documentElement.dataset.motion=paused?'paused':'running';motion.textContent=paused?'Resume page motion':'Pause page motion';motion.setAttribute('aria-pressed',String(paused));if(paused||reduced.matches)cancel();for(const controller of controllers)controller.setMotionPaused(paused);}
motion.addEventListener('click',()=>{paused=!paused;updateMotion();});reduced.addEventListener('change',updateMotion);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
document.querySelectorAll('[data-hero]').forEach((element,index)=>enter(element,index*45));
const menuButton=document.querySelector('#menu-toggle'),menu=document.querySelector('#site-menu');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open all pages');}
menuButton.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;menuButton.setAttribute('aria-expanded',String(opening));menuButton.setAttribute('aria-label',opening?'Close all pages':'Open all pages');});
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
for(const element of document.querySelectorAll('[data-next-service]')){const service=nextSunday();element.textContent=service.scheduledNow?'Sunday worship is scheduled now. Open the church’s YouTube channel for broadcast availability.':'Next Sunday worship: '+new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'long',month:'long',day:'numeric'}).format(service.start)+' · 11 am Central';}
for(const button of document.querySelectorAll('[data-calendar]')){button.hidden=false;button.addEventListener('click',()=>{const file=new Blob([calendar()],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download='Covenant-Embassy-Sunday.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});}
for(const container of document.querySelectorAll('[data-video]')){let controller;controller=setupVideo(container,window,{beforePlay:()=>{for(const other of controllers)if(other!==controller)other.pause('other');}});controllers.push(controller);}
updateMotion();
