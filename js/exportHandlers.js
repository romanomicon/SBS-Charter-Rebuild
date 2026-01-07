/* exportHandlers.js
   Handles export actions:
   - JSON structure export
   - Word export (delegated to exportWord)
*/

import { state } from "./state.js";
import { getById, createEl } from "./domUtils.js";
import { exportWord } from "./export/exportWord.js"; // ✅ ADD THIS

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

  const wordBtn = getById('export-word');
  if (wordBtn) {
    wordBtn.onclick = () => exportWord(state);
  }
}
