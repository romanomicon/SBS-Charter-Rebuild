/*
========================================================================
CHART EDITOR - Editable book structure chart
========================================================================
Loads book from storage and allows editing of:
- Division titles
- Section titles
- Segment titles
- Key verse
- Paragraph titles
- Paragraph content (notes/writing space)
- Segment side notes (left and right columns)

Changes are saved back to storage.
========================================================================
*/

import { loadBook } from "./storage.js";
import { exportWord } from "./export/exportWord.js";

// Current book state (loaded from storage)
let bookState = null;
let isDirty = false;
let currentEditableElement = null;

// ================================
// Text Formatting Toolbar (Fixed at top)
// ================================

function createFormatToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'format-toolbar-fixed';
  toolbar.id = 'formatToolbar';
  toolbar.innerHTML = `
    <div class="toolbar-section">
      <select id="headingSelect" class="toolbar-select" title="Heading Style">
        <option value="">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <select id="fontSizeSelect" class="toolbar-select" title="Font Size">
        <option value="">Size</option>
        <option value="1">8pt</option>
        <option value="2">10pt</option>
        <option value="3">12pt</option>
        <option value="4">14pt</option>
        <option value="5">18pt</option>
        <option value="6">24pt</option>
        <option value="7">36pt</option>
      </select>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <button type="button" data-cmd="bold" class="fmt-bold" title="Bold (Ctrl+B)">B</button>
      <button type="button" data-cmd="italic" class="fmt-italic" title="Italic (Ctrl+I)">I</button>
      <button type="button" data-cmd="underline" class="fmt-underline" title="Underline (Ctrl+U)">U</button>
      <button type="button" data-cmd="strikeThrough" class="fmt-strike" title="Strikethrough">S</button>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <div class="color-picker">
        <button type="button" data-cmd="textColor" title="Text Color">
          <span class="color-icon">A</span>
          <span class="color-bar" id="textColorBar"></span>
        </button>
        <div class="color-palette" id="textColorPalette">
          <button type="button" data-color="#000000" style="background:#000000" title="Black"></button>
          <button type="button" data-color="#434343" style="background:#434343" title="Dark Gray"></button>
          <button type="button" data-color="#666666" style="background:#666666" title="Gray"></button>
          <button type="button" data-color="#999999" style="background:#999999" title="Light Gray"></button>
          <button type="button" data-color="#c00000" style="background:#c00000" title="Dark Red"></button>
          <button type="button" data-color="#ff0000" style="background:#ff0000" title="Red"></button>
          <button type="button" data-color="#ffc000" style="background:#ffc000" title="Orange"></button>
          <button type="button" data-color="#ffff00" style="background:#ffff00" title="Yellow"></button>
          <button type="button" data-color="#92d050" style="background:#92d050" title="Light Green"></button>
          <button type="button" data-color="#00b050" style="background:#00b050" title="Green"></button>
          <button type="button" data-color="#00b0f0" style="background:#00b0f0" title="Light Blue"></button>
          <button type="button" data-color="#0070c0" style="background:#0070c0" title="Blue"></button>
          <button type="button" data-color="#002060" style="background:#002060" title="Dark Blue"></button>
          <button type="button" data-color="#7030a0" style="background:#7030a0" title="Purple"></button>
        </div>
      </div>
      <div class="highlight-picker">
        <button type="button" data-cmd="highlight" title="Highlight">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <div class="highlight-colors" id="highlightColors">
          <button type="button" data-highlight="yellow" class="highlight-yellow" title="Yellow"></button>
          <button type="button" data-highlight="green" class="highlight-green" title="Green"></button>
          <button type="button" data-highlight="blue" class="highlight-blue" title="Blue"></button>
          <button type="button" data-highlight="pink" class="highlight-pink" title="Pink"></button>
          <button type="button" data-highlight="orange" class="highlight-orange" title="Orange"></button>
          <button type="button" data-highlight="purple" class="highlight-purple" title="Purple"></button>
          <button type="button" class="remove-highlight" data-highlight="remove">Remove</button>
        </div>
      </div>
      <button type="button" data-cmd="removeFormat" title="Clear Formatting">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <button type="button" data-cmd="subscript" title="Subscript">
        <span style="font-size: 11px;">x<sub>2</sub></span>
      </button>
      <button type="button" data-cmd="superscript" title="Superscript">
        <span style="font-size: 11px;">x<sup>2</sup></span>
      </button>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <button type="button" data-cmd="justifyLeft" title="Align Left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
        </svg>
      </button>
      <button type="button" data-cmd="justifyCenter" title="Align Center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
      <button type="button" data-cmd="justifyRight" title="Align Right">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="separator"></div>
    <div class="toolbar-section">
      <button type="button" data-cmd="insertUnorderedList" title="Bullet List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="4" cy="6" r="1.5" fill="currentColor"/><line x1="9" y1="6" x2="21" y2="6"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor"/><line x1="9" y1="12" x2="21" y2="12"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor"/><line x1="9" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <button type="button" data-cmd="insertOrderedList" title="Numbered List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <text x="2" y="8" font-size="6" fill="currentColor">1.</text><line x1="9" y1="6" x2="21" y2="6"/>
          <text x="2" y="14" font-size="6" fill="currentColor">2.</text><line x1="9" y1="12" x2="21" y2="12"/>
          <text x="2" y="20" font-size="6" fill="currentColor">3.</text><line x1="9" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <button type="button" data-cmd="indent" title="Increase Indent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>
          <polyline points="3 10 6 12 3 14"/>
        </svg>
      </button>
      <button type="button" data-cmd="outdent" title="Decrease Indent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>
          <polyline points="6 10 3 12 6 14"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(toolbar);
  return toolbar;
}

function initFormatToolbar() {
  const toolbar = createFormatToolbar();

  // Setup editor toggle - controls toolbar visibility
  const editorToggle = document.getElementById('advancedEditorToggle');
  if (editorToggle) {
    editorToggle.addEventListener('change', (e) => {
      toolbar.classList.toggle('visible', e.target.checked);
    });
  }

  // Track current editable element for toolbar commands
  document.addEventListener('focusin', (e) => {
    const editableEl = e.target.closest ? e.target.closest('[contenteditable="true"]') : null;
    if (editableEl) {
      currentEditableElement = editableEl;
    }
  });

  // Prevent toolbar from stealing focus (except for selects)
  toolbar.addEventListener('mousedown', (e) => {
    if (!e.target.closest('select')) {
      e.preventDefault();
    }
  });

  // Heading style select
  const headingSelect = document.getElementById('headingSelect');
  if (headingSelect) {
    headingSelect.addEventListener('change', (e) => {
      if (currentEditableElement) {
        currentEditableElement.focus();
      }
      const value = e.target.value;
      if (value) {
        document.execCommand('formatBlock', false, value);
      } else {
        document.execCommand('formatBlock', false, 'div');
      }
      markDirty();
      e.target.value = ''; // Reset to show placeholder
    });
  }

  // Font size select
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
      if (currentEditableElement) {
        currentEditableElement.focus();
      }
      const value = e.target.value;
      if (value) {
        document.execCommand('fontSize', false, value);
      }
      markDirty();
      e.target.value = ''; // Reset to show placeholder
    });
  }

  // Handle toolbar button clicks
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const cmd = btn.dataset.cmd;
    const highlight = btn.dataset.highlight;
    const textColor = btn.dataset.color;
    const highlightColors = document.getElementById('highlightColors');
    const textColorPalette = document.getElementById('textColorPalette');

    if (cmd === 'highlight') {
      highlightColors?.classList.toggle('visible');
      textColorPalette?.classList.remove('visible');
      return;
    }

    if (cmd === 'textColor') {
      textColorPalette?.classList.toggle('visible');
      highlightColors?.classList.remove('visible');
      return;
    }

    if (highlight) {
      applyHighlight(highlight);
      highlightColors?.classList.remove('visible');
      return;
    }

    if (textColor) {
      applyTextColor(textColor);
      textColorPalette?.classList.remove('visible');
      return;
    }

    if (cmd) {
      // Restore focus to the editable element before executing command
      if (currentEditableElement) {
        currentEditableElement.focus();
      }
      document.execCommand(cmd, false, null);
      markDirty();
      updateToolbarState();
    }
  });

  // Hide pickers when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.highlight-picker')) {
      document.getElementById('highlightColors')?.classList.remove('visible');
    }
    if (!e.target.closest('.color-picker')) {
      document.getElementById('textColorPalette')?.classList.remove('visible');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const editableParent = document.activeElement?.closest?.('[contenteditable="true"]');
    if (!editableParent) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false, null);
          markDirty();
          updateToolbarState();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false, null);
          markDirty();
          updateToolbarState();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false, null);
          markDirty();
          updateToolbarState();
          break;
      }
    }
  });

  // Update toolbar state on selection change
  document.addEventListener('selectionchange', updateToolbarState);
}

function applyTextColor(color) {
  if (currentEditableElement) {
    currentEditableElement.focus();
  }
  document.execCommand('foreColor', false, color);
  // Update the color bar indicator
  const colorBar = document.getElementById('textColorBar');
  if (colorBar) {
    colorBar.style.backgroundColor = color;
  }
  markDirty();
}

function updateToolbarState() {
  const toolbar = document.getElementById('formatToolbar');
  if (!toolbar) return;

  toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (cmd && cmd !== 'highlight' && cmd !== 'removeFormat') {
      try {
        const isActive = document.queryCommandState(cmd);
        btn.classList.toggle('active', isActive);
      } catch (e) {
        // Some commands may not have a state
      }
    }
  });
}

function applyHighlight(color) {
  if (color === 'remove') {
    document.execCommand('removeFormat', false, null);
    document.execCommand('hiliteColor', false, 'transparent');
  } else {
    const colorMap = {
      yellow: '#fff59d',
      green: '#a5d6a7',
      blue: '#90caf9',
      pink: '#f48fb1',
      orange: '#ffcc80',
      purple: '#ce93d8'
    };
    document.execCommand('hiliteColor', false, colorMap[color] || color);
  }
  markDirty();
}

// Helper functions
function safeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sanitize HTML - allow only safe formatting tags
function sanitizeHtml(html) {
  if (!html) return "";

  // Create a temporary element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Allowed tags for formatting (including FONT for color/size and H1-H3 for headings)
  const allowedTags = ['B', 'I', 'U', 'STRONG', 'EM', 'SPAN', 'BR', 'STRIKE', 'S', 'DEL', 'SUB', 'SUP', 'UL', 'OL', 'LI', 'DIV', 'P', 'FONT', 'H1', 'H2', 'H3'];

  // Recursively clean nodes
  function cleanNode(node) {
    const childNodes = Array.from(node.childNodes);

    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.includes(child.tagName)) {
          // Replace disallowed tags with their content
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          node.removeChild(child);
        } else {
          // Remove dangerous attributes but keep safe ones
          const attrs = Array.from(child.attributes);
          for (const attr of attrs) {
            if (attr.name === 'style') {
              // Only allow safe style properties
              const safeStyles = [];
              const bgMatch = attr.value.match(/background-color:\s*([^;]+)/i);
              const alignMatch = attr.value.match(/text-align:\s*([^;]+)/i);
              const marginMatch = attr.value.match(/margin-left:\s*([^;]+)/i);
              const colorMatch = attr.value.match(/(?:^|[^-])color:\s*([^;]+)/i);
              const fontSizeMatch = attr.value.match(/font-size:\s*([^;]+)/i);
              if (bgMatch) safeStyles.push(`background-color: ${bgMatch[1]}`);
              if (alignMatch) safeStyles.push(`text-align: ${alignMatch[1]}`);
              if (marginMatch) safeStyles.push(`margin-left: ${marginMatch[1]}`);
              if (colorMatch) safeStyles.push(`color: ${colorMatch[1]}`);
              if (fontSizeMatch) safeStyles.push(`font-size: ${fontSizeMatch[1]}`);
              if (safeStyles.length > 0) {
                child.setAttribute('style', safeStyles.join('; '));
              } else {
                child.removeAttribute('style');
              }
            } else if (attr.name === 'color' && child.tagName === 'FONT') {
              // Allow color attribute on FONT tags
            } else if (attr.name === 'size' && child.tagName === 'FONT') {
              // Allow size attribute on FONT tags
            } else if (attr.name !== 'class') {
              child.removeAttribute(attr.name);
            }
          }
          cleanNode(child);
        }
      }
    }
  }

  cleanNode(temp);
  return temp.innerHTML.trim();
}

function computeSegStart(seg) {
  return Math.min(...seg.paragraphIndexes);
}

function computeSegEnd(seg, segmentsSorted, totalParagraphs) {
  const segStart = computeSegStart(seg);
  const idx = segmentsSorted.findIndex(s => computeSegStart(s) === segStart);
  if (idx < segmentsSorted.length - 1) {
    return computeSegStart(segmentsSorted[idx + 1]) - 1;
  }
  return totalParagraphs - 1;
}

function humanRangeFromIdx(startIdx, endIdx, paragraphs) {
  const startPara = paragraphs[startIdx];
  const endPara = paragraphs[endIdx];
  if (!startPara || !endPara) return "";
  const startRange = startPara.range || "";
  const endRange = endPara.range || "";
  if (startRange === endRange) return startRange;
  return `${startRange}–${endRange}`;
}

// Mark as dirty (unsaved changes)
function markDirty() {
  isDirty = true;
  updateSaveStatus();
}

function markClean() {
  isDirty = false;
  updateSaveStatus();
}

function updateSaveStatus() {
  const saveStatus = document.getElementById("saveStatus");
  const dirtyStatus = document.getElementById("dirtyStatus");

  if (saveStatus && dirtyStatus) {
    if (isDirty) {
      saveStatus.style.display = "none";
      dirtyStatus.style.display = "inline";
    } else {
      saveStatus.style.display = "inline";
      dirtyStatus.style.display = "none";
    }
  }
}

// Save book to storage
function saveBook() {
  if (!bookState || !bookState.bookId) return;

  const bookKey = bookState.bookId;
  const index = JSON.parse(localStorage.getItem("bookIndex")) || {};

  const data = {
    bookId: bookKey,
    bookName: bookState.bookName || "",
    bookTitle: bookState.bookTitle || bookState.bookName,
    keyVerse: bookState.keyVerse || "",
    paragraphs: bookState.paragraphs || [],
    divisions: bookState.divisions || [],
    sections: bookState.sections || [],
    segments: bookState.segments || [],
    lastModified: Date.now()
  };

  localStorage.setItem(bookKey, JSON.stringify(data));

  index[bookKey] = {
    bookTitle: data.bookTitle,
    lastModified: data.lastModified
  };
  localStorage.setItem("bookIndex", JSON.stringify(index));

  markClean();
  console.log("Book saved:", bookKey);
}

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");

  if (!bookId) {
    showError("No book ID provided. Please go back to the editor.");
    return;
  }

  // Load book from storage
  bookState = loadBook(bookId);

  if (!bookState) {
    showError(`Book "${bookId}" not found. Please go back to the library.`);
    return;
  }

  // Update page title
  document.title = `${bookState.bookName || "Book"} — Chart Editor`;

  // Update back link
  const backLink = document.getElementById("backToBookLink");
  if (backLink) {
    backLink.href = `book.html?bookId=${encodeURIComponent(bookId)}`;
  }

  // Initialize formatting toolbar
  initFormatToolbar();

  // Render the preview
  renderPreview();

  // Setup button handlers
  document.getElementById("printBtn").onclick = () => window.print();
  document.getElementById("exportWordBtn").onclick = () => exportWord(bookState);
  document.getElementById("saveBtn").onclick = saveBook;

  // Initial save status
  markClean();
});

function showError(message) {
  document.getElementById("previewContent").innerHTML = `
    <div class="preview-page">
      <p style="text-align: center; padding: 2rem;">${message}</p>
      <p style="text-align: center;">
        <a href="library.html">Go to Library</a>
      </p>
    </div>
  `;
}

function renderPreview() {
  const container = document.getElementById("previewContent");
  const overviewHtml = buildOverviewPage();
  const segmentPagesHtml = buildSegmentPages();
  container.innerHTML = overviewHtml + segmentPagesHtml;

  // Setup editable cell listeners
  setupEditableListeners();
}

function setupEditableListeners() {
  // Key verse editing
  const keyVerseEl = document.querySelector('[data-field="keyVerse"]');
  if (keyVerseEl) {
    keyVerseEl.addEventListener("blur", () => {
      bookState.keyVerse = keyVerseEl.textContent.trim();
      markDirty();
    });
  }

  // Division title editing
  document.querySelectorAll('[data-type="division"]').forEach(el => {
    el.addEventListener("blur", () => {
      const divId = parseInt(el.dataset.id);
      const division = bookState.divisions.find(d => d.id === divId);
      if (division) {
        division.title = el.textContent.trim();
        markDirty();
      }
    });
  });

  // Section title editing
  document.querySelectorAll('[data-type="section"]').forEach(el => {
    el.addEventListener("blur", () => {
      const secId = parseInt(el.dataset.id);
      const section = bookState.sections.find(s => s.id === secId);
      if (section) {
        section.title = el.textContent.trim();
        markDirty();
      }
    });
  });

  // Segment title editing (overview table)
  document.querySelectorAll('[data-type="segment"]').forEach(el => {
    el.addEventListener("blur", () => {
      const segId = parseInt(el.dataset.id);
      const segment = bookState.segments.find(s => s.id === segId);
      if (segment) {
        segment.title = el.textContent.trim();
        markDirty();
        // Also update the segment header on segment pages
        updateSegmentHeaders(segId, segment.title);
      }
    });
  });

  // Segment header editing (on segment pages)
  document.querySelectorAll('[data-type="segment-header"]').forEach(el => {
    el.addEventListener("blur", () => {
      const segId = parseInt(el.dataset.id);
      const segment = bookState.segments.find(s => s.id === segId);
      if (segment) {
        segment.title = el.textContent.trim();
        markDirty();
        // Also update the overview table
        updateOverviewSegment(segId, segment.title);
      }
    });
  });

  // Paragraph title editing
  document.querySelectorAll('[data-type="para-title"]').forEach(el => {
    el.addEventListener("blur", () => {
      const idx = parseInt(el.dataset.idx);
      if (bookState.paragraphs[idx]) {
        const newTitle = el.textContent.trim();
        // Clear placeholder text if user didn't type anything
        if (newTitle === "(click to add title)") {
          bookState.paragraphs[idx].title = "";
        } else {
          bookState.paragraphs[idx].title = newTitle;
        }
        markDirty();
      }
    });
    // Clear placeholder on focus
    el.addEventListener("focus", () => {
      if (el.textContent.trim() === "(click to add title)") {
        el.textContent = "";
      }
    });
  });

  // Paragraph content (writing space) editing - supports HTML formatting
  document.querySelectorAll('[data-type="para-content"]').forEach(el => {
    el.addEventListener("blur", () => {
      const idx = parseInt(el.dataset.idx);
      if (bookState.paragraphs[idx]) {
        bookState.paragraphs[idx].content = sanitizeHtml(el.innerHTML);
        markDirty();
      }
    });
  });

  // Segment left column notes editing - supports HTML formatting
  document.querySelectorAll('[data-type="seg-left"]').forEach(el => {
    el.addEventListener("blur", () => {
      const segId = parseInt(el.dataset.id);
      const segment = bookState.segments.find(s => s.id === segId);
      if (segment) {
        segment.leftNote = sanitizeHtml(el.innerHTML);
        markDirty();
      }
    });
  });

  // Segment right column notes editing - supports HTML formatting
  document.querySelectorAll('[data-type="seg-right"]').forEach(el => {
    el.addEventListener("blur", () => {
      const segId = parseInt(el.dataset.id);
      const segment = bookState.segments.find(s => s.id === segId);
      if (segment) {
        segment.rightNote = sanitizeHtml(el.innerHTML);
        markDirty();
      }
    });
  });
}

// Helper to sync segment title from overview table to segment page headers
function updateSegmentHeaders(segId, title) {
  document.querySelectorAll(`[data-type="segment-header"][data-id="${segId}"]`).forEach(el => {
    el.textContent = title || `Segment ${segId}`;
  });
}

// Helper to sync segment title from segment page header to overview table
function updateOverviewSegment(segId, title) {
  document.querySelectorAll(`[data-type="segment"][data-id="${segId}"]`).forEach(el => {
    el.textContent = title || `Segment ${segId}`;
  });
}

function buildOverviewPage() {
  const paragraphs = bookState.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...bookState.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const divisionsSorted = [...bookState.divisions].sort((a, b) => {
    const aStart = Math.min(...a.paragraphIndexes);
    const bStart = Math.min(...b.paragraphIndexes);
    return aStart - bStart;
  });

  const sectionsSorted = [...bookState.sections].sort((a, b) => {
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

  // Pre-calculate row data with paragraph counts for height calculation
  const rowData = segmentsSorted.map(seg => {
    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const sec = findSectionForSegment(segStart);
    const div = findDivisionForSegment(segStart);
    const paragraphCount = segEnd - segStart + 1;
    return { seg, sec, div, divStart: getDivStart(div), secStart: getSecStart(sec), paragraphCount };
  });

  // Calculate height scaling to fit on A4 page
  const heightPerParagraph = 25;
  const minRowHeight = 40;
  const maxTableHeight = 880;
  const headerHeight = 40;

  const totalNaturalHeight = rowData.reduce((sum, row) => {
    return sum + Math.max(minRowHeight, row.paragraphCount * heightPerParagraph);
  }, 0) + headerHeight;

  const heightScale = totalNaturalHeight > maxTableHeight
    ? (maxTableHeight - headerHeight) / (totalNaturalHeight - headerHeight)
    : 1.0;

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

  // Build table rows with editable cells
  let tableRows = "";
  rowData.forEach((row, idx) => {
    const { seg, sec, div, paragraphCount } = row;
    const { isNewDiv, isNewSec, divRowspan, secRowspan } = rowMeta[idx];

    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    const naturalHeight = Math.max(minRowHeight, paragraphCount * heightPerParagraph);
    const rowHeight = Math.round(naturalHeight * heightScale);

    tableRows += `<tr style="height: ${rowHeight}px;">`;

    if (isNewDiv) {
      const divTitle = div?.title || `Division ${div?.id}`;
      tableRows += `<td rowspan="${divRowspan}">
        <strong contenteditable="true" data-type="division" data-id="${div?.id}">${safeText(divTitle)}</strong>
      </td>`;
    }

    if (isNewSec) {
      const secTitle = sec?.title || `Section ${sec?.id}`;
      tableRows += `<td rowspan="${secRowspan}">
        <strong contenteditable="true" data-type="section" data-id="${sec?.id}">${safeText(secTitle)}</strong>
      </td>`;
    }

    const segTitle = seg.title || `Segment ${seg.id}`;
    tableRows += `
      <td>
        <strong contenteditable="true" data-type="segment" data-id="${seg.id}">${safeText(segTitle)}</strong>
        <span class="range">${range}</span>
      </td>
    `;

    tableRows += "</tr>";
  });

  const keyVerse = bookState.keyVerse || "";

  return `
    <section class="preview-page">
      <h1 class="preview-title">${safeText(bookState.bookName)} - Structure Overview</h1>

      <div class="preview-key-verse">
        <strong>Key verse:</strong> <em contenteditable="true" data-field="keyVerse">${safeText(keyVerse)}</em>
      </div>

      <table class="preview-table">
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
    </section>
  `;
}

function buildSegmentPages() {
  const paragraphs = bookState.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...bookState.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  let html = "";

  segmentsSorted.forEach(seg => {
    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    // Count total rows needed (2 rows per paragraph: header + writing space)
    let paraCount = 0;
    for (let i = segStart; i <= segEnd; i++) {
      if (paragraphs[i]) paraCount++;
    }
    const totalRows = paraCount * 2;

    // Get segment-level notes
    const leftNote = seg.leftNote || "";
    const rightNote = seg.rightNote || "";

    let rows = "";
    let isFirstPara = true;
    for (let i = segStart; i <= segEnd; i++) {
      const para = paragraphs[i];
      if (!para) continue;

      const paraTitle = para.title || "";
      const paraContent = para.content || "";

      // Only add side columns on first paragraph row (they span all rows)
      // Note: paraContent, leftNote, rightNote support HTML formatting, so we don't escape them
      if (isFirstPara) {
        rows += `
          <tr>
            <td class="side-col" rowspan="${totalRows}" contenteditable="true" data-type="seg-left" data-id="${seg.id}">${leftNote}</td>
            <td class="header-row">
              <strong>${para.range}</strong> — <span contenteditable="true" data-type="para-title" data-idx="${i}">${safeText(paraTitle) || "(click to add title)"}</span>
            </td>
            <td class="side-col" rowspan="${totalRows}" contenteditable="true" data-type="seg-right" data-id="${seg.id}">${rightNote}</td>
          </tr>
          <tr>
            <td class="writing-space" contenteditable="true" data-type="para-content" data-idx="${i}">${paraContent}</td>
          </tr>
        `;
        isFirstPara = false;
      } else {
        rows += `
          <tr>
            <td class="header-row">
              <strong>${para.range}</strong> — <span contenteditable="true" data-type="para-title" data-idx="${i}">${safeText(paraTitle) || "(click to add title)"}</span>
            </td>
          </tr>
          <tr>
            <td class="writing-space" contenteditable="true" data-type="para-content" data-idx="${i}">${paraContent}</td>
          </tr>
        `;
      }
    }

    const segTitle = seg.title || `Segment ${seg.id}`;
    html += `
      <section class="preview-page">
        <div class="segment-header">
          <strong contenteditable="true" data-type="segment-header" data-id="${seg.id}">${safeText(segTitle)}</strong>
          <span class="segment-range">${range}</span>
        </div>

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
