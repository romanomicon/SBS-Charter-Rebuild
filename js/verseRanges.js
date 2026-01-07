// verseRanges.js
// Loads verse ranges for a book and populates state.paragraphs
// No direct DOM rendering — now fully modular

export async function loadVerseRangesForBook(bookName, state) {
  if (!bookName) return;

  const path = `Books/cleaned/${encodeURIComponent(bookName)}_ranges.json`;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const ranges = await res.json();

    // Clear previous paragraphs
    state.paragraphs = [];

    // Populate state with paragraph objects
    ranges.forEach(block => {
      state.paragraphs.push({
        range: block.range || "",
        title: "",          // ensures input box appears
        text: block.text || ""
      });
    });

  } catch (err) {
    console.error("Error loading verse ranges:", err);
  }
}


