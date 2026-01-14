/*
========================================================================
📄 HTML EXPORT - LIVE PREVIEW VERSION
========================================================================
PURPOSE: Creates an HTML version of the book structure that can be
         previewed in the browser and edited before Word export.

BENEFITS:
- Instant preview without downloading
- Live editing of content
- See exact layout before exporting to Word
- Print to PDF if needed

USAGE:
  exportHTML(state) - Opens preview in new tab/window
========================================================================
*/

import { computeSegStart, computeSegEnd } from "./helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "./helpers/textUtils.js";

/**
 * Creates an HTML preview of the book structure
 * Opens in a new window/tab for viewing and editing
 * @returns {Window} The preview window reference
 */
export function exportHTML(state) {
  const html = buildHTMLDocument(state);

  // Open in new window
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(html);
  previewWindow.document.close();

  // Return window reference for auto-refresh feature
  return previewWindow;
}

/**
 * Builds the complete HTML document
 */
function buildHTMLDocument(state) {
  const overviewTable = buildOverviewTableHTML(state);
  const segmentPages = buildSegmentPagesHTML(state);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeText(state.bookName)} - Structure Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    ${getPreviewStyles()}
  </style>
</head>
<body>
  <header class="toolbar">
    <div class="toolbar-brand">📖 ${safeText(state.bookName)}</div>
    <div class="toolbar-actions">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Print / PDF
      </button>
      <button onclick="exportToWord()" class="btn btn-success">
        📄 Export to Word
      </button>
      <button onclick="toggleEditMode()" class="btn btn-secondary" id="editBtn">
        ✏️ Enable Editing
      </button>
      <button onclick="syncChangesToMainApp()" class="btn btn-info" id="syncBtn">
        🔄 Sync Changes
      </button>
      <select onchange="changeTheme(this.value)" class="theme-selector">
        <option value="default">Default Theme</option>
        <option value="compact">Compact Theme</option>
        <option value="spacious">Spacious Theme</option>
        <option value="minimal">Minimal Theme</option>
      </select>
      <button onclick="window.close()" class="btn btn-danger">
        ❌ Close
      </button>
    </div>
  </header>

  <div class="page-container">
    <!-- Overview Page -->
    <div class="page overview-page">
      <h1 class="page-title">${safeText(state.bookName)} - Structure Overview</h1>
      ${overviewTable}
    </div>

    <!-- Segment Pages -->
    ${segmentPages}
  </div>

  <script>
    ${getPreviewScripts()}
  </script>
</body>
</html>`;
}

/**
 * Builds the overview table HTML
 */
function buildOverviewTableHTML(state) {
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const sectionsById = Object.fromEntries(
    state.sections.map(s => [s.id, s])
  );
  const divisionsById = Object.fromEntries(
    state.divisions.map(d => [d.id, d])
  );

  let tableHTML = `
    <table class="overview-table">
      <thead>
        <tr>
          <th>Division</th>
          <th>Section</th>
          <th>Segment</th>
          <th rowspan="${segmentsSorted.length + 1}" class="key-verse-cell">
            <div contenteditable="true">
              <strong>Key verse:</strong><br>
              ${safeText(state.keyVerse)}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
  `;

  let lastDiv = null;
  let lastSec = null;
  let divRowspan = 0;
  let secRowspan = 0;

  // Calculate rowspans
  const divRowspans = {};
  const secRowspans = {};

  segmentsSorted.forEach(seg => {
    const sec = sectionsById[seg.sectionId];
    const div = sec ? divisionsById[sec.divisionId] : null;

    if (div) {
      divRowspans[div.id] = (divRowspans[div.id] || 0) + 1;
    }
    if (sec) {
      secRowspans[sec.id] = (secRowspans[sec.id] || 0) + 1;
    }
  });

  segmentsSorted.forEach((seg, idx) => {
    const sec = sectionsById[seg.sectionId];
    const div = sec ? divisionsById[sec.divisionId] : null;

    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    tableHTML += '<tr>';

    // Division cell
    if (div?.id !== lastDiv) {
      const rowspan = div ? (divRowspans[div.id] || 1) : 1;
      tableHTML += `
        <td rowspan="${rowspan}" class="division-cell" contenteditable="true">
          ${safeText(div?.title)}
        </td>
      `;
      lastDiv = div?.id;
    }

    // Section cell
    if (sec?.id !== lastSec) {
      const rowspan = sec ? (secRowspans[sec.id] || 1) : 1;
      tableHTML += `
        <td rowspan="${rowspan}" class="section-cell" contenteditable="true">
          ${safeText(sec?.title)}
        </td>
      `;
      lastSec = sec?.id;
    }

    // Segment cell
    tableHTML += `
      <td class="segment-cell">
        <div contenteditable="true" class="segment-title">
          ${safeText(seg.title)}
        </div>
        <div class="segment-range">${range}</div>
      </td>
    `;

    tableHTML += '</tr>';
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  return tableHTML;
}

/**
 * Builds the segment pages HTML
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

    html += `
      <div class="page segment-page">
        <h2 class="segment-title" contenteditable="true">${safeText(seg.title)}</h2>

        <table class="segment-table">
          <tbody>
    `;

    // Add paragraph rows
    for (let i = segStart; i <= segEnd; i++) {
      const para = paragraphs[i];
      if (!para) continue;

      html += `
        <tr>
          <td class="blank-column"></td>
          <td class="content-column">
            <div class="paragraph-header">
              <span class="paragraph-range">${para.range}</span>
              <span class="paragraph-title" contenteditable="true">${safeText(para.title)}</span>
            </div>
            <div class="writing-space" contenteditable="true"></div>
          </td>
          <td class="blank-column"></td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  return html;
}

