import {cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {SITE_ORIGIN} from '../redesign/site/media-config.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const REVIEW_URL = 'https://olalere-durodola.github.io/rccgce-website/';

function files(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

export function exportPages({output = join(root, 'build/github-pages'), siteUrl = REVIEW_URL} = {}) {
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) {
    throw new Error('Use an HTTPS review URL without credentials, query or fragment.');
  }
  const base = site.pathname.replace(/\/$/, '');
  const website = site.origin + base;
  output = resolve(output);
  // Inside the checkout, only generated build/ output may be replaced.
  const source = root.replaceAll('\\', '/') + '/';
  const destination = output.replaceAll('\\', '/') + '/';
  if (source.startsWith(destination) || (destination.startsWith(source) && !destination.startsWith(source + 'build/'))) {
    throw new Error('Export output must be separate from source and redesign/dist.');
  }
  const built = spawnSync(process.execPath, [join(root, 'redesign/scripts/build.mjs')], {encoding: 'utf8'});
  if (built.status !== 0) throw new Error(built.stderr || 'Redesign build failed.');
  const dist = join(root, 'redesign/dist');
  rmSync(output, {recursive: true, force: true});
  mkdirSync(output, {recursive: true});
  cpSync(dist, output, {recursive: true});
  for (const path of files(output)) {
    if (!/\.(html|css|mjs)$/.test(path)) continue;
    let text = readFileSync(path, 'utf8');
    if (path.endsWith('.html')) {
      text = text.replaceAll(SITE_ORIGIN, website)
        .replace(/\b(href|src|poster|action)=(["'])(\/(?!\/)[^"']*)\2/g,
          (_, attr, quote, value) => `${attr}=${quote}${base}${value}${quote}`)
        .replaceAll('This private redesign', 'This review website')
        .replaceAll('this private preview', 'this public review version')
        .replaceAll('This private preview', 'This public review version')
        .replaceAll('the private Covenant Embassy redesign', 'the Covenant Embassy review website')
        .replaceAll('Updated October 14, 2026.', 'Updated October 18, 2026.')
        .replaceAll('This redesign is privately hosted. The current public church website remains at www.rccgcovenantembassy.org. Hosting and sign-in services may process request and account information to deliver this preview and control access.',
          'This review website is publicly viewable on GitHub Pages. The current church website remains at www.rccgcovenantembassy.org. GitHub processes request information, including visitor IP addresses, to host and protect this website. This version has no account sign-in. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.')
        .replaceAll('before public release.', 'before launch on the church’s own domain.');
    } else if (path.endsWith('.css')) {
      text = text.replace(/url\((["']?)(\/(?!\/)[^)"']+)\1\)/g,
        (_, quote, value) => `url(${quote}${base}${value}${quote})`);
    } else {
      // The YouTube API origin must be the origin alone, never the project path.
      text = text.replaceAll(SITE_ORIGIN, site.origin);
    }
    writeFileSync(path, text);
  }
  writeFileSync(join(output, '.nojekyll'), '');
  const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found — Covenant Embassy</title><link rel="stylesheet" href="${base}/styles.css"></head><body><main class="wrap section"><h1>Page not found.</h1><p><a class="button" href="${base}/">Return to Covenant Embassy</a></p></main></body></html>`;
  writeFileSync(join(output, '404.html'), notFound);
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'});
  writeFileSync(join(output, 'review-source.json'), JSON.stringify({
    source_repository: 'https://github.com/olalere-durodola/rccgce-website',
    design_source_commit: commit.status === 0 ? commit.stdout.trim() : null,
    exporter_sha256: createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
    review_url: website + '/',
    scope: 'Static review website; account/admin/API/database are excluded; giving and groups use existing church handoffs.',
  }, null, 2) + '\n');
  return {output, website, files: files(output)};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = exportPages();
  console.log(`Exported ${result.files.length} static review files to ${result.output} for ${result.website}/`);
}
