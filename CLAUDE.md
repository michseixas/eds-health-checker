# EDS Site Health Checker — Claude Instructions

## What this project is
A browser-based tool that audits Adobe Edge Delivery Services (EDS/Franklin) sites.
The user enters a URL, the tool runs all checks in parallel, and outputs a visual dashboard + PDF report.

## EDS context
- EDS pages are served from `aem.live` (production) and `aem.page` (preview)
- Blocks are `<div>` elements whose first class matches the block name (e.g. `<div class="hero">`)
- Metadata comes from a table in the source Google Doc, rendered as standard `<meta>` tags
- EDS images should route through `./media/` or `media_*` URLs — external image URLs are a red flag
- Target Lighthouse score for any EDS site: 100/100

## Check modules
Each check lives in `scripts/checks/`. Every module must export:

```js
export async function run(url) {
  return {
    id: 'check-id',          // kebab-case string
    label: 'Human Label',    // shown in the dashboard card
    status: 'pass',          // 'pass' | 'warn' | 'fail'
    findings: [],            // string[] — empty on pass
    checks: [],              // string[] — verified criteria, shown on passing cards
  };
}
```

Use a `result(status, findings)` helper that closes over a module-level `CHECKS` array.
This is the established pattern — every check module follows it.

When adding a new check:
1. Use the `/new-check` slash command to scaffold the file
2. Wire it into `main.js` (import + CHECKS array entry)
3. One check per commit/PR — this is the established practice
4. Do NOT modify `main.js` for anything other than wiring in a new check

## Current checks (18)

| File | Label | What it audits |
|---|---|---|
| `performance.js` | Performance | PageSpeed Insights API — CWV / Lighthouse score |
| `metadata.js` | Metadata Completeness | title, description, og:image, canonical, og:title, og:description, robots |
| `blocks.js` | Block Structure | EDS block conventions — block names, row structure, inline styles/IDs |
| `images.js` | Image Routing | media_ pipeline routing, external images, data URIs, dimensions, picture wrapping |
| `redirect.js` | Redirect Check | aem.page vs aem.live, HTTP→HTTPS redirects |
| `headings.js` | Heading Hierarchy | single h1, non-empty h1, no skipped levels |
| `links.js` | Link Health | broken same-origin links, non-HTTPS, missing rel="noopener", suspicious hrefs |
| `fonts.js` | Font Loading | render-blocking font CDN stylesheets, @import, preconnect hints, external @font-face |
| `inline-styles.js` | Inline Styles | !important, theming props inline, body style tags, volume of styled elements |
| `accessibility.js` | Accessibility | img alt, linked image alt, form labels, button names, onclick without role, contrast |
| `lazy-loading.js` | Lazy Loading | LCP image loading="lazy" (fail), fetchpriority="high" (warn), non-LCP missing lazy |
| `script-loading.js` | Script Loading | render-blocking scripts in head, async scripts, large inline scripts |
| `duplicate-ids.js` | Duplicate IDs | any id attribute appearing more than once in the document |
| `structured-data.js` | Structured Data | JSON-LD presence, valid JSON, @context/@type, high-value schemas |
| `ai-readiness.js` | AI Readiness | llms.txt at domain root, robots.txt AI crawler policy |
| `sitemap.js` | Sitemap | /sitemap.xml reachability, valid XML, loc entries, URL in sitemap, robots Sitemap: directive |
| `viewport.js` | Viewport Meta | `<meta name="viewport">` presence, width=device-width, initial-scale=1 |
| `lang.js` | Language Attribute | `<html lang>` presence, non-empty, valid BCP 47 tag |

## Conventions
- Vanilla JS only — no frameworks, no build step
- ES module syntax (`import`/`export`) throughout
- CSS custom properties for all colors/spacing — define tokens in `styles/main.css`,
  never hardcode values elsewhere
- No external dependencies — PDF export uses `window.print()` with `@media print` CSS
- All page fetches go through `/proxy?url=...` on the local dev server (bypasses CORS)
- Domain-root files (robots.txt, llms.txt, sitemap.xml) are also fetched via `/proxy`
- Shared fetch helpers live in `scripts/lib/fetch.js` — import from there, never redefine locally:
  - `fetchAndParse(url)` → parses HTML via proxy, throws on error
  - `fetchRaw(url)` → returns `{ ok, body }`, never throws
  - `truncate(src, max?)` → truncates a string with …
  - `addCapped(findings, items, format, label, max?)` → capped findings list

## Project structure
```
index.html                          # Entry point — URL form + #dashboard mount
styles/
  main.css                          # Global styles, CSS custom properties, @media print
scripts/
  main.js                           # Orchestrator: runs all checks, progressive render; URL history (localStorage, datalist)
  lib/
    fetch.js                        # Shared helpers: fetchAndParse, fetchRaw, truncate, addCapped
  checks/
    performance.js                  # PageSpeed Insights API — CWV / Lighthouse score
    metadata.js                     # EDS metadata completeness
    blocks.js                       # EDS block structure validation
    images.js                       # Image src routing (media_ vs external)
    redirect.js                     # Redirect and host validation
    headings.js                     # Heading hierarchy
    links.js                        # Link health
    fonts.js                        # Font loading audit
    inline-styles.js                # Inline style audit
    accessibility.js                # Accessibility audit
    lazy-loading.js                 # Image lazy loading
    script-loading.js               # Render-blocking script audit
    duplicate-ids.js                # Duplicate id attributes
    structured-data.js              # JSON-LD structured data
    ai-readiness.js                 # llms.txt + robots.txt AI crawler policy
    sitemap.js                      # sitemap.xml reachability and content
    viewport.js                     # Viewport meta tag
    lang.js                         # HTML lang attribute (WCAG 3.1.1)
  report/
    dashboard.js                    # Renders check cards into #dashboard (progressive); status-filter pills; Export PDF button
    pdf.js                          # PDF export via window.print()
    seo-summary.js                  # SEO & AI Snapshot panel (above check grid); skeleton loading state
server.js                           # Dev server: static files + /proxy + /redirect-check
lib/
  jspdf.umd.min.js                  # Reserved for future jsPDF integration
.claude/
  settings.json                     # Claude Code project permissions
  commands/
    run-checks.md                   # /run-checks slash command
    new-check.md                    # /new-check slash command
```

## Server endpoints
- `GET /proxy?url=<url>` — fetches target URL server-side, returns body with CORS headers
- `GET /redirect-check?url=<url>` — follows redirects, returns `{ finalUrl, redirected, status }`
- `GET /*` — static file server from project root

