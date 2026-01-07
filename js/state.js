/* state.js
   Central application state for a book page.

   This object is intentionally mutable and shared.
   All UI modules read from and write to this state.
*/

// state.js
export const state = {
  bookId: null,
  bookName: '',
  paragraphs: [],
  divisions: [],
  sections: [],
  segments: [],
  ids: {
    division: 0,
    section: 0,
    segment: 0
  }
};


export let isDirty = false;

export function markDirty() {
  isDirty = true;
  document.getElementById('dirtyStatus')?.classList.add('visible');
}

export function clearDirty() {
  isDirty = false;
  document.getElementById('dirtyStatus')?.classList.remove('visible');
}

