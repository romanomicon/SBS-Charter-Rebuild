/*
========================================================================
📄 DOCX UTILITIES - TABLE CELL HELPERS
========================================================================
PURPOSE: Reusable helper functions for creating Word table cells with
         consistent styling. Reduces code duplication and makes table
         creation more readable.

IMPORTANT CONCEPTS:
- DXA: Document units (1 inch = 1440 DXA)
- Margins: Space inside cell borders (120 DXA ≈ 0.08 inches)
- Borders: "single" style with size 4 creates thin black lines
- VerticalMerge: Allows cells to span multiple rows (like rowspan in HTML)

TO ADJUST CELL SPACING: Change the margins values (currently 120)
TO ADJUST BORDER THICKNESS: Change border size (currently 4)
========================================================================
*/

/**
 * Creates a table cell with borders and standard margins
 *
 * @param {Object} docx - The docx library instance (window.docx)
 * @param {Array} children - Array of Paragraph objects to display in cell
 * @param {Object} opts - Additional cell options (width, alignment, merge, etc.)
 * @returns {TableCell} A docx TableCell with borders and margins
 *
 * USAGE:
 *   borderedCell(docx, [new docx.Paragraph("Hello")], { width: {...} })
 *
 * MARGINS EXPLAINED:
 *   120 DXA = approximately 0.08 inches of padding inside the cell
 *   Increase for more spacing, decrease for tighter layout
 */
export function borderedCell(docx, children, opts = {}) {
  return new docx.TableCell({
    children,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    borders: {
      top: { style: "single", size: 4 },
      bottom: { style: "single", size: 4 },
      left: { style: "single", size: 4 },
      right: { style: "single", size: 4 }
    },
    ...opts
  });
}

/**
 * Creates an empty bordered cell that merges with cells above/below it
 * Used for creating cells that span multiple rows (like HTML rowspan)
 *
 * @param {Object} docx - The docx library instance
 * @param {string} mergeType - Either "restart" (first cell) or "continue" (subsequent cells)
 * @param {number} widthDXA - Width of cell in DXA units
 * @returns {TableCell} An empty merged cell
 *
 * USAGE PATTERN:
 *   Row 1: mergedCell(docx, "restart", 3000)    // Starts the merge
 *   Row 2: mergedCell(docx, "continue", 3000)   // Continues merge from row 1
 *   Row 3: mergedCell(docx, "continue", 3000)   // Still part of the merge
 *
 * VISUAL RESULT:
 *   +-------+       The first cell spans all three rows
 *   |       |
 *   | Text  |
 *   |       |
 *   +-------+
 */
export function mergedCell(docx, mergeType, widthDXA) {
  return borderedCell(
    docx,
    [new docx.Paragraph("")],
    {
      verticalMerge: mergeType,
      width: {
        size: widthDXA,
        type: docx.WidthType.DXA
      }
    }
  );
}

/**
 * Creates a centered, bold text cell (used for headers and titles)
 *
 * @param {Object} docx - The docx library instance
 * @param {string} text - The text to display
 * @param {number} widthDXA - Width of cell in DXA units
 * @param {string|null} mergeType - Optional: "restart" or "continue" for merged cells
 * @returns {TableCell} A cell with centered, bold text
 *
 * USAGE:
 *   centeredTextCell(docx, "Division", 3000)           // Regular cell
 *   centeredTextCell(docx, "Title", 3000, "restart")   // Merged cell
 *
 * TEXT STYLING:
 *   - Always bold
 *   - Always centered horizontally
 *   - Vertically centered in cell
 */
export function centeredTextCell(docx, text, widthDXA, mergeType = null) {
  return borderedCell(
    docx,
    [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
          new docx.TextRun({
            text,
            bold: true
          })
        ]
      })
    ],
    {
      verticalMerge: mergeType || undefined,
      verticalAlign: docx.VerticalAlign.CENTER,
      width: {
        size: widthDXA,
        type: docx.WidthType.DXA
      }
    }
  );
}

