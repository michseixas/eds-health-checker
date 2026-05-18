/**
 * headings.js
 *
 * Validates heading hierarchy on the page:
 *  - Exactly one <h1> (zero or multiple = fail)
 *  - <h1> text is not empty
 *  - No skipped heading levels (e.g. h1 → h3 without h2 = warn)
 *
 * @returns {Promise<import('../main.js').CheckResult>}
 */

export async function run(url) {
  const result = {
    id: 'headings',
    label: 'Heading Hierarchy',
    status: 'pass',
    findings: [],
  };

  let html;
  try {
    const res = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    html = await res.text();
  } catch (err) {
    result.status = 'warn';
    result.findings.push(`Could not fetch page: ${err.message}`);
    return result;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = [...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')];

  const h1s = headings.filter((h) => h.tagName === 'H1');

  if (h1s.length === 0) {
    result.status = 'fail';
    result.findings.push('No <h1> found on the page.');
  } else if (h1s.length > 1) {
    result.status = 'fail';
    result.findings.push(`${h1s.length} <h1> elements found — there should be exactly one.`);
  } else if (!h1s[0].textContent.trim()) {
    result.status = 'fail';
    result.findings.push('<h1> is present but contains no text.');
  }

  // Check for skipped levels
  const levels = headings.map((h) => parseInt(h.tagName[1], 10));
  for (let i = 1; i < levels.length; i++) {
    const diff = levels[i] - levels[i - 1];
    if (diff > 1) {
      if (result.status !== 'fail') result.status = 'warn';
      result.findings.push(
        `Heading level skipped: h${levels[i - 1]} → h${levels[i]} (missing h${levels[i - 1] + 1}).`
      );
    }
  }

  return result;
}
