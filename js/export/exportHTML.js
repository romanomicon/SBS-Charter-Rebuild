/*
========================================================================
HTML EXPORT - INTEGRATED PREVIEW
========================================================================
PURPOSE: Creates an HTML preview that:
  1. Matches the main website's navigation and styling
  2. Shows exactly what the Word export will look like (no extra aesthetics)

This preview is part of the main website experience, not a standalone page.
========================================================================
*/

import { computeSegStart, computeSegEnd } from "./helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "./helpers/textUtils.js";

/**
 * Creates an HTML preview of the book structure
 * Opens in a new window/tab for viewing
 * @param {Object} state - The application state
 * @returns {Window} The preview window reference
 */
export function exportHTML(state) {
  const html = buildHTMLDocument(state);

  // Open blank window and write content
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(html);
  previewWindow.document.close();

  return previewWindow;
}

/**
 * Builds the complete HTML document
 */
function buildHTMLDocument(state) {
  const overviewContent = buildOverviewHTML(state);
  const segmentPages = buildSegmentPagesHTML(state);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeText(state.bookName)} - Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <!-- Navigation matching main site -->
  <header class="global-nav">
    <div class="nav-inner">
      <div class="brand">Project Nehemiah</div>
      <nav class="nav-links">
        <a href="index.html" target="_blank">Home</a>
        <a href="library.html" target="_blank">Library</a>
        <button onclick="window.print()" class="nav-btn">Print</button>
        <button onclick="exportToWord()" class="nav-btn primary">Export Word</button>
        <button onclick="window.close()" class="nav-btn">Close</button>
      </nav>
    </div>
  </header>

  <main class="preview-container">
    <!-- Overview Page -->
    <section class="page">
      ${overviewContent}
    </section>

    <!-- Segment Pages -->
    ${segmentPages}
  </main>

  <footer class="footer">
    Preview of Word export - What you see here is what you get in the document
  </footer>

  <script>
    function exportToWord() {
      // Signal the main app to export via localStorage
      localStorage.setItem('sbs-export-word-trigger', Date.now().toString());
      // Redirect back to main app so download happens automatically
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Builds the overview page HTML (matches Word export structure)
 */
function buildOverviewHTML(state) {
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const divisionsSorted = [...state.divisions].sort((a, b) => {
    const aStart = Math.min(...a.paragraphIndexes);
    const bStart = Math.min(...b.paragraphIndexes);
    return aStart - bStart;
  });

  const sectionsSorted = [...state.sections].sort((a, b) => {
    const aStart = Math.min(...a.paragraphIndexes);
    const bStart = Math.min(...b.paragraphIndexes);
    return aStart - bStart;
  });

  function findDivisionForSegment(segStart) {
    let result = null;
    for (const div of divisionsSorted) {
      const divStart = Math.min(...div.paragraphIndexes);
      if (divStart <= segStart) {
        result = div;
      } else {
        break;
      }
    }
    return result;
  }

  function findSectionForSegment(segStart) {
    let result = null;
    for (const sec of sectionsSorted) {
      const secStart = Math.min(...sec.paragraphIndexes);
      if (secStart <= segStart) {
        result = sec;
      } else {
        break;
      }
    }
    return result;
  }

  const getDivStart = (div) => div ? Math.min(...div.paragraphIndexes) : -1;
  const getSecStart = (sec) => sec ? Math.min(...sec.paragraphIndexes) : -1;

  // Pre-calculate row data
  const rowData = segmentsSorted.map(seg => {
    const segStart = computeSegStart(seg);
    const sec = findSectionForSegment(segStart);
    const div = findDivisionForSegment(segStart);
    return { seg, sec, div, divStart: getDivStart(div), secStart: getSecStart(sec) };
  });

  // Calculate rowspans
  const rowMeta = rowData.map((row, idx) => {
    const prevRow = idx > 0 ? rowData[idx - 1] : null;
    const isNewDiv = !prevRow || (row.divStart !== prevRow.divStart);
    const isNewSec = !prevRow || (row.secStart !== prevRow.secStart);

    let divRowspan = 1;
    if (isNewDiv) {
      for (let j = idx + 1; j < rowData.length; j++) {
        if (rowData[j].divStart === row.divStart) divRowspan++;
        else break;
      }
    }

    let secRowspan = 1;
    if (isNewSec) {
      for (let j = idx + 1; j < rowData.length; j++) {
        if (rowData[j].secStart === row.secStart) secRowspan++;
        else break;
      }
    }

    return { isNewDiv, isNewSec, divRowspan, secRowspan };
  });

  // Build table rows
  let tableRows = '';
  rowData.forEach((row, idx) => {
    const { seg, sec, div } = row;
    const { isNewDiv, isNewSec, divRowspan, secRowspan } = rowMeta[idx];

    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    tableRows += '<tr>';

    if (isNewDiv) {
      const divTitle = safeText(div?.title) || `Division ${div?.id}`;
      tableRows += `<td rowspan="${divRowspan}" class="cell-center"><strong>${divTitle}</strong></td>`;
    }

    if (isNewSec) {
      const secTitle = safeText(sec?.title) || `Section ${sec?.id}`;
      tableRows += `<td rowspan="${secRowspan}" class="cell-center"><strong>${secTitle}</strong></td>`;
    }

    const segTitle = safeText(seg.title) || `Segment ${seg.id}`;
    tableRows += `
      <td>
        <strong>${segTitle}</strong><br>
        <span class="range">${range}</span>
      </td>
    `;

    tableRows += '</tr>';
  });

  return `
    <h1 class="title">${safeText(state.bookName)} - Structure Overview</h1>

    <div class="key-verse">
      <strong>Key verse:</strong> <em>${safeText(state.keyVerse)}</em>
    </div>

    <table class="structure-table">
      <thead>
        <tr>
          <th>Division</th>
          <th>Section</th>
          <th>Segment</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

/**
 * Builds the segment pages HTML (matches Word export structure)
 */
function buildSegmentPagesHTML(state) {
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  let html = '';

  segmentsSorted.forEach(seg => {
    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    let rows = '';
    for (let i = segStart; i <= segEnd; i++) {
      const para = paragraphs[i];
      if (!para) continue;

      rows += `
        <tr>
          <td class="blank-col" rowspan="2"></td>
          <td class="header-row">
            <strong>${para.range}</strong>${para.title ? ' — ' + safeText(para.title) : ''}
          </td>
          <td class="blank-col" rowspan="2"></td>
        </tr>
        <tr>
          <td class="writing-space"></td>
        </tr>
      `;
    }

    const segTitle = safeText(seg.title) || `Segment ${seg.id}`;
    html += `
      <section class="page">
        <div class="segment-header">
          <strong>${segTitle}</strong>
        </div>
        <div class="segment-range">${range}</div>

        <table class="segment-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    `;
  });

  return html;
}

