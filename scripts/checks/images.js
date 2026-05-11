/**
 * checks/images.js
 *
 * Audits image URL routing on the target EDS page.
 *
 * EDS image conventions:
 *   - Images should be served through EDS's media pipeline:
 *       ./media/<filename>  or  media_<hash>.<ext>  (relative/absolute on same origin)
 *   - External image URLs (e.g. https://cdn.example.com/image.png) are a red flag —
 *     they bypass EDS optimisation, auto-WebP conversion, and width/format negotiation
 *   - <picture> + <source> with width descriptors is the expected EDS pattern
 *
 * Approach:
 *   - Fetch and parse the page HTML with DOMParser
 *   - querySelectorAll('img, source') to collect all image URLs (src, srcset)
 *   - Classify each URL:
 *       - same-origin media_ path → OK
 *       - data: URI → warn (may indicate inline images)
 *       - external origin → fail finding
 *   - Also check that <img> elements use width + height attributes (CLS prevention)
 *
 * Status:
 *   - All images routed through EDS media pipeline → pass
 *   - Some data URIs or missing dimensions → warn
 *   - Any external image URLs detected → fail
 */

/**
 * @param {string} url
 * @returns {Promise<{id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[]}>}
 */
export async function run(url) {
  // TODO: implement image routing check
  return {
    id: 'images',
    label: 'Image Routing',
    status: 'pass',
    findings: [],
  };
}
