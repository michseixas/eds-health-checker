/**
 * checks/lazy-loading.js
 *
 * Audits image loading attributes against EDS/Lighthouse best practices.
 *
 * The first <img> inside <main> is treated as the probable LCP candidate:
 *   - loading="lazy" on the LCP image defers it and hurts LCP score → fail
 *   - Missing fetchpriority="high" on the LCP image is a missed optimisation → warn
 *
 * All other images:
 *   - Missing loading="lazy" means the browser eagerly fetches off-screen
 *     images, wasting bandwidth and hurting performance → warn
 *   - loading="eager" is an explicit opt-out of lazy loading → warn
 */

const MAX_FINDINGS = 5;

/**
 * @param {string} url
 * @returns {Promise<{id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[]}>}
 */
export async function run(url) {
  let doc;
  try {
    doc = await fetchAndParse(url);
  } catch (err) {
    return result('fail', [`Could not fetch page HTML: ${err.message}`]);
  }

  const main = doc.querySelector('main');
  const imgs = [...(main ?? doc.body).querySelectorAll('img')];

  if (imgs.length === 0) return result('pass', []);

  const findings = [];
  let hasFail = false;

  // Treat the first <img> in <main> as the probable LCP candidate
  const [lcpImg, ...restImgs] = imgs;
  const lcpSrc = truncate(lcpImg.getAttribute('src') ?? '');

  if (lcpImg.getAttribute('loading') === 'lazy') {
    findings.push(
      `LCP image has loading="lazy" — this defers the most important image and hurts LCP: "${lcpSrc}"`,
    );
    hasFail = true;
  } else if (!lcpImg.hasAttribute('fetchpriority') || lcpImg.getAttribute('fetchpriority') !== 'high') {
    findings.push(
      `LCP image is missing fetchpriority="high" — add it to hint the browser to prioritise this image: "${lcpSrc}"`,
    );
  }

  // All remaining images should have loading="lazy"
  const missingLazy = restImgs.filter(
    (img) => !img.hasAttribute('loading') || img.getAttribute('loading') === 'eager',
  );
  if (missingLazy.length > 0) {
    addCapped(
      findings,
      missingLazy,
      (img) => `Image missing loading="lazy": "${truncate(img.getAttribute('src') ?? '')}"`,
      'images missing lazy loading',
    );
  }

  const status = hasFail ? 'fail' : findings.length > 0 ? 'warn' : 'pass';
  return result(status, findings);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchAndParse(url) {
  const res = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const html = await res.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

function addCapped(findings, items, format, categoryLabel) {
  const shown = items.slice(0, MAX_FINDINGS);
  const rest = items.length - shown.length;
  for (const item of shown) findings.push(format(item));
  if (rest > 0) findings.push(`…and ${rest} more ${categoryLabel}.`);
}

function truncate(src, max = 80) {
  return src.length <= max ? src : `${src.slice(0, max)}…`;
}

const CHECKS = [
  'LCP image (first <img> in <main>) does not have loading="lazy"',
  'LCP image has fetchpriority="high"',
  'All non-LCP images have loading="lazy"',
];

function result(status, findings) {
  return { id: 'lazy-loading', label: 'Lazy Loading', status, findings, checks: CHECKS };
}
