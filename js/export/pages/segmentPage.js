import { computeSegStart, computeSegEnd } from "../helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "../helpers/textUtils.js";
import { borderedCell, mergedCell, mergedCellWithContent } from "../helpers/docxUtils.js";

export function buildSegmentPage(docx, state, seg, segmentsSorted) {
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

  // Get the side column notes from the segment (with HTML formatting)
  const leftNote = seg.leftNote || '';
  const rightNote = seg.rightNote || '';

  for (let i = segStart; i <= segEnd; i++) {
    const p = paragraphs[i];

    rows.push(new docx.TableRow({
      height: { value: 350, rule: docx.HeightRule.EXACT },
      children: [
        // Left column - uses mergedCellWithContent for first row to include notes
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
        // Right column - uses mergedCellWithContent for first row to include notes
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