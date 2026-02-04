/* home.js
   Dynamic generation of home page tiles
*/

import { BOOKS } from "./books.js";
import { listBooks } from "./storage.js";
import { runSanityCheck } from "./debugSanityCheck.js";

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  const index = listBooks();

  BOOKS.forEach(bookCanonicalId => {
    const tile = document.createElement('div');
    tile.className = 'book-tile';
    tile.setAttribute('aria-label', `Open ${bookCanonicalId}`);

    const savedMeta = index[bookCanonicalId];
    const isSaved = !!savedMeta;
    const displayName = savedMeta?.bookTitle || bookCanonicalId;

    if (isSaved) {
      tile.classList.add('saved');
      tile.innerHTML = `
        <div class="split-btn">
          <button class="split-left" title="Open Charter Builder">
            <span class="btn-label">${displayName}</span>
            <span class="btn-hint">Builder</span>
          </button>
          <button class="split-right" title="Open Chart Editor">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
            </svg>
            <span class="btn-hint">Chart</span>
          </button>
        </div>
      `;

      tile.querySelector('.split-left').addEventListener('click', () => {
        window.location.href = `book.html?bookId=${bookCanonicalId}`;
      });

      tile.querySelector('.split-right').addEventListener('click', () => {
        window.location.href = `preview.html?bookId=${bookCanonicalId}`;
      });
    } else {
      tile.classList.add('new');
      tile.innerHTML = `<span class="pill-label">${displayName}</span>`;

      tile.addEventListener('click', () => {
        window.location.href = `book.html?name=${bookCanonicalId}`;
      });
    }

    grid.appendChild(tile);
  });

  // Only run debug sanity check if ?debug=true URL param exists
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "true") {
    runSanityCheck(BOOKS);
  }
});
