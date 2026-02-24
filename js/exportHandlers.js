import { state } from "./state.js";
import { getById } from "./domUtils.js";
import { exportWord } from "./exportWord.js";

export function initExportButtons() {
  const previewBtn = getById('export-preview');
  if (previewBtn) {
    previewBtn.onclick = () => {
      if (!state.bookId) {
        alert("Please save the book first before previewing.");
        return;
      }
      window.location.href = `preview.html?bookId=${encodeURIComponent(state.bookId)}`;
    };
  }

  const wordBtn = getById('export-word');
  if (wordBtn) {
    wordBtn.onclick = () => exportWord(state);
  }
}
