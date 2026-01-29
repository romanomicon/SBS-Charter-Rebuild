/* exportHandlers.js
   Handles export actions:
   - JSON structure export
   - HTML preview export (new!)
   - Word export (delegated to exportWord)
*/

import { state } from "./state.js";
import { getById, createEl } from "./domUtils.js";
import { exportWord } from "./export/exportWord.js";
import { exportHTML } from "./export/exportHTML.js";

// Track preview window for auto-refresh
let previewWindow = null;

// Expose exportWord function globally so preview window can call it
window.triggerWordExport = () => {
  exportWord(state);
};

// Listen for messages from preview window
window.addEventListener('message', (event) => {
  if (event.data.type === 'PREVIEW_SYNC') {
    applyPreviewChanges(event.data.changes);
  } else if (event.data.type === 'EXPORT_WORD') {
    exportWord(state);
  }
});

// Listen for localStorage trigger from preview window
window.addEventListener('storage', (event) => {
  if (event.key === 'sbs-export-word-trigger') {
    exportWord(state);
  }
});

/**
 * Applies changes from preview back to main app state
 */
function applyPreviewChanges(changes) {
  try {
    // Update key verse
    if (changes.keyVerse !== null) {
      state.keyVerse = changes.keyVerse;
    }

    // Update division titles
    changes.divisions.forEach(({ index, title }) => {
      if (state.divisions[index]) {
        state.divisions[index].title = title;
      }
    });

    // Update section titles
    changes.sections.forEach(({ index, title }) => {
      if (state.sections[index]) {
        state.sections[index].title = title;
      }
    });

    // Update segment titles
    changes.segments.forEach(({ index, title }) => {
      if (state.segments[index]) {
        state.segments[index].title = title;
      }
    });

    // Update paragraph titles
    changes.paragraphs.forEach(({ index, title }) => {
      if (state.paragraphs[index]) {
        state.paragraphs[index].title = title;
      }
    });

    console.log('✅ Preview changes applied to state');

    // Mark as dirty so user can save
    if (window.markDirty) {
      window.markDirty();
    }

    // Refresh the UI
    if (window.renderBook) {
      window.renderBook();
    }
  } catch (error) {
    console.error('❌ Error applying preview changes:', error);
    alert('Failed to apply changes: ' + error.message);
  }
}

/**
 * Notify preview window to refresh when state changes
 */
export function notifyPreviewRefresh() {
  if (previewWindow && !previewWindow.closed) {
    previewWindow.postMessage({ type: 'PREVIEW_REFRESH' }, '*');
  }
}

export function initExportButtons() {
  const jsonBtn = getById('export-json');
  if (jsonBtn) {
    jsonBtn.onclick = () => {
      const blob = new Blob(
        [JSON.stringify(state, null, 2)],
        { type: 'application/json' }
      );
      const a = createEl('a', {
        attrs: {
          href: URL.createObjectURL(blob),
          download: `${state.bookName || 'book'}_structure.json`
        }
      });
      a.click();
    };
  }

  // NEW: HTML Preview button
  const previewBtn = getById('export-preview');
  if (previewBtn) {
    previewBtn.onclick = () => {
      previewWindow = exportHTML(state);
    };
  }

  const wordBtn = getById('export-word');
  if (wordBtn) {
    wordBtn.onclick = () => exportWord(state);
  }
}