/**
 * CSS styles for the preview
 */
function getPreviewStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%);
      min-height: 100vh;
      padding: 0;
    }

    .toolbar {
      position: sticky;
      top: 0;
      background: #1A73E8;
      padding: 1rem 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      z-index: 1000;
    }

    .toolbar-brand {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .btn-primary { background: #1A73E8; color: white; border-color: #1A73E8; }
    .btn-primary:hover { background: #1765CC; border-color: #1765CC; }

    .btn-success { background: #1E8E3E; color: white; border-color: #1E8E3E; }
    .btn-success:hover { background: #15803D; border-color: #15803D; }

    .btn-secondary { background: #F8F9FA; color: #202124; border-color: #DADCE0; }
    .btn-secondary:hover { background: #E8EAED; border-color: #1A73E8; color: #1A73E8; }

    .btn-info { background: #0891B2; color: white; border-color: #0891B2; }
    .btn-info:hover { background: #0E7490; border-color: #0E7490; }

    .btn-warning { background: #F9AB00; color: #202124; border-color: #F9AB00; }
    .btn-warning:hover { background: #EA9200; border-color: #EA9200; }

    .btn-danger { background: #D93025; color: white; border-color: #D93025; }
    .btn-danger:hover { background: #C5221F; border-color: #C5221F; }

    .theme-selector {
      padding: 0.5rem 1rem;
      border: 2px solid #DADCE0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      background: #F8F9FA;
      color: #202124;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
    }

    .theme-selector:hover {
      border-color: #1A73E8;
      color: #1A73E8;
    }

    .page-container {
      max-width: 8.5in;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .page {
      background: white;
      padding: 0.5in;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(60, 64, 67, 0.15);
      border-radius: 4px;
      min-height: 11in;
      page-break-after: always;
    }

    .page-title {
      font-family: 'Inter', sans-serif;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 2rem;
      font-weight: 700;
      color: #202124;
      letter-spacing: -0.5px;
      padding-bottom: 1rem;
      border-bottom: 3px solid #1A73E8;
    }

    /* Overview Table Styles */
    .overview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1rem;
      box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1);
    }

    .overview-table th,
    .overview-table td {
      border: 2px solid #DADCE0;
      padding: 1rem;
      text-align: center;
      vertical-align: middle;
    }

    .overview-table th {
      background: #1A73E8;
      color: white;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .division-cell,
    .section-cell {
      font-weight: 700;
      background: #F8F9FA;
      font-family: 'Inter', sans-serif;
      color: #202124;
    }

    .segment-cell {
      text-align: left;
      background: white;
    }

    .segment-title {
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #202124;
      font-family: 'Inter', sans-serif;
    }

    .segment-range {
      font-size: 0.875rem;
      color: #5F6368;
      font-weight: 600;
    }

    .key-verse-cell {
      background: #E6F4EA;
      font-style: italic;
      color: #1E8E3E;
    }

    /* Segment Page Styles */
    .segment-page .segment-title {
      font-family: 'Inter', sans-serif;
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      padding: 1rem;
      background: #1A73E8;
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(60, 64, 67, 0.15);
    }

    .segment-table {
      width: 100%;
      border-collapse: collapse;
      box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1);
    }

    .segment-table td {
      border: 2px solid #DADCE0;
      padding: 1rem;
    }

    .blank-column {
      width: 20%;
      background: #F8F9FA;
    }

    .content-column {
      width: 60%;
      background: white;
    }

    .paragraph-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #E8EAED;
    }

    .paragraph-range {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      color: #1A73E8;
      font-size: 0.875rem;
    }

    .paragraph-title {
      flex: 1;
      margin-left: 1rem;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      color: #202124;
    }

    .writing-space {
      min-height: 120px;
      padding: 0.75rem;
      background: #F8F9FA;
      border-radius: 4px;
      font-family: 'Inter', sans-serif;
      color: #202124;
      line-height: 1.6;
    }

    /* Editable content styling */
    [contenteditable="true"] {
      outline: none;
      position: relative;
      transition: all 0.2s ease;
    }

    [contenteditable="true"]:hover {
      background: #FFF9E6;
    }

    [contenteditable="true"]:focus {
      background: #FFFBCC;
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
      border-radius: 2px;
    }

    /* Theme: Compact */
    .theme-compact .overview-table {
      font-size: 14px;
    }

    .theme-compact .overview-table th,
    .theme-compact .overview-table td {
      padding: 8px;
    }

    .theme-compact .segment-table td {
      padding: 6px;
    }

    .theme-compact .writing-space {
      min-height: 60px;
    }

    /* Theme: Spacious */
    .theme-spacious .overview-table {
      font-size: 20px;
    }

    .theme-spacious .overview-table th,
    .theme-spacious .overview-table td {
      padding: 20px;
    }

    .theme-spacious .segment-table td {
      padding: 15px;
    }

    .theme-spacious .writing-space {
      min-height: 150px;
    }

    /* Theme: Minimal */
    .theme-minimal .overview-table th,
    .theme-minimal .overview-table td {
      border: 1px solid #ddd;
    }

    .theme-minimal .overview-table th {
      background: white;
    }

    .theme-minimal .division-cell,
    .theme-minimal .section-cell {
      background: white;
    }

    .theme-minimal .blank-column {
      background: white;
      border: 1px solid #ddd;
    }

    .theme-minimal .page {
      box-shadow: none;
    }

    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .toolbar {
        display: none !important;
      }

      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      [contenteditable="true"] {
        background: transparent !important;
        box-shadow: none !important;
      }
    }
  `;
}

/**
 * JavaScript for interactive preview
 */
function getPreviewScripts() {
  return `
    let editMode = false;
    let hasChanges = false;
    let currentTheme = 'default';

    function toggleEditMode() {
      editMode = !editMode;
      const editables = document.querySelectorAll('[contenteditable]');
      const btn = document.getElementById('editBtn');

      editables.forEach(el => {
        el.contentEditable = editMode ? 'true' : 'false';
      });

      if (editMode) {
        btn.textContent = '🔒 Disable Editing';
        btn.classList.add('btn-warning');
        btn.classList.remove('btn-secondary');
      } else {
        btn.textContent = '✏️ Enable Editing';
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-warning');
      }
    }

    function syncChangesToMainApp() {
      if (!window.opener || window.opener.closed) {
        alert('Main app is closed. Please reopen it to sync changes.');
        return;
      }

      try {
        // Collect all changes
        const changes = collectChanges();

        // Send changes to main app
        window.opener.postMessage({
          type: 'PREVIEW_SYNC',
          changes: changes
        }, '*');

        hasChanges = false;
        alert('✅ Changes synced successfully!\\n\\nYou can now export to Word from the main app.');
      } catch (error) {
        console.error('Sync error:', error);
        alert('❌ Failed to sync changes. Error: ' + error.message);
      }
    }

    function collectChanges() {
      const changes = {
        keyVerse: null,
        divisions: [],
        sections: [],
        segments: [],
        paragraphs: []
      };

      // Collect key verse
      const keyVerseEl = document.querySelector('.key-verse-cell [contenteditable]');
      if (keyVerseEl) {
        const text = keyVerseEl.textContent.replace(/Key verse:\\s*/i, '').trim();
        changes.keyVerse = text;
      }

      // Collect division titles
      document.querySelectorAll('.division-cell[contenteditable]').forEach((el, idx) => {
        changes.divisions.push({
          index: idx,
          title: el.textContent.trim()
        });
      });

      // Collect section titles
      document.querySelectorAll('.section-cell[contenteditable]').forEach((el, idx) => {
        changes.sections.push({
          index: idx,
          title: el.textContent.trim()
        });
      });

      // Collect segment titles
      document.querySelectorAll('.segment-title[contenteditable]').forEach((el, idx) => {
        changes.segments.push({
          index: idx,
          title: el.textContent.trim()
        });
      });

      // Collect paragraph titles
      document.querySelectorAll('.paragraph-title[contenteditable]').forEach((el, idx) => {
        changes.paragraphs.push({
          index: idx,
          title: el.textContent.trim()
        });
      });

      return changes;
    }

    function changeTheme(theme) {
      currentTheme = theme;
      document.body.className = 'theme-' + theme;
    }

    function exportToWord() {
      if (hasChanges) {
        const sync = confirm('You have unsaved changes.\\n\\nSync changes to main app before exporting?');
        if (sync) {
          syncChangesToMainApp();
          setTimeout(() => {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'EXPORT_WORD' }, '*');
            }
          }, 500);
        }
      } else {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'EXPORT_WORD' }, '*');
          window.close();
        } else {
          alert('Main app is closed. Please reopen it to export.');
        }
      }
    }

    // Track changes
    document.addEventListener('input', (e) => {
      if (e.target.contentEditable === 'true') {
        hasChanges = true;
      }
    });

    // Initialize with editing disabled
    document.addEventListener('DOMContentLoaded', () => {
      const editables = document.querySelectorAll('[contenteditable]');
      editables.forEach(el => {
        el.contentEditable = 'false';
      });

      // Listen for refresh messages from main app
      window.addEventListener('message', (event) => {
        if (event.data.type === 'PREVIEW_REFRESH') {
          if (confirm('Main app has updated content.\\n\\nRefresh preview? (Unsaved changes will be lost)')) {
            location.reload();
          }
        }
      });
    });

    // Warn before closing if content was edited
    window.addEventListener('beforeunload', (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Sync them before closing?';
      }
    });
  `;
}
