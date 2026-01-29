export function safeText(v) {
  return v == null ? "" : String(v);
}

export function humanRangeFromIdx(startIdx, endIdx, paragraphs) {
  if (!paragraphs[startIdx] || !paragraphs[endIdx]) return "";

  const start = paragraphs[startIdx].range.split("–")[0];
  const endRaw = paragraphs[endIdx].range;
  const end = endRaw.includes("–") ? endRaw.split("–")[1] : endRaw;

  return `${start}–${end}`;
}
