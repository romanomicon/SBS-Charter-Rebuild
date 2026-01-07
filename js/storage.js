// storage.js
import { state } from "./state.js";

/* ================================
   Utilities
================================ */

function getBookIndex() {
  return JSON.parse(localStorage.getItem("bookIndex")) || {};
}

function saveBookIndex(index) {
  localStorage.setItem("bookIndex", JSON.stringify(index));
}

/* ================================
   Save Book
================================ */

export function saveBook() {
  if (!state.bookId) {
    console.warn("Cannot save book: missing bookId");
    return;
  }

  const bookKey = state.bookId; // canonical ID
  const index = getBookIndex();

  const data = {
    bookId: bookKey,                     // canonical ID
    bookName: state.bookName || "",      // editable
    bookTitle: state.bookTitle || state.bookName, // display
    keyVerse: state.keyVerse || "",
    paragraphs: state.paragraphs || [],
    divisions: state.divisions || [],
    sections: state.sections || [],
    segments: state.segments || [],
    lastModified: Date.now()
  };

  // Always overwrite existing save for the same bookId
  localStorage.setItem(bookKey, JSON.stringify(data));

  // Update index
  index[bookKey] = {
    bookTitle: data.bookTitle,
    lastModified: data.lastModified
  };
  saveBookIndex(index);
}

/* ================================
   Load Book
================================ */

export function loadBook(bookId) {
  if (!bookId) return null;

  const raw = localStorage.getItem(bookId);
  if (!raw) return null;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    localStorage.removeItem(bookId);
    return null;
  }

  return {
    bookId: data.bookId || bookId,
    bookName: data.bookName || bookId,
    bookTitle: data.bookTitle || bookId,
    keyVerse: data.keyVerse || "",
    paragraphs: data.paragraphs || [],
    divisions: data.divisions || [],
    sections: data.sections || [],
    segments: data.segments || [],
    lastModified: data.lastModified || Date.now()
  };
}

/* ================================
   List Books
================================ */

export function listBooks() {
  return getBookIndex();
}

/* ================================
   Delete Book
================================ */

export function deleteBook(bookId) {
  localStorage.removeItem(bookId);

  const index = getBookIndex();
  delete index[bookId];
  saveBookIndex(index);
}

/* ================================
   Utility: check saved
================================ */

export function isBookSaved(bookId) {
  const index = getBookIndex();
  return !!index[bookId] && !!localStorage.getItem(bookId);
}
