/**
 * report/pdf.js
 *
 * Exports the audit results as a PDF using the browser's native print dialog.
 * No external dependencies — layout is handled by @media print rules in main.css.
 *
 * Steps:
 *   1. Read the audited URL from the rendered summary bar.
 *   2. Set document.title so the browser uses it as the default PDF filename.
 *   3. Inject a .print-header element (hidden on screen, visible in print)
 *      containing the report title, URL, and timestamp.
 *   4. Call window.print().
 *   5. On the afterprint event, remove the injected header and restore the title.
 */

export function exportPdf() {
  const auditedUrl = document.querySelector('.score-summary__url')?.textContent?.trim() ?? '';
  const timestamp = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Use the hostname as the PDF filename suggested by the browser
  let hostname = 'eds-health-report';
  try {
    hostname = new URL(auditedUrl).hostname;
  } catch {
    // auditedUrl not parseable — fall through to default filename
  }

  const originalTitle = document.title;
  document.title = `EDS Health Report — ${hostname}`;

  const header = buildPrintHeader(auditedUrl, timestamp);
  document.getElementById('dashboard').prepend(header);

  window.addEventListener('afterprint', () => {
    header.remove();
    document.title = originalTitle;
  }, { once: true });

  window.print();
}

// ---------------------------------------------------------------------------

function buildPrintHeader(url, timestamp) {
  const header = document.createElement('div');
  header.className = 'print-header';

  const title = document.createElement('h1');
  title.textContent = 'EDS Site Health Report';

  const urlLine = document.createElement('p');
  urlLine.textContent = url;

  const timeLine = document.createElement('p');
  timeLine.className = 'print-header__timestamp';
  timeLine.textContent = `Generated: ${timestamp}`;

  header.appendChild(title);
  header.appendChild(urlLine);
  header.appendChild(timeLine);

  return header;
}
