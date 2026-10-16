from pathlib import Path
from lxml import html
import json,re,xml.etree.ElementTree as ET
from urllib.parse import urlsplit,parse_qs
root=Path(__file__).resolve().parents[1];public=root/'dist';count=0
def check(value,message):
 global count
 assert value,message
 count+=1
paths=['/','/watch','/visit','/about','/groups','/gallery','/events','/articles','/contact','/give','/privacy']
past_events=json.loads((root/'content/legacy-content.json').read_text())['events']
paths.extend(event['destination'] for event in past_events)
routes={p:('index.html' if p=='/' else p.lstrip('/')+'/index.html') for p in paths}
origin='https://covenant-embassy-redesign.deephaven17.chatgpt.site'
for route,file in routes.items():
 raw=(public/file).read_text();page=html.fromstring(raw)
 check(page.xpath('//html/@lang')==['en'],route+' language')
 check(len(page.xpath('//h1'))==1,route+' one h1')
 check(len(page.xpath('//main'))==1,route+' main landmark')
 description=page.xpath('//meta[@name="description"]/@content')
 check(len(description)==1 and 10<=len(description[0])<=250 and '<' not in description[0],route+' concise text metadata')
 check(page.xpath('//meta[@name="robots"]/@content')==['noindex, nofollow, noarchive'],route+' private robots')
 check(page.xpath('//link[@rel="canonical"]/@href')==[origin+route],route+' canonical')
 check(not page.xpath('//iframe'),route+' no iframe before client viewport decision')
 check(not page.xpath('//form'),route+' no fake send/payment form')
 check('ratova' not in raw.lower(),route+' client isolation')
 check(page.xpath('//link[@rel="stylesheet"]/@href')==['/styles.css'],route+' same shared stylesheet')
 check(page.xpath('//meta[@name="theme-color"]/@content')==['#1b1b1b'],route+' same charcoal identity')
 check(page.xpath('//header//img/@src')==['/assets/church-logo.jpg'],route+' authentic shared logo')
 check(not page.xpath('//*[@style]'),route+' no inline page-specific visual overrides')
 check(all(src=='/assets/church-logo.jpg' for src in page.xpath('//img/@src')),route+' no photographic imagery')
 check(len(page.xpath('//button[@id="motion-toggle"]'))==1,route+' page-motion control')
 check(len(page.xpath('//nav[@aria-label="All pages"]/a'))>=10,route+' full themed navigation')
 check(all(not url.startswith('https:') for url in page.xpath('//header//nav/a/@href | //footer//nav/a/@href')),route+' navigation stays in the redesign')
 if route.startswith('/events/'):
  check(page.xpath('//nav[@aria-label="Breadcrumb"]/*[@aria-current="page"]'),route+' current event identified')
 elif route!='/':check(len(page.xpath('//a[@href="'+route+'" and @aria-current="page"]'))>=1,route+' current page identified')
 if route=='/privacy':
  check(not page.xpath('//h1[@data-hero]'),route+' no decorative policy heading motion')
  check('attempt muted playback when the media enters view' in raw,route+' automatic provider loading accurately disclosed')
 if route=='/groups':check('Open choir member portal on the current website' in raw,route+' external functional portal labelled')
 if route=='/give':check('existing checkout' in raw and 'does not collect or process payments' in raw,route+' genuine checkout and preview boundary')
 ids=page.xpath('//@id');check(len(ids)==len(set(ids)),route+' unique IDs')
 for value in page.xpath('//@aria-labelledby | //@aria-controls'):
  check(all(name in ids for name in value.split()),route+' valid ARIA reference')
 for url in page.xpath('//a/@href'):
  if url.startswith('#'):check(url[1:] in ids,route+' local anchor '+url)
  elif url.startswith('/'):
   parsed=urlsplit(url);check(parsed.path in routes or (public/parsed.path.lstrip('/')).is_file(),route+' internal destination '+url)
   if parsed.query:check(parsed.path=='/watch' and parse_qs(parsed.query).get('service',[None])[0] in ['ZLl7B5PcLmA','Wonec0jyv74','tQdeTvujE54','shYPLGaY4_0'],route+' trusted recording deep link')
  elif url.startswith('https:'):check(not any(x in url for x in ['example.com','placeholder','javascript:']),route+' real external destination')
  else:check(url.startswith('mailto:covenantembassy@gmail.com'),route+' verified email')
 for asset in page.xpath('//script[@src]/@src | //link[@rel="stylesheet"]/@href | //link[@rel="icon"]/@href | //link[@rel="preload"]/@href | //img/@src'):
  check(asset.startswith('/') and (public/asset.lstrip('/')).is_file(),route+' local asset '+asset)
 for image in page.xpath('//img'):check('alt' in image.attrib and image.get('width') and image.get('height'),route+' image description and reserved size')
 for button in page.xpath('//button'):check(button.get('aria-label') or button.text_content().strip(),route+' button name')
 for select in page.xpath('//select'):
  check(page.xpath('//label[@for="'+select.get('id')+'"]'),route+' select label')
  check(select.xpath('./option[1]/@value')==['ZLl7B5PcLmA'],route+' recorded default instead of unreliable live splash')
 for feature in page.xpath('//figure[@data-video]'):
  check(feature.xpath('.//*[@data-video-stage]') and feature.xpath('.//div[@data-video-poster]'),route+' photo-free static media fallback')
  check(feature.xpath('.//button[@data-video-toggle and @hidden]'),route+' manual playback fallback progressively enhanced')
  check(feature.xpath('.//a[contains(@href,"youtube.com")]'),route+' provider recovery link')
  check(feature.xpath('.//*[@data-video-status and @role="status"]'),route+' media status')
 for text in page.xpath('//script[@type="application/ld+json"]/text()'):
  data=json.loads(text);check(data['@type']=='Church' and data['address']['addressLocality']=='Plano',route+' truthful Church schema')
