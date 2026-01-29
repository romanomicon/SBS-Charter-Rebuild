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

