/**
 * redirect.js
 *
 * Checks whether the target URL redirects, and flags common EDS authoring
 * mistakes such as using an aem.page (preview) URL instead of aem.live
 * (production), or serving over plain HTTP.
 *
 * @returns {Promise<import('../main.js').CheckResult>}
 */

export async function run(url) {
  const result = {
    id: 'redirect',
    label: 'Redirect Check',
    status: 'pass',
    findings: [],
  };

  const parsed = new URL(url);

  // aem.page is a preview host — always a fail for production audits
  if (parsed.hostname.endsWith('aem.page')) {
    result.status = 'fail';
    result.findings.push('URL points to aem.page (preview), not aem.live (production).');
    return result;
  }

  let data;
  try {
    const res = await fetch(`/redirect-check?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    data = await res.json();
  } catch (err) {
    result.status = 'warn';
    result.findings.push(`Could not perform redirect check: ${err.message}`);
    return result;
  }

  if (data.redirected) {
    const inputParsed = new URL(url);
    const finalParsed = new URL(data.finalUrl);

    if (inputParsed.protocol === 'http:' && finalParsed.protocol === 'https:') {
      result.status = 'warn';
      result.findings.push(`HTTP input redirected to HTTPS (final URL: ${data.finalUrl}).`);
    } else {
      result.status = 'warn';
      result.findings.push(`URL redirects to a different location (final URL: ${data.finalUrl}).`);
    }
  }

  return result;
}
