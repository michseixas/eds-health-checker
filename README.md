# EDS Site Health Checker

A browser-based audit tool for [Adobe Edge Delivery Services](https://www.aem.live) (EDS/Franklin) sites. Enter a URL, run all checks in parallel, and get an instant visual report — with PDF export.

## Features

- **18 automated checks** covering performance, SEO, accessibility, EDS conventions, and more
- **Progressive rendering** — each card appears as its check resolves, no waiting for the slowest one
- **Status filter tags** — click Pass / Warn / Fail in the summary bar to focus on a specific category
- **URL history** — recent URLs are remembered and suggested as you type
- **PDF export** — one-click print-quality report via `window.print()`
- No build step, no framework, no external dependencies — vanilla JS ES modules

## Getting started

**Prerequisites:** Node.js 18+

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

The dev server handles two things:
- Serves static files from the project root
- Proxies all page fetches through `/proxy?url=...` to bypass browser CORS restrictions

## Usage

1. Paste an EDS page URL (e.g. `https://www.example.aem.live`) into the URL field
2. Optionally enter a [PageSpeed Insights API key](https://developers.google.com/speed/docs/insights/v5/get-started) for the Performance check — without one it uses the free quota
3. Click **Run Checks**
4. Cards appear one by one as checks complete
5. Click **Pass**, **Warn**, or **Fail** in the summary bar to filter the grid
6. Click **Export PDF** to print or save the report

The API key and the last 10 audited URLs are saved in `localStorage` — no data leaves your machine.

## Checks

| Check | What it audits |
|---|---|
| Performance | PageSpeed Insights — Lighthouse score, LCP, CLS, TBT, FCP, INP, Speed Index |
| Metadata Completeness | `<title>`, `<meta description>`, `og:image`, `canonical`, `og:title`, `og:description`, `robots` |
| Block Structure | EDS block conventions — block names, row structure, inline styles/IDs |
| Image Routing | `media_` pipeline routing, external images, data URIs, dimensions, `<picture>` wrapping |
| Redirect Check | `aem.page` vs `aem.live`, HTTP→HTTPS redirect chain |
| Heading Hierarchy | Single `<h1>`, non-empty `<h1>`, no skipped heading levels |
| Link Health | Broken same-origin links, non-HTTPS hrefs, missing `rel="noopener"`, suspicious patterns |
| Font Loading | Render-blocking font CDN stylesheets, `@import`, preconnect hints, external `@font-face` |
| Inline Styles | `!important` usage, theming props inline, `<style>` on `<body>`, volume of styled elements |
| Accessibility | Image `alt`, linked image `alt`, form labels, button names, `onclick` without role, contrast |
| Lazy Loading | LCP image `loading="lazy"` (fail), missing `fetchpriority="high"` (warn), non-LCP missing lazy |
| Script Loading | Render-blocking scripts in `<head>`, async scripts, large inline scripts |
| Duplicate IDs | Any `id` attribute appearing more than once in the document |
| Structured Data | JSON-LD presence, valid JSON, `@context`/`@type`, high-value schema types |
| AI Readiness | `llms.txt` at domain root, `robots.txt` AI crawler policy |
| Sitemap | `/sitemap.xml` reachability, valid XML, `<loc>` entries, page URL in sitemap, `Sitemap:` directive in `robots.txt` |
| Viewport Meta | `<meta name="viewport">` presence, `width=device-width`, `initial-scale=1` |
| Language Attribute | `<html lang>` presence, non-empty, valid BCP 47 tag (WCAG 3.1.1) |

## Project structure

```
index.html                  # Entry point — URL form + #dashboard mount
styles/
  main.css                  # Tokens, layout, components, @media print
scripts/
  main.js                   # Orchestrator: runs all checks, progressive render
  lib/
    fetch.js                # Shared helpers: fetchAndParse, fetchRaw, truncate, addCapped
  checks/                   # One module per check — each exports run(url)
  report/
    dashboard.js            # Renders check cards into #dashboard
    pdf.js                  # PDF export via window.print()
server.js                   # Dev server: static files + /proxy + /redirect-check
```

## Adding a check

Use the `/new-check` slash command inside Claude Code — it scaffolds the file and wires it into `main.js`. Every check module must export:

```js
export async function run(url) {
  return {
    id: 'check-id',       // kebab-case
    label: 'Human Label', // shown in the dashboard card
    status: 'pass',       // 'pass' | 'warn' | 'fail'
    findings: [],         // string[] — empty on pass
    checks: [],           // string[] — verified criteria, shown on passing cards
  };
}
```

Use `fetchAndParse(url)` (returns a parsed `Document`) or `fetchRaw(url)` (returns `{ ok, body }`) from `scripts/lib/fetch.js` — never redefine them locally.

## Architecture notes

- All page fetches go through `GET /proxy?url=<url>` on the local dev server
- Domain-root files (`robots.txt`, `sitemap.xml`, `llms.txt`) are also fetched via the proxy
- `renderLoading()` pre-renders N skeleton cards tagged with `data-check-id`; `renderCard()` swaps each in as its Promise resolves; `renderSummary()` updates the header after all checks complete
- CSS custom properties for all colours and spacing — never hardcode values
- PDF export uses `@media print` CSS — all cards expand, the form is hidden
