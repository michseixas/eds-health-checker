/**
 * main.js
 *
 * Wires up the URL form, runs all four checks in parallel, and hands
 * the collected results to the dashboard renderer.
 *
 * @typedef {{ id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[] }} CheckResult
 */

import { run as runPerformance } from './checks/performance.js';
import { run as runMetadata } from './checks/metadata.js';
import { run as runBlocks } from './checks/blocks.js';
import { run as runImages } from './checks/images.js';
import { run as runRedirect } from './checks/redirect.js';
import { run as runHeadings } from './checks/headings.js';
import { run as runLinks   } from './checks/links.js';
import { run as runFonts        } from './checks/fonts.js';
import { run as runInlineStyles  } from './checks/inline-styles.js';
import { run as runAccessibility } from './checks/accessibility.js';
import { run as runLazyLoading   } from './checks/lazy-loading.js';
import { run as runScriptLoading } from './checks/script-loading.js';
import { run as runDuplicateIds   } from './checks/duplicate-ids.js';
import { run as runStructuredData } from './checks/structured-data.js';
import { run as runAiReadiness   } from './checks/ai-readiness.js';
import { render, renderLoading, renderError } from './report/dashboard.js';

const CHECKS = [
  { id: 'performance', label: 'Performance',        run: runPerformance },
  { id: 'metadata',    label: 'Metadata',            run: runMetadata    },
  { id: 'blocks',      label: 'Block Structure',     run: runBlocks      },
  { id: 'images',      label: 'Image Routing',       run: runImages      },
  { id: 'redirect',    label: 'Redirect Check',      run: runRedirect    },
  { id: 'headings',    label: 'Heading Hierarchy',   run: runHeadings    },
  { id: 'links',       label: 'Link Health',          run: runLinks       },
  { id: 'fonts',         label: 'Font Loading',         run: runFonts        },
  { id: 'inline-styles',  label: 'Inline Styles',        run: runInlineStyles  },
  { id: 'accessibility',  label: 'Accessibility',        run: runAccessibility },
  { id: 'lazy-loading',   label: 'Lazy Loading',         run: runLazyLoading   },
  { id: 'script-loading', label: 'Script Loading',       run: runScriptLoading },
  { id: 'duplicate-ids',   label: 'Duplicate IDs',        run: runDuplicateIds   },
  { id: 'structured-data', label: 'Structured Data',      run: runStructuredData },
  { id: 'ai-readiness',    label: 'AI Readiness',         run: runAiReadiness    },
];

const LS_KEY = 'eds-hc-psi-api-key';

const form        = document.getElementById('check-form');
const input       = document.getElementById('url-input');
const apiKeyInput = document.getElementById('api-key-input');
const submitBtn   = document.getElementById('submit-btn');

// Restore saved key on load
apiKeyInput.value = localStorage.getItem(LS_KEY) ?? '';

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let url;
  try {
    url = normalizeUrl(input.value.trim());
  } catch {
    renderError('Please enter a valid URL (e.g. https://www.example.aem.live).');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Running…';
  renderLoading();

  const apiKey = apiKeyInput.value.trim();
  if (apiKey) localStorage.setItem(LS_KEY, apiKey);
  else localStorage.removeItem(LS_KEY);
  const settled = await Promise.allSettled(CHECKS.map(({ id, run }) =>
    id === 'performance' ? run(url, apiKey) : run(url)
  ));

  const results = settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') return outcome.value;
    return {
      id:       CHECKS[i].id,
      label:    CHECKS[i].label,
      status:   'fail',
      findings: [`Unexpected error: ${outcome.reason?.message ?? String(outcome.reason)}`],
    };
  });

  render(results, url);

  submitBtn.disabled = false;
  submitBtn.textContent = 'Run Checks';
});

/** Prepend https:// if missing, then validate with URL constructor. */
function normalizeUrl(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withProtocol).href;
}
