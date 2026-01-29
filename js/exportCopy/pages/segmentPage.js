import { computeSegStart, computeSegEnd } from "../helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "../helpers/textUtils.js";
import { borderedCell, mergedCell } from "../helpers/docxUtils.js";

export function buildSegmentPage(docx, state, seg, segmentsSorted) {
  const paragraphs = state.paragraphs;
  const totalParagraphs = paragraphs.length;

  const segStart = computeSegStart(seg);
  const segEnd = computeSegEnd(seg, segmentsSorted, totalParagraphs);
  const range = humanRangeFromIdx(segStart, segEnd, paragraphs);

  const rows = [];

  rows.push(new docx.TableRow({
    children: [
      borderedCell(docx, [
        new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          children: [new docx.TextRun({ text: safeText(seg.title), bold: true })]
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

  for (let i = segStart; i <= segEnd; i++) {
    const p = paragraphs[i];

    rows.push(new docx.TableRow({
      children: [
        mergedCell(docx, mergeState, 33),
        borderedCell(docx, [
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [new docx.TextRun({
              text: `${p.range}${p.title ? " — " + p.title : ""}`,
              bold: true
            })]
          })
        ], { width: { size: 34, type: docx.WidthType.PERCENTAGE } }),
        mergedCell(docx, mergeState, 33)
      ]
    }));

    rows.push(new docx.TableRow({
      children: [
        mergedCell(docx, "continue", 33),
        borderedCell(docx, [new docx.Paragraph(" "), new docx.Paragraph(" ")]),
        mergedCell(docx, "continue", 33)
      ]
    }));

    mergeState = "continue";
  }

  return new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    rows
  });
}
