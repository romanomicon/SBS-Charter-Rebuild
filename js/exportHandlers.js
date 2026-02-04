/* exportHandlers.js
   Handles export actions:
   - Chart Editor (HTML) export
   - Word export (delegated to exportWord)
*/

import { state } from "./state.js";
import { getById } from "./domUtils.js";
import { exportWord } from "./export/exportWord.js";
import { exportHTML } from "./export/exportHTML.js";

export function initExportButtons() {
  // Chart Editor button - opens Chart Editor (preview.html) page
  const previewBtn = getById('export-preview');
  if (previewBtn) {
    previewBtn.onclick = () => exportHTML(state);
  }

  const wordBtn = getById('export-word');
  if (wordBtn) {
    wordBtn.onclick = () => exportWord(state);
  }
}
