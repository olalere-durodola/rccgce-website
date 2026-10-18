import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {exportPages, REVIEW_URL} from './export-github-pages.mjs';

const temporary = mkdtempSync(join(tmpdir(), 'rccg-pages-'));
let result;
before(() => { result = exportPages({output: join(temporary, 'site')}); });
after(() => rmSync(temporary, {recursive: true, force: true}));
const html = path => readFileSync(join(result.output, path), 'utf8');

test('all thirteen complete pages are exported with the correct canonical and review exclusions', () => {
  const routes = JSON.parse(readFileSync(new URL('../redesign/routes.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(routes).length, 13);
  for (const entry of Object.values(routes)) {
    const page = html(entry.file);
    assert.ok(page.includes(`rel="canonical" href="${REVIEW_URL.replace(/\/$/, '')}${entry.path}"`));
    assert.ok(page.includes('content="noindex, nofollow, noarchive"'));
    assert.ok(page.includes('id="main"'));
    assert.ok(page.includes('3900 Pebblecreek'));
  }
});

test('every local HTML link, resource and fragment resolves inside the project path', () => {
  for (const file of result.files.filter(path => path.endsWith('.html'))) {
    const page = readFileSync(file, 'utf8');
    for (const [, value] of page.matchAll(/(?:href|src|poster|action)="([^"]*)"/g)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue;
      const documentUrl = new URL(relative(result.output, file).replaceAll('\\', '/'), REVIEW_URL);
      const url = new URL(value.replaceAll('&amp;', '&'), documentUrl);
      assert.ok(url.pathname.startsWith('/rccgce-website/'), value);
      const relativePath = decodeURIComponent(url.pathname.slice('/rccgce-website/'.length));
      let target = join(result.output, relativePath);
      if (!existsSync(target) || !/\.[a-z0-9]+$/i.test(target)) target = join(target, 'index.html');
      assert.ok(existsSync(target), `${file}: ${value}`);
      if (url.hash && target.endsWith('.html')) {
        assert.ok(readFileSync(target, 'utf8').includes(`id="${url.hash.slice(1)}"`), value);
      }
    }
  }
});

test('font URLs and YouTube API origin are correct for project hosting', async () => {
  const css = html('styles.css');
  for (const [, path] of css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g)) {
    assert.ok(path.startsWith('/rccgce-website/'));
    assert.ok(existsSync(join(result.output, path.slice('/rccgce-website/'.length))));
  }
  const media = await import(pathToFileURL(join(result.output, 'media-config.mjs')).href);
  assert.equal(media.SITE_ORIGIN, new URL(REVIEW_URL).origin);
  assert.equal(new URL(media.embedUrl(media.HERO_CLIP.id)).searchParams.get('origin'), new URL(REVIEW_URL).origin);
  assert.equal(media.HERO_CLIP.id, 'ZLl7B5PcLmA');
});

test('public review notice is accurate and existing external handoffs remain', () => {
  assert.match(html('privacy/index.html'), /publicly viewable on GitHub Pages/);
  assert.match(html('privacy/index.html'), /visitor IP addresses/);
  assert.doesNotMatch(html('privacy/index.html'), /privately hosted|control access|This private preview/);
  assert.match(html('give/index.html'), /https:\/\/www\.rccgcovenantembassy\.org\/#comp-/);
  assert.match(html('groups/index.html'), /https:\/\/www\.rccgcovenantembassy\.org\/group\//);
  assert.ok(result.files.every(path => !/node_modules|prisma|\.openai|legacy-content|legacy-source|\.env/.test(path)));
  assert.ok(existsSync(join(result.output, '.nojekyll')));
  assert.match(html('404.html'), /href="\/rccgce-website\/"/);
});

test('all migrated church paragraphs survive the hosting conversion verbatim', () => {
  const legacy = JSON.parse(readFileSync(new URL('../redesign/content/legacy-content.json', import.meta.url), 'utf8'));
  const pages = result.files.filter(path => path.endsWith('.html')).map(path => readFileSync(path, 'utf8')).join('\n');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  let count = 0;
  for (const section of Object.values(legacy.sections)) {
    for (const paragraph of section.paragraphs) {
      assert.ok(pages.includes(`<p>${escape(paragraph)}</p>`), paragraph.slice(0,80));
      count++;
    }
  }
  assert.equal(count, 14);
});

test('root-domain hosting also works and output cannot overwrite source', () => {
  const root = exportPages({output: join(temporary, 'root'), siteUrl: 'https://example.github.io/'});
  assert.match(readFileSync(join(root.output, 'index.html'), 'utf8'), /href="\/styles.css"/);
  assert.throws(() => exportPages({siteUrl: 'http://example.com/'}), /HTTPS/);
  assert.throws(() => exportPages({output: resolve('.')}), /separate/);
  assert.throws(() => exportPages({output: resolve('scripts')}), /separate/);
});
