/**
 * report/pdf.js
 *
 * Exports a clean, printable PDF report of the audit results.
 *
 * Strategy: use window.print() with print-specific CSS rather than jsPDF,
 * keeping the implementation dependency-free. jsPDF is available as a fallback
 * in lib/jspdf.umd.min.js if richer layout control is needed later.
 *
 * Responsibilities:
 *   1. exportPdf(): triggers window.print() — the browser handles PDF save
 *   2. The print layout is controlled by @media print rules in styles/main.css:
 *      - Hide #app-header (URL form) and the Export button
 *      - Expand check cards to full page width
 *      - Inject site URL + timestamp as a printed header via CSS content
 *      - Page-break-after each check card if needed
 *   3. Optionally: exportJsPdf(results) — programmatic PDF via jsPDF for
 *      client-delivery attachments with custom branding/cover page
 */

export function exportPdf() {
  // TODO: trigger window.print() for browser-native PDF save
}

/**
 * @param {Array<{id: string, label: string, status: string, findings: string[]}>} results
 */
export function exportJsPdf(results) {
  // TODO: implement jsPDF-based export for branded client reports
}
