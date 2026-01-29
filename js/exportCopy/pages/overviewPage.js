import { computeSegStart, computeSegEnd } from "../helpers/segmentMath.js";
import { humanRangeFromIdx, safeText } from "../helpers/textUtils.js";
import { borderedCell, mergedCell, centeredTextCell } from "../helpers/docxUtils.js";

export function buildOverviewPage(docx, state) {
  const paragraphs = state.paragraphs || [];
  const totalParagraphs = paragraphs.length;

  const segmentsSorted = [...state.segments]
    .sort((a, b) => computeSegStart(a) - computeSegStart(b));

  const sectionsById = Object.fromEntries(
    state.sections.map(s => [s.id, s])
  );
  const divisionsById = Object.fromEntries(
    state.divisions.map(d => [d.id, d])
  );

  // ---- DXA column widths ----
  const DIV_W = 3000;
  const SEC_W = 3000;
  const SEG_W = 3000;
  const TABLE_W = DIV_W + SEC_W + SEG_W;

  const rows = [];

  // ---- Header row ----
  rows.push(
    new docx.TableRow({
      children: [
        centeredTextCell(docx, "Division", DIV_W),
        centeredTextCell(docx, "Section", SEC_W),
        centeredTextCell(docx, "Segment", SEG_W)
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
            ? centeredTextCell(
                docx,
                safeText(div?.title),
                DIV_W,
                "restart"
              )
            : mergedCell(docx, "continue", DIV_W),

          sec?.id !== lastSec
            ? centeredTextCell(
                docx,
                safeText(sec?.title),
                SEC_W,
                "restart"
              )
            : mergedCell(docx, "continue", SEC_W),

          borderedCell(
            docx,
            [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: safeText(seg.title),
                    bold: true
                  })
                ]
              }),
              new docx.Paragraph(range)
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

    lastDiv = div?.id;
    lastSec = sec?.id;
  });

  return new docx.Table({
    width: {
      size: TABLE_W,
      type: docx.WidthType.DXA
    },
    layout: docx.TableLayoutType.FIXED,
    rows
  });
}
