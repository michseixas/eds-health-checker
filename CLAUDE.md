# EDS Site Health Checker — Claude Instructions

## What this project is
A browser-based tool that audits Adobe Edge Delivery Services (EDS/Franklin) sites.
The user enters a URL, the tool runs 4 checks, and outputs a visual dashboard + PDF report.

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
  };
}
```

When adding a new check, use the `/new-check` slash command. Do NOT modify `main.js`
unless explicitly asked — it is the orchestrator and changes there affect all checks.

## Conventions
- Vanilla JS only — no frameworks, no build step
- ES module syntax (`import`/`export`) throughout
- CSS custom properties for all colors/spacing — define tokens in `styles/main.css`,
  never hardcode values elsewhere
- No external dependencies except jsPDF (vendored in `lib/`) for PDF export
- Files are served statically — no server-side code

## Project structure
```
index.html                      # Entry point — URL form + #dashboard mount
styles/
  main.css                      # Global styles, all CSS custom properties, @media print
scripts/
  main.js                       # Orchestrator: runs checks, calls dashboard.render()
  checks/
    performance.js              # PageSpeed Insights API — CWV / Lighthouse score
    metadata.js                 # EDS metadata block completeness (title, desc, og:image, canonical)
    blocks.js                   # EDS block structure validation
    images.js                   # Image src routing (media_ vs external URLs)
  report/
    dashboard.js                # Renders .check-card elements into #dashboard
    pdf.js                      # PDF export via window.print() + optional jsPDF
lib/
  jspdf.umd.min.js              # Vendored jsPDF — do not modify
.claude/
  settings.json                 # Claude Code project permissions
  commands/
    run-checks.md               # /run-checks slash command
    new-check.md                # /new-check slash command
```
