/**
 * report/dashboard.js
 *
 * Renders the visual results dashboard. All DOM construction uses
 * createElement + textContent — no innerHTML with dynamic data.
 */

import { exportPdf } from './pdf.js';

const STATUS_ICON  = { pass: '✓', warn: '⚠', fail: '✕' };
const STATUS_LABEL = { pass: 'Pass', warn: 'Warn', fail: 'Fail' };

const dashboard = document.getElementById('dashboard');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render the full results dashboard.
 * @param {Array<{id:string, label:string, status:string, findings:string[]}>} results
 * @param {string} url  The audited URL, shown in the summary bar.
 */
export function render(results, url) {
  clear();
  dashboard.appendChild(buildSummary(results, url));
  dashboard.appendChild(buildGrid(results));
}

/** Show four skeleton cards while checks are in flight. */
export function renderLoading() {
  clear();
  dashboard.appendChild(buildLoadingSummary());
  dashboard.appendChild(buildLoadingGrid());
}

/**
 * Show a top-level error message (e.g. invalid URL before checks run).
 * @param {string} message
 */
export function renderError(message) {
  clear();
  const p = document.createElement('p');
  p.className = 'error-message';
  p.textContent = message;
  dashboard.appendChild(p);
}

// ---------------------------------------------------------------------------
// Score summary
// ---------------------------------------------------------------------------

function buildSummary(results, url) {
  const counts = tally(results);
  const overall = counts.fail > 0 ? 'fail' : counts.warn > 0 ? 'warn' : 'pass';

  const section = el('div', 'score-summary');

  // Audited URL
  const urlLine = el('p', 'score-summary__url');
  urlLine.textContent = url;
  section.appendChild(urlLine);

  // Badge + per-status counts + export button
  const meta = el('div', 'score-summary__meta');

  const badge = el('span', `score-summary__badge status-${overall}`);
  badge.textContent = `Overall: ${STATUS_LABEL[overall]}`;
  meta.appendChild(badge);

  for (const [status, count] of Object.entries(counts)) {
    const pill = el('span', `score-summary__count status-${status}`);
    pill.textContent = `${count} ${status}`;
    meta.appendChild(pill);
  }

  const btn = el('button', 'export-btn');
  btn.id = 'export-btn';
  btn.textContent = 'Export PDF';
  btn.addEventListener('click', exportPdf);
  meta.appendChild(btn);

  section.appendChild(meta);
  return section;
}

function buildLoadingSummary() {
  const section = el('div', 'score-summary score-summary--loading');
  section.appendChild(skeleton('score-summary__url skeleton'));
  const meta = el('div', 'score-summary__meta');
  meta.appendChild(skeleton('score-summary__badge skeleton'));
  section.appendChild(meta);
  return section;
}

// ---------------------------------------------------------------------------
// Check card grid
// ---------------------------------------------------------------------------

function buildGrid(results) {
  const grid = el('div', 'check-grid');
  for (const r of results) grid.appendChild(buildCard(r));
  return grid;
}

function buildLoadingGrid() {
  const grid = el('div', 'check-grid');
  for (let i = 0; i < 4; i++) grid.appendChild(buildLoadingCard());
  return grid;
}

function buildCard(result) {
  const card = el('div', `check-card check-card--${result.status}`);
  card.dataset.checkId = result.id;

  // Header row
  const header = el('div', 'check-card__header');

  const icon = el('span', 'check-card__icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = STATUS_ICON[result.status];

  const label = el('h2', 'check-card__label');
  label.textContent = result.label;

  const badge = el('span', `check-card__status-badge status-${result.status}`);
  badge.textContent = STATUS_LABEL[result.status];

  header.appendChild(icon);
  header.appendChild(label);
  header.appendChild(badge);
  card.appendChild(header);

  // Findings (collapsible, open by default so users see them immediately)
  if (result.findings.length > 0) {
    const details = el('details', 'check-card__findings');
    details.open = true;

    const summary = el('summary');
    summary.textContent = `${result.findings.length} finding${result.findings.length !== 1 ? 's' : ''}`;
    details.appendChild(summary);

    const list = el('ul');
    for (const text of result.findings) {
      const li = el('li');
      li.textContent = text;
      list.appendChild(li);
    }
    details.appendChild(list);
    card.appendChild(details);
  }

  return card;
}

function buildLoadingCard() {
  const card = el('div', 'check-card check-card--loading');
  const header = el('div', 'check-card__header');
  header.appendChild(skeleton('skeleton--line'));
  header.appendChild(skeleton('skeleton--line skeleton--short'));
  card.appendChild(header);
  return card;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function tally(results) {
  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}

function clear() {
  dashboard.innerHTML = '';
}

/** Shorthand for createElement + className. */
function el(tag, className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Create a div with skeleton class(es) for the loading state. */
function skeleton(extraClass = '') {
  return el('div', `skeleton ${extraClass}`.trim());
}
