export function computeSegStart(seg) {
  return Math.min(...(seg.paragraphIndexes || [Infinity]));
}

export function computeSegEnd(seg, sortedSegments, totalParagraphs) {
  const start = computeSegStart(seg);
  const next = sortedSegments.find(s => computeSegStart(s) > start);
  return next ? computeSegStart(next) - 1 : totalParagraphs - 1;
}
