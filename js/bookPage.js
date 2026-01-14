// bookPage.js
import { state } from "./state.js";
import { loadBook, saveBook } from "./storage.js";
import { loadVerseRangesForBook } from "./verseRanges.js";
import { renderBookInfoInputs } from "./bookInfoUI.js";
import { renderParagraphRows } from "./paragraphUI.js";
import { renderStructure } from "./structureUI.js";
import { initExportButtons } from "./exportHandlers.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const bookIdParam = params.get("bookId");
  const nameParam = params.get("name");

  console.log("Book page loaded:", window.location.href);

  // --- Load saved book by ID ---
  if (bookIdParam) {
    const saved = loadBook(bookIdParam);
    if (!saved) {
      console.error("Saved book not found:", bookIdParam);
      return;
    }

    Object.assign(state, saved);
    console.log("Loaded saved book:", state.bookTitle);
    finalizeAndRender();
    return; // STOP HERE
  }

  // --- Load default book if no save ---
  if (!nameParam) {
    console.warn("No bookId or name provided.");
    return;
  }

  console.log("No saved book found, loading default for:", nameParam);

  state.bookId = nameParam;           // canonical ID
  state.bookName ||= nameParam;       // editable (preserve existing edits)
  state.bookTitle ||= nameParam;      // display
  state.keyVerse ||= "";
  state.paragraphs = [];
  state.divisions = [];
  state.sections = [];
  state.segments = [];

  try {
    console.log("Loading default paragraphs for:", state.bookName);
    await loadVerseRangesForBook(state.bookName, state);
    console.log("Default paragraphs loaded:", state.paragraphs.length);
  } catch (err) {
    console.error("Failed to load default paragraphs:", err);
    state.paragraphs = [];
  }

  finalizeAndRender();
});

function finalizeAndRender() {
  state.paragraphs ||= [];
  state.divisions ||= [];
  state.sections ||= [];
  state.segments ||= [];

  // Render book title at the top
  const bookPageTitle = document.getElementById("bookPageTitle");
  if (bookPageTitle) {
    bookPageTitle.textContent = state.bookTitle || state.bookName || "Book";
  }

  renderParagraphRows();
  renderBookInfoInputs();
  renderStructure();
  initExportButtons();
}

// --- Save button ---
const saveBtn = document.getElementById("saveBookBtn");
const saveStatus = document.getElementById("saveStatus");

if (saveBtn && saveStatus) {
  saveBtn.addEventListener("click", () => {
    if (!state.bookId) return;

    saveBook();

    saveStatus.classList.add("visible");
    clearTimeout(saveStatus._timeout);
    saveStatus._timeout = setTimeout(() => {
      saveStatus.classList.remove("visible");
    }, 1200);
  });
}
