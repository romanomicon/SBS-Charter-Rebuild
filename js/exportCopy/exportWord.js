import { buildOverviewPage } from "./pages/overviewPage.js";
import { buildSegmentPage } from "./pages/segmentPage.js";
import { computeSegStart } from "./helpers/segmentMath.js";
import { safeText } from "./helpers/textUtils.js";

export function exportWord(state) {
  const docx = window.docx;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const overviewTable = buildOverviewPage(docx, state);

  const segmentSections = segmentsSorted.map(seg => ({
    children: [buildSegmentPage(docx, state, seg, segmentsSorted)]
  }));

  const doc = new docx.Document({
    sections: [
      { children: [overviewTable] },
      ...segmentSections
    ]
  });

  docx.Packer.toBlob(doc).then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeText(state.bookName) || "book"}_structure.docx`;
    a.click();
  });
};

/*
========================================================================
📁 WORD EXPORT MODULE ARCHITECTURE — EXPLANATION & PURPOSE
========================================================================

This project intentionally splits the Word export logic into multiple
small, focused modules. The goal is:

- Easier debugging
- Easier reasoning with ChatGPT
- Clear separation of responsibilities
- Ability to modify ONE thing without breaking everything else

Below is a breakdown of each related file and what it is responsible for.

------------------------------------------------------------------------
📂 js/state.js
------------------------------------------------------------------------
PURPOSE:
- Holds the single source of truth for the entire book structure.
- Shared across the whole app (UI, exports, rendering).

CONTAINS:
- bookName
- keyVerse
- paragraphs (verse ranges + paragraph titles)
- divisions (dividers)
- sections (dividers)
- segments (dividers)

WHY THIS FILE EXISTS:
- Prevents passing massive objects between functions everywhere
- Keeps UI logic and export logic in sync
- Makes exporting deterministic (export always reflects current UI)

IMPORTANT:
- This file contains DATA ONLY
- NO DOM access
- NO Word/docx logic

------------------------------------------------------------------------
📂 js/export/exportWord.js   ← (THIS FILE)
------------------------------------------------------------------------
PURPOSE:
- The orchestration layer for Word export.
- Builds the DOCX document from the current state.

RESPONSIBILITIES:
- Accepts `state` as input
- Coordinates page generation
- Assembles the final `Document`
- Triggers download via docx Packer

WHAT SHOULD LIVE HERE:
- High-level export flow
- Section ordering
- Document assembly
- ZERO DOM logic

WHAT SHOULD NOT LIVE HERE:
- Button click handlers
- HTML manipulation
- Business rules about UI layout

THINK OF THIS FILE AS:
"Given a finished book structure, create a Word document."

------------------------------------------------------------------------
📂 js/export/overviewPage.js
------------------------------------------------------------------------
PURPOSE:
- Generates Page 1 of the Word document (horizontal overview).

RESPONSIBILITIES:
- Builds the 3-column table:
  - Column 1: Divisions (as dividers, NOT boxes)
  - Column 2: Sections (nested under divisions)
  - Column 3: Segments (nested under sections)
- Handles vertical merging logic correctly
- Ensures dividers span from their start verse until the next divider

IMPORTANT LOGIC:
- Divisions / sections / segments are DIVIDERS
- A divider applies from its paragraph index
  UNTIL another divider of the same type appears
- Empty cells are merged into the divider title cell

WHY THIS IS SEPARATE:
- This page is structurally complex
- Mixing it with segment pages would be unreadable
- Easy to debug layout issues in isolation

------------------------------------------------------------------------
📂 js/export/segmentPages.js
------------------------------------------------------------------------
PURPOSE:
- Generates pages 2..N (one page per segment).

RESPONSIBILITIES:
- Creates a 3-column table per segment:
  - Left column: blank, single tall merged cell
  - Middle column:
      - Paragraph title rows
      - Writing space rows underneath each title
  - Right column: blank, single tall merged cell
- Ensures all three columns are the SAME WIDTH
- Alternates title row → writing row correctly

IMPORTANT RULES:
- Each segment MUST include its segment title
- Verse ranges appear under titles (not inline)
- Paragraph titles get their OWN row
- Writing space rows are empty but bordered

WHY THIS IS SEPARATE:
- This logic repeats per segment
- Much easier to test one segment page at a time
- Keeps exportWord.js clean

------------------------------------------------------------------------
📂 js/export/rangeUtils.js
------------------------------------------------------------------------
PURPOSE:
- All verse-range math lives here.

RESPONSIBILITIES:
- Convert paragraph indexes → human-readable verse ranges
- Determine where a divider ends
- Calculate:
    - Segment start index
    - Segment end index
    - Display ranges like "1:1–1:21"

WHY THIS IS SEPARATE:
- Range logic is tricky and error-prone
- Multiple pages depend on the same calculations
- Centralizing prevents subtle mismatches

RULE OF THUMB:
"If it calculates verse boundaries, it belongs here."

------------------------------------------------------------------------
📂 js/export/tableUtils.js
------------------------------------------------------------------------
PURPOSE:
- Low-level helpers for docx tables.

RESPONSIBILITIES:
- Create bordered cells
- Apply consistent margins
- Handle verticalMerge / columnSpan boilerplate
- Reduce repeated docx configuration noise

WHY THIS EXISTS:
- docx API is very verbose
- Keeps layout code readable
- Prevents copy-paste bugs

THIS FILE SHOULD:
- Contain NO business logic
- Contain NO book knowledge
- ONLY care about table mechanics

------------------------------------------------------------------------
📂 js/exportHandlers.js
------------------------------------------------------------------------
PURPOSE:
- Connects UI buttons to export logic.

RESPONSIBILITIES:
- Listens for "Export JSON"
- Listens for "Export Word"
- Calls exportWord(state)

IMPORTANT:
- This file knows about the DOM
- exportWord.js does NOT

WHY THIS SEPARATION MATTERS:
- You can change export logic without touching UI
- You can redesign UI without breaking export

------------------------------------------------------------------------
📂 js/domUtils.js
------------------------------------------------------------------------
PURPOSE:
- Small helpers for DOM access.

RESPONSIBILITIES:
- getById()
- createEl()

WHY THIS EXISTS:
- Keeps DOM code consistent
- Prevents repetitive boilerplate
- Makes UI code cleaner

------------------------------------------------------------------------
📂 js/bookPage.js
------------------------------------------------------------------------
PURPOSE:
- Main UI controller for building the book structure.

RESPONSIBILITIES:
- Rendering paragraph rows
- Assigning divisions / sections / segments
- Updating `state`
- Visual structure editing

IMPORTANT:
- This file NEVER touches Word export internals
- It only manipulates `state`

------------------------------------------------------------------------
🧠 ARCHITECTURAL SUMMARY
------------------------------------------------------------------------

UI builds state
↓
exportHandlers listens for click
↓
exportWord(state) is called
↓
exportWord delegates:
   - overviewPage
   - segmentPages
   - rangeUtils
   - tableUtils
↓
docx.Document is assembled
↓
Packer downloads .docx

------------------------------------------------------------------------
WHY THIS DESIGN WORKS WELL WITH CHATGPT
------------------------------------------------------------------------
- Each file has ONE responsibility
- You can paste ONE file at a time for debugging
- Changes are localized
- Word layout bugs are isolated from UI bugs

========================================================================
END OF ARCHITECTURE EXPLANATION
========================================================================
*/
