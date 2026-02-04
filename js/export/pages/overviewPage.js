/*
========================================================================
📊 OVERVIEW PAGE - HORIZONTAL BOOK STRUCTURE TABLE
========================================================================
PURPOSE: Creates the first page(s) of the Word export showing the entire
         book structure in a horizontal table format.

TABLE STRUCTURE:
  +----------+----------+----------+------------------+
  | Division | Section  | Segment  | Key Verse: 1:1   |
  +----------+----------+----------+------------------+
  |          |          | Seg 1    |                  |
  | Div 1    | Sec 1    | 1:1-1:21 |                  |
  |          +----------+----------+  (Key verse      |
  |          |          | Seg 2    |   spans all      |
  |          | Sec 2    | 1:22-2:5 |   rows)          |
  +----------+----------+----------+                  |
  |          |          | Seg 3    |                  |
  | Div 2    | Sec 3    | 2:6-3:10 |                  |
  +----------+----------+----------+------------------+

KEY FEATURES:
- Divisions/Sections use vertical merge (span multiple rows)
- Each segment gets its own row
- Key verse column spans entire table height
- Rows auto-size based on content (no fixed heights)

EDITING TIPS:
- Column widths: See DIV_W, SEC_W, SEG_W, KEY_W constants
- Cell spacing: See compactBorderedCell margins (currently 60/80 DXA)
- Font size: Currently 18pt (see fontSize variable)
========================================================================
*/

import { computeSegStart, computeSegEnd } from "../helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "../helpers/textUtils.js";

/*
------------------------------------------------------------------------
COMPACT CELL HELPERS
------------------------------------------------------------------------
These functions create table cells with REDUCED margins compared to
the standard cells in docxUtils.js. This allows more content to fit.

Standard margins: 120 DXA
Compact margins:  60 DXA (top/bottom), 80 DXA (left/right)

WHY SEPARATE FUNCTIONS?
  We want overview page to be compact, but other pages to have
  more breathing room. These functions give us that flexibility.
------------------------------------------------------------------------
*/

/**
 * Creates a compact bordered cell with reduced margins
 * Similar to borderedCell() in docxUtils.js but with 50% less vertical margin
 */
