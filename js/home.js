/* home.js
   Dynamic generation of home page tiles
*/

import { listBooks } from "./storage.js";

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('booksGrid');
  if (!grid || typeof BOOKS === 'undefined') return;

  const index = listBooks(); // get saved books

  BOOKS.forEach(bookCanonicalId => {
    const tile = document.createElement('button');
    tile.className = 'book-tile';
    tile.setAttribute('aria-label', `Open ${bookCanonicalId}`);

    const savedMeta = index[bookCanonicalId];
    const isSaved = !!savedMeta;

    // Show the user-edited title if available
    const displayName = savedMeta?.bookTitle || bookCanonicalId;

    tile.innerHTML = `
      <h4>${displayName}</h4>
      <span class="book-status ${isSaved ? "saved" : "new"}">
        ${isSaved ? "Saved" : "New"}
      </span>
    `;

    tile.addEventListener('click', () => {
      if (isSaved) {
        window.location.href = `book.html?bookId=${bookCanonicalId}`;
      } else {
        window.location.href = `book.html?name=${bookCanonicalId}`;
      }
    });

    grid.appendChild(tile);
  });
});


import { runSanityCheck } from "./debugSanityCheck.js";

document.addEventListener("DOMContentLoaded", () => {
  // Only run if a URL param ?debug=true exists
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "true") {
    runSanityCheck();
  }
});
