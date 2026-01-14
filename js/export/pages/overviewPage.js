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
  return compactBorderedCell(
    docx,
    [new docx.Paragraph("")],
    {
      verticalMerge: mergeType === "restart" ? docx.VerticalMerge.RESTART : docx.VerticalMerge.CONTINUE,
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
      verticalMerge: mergeType === "restart" ? docx.VerticalMerge.RESTART : (mergeType === "continue" ? docx.VerticalMerge.CONTINUE : undefined),
      verticalAlign: docx.VerticalAlign.CENTER,
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
This function is called by exportWord.js to create the overview table.

PARAMETERS:
  docx - The docx library instance (window.docx)
  state - The application state object containing:
    - state.paragraphs: Array of paragraph objects
    - state.segments: Array of segment objects
    - state.sections: Array of section objects
    - state.divisions: Array of division objects
    - state.keyVerse: String for the key verse

RETURNS:
  A docx.Table object ready to be added to the document

HOW IT WORKS:
  1. Sort segments by starting paragraph
  2. Create lookup maps for sections and divisions
  3. Build header row (Division | Section | Segment | Key Verse)
  4. For each segment, add a row with appropriate merging
  5. Return the complete table
========================================================================
*/
export function buildOverviewPage(docx, state) {
  // Get all paragraphs from state
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  // Sort segments by their starting paragraph (earliest first)
  // This ensures they appear in book order in the table
  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  // Create lookup maps for fast access by ID
  // Instead of searching arrays, we can do: sectionsById[id]
  const sectionsById = Object.fromEntries(
    state.sections.map(s => [s.id, s])
  );
  const divisionsById = Object.fromEntries(
    state.divisions.map(d => [d.id, d])
  );

  /*
  ---- COLUMN WIDTHS ----
  These are in DXA units (1440 DXA = 1 inch)

  CURRENT WIDTHS:
    Division: 3000 DXA ≈ 2.08 inches
    Section:  3000 DXA ≈ 2.08 inches
    Segment:  3000 DXA ≈ 2.08 inches
    Key Verse: 1701 DXA ≈ 1.18 inches
    TOTAL:    10701 DXA ≈ 7.43 inches

  TO ADJUST: Change these values
  TIP: Keep total under 11906 DXA (page width)
  */
  const DIV_W = 3000;
  const SEC_W = 3000;
  const SEG_W = 3000;
  const KEY_W = 1701;
  const TABLE_W = DIV_W + SEC_W + SEG_W + KEY_W;

  const rows = [];

  // Font size for all text in the table
  // ADJUST THIS to make text larger (increase) or smaller (decrease)
  const fontSize = 18;

  // ---- Header row ----
  rows.push(
    new docx.TableRow({
      children: [
        compactCenteredCell(docx, "Division", DIV_W, fontSize),
        compactCenteredCell(docx, "Section", SEC_W, fontSize),
        compactCenteredCell(docx, "Segment", SEG_W, fontSize),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
              children: [
                new docx.TextRun({
                  text: `Key verse: ${safeText(state.keyVerse) || ""}`,
                  bold: true,
                  italic: true,
                  size: fontSize
                })
              ]
            })
          ],
          width: { size: KEY_W, type: docx.WidthType.DXA },
          verticalMerge: docx.VerticalMerge.RESTART,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          borders: {
            top: { style: "single", size: 4 },
            bottom: { style: "single", size: 4 },
            left: { style: "single", size: 4 },
            right: { style: "single", size: 4 }
          }
        })
      ]
    })
  );

  let lastDiv = null;
  let lastSec = null;

  segmentsSorted.forEach(seg => {
    const sec = sectionsById[seg.sectionId];
    const div = sec ? divisionsById[sec.divisionId] : null;

    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

    rows.push(
      new docx.TableRow({
        children: [
          div?.id !== lastDiv
            ? compactCenteredCell(
                docx,
                safeText(div?.title),
                DIV_W,
                fontSize,
                "restart"
              )
            : compactMergedCell(docx, "continue", DIV_W),

          sec?.id !== lastSec
            ? compactCenteredCell(
                docx,
                safeText(sec?.title),
                SEC_W,
                fontSize,
                "restart"
              )
            : compactMergedCell(docx, "continue", SEC_W),

          compactBorderedCell(
            docx,
            [
              new docx.Paragraph({
                spacing: { before: 0, after: 0, line: 240, lineRule: docx.LineRuleType.AUTO },
                children: [
                  new docx.TextRun({
                    text: safeText(seg.title),
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
          ),

          // Key verse column - continue vertical merge
          new docx.TableCell({
            children: [new docx.Paragraph("")],
            width: { size: KEY_W, type: docx.WidthType.DXA },
            verticalMerge: docx.VerticalMerge.CONTINUE,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            borders: {
              top: { style: "single", size: 4 },
              bottom: { style: "single", size: 4 },
              left: { style: "single", size: 4 },
              right: { style: "single", size: 4 }
            }
          })
        ]
      })
    );

    lastDiv = div?.id;
    lastSec = sec?.id;
  });

  return new docx.Table({
    width: {
      size: 95,
      type: docx.WidthType.PERCENTAGE
    },
    layout: docx.TableLayoutType.AUTOFIT,
    rows
  });
}