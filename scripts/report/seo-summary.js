/**
 * report/seo-summary.js
 *
 * Renders the "SEO & AI Snapshot" panel above the check grid.
 * All DOM construction uses createElement + textContent — no innerHTML with dynamic data.
 */

import { truncate } from '../lib/fetch.js';

const STATUS_ICON = { pass: '✓', warn: '⚠', fail: '✕' };
const STATUS_RANK = { fail: 2, warn: 1, pass: 0 };

const SEO_GROUP = [
  { id: 'metadata',        label: 'Metadata' },
  { id: 'headings',        label: 'Heading Structure' },
  { id: 'sitemap',         label: 'Sitemap' },
  { id: 'structured-data', label: 'Structured Data' },
  { id: 'redirect',        label: 'URL & Redirects' },
  { id: 'performance',     label: 'Performance (CWV)' },
  { id: 'viewport',        label: 'Viewport' },
  { id: 'lang',            label: 'Language' },
];

const AI_GROUP = [
  { id: 'ai-readiness',    label: 'llms.txt & AI Crawlers' },
  { id: 'structured-data', label: 'Structured Data (JSON-LD)' },
  { id: 'metadata',        label: 'Open Graph Tags' },
];

const GROUP_BADGE_TEXT = { pass: 'All Good', warn: 'Needs Attention', fail: 'Issues Found' };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildSeoLoading() {
  const section = el('section', 'seo-ai-panel seo-ai-panel--loading');
  const heading = el('h2', 'seo-ai-panel__title');
  heading.textContent = 'SEO & AI Snapshot';
  const grid = el('div', 'seo-ai-panel__grid');
  grid.append(buildSkeletonGroup(SEO_GROUP.length), buildSkeletonGroup(AI_GROUP.length));
  section.append(heading, grid);
  return section;
}

export function buildSeoPanel(results) {
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));

  const section = el('section', 'seo-ai-panel');
  const heading = el('h2', 'seo-ai-panel__title');
  heading.textContent = 'SEO & AI Snapshot';
  const grid = el('div', 'seo-ai-panel__grid');
  grid.append(
    buildGroup('SEO Signals',        SEO_GROUP, byId),
    buildGroup('AI / LLM Readiness', AI_GROUP,  byId),
  );
  section.append(heading, grid);

  section.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scroll-to]');
    if (!btn) return;
    document.querySelector(`[data-check-id="${btn.dataset.scrollTo}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  return section;
}

// ---------------------------------------------------------------------------
// Group builder
// ---------------------------------------------------------------------------

function buildGroup(title, group, byId) {
  const wrap = el('div', 'seo-ai-panel__group');

  const header = el('div', 'seo-ai-panel__group-header');
  const lbl = el('span', 'seo-ai-panel__group-label');
  lbl.textContent = title;
  const aggStatus = worstStatus(group, byId);
  const badge = el('span', `seo-ai-panel__group-badge status-${aggStatus}`);
  badge.textContent = GROUP_BADGE_TEXT[aggStatus];
  header.append(lbl, badge);
  wrap.appendChild(header);

  const list = el('ul', 'seo-ai-panel__list');
  for (const { id, label } of group) {
    const r = byId[id];
    const status = r?.status ?? 'pass';

    const item = el('li', 'seo-ai-panel__item');

    const icon = el('span', `seo-ai-panel__item-icon seo-ai-panel__item-icon--${status}`);
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = STATUS_ICON[status];

    const body = el('div', 'seo-ai-panel__item-body');
    const btn = el('button', 'seo-ai-panel__item-btn');
    btn.textContent = label;
    btn.dataset.scrollTo = id;
    body.appendChild(btn);

    if (status !== 'pass' && r?.findings?.length) {
      const hint = el('span', 'seo-ai-panel__item-hint');
      hint.textContent = truncate(r.findings[0], 80);
      body.appendChild(hint);
    }

    item.append(icon, body);
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

function buildSkeletonGroup(rowCount) {
  const wrap = el('div', 'seo-ai-panel__group');
  const header = el('div', 'seo-ai-panel__group-header');
  header.append(sk('skeleton--seo-label'), sk('skeleton--seo-badge'));
  wrap.appendChild(header);
  const list = el('ul', 'seo-ai-panel__list');
  for (let i = 0; i < rowCount; i++) {
    const item = el('li', 'seo-ai-panel__item');
    item.append(sk('skeleton--seo-icon'), sk('skeleton--seo-row'));
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function worstStatus(group, byId) {
  return group.reduce((worst, { id }) => {
    const s = byId[id]?.status ?? 'pass';
    return STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst;
  }, 'pass');
}

function el(tag, className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function sk(...extra) {
  return el('div', ['skeleton', ...extra].join(' '));
}