css=(public/'styles.css').read_text()
check(css.count('{')==css.count('}'),'Balanced CSS')
check('prefers-reduced-motion' in css and 'html[data-motion=paused]' in css,'OS and visitor motion controls')
check('(hover:hover) and (pointer:fine)' in css,'Touch-gated hover motion')
check('.no-script-menu' in css,'No-JavaScript navigation')
for url in re.findall(r'url\([\'"]?([^\)\'"]+)',css):check((public/url.lstrip('/')).is_file(),'Self-hosted font '+url)
for file in public.glob('*.mjs'):
 code=file.read_text();check(not re.search(r'localStorage|sessionStorage|document\.cookie|fetch\(',code),file.name+' no storage or submission')
 for imp in re.findall(r"from ['\"]\./([^'\"]+)",code):check((public/imp).is_file(),file.name+' imported module')
check(not any((public/'assets'/name).exists() for name in ['worship-original.jpg','gallery-b.jpg','gallery-a.jpg','pastor-original.jpg']),'Photography excluded from deployment')
check('Disallow: /' in (public/'robots.txt').read_text(),'Private crawler exclusions')
check(not list(ET.fromstring((public/'sitemap.xml').read_text())),'No private URLs submitted in sitemap')
manifest=json.loads((root/'.openai/hosting.json').read_text());check(manifest['project_id']=='appgprj_6acfd097665c8191892063e0f3cb8085','Preserved Site identity');check(manifest['static']['directory']=='dist','Static output configured')
def luminance(color):
 values=[int(color[i:i+2],16)/255 for i in (1,3,5)]
 return sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for w,v in zip((.2126,.7152,.0722),values))
for text,bg in [('#f4f0e9','#1b1b1b'),('#b7b4ae','#1b1b1b'),('#b7b4ae','#222220'),('#ffffff','#141414'),('#c7c3bc','#141414'),('#ffffff','#34332f'),('#191919','#db9c55'),('#191919','#edb879')]:
 a,b=sorted([luminance(text),luminance(bg)]);check((b+.05)/(a+.05)>=4.5,'Specified resting text contrast '+text+'/'+bg)
print(f'{count} checks passed across {len(paths)} themed pages, routes, media fallbacks, assets, privacy and specified resting contrast. Browser/layout/actual-playback checks are not run.')
