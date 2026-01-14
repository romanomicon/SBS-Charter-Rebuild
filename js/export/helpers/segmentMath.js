/*
========================================================================
🧮 SEGMENT MATH - PARAGRAPH RANGE CALCULATIONS
========================================================================
PURPOSE: Calculate which paragraphs belong to which segments.

KEY CONCEPT: Segments are "dividers" not "boxes"
- A segment STARTS at its first assigned paragraph
- A segment ENDS just before the next segment starts
- The last segment extends to the end of the book

EXAMPLE:
  Book has 50 paragraphs total
  Segment A assigned to paragraphs: [0, 5, 10]  → Starts at 0
  Segment B assigned to paragraphs: [25, 30]    → Starts at 25
  Segment C assigned to paragraphs: [40]        → Starts at 40

  RESULT:
    Segment A: paragraphs 0-24  (ends before B starts)
    Segment B: paragraphs 25-39 (ends before C starts)
    Segment C: paragraphs 40-49 (extends to end)

USED BY: overviewPage.js and segmentPage.js
========================================================================
*/

/**
 * Finds the starting paragraph index for a segment
 *
 * @param {Object} seg - Segment object with .paragraphIndexes array
 * @returns {number} The lowest paragraph index assigned to this segment
 *
 * HOW IT WORKS:
 *   A segment can be assigned to multiple paragraphs (e.g., [5, 10, 15])
 *   The segment STARTS at the LOWEST index (in this case, 5)
 *
 * EXAMPLE:
 *   seg.paragraphIndexes = [10, 5, 15, 8]
 *   computeSegStart(seg) → Returns 5 (the minimum)
 *
 * EDGE CASE:
 *   If no paragraphs assigned, returns Infinity (will be treated as "not started")
 */
export function computeSegStart(seg) {
  return Math.min(...(seg.paragraphIndexes || [Infinity]));
}

/**
 * Finds the ending paragraph index for a segment
 *
 * @param {Object} seg - The segment to find the end for
 * @param {Array} sortedSegments - All segments sorted by start index
 * @param {number} totalParagraphs - Total number of paragraphs in the book
 * @returns {number} The last paragraph index that belongs to this segment
 *
 * HOW IT WORKS:
 *   1. Find where THIS segment starts
 *   2. Find the NEXT segment (the one that starts after this one)
 *   3. This segment ends 1 paragraph BEFORE the next segment starts
 *   4. If no next segment exists, this segment goes to the end of the book
 *
 * EXAMPLE:
 *   Segment A starts at paragraph 0
 *   Segment B starts at paragraph 25
 *   Total paragraphs: 50
 *
 *   computeSegEnd(A, [A, B], 50)
 *   → Next segment is B (starts at 25)
 *   → A ends at 25 - 1 = 24
 *   → Returns 24
 *
 *   computeSegEnd(B, [A, B], 50)
 *   → No next segment after B
 *   → B extends to the end
 *   → Returns 50 - 1 = 49
 *
 * WHY THIS MATTERS:
 *   This is how we determine which paragraphs to display on each segment's page
 */
export function computeSegEnd(seg, sortedSegments, totalParagraphs) {
  const start = computeSegStart(seg);
  const next = sortedSegments.find(s => computeSegStart(s) > start);
  return next ? computeSegStart(next) - 1 : totalParagraphs - 1;
}
