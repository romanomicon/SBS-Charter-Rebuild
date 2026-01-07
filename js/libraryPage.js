import { listBooks, loadBook, deleteBook } from "./storage.js";

const undoStack = [];
let undoTimer = null;
let countdownInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("book-library");
  if (!grid) return;

  createUndoToast();
  renderLibrary();

  /* ============================
     Render library
  ============================ */
  function renderLibrary() {
    const books = listBooks();

    if (!books || Object.keys(books).length === 0) {
      grid.innerHTML = "<p>No books saved yet.</p>";
      return;
    }

    grid.innerHTML = "";

    for (const [bookId, meta] of Object.entries(books)) {
      const tile = document.createElement("div");
      tile.className = "book-tile";
      tile.dataset.bookId = bookId;

      const displayTitle = meta.bookTitle || bookId;

      tile.innerHTML = `
        <h4>${displayTitle}</h4>
        <span class="book-status saved">Saved</span>
        <button class="delete-book" data-id="${bookId}" aria-label="Delete book">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor"
              d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"/>
          </svg>
        </button>
      `;

      grid.appendChild(tile);
    }
  }

  /* ============================
     Delete handling
  ============================ */
  grid.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-book");
    if (!deleteBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const bookId = deleteBtn.dataset.id;
    const bookData = loadBook(bookId);
    if (!bookData) return;

    const confirmed = confirm("Are you sure you want to permanently delete this book?");
    if (!confirmed) return;

    // Push to undo stack
    undoStack.push({ bookId, bookData });

    // Delete from storage
    deleteBook(bookId);
    renderLibrary();

    // Show undo toast
    showUndoToast();
  });

  /* ============================
     Tile navigation
  ============================ */
  grid.addEventListener("click", (e) => {
    const tile = e.target.closest(".book-tile");
    if (!tile) return;
    if (e.target.closest(".delete-book")) return;

    const bookId = tile.dataset.bookId;
    if (!bookId) return;

    window.location.href = `book.html?bookId=${encodeURIComponent(bookId)}`;
  });

 /* ============================
   Undo Toast (progress + 10s)
============================ */
let countdown = 10;

function createUndoToast() {
  const toast = document.createElement("div");
  toast.id = "undo-toast";
  toast.className = "hidden";
  toast.style.display = "flex";
  toast.style.flexDirection = "column"; // allow progress bar below text
  toast.style.alignItems = "center";
  toast.innerHTML = `
    <div id="undo-message">Book deleted · <span id="undo-countdown">10</span>s</div>
    <div id="undo-progress-container">
      <div id="undo-progress"></div>
    </div>
    <button id="undo-delete">Undo</button>
  `;
  document.body.appendChild(toast);

  toast.querySelector("#undo-delete").addEventListener("click", undoDelete);
}

function updateToastMessage() {
  const messageEl = document.getElementById("undo-message");
  const countdownEl = document.getElementById("undo-countdown");
  const count = undoStack.length;

  countdownEl.textContent = countdown;

  if (count > 1) {
    messageEl.innerHTML = `Undo ${count} books · <span id="undo-countdown">${countdown}</span>s`;
  } else {
    messageEl.innerHTML = `Book deleted · <span id="undo-countdown">${countdown}</span>s`;
  }

  // Update progress bar
  const progressEl = document.getElementById("undo-progress");
  if (progressEl) {
    progressEl.style.width = `${(countdown / 10) * 100}%`;
  }
}

function showUndoToast() {
  if (!undoStack.length) return;

  const toast = document.getElementById("undo-toast");
  toast.classList.remove("hidden");
  toast.classList.add("visible");

  countdown = 10;
  updateToastMessage();

  clearTimeout(undoTimer);
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    countdown--;
    updateToastMessage();

    if (countdown <= 0) {
      // Remove the oldest pending delete without restoring
      undoStack.pop();
      if (!undoStack.length) clearUndo();
      else showUndoToast(); // reset countdown for remaining items
    }
  }, 1000);

  undoTimer = setTimeout(() => {
    undoStack.pop();
    if (!undoStack.length) clearUndo();
    else showUndoToast();
  }, 10000);
}

function undoDelete() {
  if (!undoStack.length) return;

  const { bookId, bookData } = undoStack.pop();

  // Restore book data
  localStorage.setItem(bookId, JSON.stringify(bookData));

  // Restore index entry
  const index = JSON.parse(localStorage.getItem("bookIndex")) || {};
  index[bookId] = {
    bookTitle: bookData.bookTitle,
    lastModified: bookData.lastModified
  };
  localStorage.setItem("bookIndex", JSON.stringify(index));

  renderLibrary();

  if (!undoStack.length) clearUndo();
  else showUndoToast(); // reset countdown for next pending book
}

function clearUndo() {
  const toast = document.getElementById("undo-toast");
  toast.classList.remove("visible");
  toast.classList.add("hidden");

  clearTimeout(undoTimer);
  clearInterval(countdownInterval);
}

});
