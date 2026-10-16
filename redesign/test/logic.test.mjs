import test from 'node:test';
import assert from 'node:assert/strict';
import {playerUrl,nextSunday,calendar,CHANNEL_ID,RECORDINGS} from '../site/logic.mjs';
test('live embed belongs to the verified channel; published recordings are allowlisted',()=>{
 const live=new URL(playerUrl('live'));assert.equal(live.origin,'https://www.youtube-nocookie.com');assert.equal(live.pathname,'/embed/live_stream');assert.equal(live.searchParams.get('channel'),CHANNEL_ID);
 for(const id of RECORDINGS)assert.equal(new URL(playerUrl(id)).pathname,'/embed/'+id);
 for(const bad of ['','https://example.com','abcdefghijk','live&channel=evil','../watch'])assert.throws(()=>playerUrl(bad));
});
test('next Sunday resolves Central Time correctly across summer, winter, and DST boundaries',()=>{
 for(const [now,start]of [['2026-10-14T18:53:00Z','2026-10-18T16:00:00.000Z'],['2026-10-30T18:00:00Z','2026-11-01T17:00:00.000Z'],['2027-03-12T18:00:00Z','2027-03-14T16:00:00.000Z'],['2026-12-30T18:00:00Z','2027-01-03T17:00:00.000Z']])assert.equal(nextSunday(new Date(now)).start.toISOString(),start);
});
test('scheduled-now is a schedule condition, ends at 12:30, and never represents broadcast state',()=>{
 const before=nextSunday(new Date('2026-10-18T15:59:59Z'));assert.equal(before.scheduledNow,false);
 const during=nextSunday(new Date('2026-10-18T16:01:00Z'));assert.equal(during.scheduledNow,true);assert(!('live'in during));
 assert.equal(nextSunday(new Date('2026-10-18T17:30:00Z')).start.toISOString(),'2026-10-25T16:00:00.000Z');assert.throws(()=>nextSunday(new Date('invalid')));
});
test('calendar uses local recurring time, DST definitions, valid CRLF, and escaped address commas',()=>{
 const result=calendar(new Date('2026-10-14T18:53:00Z'));
 assert(result.includes('DTSTART;TZID=America/Chicago:20261018T110000'));
 assert(result.includes('TZOFFSETTO:-0500'));assert(result.includes('TZOFFSETTO:-0600'));assert(result.includes('RRULE:FREQ=WEEKLY;BYDAY=SU'));assert(result.includes('Court\\, Suite 102\\, Plano'));assert(!/(?<!\r)\n/.test(result));assert(result.endsWith('END:VCALENDAR\r\n'));
});
