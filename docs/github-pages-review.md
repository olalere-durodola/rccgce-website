# GitHub Pages review website

Review address: https://olalere-durodola.github.io/rccgce-website/

The repository being public does not enable Pages. The generated `gh-pages` branch is the publishing source; the Next.js application on `main` is not suitable for direct GitHub Pages hosting.

## One-time GitHub setting

Open https://github.com/olalere-durodola/rccgce-website/settings/pages and select:

1. Source: **Deploy from a branch**.
2. Branch: **gh-pages**.
3. Folder: **/ (root)**.
4. **Save**.

GitHub then builds/deploys the branch. Check the Pages deployment in Actions before treating the review URL as live. The connected GitHub tool does not expose Pages administration, so this setting must be changed in GitHub. No personal access token is needed for that UI step. The account root URL `https://olalere-durodola.github.io/` is a different user site; this project uses `/rccgce-website/`.

## Build and checks

With Node 22 or later, no dependency installation is required for this standalone export:

```sh
node --test scripts/export-github-pages.test.mjs
node scripts/export-github-pages.mjs
```

The output is `build/github-pages/`. Publish only those files to the root of `gh-pages`. The export regenerates the original static design, prefixes internal links and CSS font paths, updates canonical/social URLs, and sets the YouTube API's origin to the GitHub host without a path. The tests check all thirteen pages, every local link/resource/fragment, fonts, embed origin, original church paragraphs, external handoffs and output safety. CI runs the same export tests.

The export is a public **review version**. Its notice accurately describes GitHub Pages hosting and does not claim owner-only access. Per-page noindex/nofollow/noarchive metadata is retained; it requests crawler exclusion and is not an access control. A project-level robots.txt cannot control the whole shared github.io origin. The empty sitemap is retained for this review. Church-domain SEO/indexing configuration remains separate.

All church copy and published media are retained. The account/admin/API/Prisma code, databases, extraction records, credentials, Site hosting manifest and source maps are excluded. Giving and choir membership continue to the church's existing external destinations. The export has no login, member database, payment processor, submission API or analytics integration.

`review-source.json` records the design source commit and exporter SHA-256. It does not claim that generated files are an independently tested live deployment. Desktop/mobile rendering, keyboard behavior and actual YouTube playback remain unverified because supported browser QA is unavailable in this managed workspace. The church's current custom domain and the separate Sites review are unchanged by this export.

Future changes to `main` do not automatically update the snapshot branch. Rebuild and replace the generated branch deliberately after review. The exporter source PR must be merged only with a new explicit merge instruction; preparing the generated review branch does not merge that PR.