function compactBorderedCell(docx, children, opts = {}) {
  return new docx.TableCell({
    children,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
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
 * Creates a compact merged cell (for spanning rows vertically)
 * mergeType "restart" = start a new merged group
 * mergeType "continue" = continue the merge from previous row
 */
function compactMergedCell(docx, mergeType, widthDXA) {
  const VerticalMerge = docx.VerticalMergeType || docx.VerticalMerge;
  return compactBorderedCell(
    docx,
    [new docx.Paragraph("")],
    {
      verticalMerge: mergeType === "restart" ? VerticalMerge.RESTART : VerticalMerge.CONTINUE,
      width: {
        size: widthDXA,
        type: docx.WidthType.DXA
      }
    }
  );
}

/**
 * Creates a compact centered text cell with custom font size
 * Used for division/section/segment titles in the overview table
 */
function compactCenteredCell(docx, text, widthDXA, fontSize, mergeType = null) {
  const VerticalMerge = docx.VerticalMergeType || docx.VerticalMerge;
  let verticalMergeValue = undefined;
  if (mergeType === "restart") {
    verticalMergeValue = VerticalMerge.RESTART;
  } else if (mergeType === "continue") {
    verticalMergeValue = VerticalMerge.CONTINUE;
  }

  return compactBorderedCell(
    docx,
    [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
        children: [
          new docx.TextRun({
            text,
            bold: true,
            size: fontSize
          })
        ]
      })
    ],
    {
      verticalMerge: verticalMergeValue,
      verticalAlign: docx.VerticalAlign.CENTER,
      width: {
        size: widthDXA,
        type: docx.WidthType.DXA
      }
    }
  );
}

/**
 * Creates a compact top-left aligned text cell (for division/section titles that span rows)
 */
function compactTopLeftCell(docx, text, widthDXA, fontSize, mergeType = null) {
  const VerticalMerge = docx.VerticalMergeType || docx.VerticalMerge;
  let verticalMergeValue = undefined;
  if (mergeType === "restart") {
    verticalMergeValue = VerticalMerge.RESTART;
  } else if (mergeType === "continue") {
    verticalMergeValue = VerticalMerge.CONTINUE;
  }

  return compactBorderedCell(
    docx,
    [
      new docx.Paragraph({
        alignment: docx.AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
        children: [
          new docx.TextRun({
            text,
            bold: true,
            size: fontSize
          })
        ]
      })
    ],
    {
      verticalMerge: verticalMergeValue,
      verticalAlign: docx.VerticalAlign.TOP,
      width: {
        size: widthDXA,
        type: docx.WidthType.DXA
      }
    }
  );
}

/*
========================================================================
MAIN FUNCTION: buildOverviewPage
========================================================================
This function is called by exportWord.js to create the overview content.

PARAMETERS:
  docx - The docx library instance (window.docx)
  state - The application state object containing:
    - state.paragraphs: Array of paragraph objects
    - state.segments: Array of segment objects
    - state.sections: Array of section objects
    - state.divisions: Array of division objects
    - state.keyVerse: String for the key verse

RETURNS:
  An array of docx elements: [title, keyVerse, table]

HOW IT WORKS:
  1. Create title paragraph
  2. Create key verse paragraph (separate from table)
  3. Sort segments by starting paragraph
  4. Use position-based lookup for divisions/sections
  5. Build header row (Division | Section | Segment)
  6. For each segment, add a row with appropriate merging
  7. Return array of elements
========================================================================
*/
export function buildOverviewPage(docx, state) {
  // Get all paragraphs from state
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  // Sort segments by their starting paragraph (earliest first)
  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  // Sort divisions and sections by their start position for position-based lookup
  const divisionsSorted = [...state.divisions].sort((a, b) => {
    const aStart = Math.min(...a.paragraphIndexes);
    const bStart = Math.min(...b.paragraphIndexes);
    return aStart - bStart;
  });

  const sectionsSorted = [...state.sections].sort((a, b) => {
    const aStart = Math.min(...a.paragraphIndexes);
    const bStart = Math.min(...b.paragraphIndexes);
    return aStart - bStart;
  });

  // Find division by position (the division whose start is <= segment start)
  function findDivisionForSegment(segStart) {
    let result = null;
    for (const div of divisionsSorted) {
      const divStart = Math.min(...div.paragraphIndexes);
      if (divStart <= segStart) {
        result = div;
      } else {
        break;
      }
    }
    return result;
  }

  // Find section by position (the section whose start is <= segment start)
  function findSectionForSegment(segStart) {
    let result = null;
    for (const sec of sectionsSorted) {
      const secStart = Math.min(...sec.paragraphIndexes);
      if (secStart <= segStart) {
        result = sec;
      } else {
        break;
      }
    }
    return result;
  }

  // Helper to get start position for comparison
  const getDivStart = (div) => div ? Math.min(...div.paragraphIndexes) : -1;
  const getSecStart = (sec) => sec ? Math.min(...sec.paragraphIndexes) : -1;

  /*
  ---- COLUMN WIDTHS ----
  These are in DXA units (1440 DXA = 1 inch)
  Now only 3 columns since Key Verse is separate
  */
  const DIV_W = 3500;
  const SEC_W = 3500;
  const SEG_W = 3500;

  const rows = [];
  const fontSize = 18;

  // ---- Header row (3 columns only) ----
  rows.push(
    new docx.TableRow({
      children: [
        compactCenteredCell(docx, "Division", DIV_W, fontSize),
        compactCenteredCell(docx, "Section", SEC_W, fontSize),
        compactCenteredCell(docx, "Segment", SEG_W, fontSize)
      ]
    })
  );

  // Pre-calculate row data with division and section info using position-based lookup
  const rowData = segmentsSorted.map(seg => {
    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const sec = findSectionForSegment(segStart);
    const div = findDivisionForSegment(segStart);
    const paragraphCount = segEnd - segStart + 1;
    return { seg, sec, div, divStart: getDivStart(div), secStart: getSecStart(sec), paragraphCount };
  });

  // Calculate total "natural" height and apply scaling if needed
  const heightPerParagraph = 200; // Base height per paragraph in DXA
  const minRowHeight = 400; // Minimum row height in DXA
  const maxTableHeight = 14000; // Max table height in DXA for A4 page (16838 DXA total - margins - title - key verse)
  const headerHeight = 400; // Approximate header row height in DXA

  const totalNaturalHeight = rowData.reduce((sum, row) => {
    return sum + Math.max(minRowHeight, row.paragraphCount * heightPerParagraph);
  }, 0) + headerHeight;

  // Scale factor to fit within page (1.0 = no scaling needed)
  const heightScale = totalNaturalHeight > maxTableHeight
    ? (maxTableHeight - headerHeight) / (totalNaturalHeight - headerHeight)
    : 1.0;

  let lastDivStart = null;
  let lastSecStart = null;

  rowData.forEach(row => {
    const { seg, sec, div, divStart, secStart, paragraphCount } = row;

    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    // Calculate row height based on paragraph count, scaled to fit page
    const naturalHeight = Math.max(minRowHeight, paragraphCount * heightPerParagraph);
    const rowHeight = Math.round(naturalHeight * heightScale);

    rows.push(
      new docx.TableRow({
        height: { value: rowHeight, rule: docx.HeightRule.ATLEAST },
        children: [
          // Division cell - compare by start position instead of ID (top-left aligned)
          divStart !== lastDivStart
            ? compactTopLeftCell(
                docx,
                safeText(div?.title) || `Division ${div?.id}`,
                DIV_W,
                fontSize,
                "restart"
              )
            : compactMergedCell(docx, "continue", DIV_W),

          // Section cell - compare by start position instead of ID (top-left aligned)
          secStart !== lastSecStart
            ? compactTopLeftCell(
                docx,
                safeText(sec?.title) || `Section ${sec?.id}`,
                SEC_W,
                fontSize,
                "restart"
              )
            : compactMergedCell(docx, "continue", SEC_W),

          // Segment cell
          compactBorderedCell(
            docx,
            [
              new docx.Paragraph({
                spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
                children: [
                  new docx.TextRun({
                    text: safeText(seg.title) || `Segment ${seg.id}`,
                    bold: true,
                    size: fontSize
                  })
                ]
              }),
              new docx.Paragraph({
                spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
                children: [
                  new docx.TextRun({
                    text: range,
                    size: fontSize
                  })
                ]
              })
            ],
            {
              width: {
                size: SEG_W,
                type: docx.WidthType.DXA
              }
            }
          )
        ]
      })
    );

    lastDivStart = divStart;
    lastSecStart = secStart;
  });

  // Build the title paragraph
  const titleParagraph = new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new docx.TextRun({
        text: `${safeText(state.bookName)} - Structure Overview`,
        bold: true,
        size: 32
      })
    ]
  });

  // Build the key verse paragraph (separate from table) - simple black and white
  const keyVerseParagraph = new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 100, after: 200 },
    border: {
      top: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" }
    },
    children: [
      new docx.TextRun({
        text: "Key verse: ",
        bold: true,
        italics: true,
        size: 18
      }),
      new docx.TextRun({
        text: safeText(state.keyVerse) || "",
        italics: true,
        size: 18
      })
    ]
  });

  // Build the table
  const table = new docx.Table({
    width: {
      size: 100,
      type: docx.WidthType.PERCENTAGE
    },
    layout: docx.TableLayoutType.AUTOFIT,
    rows
  });

  // Return array of elements: title, key verse, then table
  return [titleParagraph, keyVerseParagraph, table];
}