import { BOOKS } from "./books.js";
import { listBooks, loadBook, deleteBook } from "./storage.js";

let currentTab = "all";
const undoStack = [];
let undoTimer = null;
let countdownInterval = null;
let countdown = 10;

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("booksGrid");
  if (!grid) return;

  createUndoToast();

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderGrid();
    });
  });

  renderGrid();

  function renderGrid() {
    grid.innerHTML = "";
    if (currentTab === "all") {
      renderAllBooks();
    } else {
      renderLibrary();
    }
  }

  function renderAllBooks() {
    const index = listBooks();

    BOOKS.forEach((bookCanonicalId, tileIdx) => {
      const tile = document.createElement("div");
      tile.className = "book-tile";
      tile.setAttribute("aria-label", `Open ${bookCanonicalId}`);
      tile.style.animationDelay = `${Math.min(tileIdx * 30, 300)}ms`;

      const savedMeta = index[bookCanonicalId];
      const isSaved = !!savedMeta;
      const displayName = savedMeta?.bookTitle || bookCanonicalId;

      if (isSaved) {
        tile.classList.add("saved");
        tile.innerHTML = `
          <div class="saved-card">
            <div class="saved-card-body">
              <span class="saved-title">${displayName}</span>
            </div>
            <div class="saved-card-actions">
              <button class="saved-btn-builder" title="Open Charter Builder">Builder</button>
              <button class="saved-btn-chart" title="Open Chart Editor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                </svg>
                Chart
              </button>
            </div>
          </div>
        `;

        tile.querySelector(".saved-btn-builder").addEventListener("click", () => {
          window.location.href = `book.html?bookId=${bookCanonicalId}`;
        });

        tile.querySelector(".saved-btn-chart").addEventListener("click", () => {
          window.location.href = `preview.html?bookId=${bookCanonicalId}`;
        });
      } else {
        tile.classList.add("new");
        tile.innerHTML = `<span class="pill-label">${displayName}</span>`;

        tile.addEventListener("click", () => {
          window.location.href = `book.html?name=${bookCanonicalId}`;
        });
      }

      grid.appendChild(tile);
    });
  }

  function renderLibrary() {
    const books = listBooks();

    if (!books || Object.keys(books).length === 0) {
      grid.innerHTML = '<p class="muted" style="text-align:center;padding:2rem;">No books saved yet.</p>';
      return;
    }

    let tileIdx = 0;
    for (const [bookId, meta] of Object.entries(books)) {
      const tile = document.createElement("div");
      tile.className = "book-tile saved";
      tile.dataset.bookId = bookId;
      tile.style.animationDelay = `${Math.min(tileIdx++ * 30, 300)}ms`;

      const displayTitle = meta.bookTitle || bookId;

      tile.innerHTML = `
        <div class="saved-card">
          <div class="saved-card-body">
            <span class="saved-title">${displayTitle}</span>
            <button class="saved-delete delete-book" data-id="${bookId}" aria-label="Delete book">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
          <div class="saved-card-actions">
            <button class="saved-btn-builder" title="Open Charter Builder">Builder</button>
            <button class="saved-btn-chart" title="Open Chart Editor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
              Chart
            </button>
          </div>
        </div>
      `;

      tile.querySelector(".saved-btn-builder").addEventListener("click", () => {
        window.location.href = `book.html?bookId=${encodeURIComponent(bookId)}`;
      });

      tile.querySelector(".saved-btn-chart").addEventListener("click", () => {
        window.location.href = `preview.html?bookId=${encodeURIComponent(bookId)}`;
      });

      grid.appendChild(tile);
    }
  }

  // Delete handling
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

    undoStack.push({ bookId, bookData });
    deleteBook(bookId);
    renderGrid();
    showUndoToast();
  });

  // Undo toast
  function createUndoToast() {
    const toast = document.createElement("div");
    toast.id = "undo-toast";
    toast.className = "hidden";
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
    const countdownEl = document.getElementById("undo-countdown");
    const messageEl = document.getElementById("undo-message");
    const progressEl = document.getElementById("undo-progress");

    if (countdownEl) countdownEl.textContent = countdown;

    if (messageEl) {
      if (undoStack.length > 1) {
        messageEl.innerHTML = `Undo ${undoStack.length} books · <span id="undo-countdown">${countdown}</span>s`;
      } else {
        messageEl.innerHTML = `Book deleted · <span id="undo-countdown">${countdown}</span>s`;
      }
    }

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
        undoStack.pop();
        if (!undoStack.length) clearUndo();
        else showUndoToast();
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

    localStorage.setItem(bookId, JSON.stringify(bookData));

    const index = JSON.parse(localStorage.getItem("bookIndex")) || {};
    index[bookId] = {
      bookTitle: bookData.bookTitle,
      lastModified: bookData.lastModified
    };
    localStorage.setItem("bookIndex", JSON.stringify(index));

    renderGrid();

    if (!undoStack.length) clearUndo();
    else showUndoToast();
  }

  function clearUndo() {
    const toast = document.getElementById("undo-toast");
    toast.classList.remove("visible");
    toast.classList.add("hidden");

    clearTimeout(undoTimer);
    clearInterval(countdownInterval);
  }

  function initTabs() {
  const bar = document.querySelector('.tab-bar');
  const buttons = bar.querySelectorAll('.tab-btn');
  const indicator = bar.querySelector('.tab-indicator');

  function moveIndicator(btn) {
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.height = btn.offsetHeight + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
  }

  // Set initial position without animation
  const active = bar.querySelector('.tab-btn.active');
  indicator.style.transition = 'none';
  moveIndicator(active);

  // Re-enable transition after initial paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      indicator.style.transition = '';
    });
  });

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      moveIndicator(btn);
    });
  });
}

initTabs();
});
