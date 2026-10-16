import {CHANNEL_ID,VIDEOS,embedUrl} from './media-config.mjs';
export {CHANNEL_ID};
export const RECORDINGS=VIDEOS.map(video=>video.id);
export const playerUrl=embedUrl;
function parts(date){return Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));}
function asUtc(p){return Date.UTC(p.year,p.month-1,p.day,p.hour||0,p.minute||0,p.second||0);}
function instant(local){let ms=asUtc(local);for(let i=0;i<3;i++)ms+=asUtc(local)-asUtc(parts(new Date(ms)));return new Date(ms);}
export function nextSunday(now=new Date()){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new Error('A valid date is required.');
  const p=parts(now),day=new Date(Date.UTC(p.year,p.month-1,p.day));
  let delta=(7-day.getUTCDay())%7;
  if(delta===0&&(p.hour>12||(p.hour===12&&p.minute>=30)))delta=7;
  day.setUTCDate(day.getUTCDate()+delta);
  const local={year:day.getUTCFullYear(),month:day.getUTCMonth()+1,day:day.getUTCDate(),hour:11,minute:0};
  const start=instant(local),end=instant({...local,hour:12,minute:30});
  return {start,end,scheduledNow:now>=start&&now<end,local};
}
export function calendar(now=new Date()){
  const {local}=nextSunday(now),pad=n=>String(n).padStart(2,'0'),ymd=local.year+pad(local.month)+pad(local.day);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Covenant Embassy//Sunday Worship//EN','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:America/Chicago','BEGIN:DAYLIGHT','DTSTART:20070311T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU','TZOFFSETFROM:-0600','TZOFFSETTO:-0500','TZNAME:CDT','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:20071104T020000','RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU','TZOFFSETFROM:-0500','TZOFFSETTO:-0600','TZNAME:CST','END:STANDARD','END:VTIMEZONE','BEGIN:VEVENT','UID:sunday-worship@rccgcovenantembassy.org','DTSTAMP:'+now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART;TZID=America/Chicago:'+ymd+'T110000','DTEND;TZID=America/Chicago:'+ymd+'T123000','RRULE:FREQ=WEEKLY;BYDAY=SU','SUMMARY:Sunday worship — RCCG Covenant Embassy','LOCATION:3900 Pebblecreek Court\\, Suite 102\\, Plano TX 75023','DESCRIPTION:Confirm any schedule changes with the church. Watch via its official YouTube channel.','URL:https://www.rccgcovenantembassy.org/','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
