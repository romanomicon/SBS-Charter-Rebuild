/* autosave.js
   Handles delayed autosave to persistent storage.

   Autosave is debounced so rapid edits do not spam storage.
*/

import { saveBook } from "./storage.js";
import { state } from "./state.js";

let autosaveTimer;

export function scheduleAutosave(delay = 700) {
  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(() => {
    saveBook(state);
  }, delay);
}
