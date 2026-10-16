# Original-site text migration

Source: https://www.rccgcovenantembassy.org/

Captured: 2026-10-15T04:16:35.265162+00:00

Discovery covered all four Wix sitemaps and linked same-origin public pages. Fifteen public routes returned HTTP 200. Clean extracted words, original rich-text paragraphs, source hashes and the shared shell are retained in `content/legacy-source.json`. Private member content was not accessed.

| Old route | New destination | Disposition |
| --- | --- | --- |
| / | / | migrated |
| /blank-1 | /about | migrated |
| /blank-2 | /contact | review needed |
| /blank-4 | /visit | partially migrated |
| /blog | /articles | migrated |
| /donation-thank-you-page | /give | source only |
| /event-details-registration/just-worship-2026 | /events/just-worship-2026 | migrated |
| /event-details-registration/special-mothers-day-service | /events/special-mothers-day-service | migrated |
| /group/regeneration-choir | /groups | migrated |
| /group/regeneration-choir/discussion | /groups | access gated |
| /groups | /groups | mapped |
| /portfolio | /gallery | migrated |
| /portfolio/our-pastor-and-his-lovely-wife | /gallery | migrated |
| /portfolio/youth-sunday-service | /gallery | migrated |
| /upcoming-events | /events | migrated |

The complete welcome, Who We Are, beliefs, vision and community paragraphs are inserted without rewriting. Both archived event entries preserve every available description paragraph, title, date, location and registration status. Article empty-state text, public choir information, gallery captions/year, public Bible Study joining details and giving information are included in the relevant surfaces.

Source-only exceptions:

- Conflicting Contact service times and the disputed prayer/School minute boundaries remain recorded for church confirmation; they are not current visitor facts.
- The donation thank-you template contains Donor Name, $0 and #1000. No real receipt or successful payment is implied.
- Hidden form success states, duplicate navigation/player/feed widgets and empty portfolio fields are recorded rather than represented as working new features.
- The old Wix footer credit is retained as source evidence; the new site uses its actual identity and hosting.
- Member-only discussions/files were not retrieved. Public access information links to the existing portal.
- Original photography stays excluded. The gallery collection titles and year are retained, with explicit links to the original collections.

Validation: `npm run validate:content` compares captured paragraphs to generated page text and checks complete event data, source-backed public fields, explicit archive labels and excluded false states. It does not establish mobile/browser layout or media playback acceptance.
