# Quick Edit Cheatsheet

## Most Common Edits (Copy & Paste Ready)

### 1. Make Overview Table More Compact

**File:** `js/export/pages/overviewPage.js`

**Line 61** - Reduce cell padding:
```javascript
margins: { top: 40, bottom: 40, left: 60, right: 60 }  // Was: 60, 60, 80, 80
```

**Line 191** - Smaller font:
```javascript
const fontSize = 16;  // Was: 18
```

---

### 2. Wider Segment Column (More Room for Text)

**File:** `js/export/pages/overviewPage.js`

**Lines 181-184** - Adjust column widths:
```javascript
const DIV_W = 2500;  // Was: 3000 (make smaller)
const SEC_W = 2500;  // Was: 3000 (make smaller)
const SEG_W = 4000;  // Was: 3000 (make WIDER)
const KEY_W = 1701;  // Keep same
```

---

### 3. Remove Key Verse Column Entirely

**File:** `js/export/pages/overviewPage.js`

**Lines 181-184:**
```javascript
const DIV_W = 3500;
const SEC_W = 3500;
const SEG_W = 4000;
const KEY_W = 0;  // Set to 0
```

**Lines 193-227:** Delete or comment out the key verse cell in header:
```javascript
// Comment out or remove lines 181-205 (the Key Verse TableCell)
```

**Line 246-257:** Delete or comment out the key verse cell in segment rows

---

### 4. Larger Page Margins

**File:** `js/export/exportWord.js`

**Lines 28-32:**
```javascript
margin: {
  top: 720,     // Was: 284 (0.5 inch)
  right: 720,   // Was: 284 (0.5 inch)
  bottom: 720,  // Was: 284 (0.5 inch)
  left: 720     // Was: 284 (0.5 inch)
}
```

---

### 5. Double Border Thickness

**File:** `js/export/helpers/docxUtils.js`

**Lines 39-44:**
```javascript
borders: {
  top: { style: "single", size: 8 },     // Was: 4
  bottom: { style: "single", size: 8 },  // Was: 4
  left: { style: "single", size: 8 },    // Was: 4
  right: { style: "single", size: 8 }    // Was: 4
}
```

---

### 6. Change All Fonts to Times New Roman

**File:** `js/export/pages/overviewPage.js`

Find all `TextRun` instances and add `font` property:

**Example (Line ~105, ~187, ~230, ~243):**
```javascript
new docx.TextRun({
  text,
  bold: true,
  size: fontSize,
  font: "Times New Roman"  // Add this line
})
```

---

### 7. Remove Overview Page (Segments Only)

**File:** `js/export/exportWord.js`

**Lines 12-37:** Comment out overview section:
```javascript
// const overviewTable = buildOverviewPage(docx, state);

const doc = new docx.Document({
  sections: [
    // Remove this entire section (lines 20-37)
    // {
    //   properties: { ... },
    //   children: [overviewTable]
    // },
    ...segmentSections.map(section => ({
      // Keep this part
```

---

### 8. Landscape Orientation

**File:** `js/export/exportWord.js`

**Line 24:**
```javascript
orientation: docx.PageOrientation.LANDSCAPE,  // Was: PORTRAIT
```

---

## DXA Conversion Table

| Inches | DXA   | Common Use |
|--------|-------|------------|
| 0.25"  | 360   | Small margin |
| 0.5"   | 720   | Standard margin |
| 1"     | 1440  | Large margin |
| 2"     | 2880  | Column width |
| 3"     | 4320  | Wide column |
| 8.5"   | 12240 | Page width (letter) |

**Formula:** `DXA = inches × 1440`

---

## Font Size Reference

| Points | DXA | Visual Size |
|--------|-----|-------------|
| 10pt   | 20  | Small |
| 12pt   | 24  | Standard |
| 14pt   | 28  | Medium |
| 16pt   | 32  | Large |
| 18pt   | 36  | Very Large (current) |

**Formula:** `Half-points = points × 2`

---

## Color Codes (For Future Use)

If you want to add colors to cells:

```javascript
shading: {
  fill: "CCCCCC"  // Light gray
  // Or: "FF0000" (red), "00FF00" (green), "0000FF" (blue)
}
```

Common colors:
- White: `"FFFFFF"`
- Light gray: `"CCCCCC"`
- Dark gray: `"666666"`
- Light blue: `"ADD8E6"`
- Light yellow: `"FFFFE0"`

---

## Testing Checklist

After making changes:
- [ ] Export a document
- [ ] Open in Microsoft Word
- [ ] Check page breaks
- [ ] Verify all text is visible
- [ ] Check table alignment
- [ ] Test with max content (longest book)
- [ ] Test with min content (shortest book)

---

## Rollback (Undo Changes)

If something breaks:
1. Use Git: `git checkout js/export/`
2. Or restore from backup
3. Or ask me to regenerate the files

---

**Pro Tip:** Make ONE change at a time and test immediately!
