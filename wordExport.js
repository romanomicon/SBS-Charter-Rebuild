// js/wordExport.js
// Requires docx CDN in HTML:
// <script src="https://cdn.jsdelivr.net/npm/docx@7.3.0/build/index.js"></script>

// Wait until the DOM is fully loaded so document elements and global `docx` are available.
document.addEventListener("DOMContentLoaded", () => {
  // Expose a global function `exportWord` that other code (bookPage.js) will call with `state`.
  window.exportWord = function(state) {
    // Destructure the docx constructors and enums we'll use from the global `docx` object.
    const {
      Document,
      Packer,
      Paragraph,
      Table,
      TableRow,
      TableCell,
      TextRun,
      AlignmentType,
      WidthType
    } = docx;

    // Helper: return a safe string for values that may be undefined/null.
    function safeText(v) { return v === undefined || v === null ? "" : String(v); }

    // Count how many paragraph entries exist in the state (used for end-of-book calculations).
    const totalParagraphs = (state.paragraphs || []).length;

    // Helper: compute the numeric start paragraph index for a segment (the minimum index in its paragraphIndexes).
    function computeSegStart(seg) {
      return Math.min(...(seg.paragraphIndexes || [Infinity]));
    }

    // Helper: compute the numeric end paragraph index for a segment using divider semantics:
    // the segment runs until the next segment's start - 1 or until the end of the book.
    function computeSegEnd(seg, allSegmentsSorted) {
      const start = computeSegStart(seg); // start index for this segment
      const later = allSegmentsSorted.find(s => computeSegStart(s) > start); // next segment that starts later
      return later ? computeSegStart(later) - 1 : (totalParagraphs - 1); // end index
    }

    // Helper: produce a readable verse-range string like "1:1–1:21" from start and end paragraph indices.
    function humanRangeFromIdx(startIdx, endIdx) {
      // Guard: invalid indexes -> empty string.
      if (startIdx < 0 || startIdx >= totalParagraphs) return "";
      if (endIdx < 0 || endIdx >= totalParagraphs) return "";
      // Take the left side of the start paragraph's range (before '–').
      const startRange = (state.paragraphs[startIdx]?.range || "").split("–")[0] || "";
      // Get the raw end paragraph range string.
      const endRangeRaw = state.paragraphs[endIdx]?.range || "";
      // Prefer the right side of the end paragraph's range (after '–'), or the raw string if not split.
      const endRange = endRangeRaw.split("–")[1] || endRangeRaw;
      // If both sides exist, join with an en-dash, otherwise return whichever exists.
      if (startRange && endRange) return `${startRange}–${endRange}`;
      return startRange || endRange || "";
    }

    // Helper: create a TableCell with visible borders, optional children paragraphs, and any opts merged into the TableCell constructor.
    function makeBorderedCell(children = [], opts = {}) {
      // Convert string children into Paragraph objects; leave Paragraphs as-is.
      const paras = children.map(c => typeof c === "string" ? new Paragraph({ text: c }) : c);
      // Construct and return the TableCell with margins and borders and any passed options.
      const cell = new TableCell({
        children: paras,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        borders: {
          top: { style: "single", size: 4, color: "000000" },
          bottom: { style: "single", size: 4, color: "000000" },
          left: { style: "single", size: 4, color: "000000" },
          right: { style: "single", size: 4, color: "000000" },
        },
        ...opts
      });
      return cell;
    }

    // ---------------- PAGE 1: Overview table preparation ----------------

    // Sort segments by their starting paragraph index using computeSegStart.
    const segmentsSorted = (state.segments || []).slice().sort((a,b) => computeSegStart(a) - computeSegStart(b));

    // Build quick lookup maps for sections and divisions indexed by id.
    const sectionsMap = Object.fromEntries((state.sections || []).map(s => [s.id, s]));
    const divisionsMap = Object.fromEntries((state.divisions || []).map(d => [d.id, d]));

    // For each segment row we want to know which division and section it belongs to: build arrays of IDs.
    const segDivIds = segmentsSorted.map(seg => {
      const sec = sectionsMap[seg.sectionId];
      return sec ? sec.divisionId : null; // divisionId if the segment's section exists
    });
    const segSecIds = segmentsSorted.map(seg => seg.sectionId || null); // section id per segment

    // Determine where each division/section "starts" vs "continues" in the list of segment rows.
    const divMerge = []; // will hold "restart" or "continue" per segment row
    const secMerge = [];
    for (let i = 0; i < segmentsSorted.length; i++) {
      // Division restarts at index 0 or when its id differs from the previous row.
      divMerge[i] = (i === 0 || segDivIds[i] !== segDivIds[i-1]) ? "restart" : "continue";
      // Section restarts at index 0 or when the section id differs from the previous row.
      secMerge[i] = (i === 0 || segSecIds[i] !== segSecIds[i-1]) ? "restart" : "continue";
    }

    // Build header row for the overview table with three labeled bordered cells (Division | Section | Segment).
    const headerRow = new TableRow({
      children: [
        makeBorderedCell([ new Paragraph({ children: [ new TextRun({ text: "Division", bold: true }) ] }) ], { width: { size: 33, type: WidthType.PERCENTAGE } }),
        makeBorderedCell([ new Paragraph({ children: [ new TextRun({ text: "Section", bold: true }) ] }) ], { width: { size: 33, type: WidthType.PERCENTAGE } }),
        makeBorderedCell([ new Paragraph({ children: [ new TextRun({ text: "Segment", bold: true }) ] }) ], { width: { size: 34, type: WidthType.PERCENTAGE } })
      ]
    });

    // Array to accumulate rows for the overview table (after header).
    const overviewRows = [];

    // Iterate over each sorted segment and create a TableRow with possible vertical merge behavior for division/section.
    for (let i = 0; i < segmentsSorted.length; i++) {
      const seg = segmentsSorted[i]; // current segment
      const sec = sectionsMap[seg.sectionId] || null; // its parent section (if any)
      const div = sec ? divisionsMap[sec.divisionId] : null; // its parent division (if any)

      // Build the Division cell: if divMerge says 'restart' we create a cell with text and verticalMerge restart,
      // otherwise we create a continue cell with blank text and verticalMerge continue.
      let divCell;
      if (divMerge[i] === "restart") {
        // Create a TableCell that starts a vertical merge block and shows the division title centered.
        divCell = new TableCell({
          children: [
            // Paragraph with TextRun; alignment applied to the Paragraph.
            new Paragraph({ children: [ new TextRun({ text: safeText(div?.title) || `Division ${div?.id}`, bold: true }) ], alignment: AlignmentType.CENTER })
          ],
          verticalMerge: "restart",        // marks the start of a merged vertical cell
          verticalAlign: "center",         // center text vertically within the merged block
          margins: { top: 200, bottom: 200, left: 80, right: 80 }, // internal padding
          borders: {                        // visible borders on the cell
            top: { style: "single", size: 4, color: "000000" },
            bottom: { style: "single", size: 4, color: "000000" },
            left: { style: "single", size: 4, color: "000000" },
            right: { style: "single", size: 4, color: "000000" },
          },
          width: { size: 33, type: WidthType.PERCENTAGE } // approx 1/3 width
        });
      } else {
        // Continuation of a previous division merged cell: create an empty TableCell that continues the vertical merge.
        divCell = new TableCell({
          children: [ new Paragraph({ text: "" }) ], // blank content
          verticalMerge: "continue",                 // continue the previously started vertical merge
          margins: { top: 0, bottom: 0, left: 80, right: 80 },
          borders: {                                  // still provide borders here (was earlier behavior)
            top: { style: "single", size: 4, color: "000000" },
            bottom: { style: "single", size: 4, color: "000000" },
            left: { style: "single", size: 4, color: "000000" },
            right: { style: "single", size: 4, color: "000000" },
          },
          width: { size: 33, type: WidthType.PERCENTAGE }
        });
      }

      // Build the Section cell similarly: restart shows the section title centered; continue is blank and continues the merge.
      let secCell;
      if (secMerge[i] === "restart") {
        secCell = new TableCell({
          children: [
            new Paragraph({ children: [ new TextRun({ text: safeText(sec?.title) || `Section ${sec?.id}`, bold: true }) ], alignment: AlignmentType.CENTER })
          ],
          verticalMerge: "restart",
          verticalAlign: "center",
          margins: { top: 200, bottom: 200, left: 80, right: 80 },
          borders: {
            top: { style: "single", size: 4, color: "000000" },
            bottom: { style: "single", size: 4, color: "000000" },
            left: { style: "single", size: 4, color: "000000" },
            right: { style: "single", size: 4, color: "000000" },
          },
          width: { size: 33, type: WidthType.PERCENTAGE }
        });
      } else {
        secCell = new TableCell({
          children: [ new Paragraph({ text: "" }) ],
          verticalMerge: "continue",
          margins: { top: 0, bottom: 0, left: 80, right: 80 },
          borders: {
            top: { style: "single", size: 4, color: "000000" },
            bottom: { style: "single", size: 4, color: "000000" },
            left: { style: "single", size: 4, color: "000000" },
            right: { style: "single", size: 4, color: "000000" },
          },
          width: { size: 33, type: WidthType.PERCENTAGE }
        });
      }

      // Build the Segment cell: show the segment title (bold) and the computed range underneath.
      const segStart = computeSegStart(seg);                       // starting paragraph index for seg
      const segEnd = computeSegEnd(seg, segmentsSorted);           // ending paragraph index for seg using divider logic
      const segRange = humanRangeFromIdx(segStart, segEnd);        // human-readable verse-range string
      const segCell = new TableCell({
        children: [
          new Paragraph({ children: [ new TextRun({ text: safeText(seg.title) || `Segment ${seg.id}`, bold: true }) ] }),
          new Paragraph({ text: segRange })
        ],
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        borders: {
          top: { style: "single", size: 4, color: "000000" },
          bottom: { style: "single", size: 4, color: "000000" },
          left: { style: "single", size: 4, color: "000000" },
          right: { style: "single", size: 4, color: "000000" },
        },
        width: { size: 34, type: WidthType.PERCENTAGE }
      });

      // Add the assembled row (division cell, section cell, segment cell) to the overviewRows array.
      overviewRows.push(new TableRow({ children: [ divCell, secCell, segCell ] }));
    }

    // If there were no segments, create a placeholder overview row so the table isn't empty.
    if (overviewRows.length === 0) {
      overviewRows.push(new TableRow({
        children: [
          makeBorderedCell([ new Paragraph("No structure defined") ], { width: { size: 33, type: WidthType.PERCENTAGE } }),
          makeBorderedCell([ new Paragraph("") ], { width: { size: 33, type: WidthType.PERCENTAGE } }),
          makeBorderedCell([ new Paragraph("") ], { width: { size: 34, type: WidthType.PERCENTAGE } }),
        ]
      }));
    }

    // Compose the Table for the overview page: header row + all segment rows.
    const overviewTable = new Table({
      rows: [ headerRow, ...overviewRows ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    // Build the children (Paragraphs/Tables) for page 1: book title, a spacer, then the overview table.
    const page1Children = [
      new Paragraph({ children: [ new TextRun({ text: safeText(state.bookName) || "Book", bold: true, size: 36 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: " " }),
      overviewTable
    ];

    // ---------------- PAGES 2..N: Segment pages with 3 equal columns ----------------

    // Map each sorted segment to a section definition (one section per segment page).
    const segmentSections = segmentsSorted.map(seg => {
      // Recompute start/end/range/title for this segment.
      const segStart = computeSegStart(seg);
      const segEnd = computeSegEnd(seg, segmentsSorted);
      const segRange = humanRangeFromIdx(segStart, segEnd);
      const segTitle = safeText(seg.title) || `Segment ${seg.id}`;

      // Build the array of paragraph indexes that belong to this segment by collecting from segStart to segEnd.
      const realPIdxs = [];
      for (let i = segStart; i <= segEnd && i < totalParagraphs; i++) realPIdxs.push(i);

      // We'll assemble rows for a Table where each row has three cells (left, middle, right).
      const rows = [];

      // Title row spans 3 columns and holds the segment title centered.
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [ new Paragraph({ children: [ new TextRun({ text: segTitle, bold: true, size: 24 }) ] }) ],
            columnSpan: 3,
            borders: {
              top: { style: "single", size: 4, color: "000000" },
              bottom: { style: "single", size: 4, color: "000000" },
              left: { style: "single", size: 4, color: "000000" },
              right: { style: "single", size: 4, color: "000000" },
            },
            margins: { top: 160, bottom: 160 }
          })
        ]
      }));

      // Range row spans 3 columns and shows the human-readable range centered under the title.
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [ new Paragraph({ text: segRange, alignment: AlignmentType.CENTER }) ],
            columnSpan: 3,
            borders: {
              top: { style: "single", size: 4, color: "000000" },
              bottom: { style: "single", size: 4, color: "000000" },
              left: { style: "single", size: 4, color: "000000" },
              right: { style: "single", size: 4, color: "000000" },
            },
            margins: { top: 80, bottom: 160 }
          })
        ]
      }));

      // If there are no paragraphs in this segment, create a single writing row with left/right restart merged cells.
      if (realPIdxs.length === 0) {
        rows.push(new TableRow({
          children: [
            new TableCell({
              children: [ new Paragraph(" ") ],
              verticalMerge: "restart",
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "single", size: 4, color: "000000" },
                bottom: { style: "single", size: 4, color: "000000" },
                left: { style: "single", size: 4, color: "000000" },
                right: { style: "single", size: 4, color: "000000" },
              }
            }),
            // Middle writing cell (bordered) created via makeBorderedCell for consistent padding & borders.
            makeBorderedCell([ new Paragraph(" ") ], { width: { size: 34, type: WidthType.PERCENTAGE } }),
            new TableCell({
              children: [ new Paragraph(" ") ],
              verticalMerge: "restart",
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "single", size: 4, color: "000000" },
                bottom: { style: "single", size: 4, color: "000000" },
                left: { style: "single", size: 4, color: "000000" },
                right: { style: "single", size: 4, color: "000000" },
              }
            })
          ]
        }));
      } else {
        // For each paragraph in the real paragraph index range, append two rows:
        // 1) Title row: left and right columns continue vertical merge; middle cell contains the paragraph title (centered).
        // 2) Writing row: left/right continue merged, middle cell is a bordered empty area for writing.
        let leftRightState = "restart"; // indicates whether left/right should start a vertical merge or continue
        realPIdxs.forEach(pi => {
          const p = state.paragraphs[pi] || {};
          const titleText = `${safeText(p.range)}${p.title ? " — " + safeText(p.title) : ""}`;

          // Title row: left cell (restart/continue), middle cell with centered title, right cell (restart/continue)
          rows.push(new TableRow({
            children: [
              new TableCell({
                children: [ new Paragraph(" ") ],
                verticalMerge: leftRightState === "restart" ? "restart" : "continue",
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 4, color: "000000" },
                  bottom: { style: "single", size: 4, color: "000000" },
                  left: { style: "single", size: 4, color: "000000" },
                  right: { style: "single", size: 4, color: "000000" },
                }
              }),
              new TableCell({
                children: [ new Paragraph({ children: [ new TextRun({ text: titleText, bold: true }) ], alignment: AlignmentType.CENTER }) ],
                width: { size: 34, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 4, color: "000000" },
                  bottom: { style: "single", size: 4, color: "000000" },
                  left: { style: "single", size: 4, color: "000000" },
                  right: { style: "single", size: 4, color: "000000" },
                }
              }),
              new TableCell({
                children: [ new Paragraph(" ") ],
                verticalMerge: leftRightState === "restart" ? "restart" : "continue",
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 4, color: "000000" },
                  bottom: { style: "single", size: 4, color: "000000" },
                  left: { style: "single", size: 4, color: "000000" },
                  right: { style: "single", size: 4, color: "000000" },
                }
              })
            ]
          }));

          // Writing row: left/right continue the merge; middle cell is a bordered block with empty paragraphs for height.
          rows.push(new TableRow({
            children: [
              new TableCell({
                children: [ new Paragraph(" ") ],
                verticalMerge: "continue",
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 4, color: "000000" },
                  bottom: { style: "single", size: 4, color: "000000" },
                  left: { style: "single", size: 4, color: "000000" },
                  right: { style: "single", size: 4, color: "000000" },
                }
              }),
              // Middle writing cell: two empty paragraphs inside to give it vertical height.
              makeBorderedCell([ new Paragraph(" "), new Paragraph(" ") ], { width: { size: 34, type: WidthType.PERCENTAGE } }),
              new TableCell({
                children: [ new Paragraph(" ") ],
                verticalMerge: "continue",
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 4, color: "000000" },
                  bottom: { style: "single", size: 4, color: "000000" },
                  left: { style: "single", size: 4, color: "000000" },
                  right: { style: "single", size: 4, color: "000000" },
                }
              })
            ]
          }));

          // After the first paragraph, left/right merge state becomes 'continue' so subsequent rows stay merged.
          leftRightState = "continue";
        });
      }

      // Build a Table for the segment page from the rows we collected and return it as a doc section (with page margins).
      const segTable = new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      });

      return { properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: [ segTable ] };
    });

    // Build the final Document with page 1 followed by each segment section/page.
    const doc = new Document({
      sections: [
        { properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: page1Children },
        ...segmentSections
      ]
    });

    // Pack the document into a Blob and trigger a download via a temporary anchor element.
    Packer.toBlob(doc).then(blob => {
      const a = document.createElement("a");                      // create an <a> element
      a.href = URL.createObjectURL(blob);                         // set download URL to blob URL
      a.download = (safeText(state.bookName) || "book").replace(/\s+/g, "_") + "_structure.docx"; // filename
      a.click();                                                  // simulate click to start download
    }).catch(err => {                                             // handle packing errors
      console.error("DOCX generation failed:", err);
      alert("Failed to generate DOCX. See console for details.");
    });
  };
});
