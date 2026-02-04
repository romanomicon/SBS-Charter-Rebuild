/*
========================================================================
HTML EXPORT - Opens Chart Editor Page
========================================================================
PURPOSE: Navigates to the Chart Editor page (preview.html) with the book ID.
The Chart Editor loads the book from storage and allows full editing.
========================================================================
*/

/**
 * Opens the Chart Editor page for the current book
 * @param {Object} state - The application state (must have bookId)
 */
export function exportHTML(state) {
  if (!state.bookId) {
    alert("Please save the book first before previewing.");
    return;
  }

  // Navigate to preview page with book ID
  window.location.href = `preview.html?bookId=${encodeURIComponent(state.bookId)}`;
}
