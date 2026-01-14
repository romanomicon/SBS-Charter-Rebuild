/*
========================================================================
📝 TEXT UTILITIES - STRING FORMATTING HELPERS
========================================================================
PURPOSE: Helper functions for safely handling text and formatting
         verse ranges for display in the Word document.

USED BY: overviewPage.js and segmentPage.js
========================================================================
*/

/**
 * Safely converts any value to a string, handling null/undefined
 *
 * @param {*} v - Any value (string, number, null, undefined, etc.)
 * @returns {string} Empty string if null/undefined, otherwise stringified value
 *
 * PURPOSE:
 *   Prevents "null" or "undefined" text from appearing in Word document
 *   when a field is empty or missing
 *
 * USAGE:
 *   safeText(state.bookName)     // Returns book name or ""
 *   safeText(segment.title)      // Returns title or ""
 *   safeText(null)               // Returns ""
 */
export function safeText(v) {
  return v == null ? "" : String(v);
}

/**
 * Converts paragraph array indexes into a human-readable verse range
 *
 * @param {number} startIdx - Starting paragraph index (0-based)
 * @param {number} endIdx - Ending paragraph index (0-based)
 * @param {Array} paragraphs - Array of paragraph objects with .range property
 * @returns {string} Formatted verse range like "1:1–2:5"
 *
 * HOW IT WORKS:
 *   1. Gets the START verse from paragraphs[startIdx].range
 *   2. Gets the END verse from paragraphs[endIdx].range
 *   3. Combines them with an en-dash (–)
 *
 * EXAMPLE:
 *   paragraphs[0].range = "1:1–1:5"    // First paragraph covers verses 1-5
 *   paragraphs[4].range = "2:1–2:10"   // Fifth paragraph covers ch 2, verses 1-10
 *
 *   humanRangeFromIdx(0, 4, paragraphs)
 *   → Returns "1:1–2:10" (start of first to end of fifth)
 *
 * EDGE CASES:
 *   - If paragraph doesn't exist, returns empty string
 *   - Handles single verse ranges like "3:16"
 *   - Handles multi-verse ranges like "1:1–1:21"
 */
export function humanRangeFromIdx(startIdx, endIdx, paragraphs) {
  // Safety check: ensure paragraphs exist at these indexes
  if (!paragraphs[startIdx] || !paragraphs[endIdx]) return "";

  // Extract starting verse (everything before the dash in first paragraph)
  const start = paragraphs[startIdx].range.split("–")[0];

  // Extract ending verse (everything after the dash in last paragraph, or the whole range if no dash)
  const endRaw = paragraphs[endIdx].range;
  const end = endRaw.includes("–") ? endRaw.split("–")[1] : endRaw;

  // Combine with en-dash
  return `${start}–${end}`;
}
