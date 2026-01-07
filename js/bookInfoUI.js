/* bookInfoUI.js
   UI for editable book metadata:
   - Book title
   - Key verse
*/

import { state } from "./state.js";
import { getById, createEl } from "./domUtils.js";
import { scheduleAutosave } from "./autosave.js";

export function renderBookInfoInputs() {
  const container = getById('bookInfoRow');
  if (!container) return;
  container.innerHTML = '';

  // ---- Book Title ----
const titleWrap = createEl('div', { className: 'input-inline' });
const titleLabel = createEl('label', { text: 'Book Title:' });
const titleInput = createEl('input', {
  attrs: { type: 'text', placeholder: 'Enter book title' }
});

titleInput.value = state.bookName;
titleInput.oninput = e => {
  const oldName = state.bookName;   // optional, if you want to know the previous name
  state.bookName = e.target.value;

  // Update the bookIndex so the library shows the new title
  const index = JSON.parse(localStorage.getItem("bookIndex")) || {};
  if (state.bookId) {
    index[state.bookId] = {
      bookName: state.bookName,
      lastModified: Date.now()
    };
    localStorage.setItem("bookIndex", JSON.stringify(index));
  }

  scheduleAutosave();
};


  titleWrap.append(titleLabel, titleInput);

  // ---- Key Verse ----
  const keyWrap = createEl('div', { className: 'input-inline' });
  const keyLabel = createEl('label', { text: 'Key Verse:' });
  const keyInput = createEl('input', {
    attrs: { type: 'text', placeholder: 'e.g. 3:16' }
  });

  keyInput.value = state.keyVerse;
  keyInput.oninput = e => {
    const val = e.target.value;
    if (/^\d{0,3}:?\d{0,3}$/.test(val)) {
      state.keyVerse = val;
      scheduleAutosave();
    } else {
      e.target.value = state.keyVerse;
    }
  };

  keyWrap.append(keyLabel, keyInput);

  container.append(titleWrap, keyWrap);
}
