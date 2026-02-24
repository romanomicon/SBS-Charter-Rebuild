// Word export - generates .docx from book structure

// ---- Segment math helpers ----

function computeSegStart(seg) {
  return Math.min(...(seg.paragraphIndexes || [Infinity]));
}

function computeSegEnd(seg, sortedSegments, totalParagraphs) {
  const start = computeSegStart(seg);
  const next = sortedSegments.find(s => computeSegStart(s) > start);
  return next ? computeSegStart(next) - 1 : totalParagraphs - 1;
}

// ---- Text helpers ----

function safeText(v) {
  return v == null ? "" : String(v);
}

function humanRangeFromIdx(startIdx, endIdx, paragraphs) {
  if (!paragraphs[startIdx] || !paragraphs[endIdx]) return "";
  const start = paragraphs[startIdx].range.split("–")[0];
  const endRaw = paragraphs[endIdx].range;
  const end = endRaw.includes("–") ? endRaw.split("–")[1] : endRaw;
  return `${start}–${end}`;
}

// ---- DOCX cell helpers ----

function borderedCell(docx, children, opts = {}) {
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

function mergedCellWithContent(docx, mergeType, widthPercent, htmlContent = '') {
  let children = [];

  if (htmlContent && mergeType === 'restart') {
    children = parseHtmlToParagraphs(docx, htmlContent);
  } else {
    children.push(new docx.Paragraph(''));
  }

  return borderedCell(
    docx,
    children,
    {
      verticalMerge: mergeType,
      width: {
        size: widthPercent,
        type: docx.WidthType.PERCENTAGE
      }
    }
  );
}

// ---- HTML to DOCX parsing ----

function parseHtmlToParagraphs(docx, html) {
  if (!html || typeof html !== 'string') {
    return [new docx.Paragraph('')];
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const paragraphs = [];
  let currentRuns = [];
  let listCounter = 0;
  let currentListType = null;

  function flushCurrentParagraph(listType = null, listNum = 0) {
    if (currentRuns.length > 0) {
      const paraOptions = { children: currentRuns };

      if (listType === 'bullet') {
        currentRuns.unshift(new docx.TextRun({ text: '• ' }));
        paraOptions.indent = { left: 360 };
      } else if (listType === 'number') {
        currentRuns.unshift(new docx.TextRun({ text: `${listNum}. ` }));
        paraOptions.indent = { left: 360 };
      }

      paragraphs.push(new docx.Paragraph(paraOptions));
      currentRuns = [];
    }
  }

  function createTextRun(text, formatting) {
    if (!text) return null;

    const runOptions = { text };
    if (formatting.bold) runOptions.bold = true;
    if (formatting.italic) runOptions.italics = true;
    if (formatting.underline) runOptions.underline = {};
    if (formatting.strike) runOptions.strike = true;
    if (formatting.highlight) {
      const highlightColor = mapHighlightColor(formatting.highlight);
      if (highlightColor) {
        runOptions.highlight = highlightColor;
      }
    }
    if (formatting.color) {
      runOptions.color = formatting.color.replace('#', '');
    }
    if (formatting.fontSize) {
      runOptions.size = formatting.fontSize;
    }
    return new docx.TextRun(runOptions);
  }

  function processNode(node, formatting = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        const run = createTextRun(text, formatting);
        if (run) currentRuns.push(run);
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toUpperCase();

    const newFormatting = {
      bold: formatting.bold || false,
      italic: formatting.italic || false,
      underline: formatting.underline || false,
      strike: formatting.strike || false,
      highlight: null,
      color: formatting.color || null,
      fontSize: formatting.fontSize || null
    };

    if (tag === 'B' || tag === 'STRONG') {
      newFormatting.bold = true;
    } else if (tag === 'I' || tag === 'EM') {
      newFormatting.italic = true;
    } else if (tag === 'U') {
      newFormatting.underline = true;
    } else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
      newFormatting.strike = true;
    } else if (tag === 'BR') {
      currentRuns.push(new docx.TextRun({ break: 1 }));
      return;
    } else if (tag === 'SPAN') {
      const bgColor = node.style.backgroundColor;
      if (bgColor && bgColor.trim() !== '' && bgColor !== 'transparent') {
        newFormatting.highlight = bgColor;
      }
      const textColor = node.style.color;
      if (textColor && textColor.trim() !== '') {
        newFormatting.color = parseColor(textColor);
      }
    } else if (tag === 'FONT') {
      const fontColor = node.getAttribute('color');
      if (fontColor) {
        newFormatting.color = fontColor;
      }
      const fontSize = node.getAttribute('size');
      if (fontSize) {
        newFormatting.fontSize = mapFontSize(fontSize);
      }
    } else if (tag === 'H1') {
      newFormatting.bold = true;
      newFormatting.fontSize = 48;
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'H2') {
      newFormatting.bold = true;
      newFormatting.fontSize = 36;
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'H3') {
      newFormatting.bold = true;
      newFormatting.fontSize = 28;
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'UL') {
      const prevListType = currentListType;
      currentListType = 'bullet';
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      currentListType = prevListType;
      return;
    } else if (tag === 'OL') {
      const prevListType = currentListType;
      const prevCounter = listCounter;
      currentListType = 'number';
      listCounter = 0;
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      currentListType = prevListType;
      listCounter = prevCounter;
      return;
    } else if (tag === 'LI') {
      flushCurrentParagraph();
      listCounter++;
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph(currentListType, listCounter);
      return;
    } else if (tag === 'DIV' || tag === 'P') {
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    }

    for (const child of node.childNodes) {
      processNode(child, newFormatting);
    }
  }

  for (const child of temp.childNodes) {
    processNode(child, {});
  }

  flushCurrentParagraph();

  if (paragraphs.length === 0) {
    return [new docx.Paragraph('')];
  }

  return paragraphs;
}

function mapHighlightColor(cssColor) {
  if (!cssColor || cssColor.trim() === '' || cssColor === 'transparent') {
    return null;
  }

  const color = cssColor.toLowerCase().replace(/\s/g, '');

  if (color.includes('rgb(255,245,157)') || color.includes('255,245,157') ||
      color.includes('#fff59d') || color === 'yellow') {
    return 'yellow';
  }
  if (color.includes('rgb(165,214,167)') || color.includes('165,214,167') ||
      color.includes('#a5d6a7') || color === 'green') {
    return 'green';
  }
  if (color.includes('rgb(144,202,249)') || color.includes('144,202,249') ||
      color.includes('#90caf9') || color === 'blue' || color === 'cyan') {
    return 'cyan';
  }
  if (color.includes('rgb(244,143,177)') || color.includes('244,143,177') ||
      color.includes('#f48fb1') || color === 'pink' || color === 'magenta') {
    return 'magenta';
  }
  if (color.includes('rgb(255,204,128)') || color.includes('255,204,128') ||
      color.includes('#ffcc80') || color === 'orange') {
    return 'yellow';
  }
  if (color.includes('rgb(206,147,216)') || color.includes('206,147,216') ||
      color.includes('#ce93d8') || color === 'purple') {
    return 'magenta';
  }

  return null;
}

function parseColor(cssColor) {
  if (!cssColor || cssColor.trim() === '') return null;

  if (cssColor.startsWith('#')) {
    return cssColor;
  }

  const rgbMatch = cssColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return cssColor;
}

function mapFontSize(htmlSize) {
  const sizeMap = {
    '1': 16, '2': 20, '3': 24, '4': 28, '5': 36, '6': 48, '7': 72
  };
  return sizeMap[htmlSize] || 24;
}

// ---- Overview page (compact cells) ----

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

function buildOverviewPage(docx, state) {
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

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

  const getDivStart = (div) => div ? Math.min(...div.paragraphIndexes) : -1;
  const getSecStart = (sec) => sec ? Math.min(...sec.paragraphIndexes) : -1;

  const DIV_W = 3500;
  const SEC_W = 3500;
  const SEG_W = 3500;

  const rows = [];
  const fontSize = 18;

  rows.push(
    new docx.TableRow({
      children: [
        compactCenteredCell(docx, "Division", DIV_W, fontSize),
        compactCenteredCell(docx, "Section", SEC_W, fontSize),
        compactCenteredCell(docx, "Segment", SEG_W, fontSize)
      ]
    })
  );

  const rowData = segmentsSorted.map(seg => {
    const segStart = computeSegStart(seg);
    const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
    const sec = findSectionForSegment(segStart);
    const div = findDivisionForSegment(segStart);
    const paragraphCount = segEnd - segStart + 1;
    return { seg, sec, div, divStart: getDivStart(div), secStart: getSecStart(sec), paragraphCount };
  });

  const heightPerParagraph = 200;
  const minRowHeight = 400;
  const maxTableHeight = 14000;
  const headerHeight = 400;

  const totalNaturalHeight = rowData.reduce((sum, row) => {
    return sum + Math.max(minRowHeight, row.paragraphCount * heightPerParagraph);
  }, 0) + headerHeight;

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

    const naturalHeight = Math.max(minRowHeight, paragraphCount * heightPerParagraph);
    const rowHeight = Math.round(naturalHeight * heightScale);

    rows.push(
      new docx.TableRow({
        height: { value: rowHeight, rule: docx.HeightRule.ATLEAST },
        children: [
          divStart !== lastDivStart
            ? compactTopLeftCell(
                docx,
                safeText(div?.title) || `Division ${div?.id}`,
                DIV_W,
                fontSize,
                "restart"
              )
            : compactMergedCell(docx, "continue", DIV_W),

          secStart !== lastSecStart
            ? compactTopLeftCell(
                docx,
                safeText(sec?.title) || `Section ${sec?.id}`,
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

  const table = new docx.Table({
    width: {
      size: 100,
      type: docx.WidthType.PERCENTAGE
    },
    layout: docx.TableLayoutType.AUTOFIT,
    rows
  });

  return [titleParagraph, keyVerseParagraph, table];
}

// ---- Segment page ----

function buildSegmentPage(docx, state, seg, segmentsSorted) {
  const paragraphs = state.paragraphs;
  const totalParagraphs = paragraphs.length;

  const segStart = computeSegStart(seg);
  const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
  const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

  const rows = [];

  const segTitle = safeText(seg.title) || `Segment ${seg.id}`;
  rows.push(new docx.TableRow({
    children: [
      borderedCell(docx, [
        new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          children: [new docx.TextRun({ text: segTitle, bold: true })]
        })
      ], { columnSpan: 3 })
    ]
  }));

  rows.push(new docx.TableRow({
    children: [
      borderedCell(docx, [
        new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, text: range })
      ], { columnSpan: 3 })
    ]
  }));

  let mergeState = "restart";

  const leftNote = seg.leftNote || '';
  const rightNote = seg.rightNote || '';

  for (let i = segStart; i <= segEnd; i++) {
    const p = paragraphs[i];

    rows.push(new docx.TableRow({
      height: { value: 350, rule: docx.HeightRule.EXACT },
      children: [
        mergedCellWithContent(docx, mergeState, 33, leftNote),
        borderedCell(docx, [
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [new docx.TextRun({
              text: `${p.range}${p.title ? " — " + p.title : ""}`,
              bold: true
            })]
          })
        ], { width: { size: 34, type: docx.WidthType.PERCENTAGE } }),
        mergedCellWithContent(docx, mergeState, 33, rightNote)
      ]
    }));

    rows.push(new docx.TableRow({
      children: [
        mergedCellWithContent(docx, "continue", 33),
        borderedCell(docx, [new docx.Paragraph(" "), new docx.Paragraph(" ")]),
        mergedCellWithContent(docx, "continue", 33)
      ]
    }));

    mergeState = "continue";
  }

  return new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    rows
  });
}

// ---- Main export function ----

export function exportWord(state) {
  const docx = window.docx;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const overviewElements = buildOverviewPage(docx, state);

  const segmentSections = segmentsSorted.map(seg => ({
    children: [buildSegmentPage(docx, state, seg, segmentsSorted)]
  }));

  const doc = new docx.Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: docx.PageOrientation.PORTRAIT,
              width: 11906,
              height: 16838
            },
            margin: {
              top: 284,
              right: 284,
              bottom: 284,
              left: 284
            }
          },
          type: docx.SectionType.NEXT_PAGE
        },
        children: overviewElements
      },
      ...segmentSections.map(section => ({
        ...section,
        properties: {
          page: {
            size: {
              orientation: docx.PageOrientation.PORTRAIT,
              width: 11906,
              height: 16838
            },
            margin: {
              top: 284,
              right: 284,
              bottom: 284,
              left: 284
            }
          }
        }
      }))
    ]
  });

  docx.Packer.toBlob(doc).then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeText(state.bookName) || "book"}_structure.docx`;
    a.click();
  });
}
