/**
 * main.js
 *
 * Wires up the URL form, runs all four checks in parallel, and hands
 * the collected results to the dashboard renderer.
 *
 * @typedef {{ id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[] }} CheckResult
 */

import { run as runAccessibility } from './checks/accessibility.js';
import { run as runAiReadiness } from './checks/ai-readiness.js';
import { run as runBlocks } from './checks/blocks.js';
import { run as runDuplicateIds } from './checks/duplicate-ids.js';
import { run as runFonts } from './checks/fonts.js';
import { run as runHeadings } from './checks/headings.js';
import { run as runImages } from './checks/images.js';
import { run as runInlineStyles } from './checks/inline-styles.js';
import { run as runLang } from './checks/lang.js';
import { run as runLazyLoading } from './checks/lazy-loading.js';
import { run as runLinks } from './checks/links.js';
import { run as runMetadata } from './checks/metadata.js';
import { run as runPerformance } from './checks/performance.js';
import { run as runRedirect } from './checks/redirect.js';
import { run as runScriptLoading } from './checks/script-loading.js';
import { run as runSitemap } from './checks/sitemap.js';
import { run as runStructuredData } from './checks/structured-data.js';
import { run as runViewport } from './checks/viewport.js';
import { run as runWebMcp } from './checks/webmcp.js';
import { getHistory, saveRun } from './lib/history.js';
import {
  renderCard,
  renderError,
  renderLoading,
  renderSparklines,
  renderSummary,
  updateProgress,
} from './report/dashboard.js';

const CHECKS = [
  { id: 'performance', label: 'Performance', run: runPerformance },
  { id: 'metadata', label: 'Metadata', run: runMetadata },
  { id: 'blocks', label: 'Block Structure', run: runBlocks },
  { id: 'images', label: 'Image Routing', run: runImages },
  { id: 'redirect', label: 'Redirect Check', run: runRedirect },
  { id: 'headings', label: 'Heading Hierarchy', run: runHeadings },
  { id: 'links', label: 'Link Health', run: runLinks },
  { id: 'fonts', label: 'Font Loading', run: runFonts },
  { id: 'inline-styles', label: 'Inline Styles', run: runInlineStyles },
  { id: 'accessibility', label: 'Accessibility', run: runAccessibility },
  { id: 'lazy-loading', label: 'Lazy Loading', run: runLazyLoading },
  { id: 'script-loading', label: 'Script Loading', run: runScriptLoading },
  { id: 'duplicate-ids', label: 'Duplicate IDs', run: runDuplicateIds },
  { id: 'structured-data', label: 'Structured Data', run: runStructuredData },
  { id: 'ai-readiness', label: 'AI Readiness', run: runAiReadiness },
  { id: 'sitemap', label: 'Sitemap', run: runSitemap },
  { id: 'viewport', label: 'Viewport Meta', run: runViewport },
  { id: 'lang', label: 'Language Attribute', run: runLang },
  { id: 'webmcp', label: 'WebMCP', run: runWebMcp },
];

// Static SVG lightbulb icons — lit when light mode is active, off in dark mode
const BULB_LIT = `<svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><circle cx="5.5" cy="5" r="4" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5"/><rect x="3.5" y="8.5" width="4" height="0.7" rx="0.35" fill="#9ca3af"/><rect x="3.8" y="9.4" width="3.4" height="0.7" rx="0.35" fill="#9ca3af"/><rect x="4.1" y="10.3" width="2.8" height="0.7" rx="0.35" fill="#9ca3af"/></svg>`;
const BULB_OFF = `<svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><circle cx="5.5" cy="5" r="3.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="3.5" y="8.5" width="4" height="0.7" rx="0.35" fill="currentColor" opacity="0.5"/><rect x="3.8" y="9.4" width="3.4" height="0.7" rx="0.35" fill="currentColor" opacity="0.5"/><rect x="4.1" y="10.3" width="2.8" height="0.7" rx="0.35" fill="currentColor" opacity="0.5"/></svg>`;

const LS_KEY = 'eds-hc-psi-api-key';
const LS_HISTORY_KEY = 'eds-hc-url-history';
const LS_THEME_KEY = 'eds-hc-theme';

const form = document.getElementById('check-form');
const input = document.getElementById('url-input');
const apiKeyInput = document.getElementById('api-key-input');
const submitBtn = document.getElementById('submit-btn');
const themeBtn = document.getElementById('theme-btn');
const urlHistoryDatalist = document.getElementById('url-history');

// Dark mode toggle
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  themeBtn.innerHTML = dark ? `${BULB_OFF}Light mode` : `${BULB_LIT}Dark mode`;
}

themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme !== 'dark';
  localStorage.setItem(LS_THEME_KEY, next ? 'dark' : 'light');
  applyTheme(next);
});

applyTheme(localStorage.getItem(LS_THEME_KEY) === 'dark');

// Restore saved key and URL history on load
apiKeyInput.value = localStorage.getItem(LS_KEY) ?? '';
loadHistory();

function loadHistory() {
  const history = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) ?? '[]');
  urlHistoryDatalist.innerHTML = '';
  for (const h of history) {
    const opt = document.createElement('option');
    opt.value = h;
    urlHistoryDatalist.appendChild(opt);
  }
}

function saveToHistory(url) {
  let history = JSON.parse(localStorage.getItem(LS_HISTORY_KEY) ?? '[]');
  history = [url, ...history.filter((h) => h !== url)].slice(0, 10);
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
  loadHistory();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let url;
  try {
    url = normalizeUrl(input.value.trim());
  } catch {
    renderError('Please enter a valid URL (e.g. https://www.example.aem.live).');
    return;
  }

  saveToHistory(url);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Running…';
  renderLoading(CHECKS);

  const apiKey = apiKeyInput.value.trim();
  if (apiKey) localStorage.setItem(LS_KEY, apiKey);
  else localStorage.removeItem(LS_KEY);

  let done = 0;
  const promises = CHECKS.map(({ id, label, run }) => {
    const p = id === 'performance' ? run(url, apiKey) : run(url);
    return p.then(
      (result) => {
        renderCard(result);
        updateProgress(++done, CHECKS.length);
        return result;
      },
      (reason) => {
        const fallback = {
          id,
          label,
          status: 'fail',
          findings: [`Unexpected error: ${reason?.message ?? String(reason)}`],
        };
        renderCard(fallback);
        updateProgress(++done, CHECKS.length);
        return fallback;
      },
    );
  });

  const results = await Promise.all(promises);
  try {
    saveRun(url, results);
    const runs = getHistory(url);
    renderSummary(results, url, runs.length);
    renderSparklines(runs);
    history.pushState(null, '', `?url=${encodeURIComponent(url)}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Run Checks';
  }
});

// Auto-run if the page was opened with ?url= (e.g. from a bookmark)
const prefilledUrl = new URLSearchParams(location.search).get('url');
if (prefilledUrl) {
  input.value = prefilledUrl;
  form.requestSubmit();
}

/** Prepend https:// if missing, then validate with URL constructor. */
function normalizeUrl(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withProtocol).href;
}