/**
 * Minimal CSS - matches Word output appearance with main site navigation
 */
function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #000;
      line-height: 1.4;
    }

    /* Navigation - matches main site */
    .global-nav {
      position: sticky;
      top: 0;
      background: #212121;
      z-index: 100;
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      font-weight: 700;
      font-size: 1.1rem;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .nav-links a {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .nav-links a:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .nav-btn {
      background: transparent;
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .nav-btn.primary {
      background: #fff;
      color: #212121;
      border-color: #fff;
    }

    .nav-btn.primary:hover {
      background: #e0e0e0;
    }

    /* Preview container */
    .preview-container {
      max-width: 8.5in;
      margin: 1.5rem auto;
      padding: 0 1rem;
    }

    /* Page styling - matches Word document appearance */
    .page {
      background: #fff;
      padding: 0.5in;
      margin-bottom: 1.5rem;
      border: 1px solid #ccc;
    }

    /* Title */
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    /* Key verse - simple box like Word */
    .key-verse {
      text-align: center;
      padding: 0.4rem 0.8rem;
      margin-bottom: 0.75rem;
      border: 1px solid #000;
      font-size: 9pt;
    }

    /* Structure table - matches Word export */
    .structure-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .structure-table th,
    .structure-table td {
      border: 1px solid #000;
      padding: 0.4rem;
      vertical-align: middle;
    }

    .structure-table th {
      font-weight: bold;
      text-align: center;
    }

    .cell-center {
      text-align: center;
    }

    .range {
      font-size: 9pt;
    }

    /* Segment pages */
    .segment-header {
      text-align: center;
      padding: 0.4rem;
      border: 1px solid #000;
      margin-bottom: 0.25rem;
      font-size: 10pt;
    }

    .segment-range {
      text-align: center;
      font-size: 9pt;
      margin-bottom: 0.5rem;
    }

    .segment-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .segment-table td {
      border: 1px solid #000;
      padding: 0.3rem;
    }

    .blank-col {
      width: 20%;
    }

    .header-row {
      text-align: center;
    }

    .writing-space {
      height: 80px;
    }

    /* Footer */
    .footer {
      text-align: center;
      font-size: 0.85rem;
      color: #666;
      padding: 1rem;
      margin-bottom: 2rem;
    }

    /* Print styles */
    @media print {
      body {
        background: white;
      }

      .global-nav,
      .footer {
        display: none;
      }

      .preview-container {
        margin: 0;
        padding: 0;
        max-width: none;
      }

      .page {
        border: none;
        margin: 0;
        padding: 0.5in;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }
    }
  `;
}
