// debugSanityCheck.js
import { listBooks, loadBook, isBookSaved } from "./storage.js";

export function runSanityCheck(books) {
  console.log("=== SANITY CHECK START ===");

  const savedBooks = listBooks();
  if (!savedBooks || Object.keys(savedBooks).length === 0) {
    console.warn("No saved books found in localStorage.");
  } else {
    console.log("Saved books in localStorage:", Object.keys(savedBooks).length);
    for (const [bookId, meta] of Object.entries(savedBooks)) {
      console.log(`- Book ID: ${bookId}, Title: ${meta.bookTitle}`);

      const loaded = loadBook(bookId);
      if (!loaded) {
        console.error(`Failed to load saved book by ID: ${bookId}`);
      } else {
        console.log(`Loaded successfully: ${loaded.bookTitle} (${loaded.bookName})`);
      }

      if (!isBookSaved(bookId)) {
        console.error(`Book not recognized as saved: ${bookId}`);
      } else {
        console.log(`Book correctly recognized as saved: ${bookId}`);
      }
    }
  }

  if (Array.isArray(books)) {
    console.log("\nChecking all BOOKS array items:");
    books.forEach(b => {
      const exists = isBookSaved(b);
      console.log(`- ${b}: ${exists ? "Saved" : "New"}`);
    });
  }

  console.log("=== SANITY CHECK END ===");
}
