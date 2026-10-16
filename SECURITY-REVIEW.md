# Redesign security and verification review

Recorded October 16, 2026. This is a source/automated-check review, not a penetration test, browser acceptance, or public-release approval.

## Dependency remediation

| Scope | Before | After |
| --- | --- | --- |
| Production audit | 18: 5 moderate, 9 high, 4 critical | 0 |
| Complete audit, including development tools | 30: 8 moderate, 18 high, 4 critical | 5 high; 0 critical/moderate |

Both are npm audit package-entry counts, not counts of distinct vulnerabilities. Results are a dated registry snapshot and may change as advisories are published.

The lockfile now resolves Next.js / eslint-config-next 16.4.2, next-auth 5.0.0-beta.32, @auth/core 0.41.3, @auth/prisma-adapter 2.11.3, all three direct Prisma packages 7.10.1, and Vitest 4.1.12. Compatible transitive packages were refreshed, including Sharp 0.35.5 and patched PostCSS versions. No forced major downgrade or advisory suppression was used.

Official references:

- [Next.js October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026).
- [Auth.js configuration-error behavior](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-8fpg-xm3f-6cx3).
- [Auth.js OAuth cookie provider binding](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279).

## Open development-only advisory

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects braces through 3.0.3. No patched release is published as of this review. Deeply nested brace patterns can exhaust the call stack. The five audit entries are the same dependency chain:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`

All five packages are marked `dev: true` in the lockfile. They are absent from the production-only dependency audit and are not imported by application/runtime source. This limits the observed exposure to development/CI tooling; it does not remove the vulnerability or make the full audit clean. Lint configuration and patterns should remain trusted repository inputs. A crafted lint pattern can still terminate a lint process.

The verification workflow has read-only repository permissions, a ten-minute timeout, no deployment step, and an isolated build database. These contain CI impact; they are not a package patch. The full audit step deliberately records its nonzero result and uploads the JSON report. Only the production audit is the blocking security check. npm's proposed downgrade to eslint-config-next 14.2.35 would replace the current framework tooling and was not applied.

Keep this finding open until a reviewed upstream fix or compatible supported replacement removes the vulnerable chain. Do not rename the dependency, exclude it from audit, or report it as resolved.

## Authentication and verification changes

- Account/admin helpers reject missing, non-string and blank account IDs even when the authentication result is truthy.
- Private redesign delivery rejects malformed auth results and returns an uncached/noindex 503 when authentication throws, without reading the page or exposing provider details.
- Regression cases cover these denials, existing reviewer/member/admin permissions and exact route allowlisting.
- All seven lint warnings were removed. The Arch child-content test uses a real text child rather than an unused image fixture; its child-rendering assertion is retained. Lint warnings now fail the check.
- Test mocks explicitly declare guest/member result types for the updated Vitest types; payment route behavior is unchanged.

Commands for repeatable checks:

```sh
npm run audit:production
npm audit --json                 # Currently exits 1 for the five open dev findings
npm test
npm run lint
npm run test:redesign
python scripts/create-build-fixture.py
# Use only that newly generated fixture DATABASE_URL for the production build.
npm run build
npm run validate:redesign
npm run validate:content
```

## Remaining acceptance work

No supported control-browser is available in this managed workspace. The Sites workflow explicitly prohibits installing or substituting another browser path for that missing capability. Therefore browser evidence is **not run**, not passed:

| Review | Required observations |
| --- | --- |
| Responsive pages | 360/390, 768, 1024 and 1440 px; all 13 routes; readable text and no unintended horizontal overflow |
| Navigation/accessibility | Mobile menu, keyboard order, visible focus, Escape/focus return, zoom/reflow and actual control states |
| Media | Muted viewport autoplay, offscreen pause, manual pause persistence, hidden-tab behavior, reduced motion, blocked-provider fallback, recording and live-channel selection |
| Deployed Next.js auth | Anonymous sign-in redirect, ordinary member denial, allowlisted reviewer access, administrator access, logout and denied content after logout |
| External handoffs | Actual directions/calendar behavior and correct existing church checkout/choir portal destinations; no real payment is authorized by these tests |

The owner-private Sites preview remains a separate existing deployment. This GitHub change has not deployed the Next.js integration, changed sharing, replaced Wix, merged main, or approved public access. Final-domain SEO/Search Console/indexing and real payment migration are separate release work.
