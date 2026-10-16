"""Compare migrated text with the captured public source, not rewritten summaries."""
import json
from datetime import datetime
from pathlib import Path
from lxml import html

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'content/legacy-source.json').read_text())
content = json.loads((root / 'content/legacy-content.json').read_text())
pages = {page['url']: page for page in source['pages']}
checks = 0
paragraphs_checked = 0

def check(condition, description):
    global checks
    assert condition, description
    checks += 1

def normalized(value):
    return ' '.join(value.replace('\u200b', '').replace('\xa0', ' ').split())

def page_text(route):
    path = root / 'dist' / ('index.html' if route == '/' else route.lstrip('/') + '/index.html')
    document = html.fromstring(path.read_text())
    return normalized(' '.join(document.xpath('//main')[0].itertext()))

check(len(pages) == 15, 'All fifteen discovered public routes captured')
check(len(source['sitemaps']) == 4, 'All four source sitemaps inventoried')
check(all(source['shared_shell'].values()), 'Original header and footer captured separately')
for page in pages.values():
    check(page.get('status') == 200 and page.get('text'), page['url'] + ' captured public text')
    disposition = page.get('migration', {})
    check(disposition.get('destination') and disposition.get('status') and disposition.get('notes'), page['url'] + ' migration or exclusion accounted for')

for key, section in content['sections'].items():
    original = next(block for block in pages[section['source_url']]['rich_text'] if block['id'] == section['source_id'])
    check(section['paragraphs'] == original['paragraphs'], key + ' preserves original paragraphs')
    destination = page_text(section['destination'])
    for paragraph in original['paragraphs']:
        check(normalized(paragraph) in destination, key + ' complete paragraph present in destination')
        paragraphs_checked += 1

for event in content['events']:
    original = pages[event['source_url']]['event']
    destination = page_text(event['destination'])
    for field in ['title', 'date', 'location', 'status', 'about']:
        check(event[field] == original[field], event['slug'] + ' original ' + field)
    for value in [original['title'], original['date'], original['location'], original['status'], *original['about']]:
        check(normalized(value) in destination, event['slug'] + ' source text is present')
    check('Past event' in destination and 'This event has passed.' in destination, event['slug'] + ' explicitly past')
    check(datetime.fromisoformat(event['end']) < datetime.fromisoformat(source['extracted_at']), event['slug'] + ' archive date is in the past')
    check(event['title'] in page_text('/events'), event['slug'] + ' reachable from event archive')

group = content['group']
for field in ['name', 'privacy', 'members', 'access', 'visibility', 'visibility_text', 'created', 'creator']:
    check(group[field] in pages[group['source_url']]['text'], 'Group ' + field + ' is source-backed')
    check(group[field] in page_text(group['destination']), 'Group ' + field + ' present')
for field in ['heading', 'empty_heading', 'empty_text']:
    value = content['articles'][field]
    check(value in pages[content['articles']['source_url']]['text'] and value in page_text('/articles'), 'Articles ' + field + ' preserved')
for collection in content['gallery']:
    for value in [collection['title'], collection['year']]:
        if value:
            check(value in pages[collection['source_url']]['text'] and value in page_text('/gallery'), 'Gallery collection text preserved: ' + value)
for value in [content['giving']['title'], content['giving']['reference'], *content['giving']['frequencies']]:
    check(value in pages[source['source_origin']]['text'] and value in page_text('/give'), 'Original giving information preserved: ' + value)
for value in [content['study']['title'], content['study']['meeting_id'], content['study']['passcode']]:
    check(value in pages[source['source_origin']]['text'] and value in page_text('/visit'), 'Public Bible Study information preserved')

all_new = ' '.join(normalized(' '.join(html.fromstring(path.read_text()).xpath('//main')[0].itertext())) for path in (root / 'dist').rglob('index.html'))
for false_state in ['Thank you, Donor Name', 'donation of $0', 'donation number is #1000', 'Thanks for submitting!', 'Sundays: 8am, 10am, 12pm & 5pm', 'Proudly created with Wix.com']:
    check(false_state not in all_new, 'Legacy placeholder/system/conflicting text is not a current fact: ' + false_state)
for private_source in ['legacy-source.json', 'legacy-content.json']:
    check(not list((root / 'dist').rglob(private_source)), 'Internal extraction record is not a deployed asset')

print(f'{checks} migration checks passed; {paragraphs_checked} original church paragraphs and both complete past-event entries verified against generated page text. Source-only UI, conflicts and gated content are recorded explicitly. This is not browser QA.')
