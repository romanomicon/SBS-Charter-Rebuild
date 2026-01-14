# Word Export System - Complete Guide

## 📚 Overview

This folder contains all the code for exporting book structures to Microsoft Word documents using the `docx.js` library.

---

## 🗂️ File Structure

```
js/export/
├── exportWord.js           # Main orchestrator - assembles the final document
├── exportHTML.js           # NEW: HTML preview with live editing
├── pages/
│   ├── overviewPage.js     # Creates the horizontal structure table (page 1)
│   └── segmentPage.js      # Creates individual segment pages (pages 2+)
└── helpers/
    ├── docxUtils.js        # Reusable cell creation functions
    ├── textUtils.js        # Text formatting and verse range helpers
    └── segmentMath.js      # Calculates which paragraphs belong to which segments
```

---

## 📖 How It Works (Step by Step)

### 1. User chooses an export option

**Three buttons available:**
- **👁️ Preview** - Opens HTML preview in new tab (editable, instant)
- **Word** - Downloads .docx file (requires Word to open)
- **JSON** - Downloads raw data structure

### 2A. HTML Preview Path (NEW!)
```javascript
exportHTML(state)
  ├── Builds HTML document with editable content
  ├── Opens in new browser tab/window
  ├── User can edit content live
  ├── Print to PDF or close
  └── Returns to main app for Word export if needed
```

**Benefits:**
- ✅ Instant preview - no download needed
- ✅ Edit content directly in browser
- ✅ See exact layout before exporting
- ✅ Print to PDF if preferred

### 2B. Word Export Path
```javascript
exportWord(state)
  ├── Builds overview table (calls buildOverviewPage)
  ├── Builds segment pages (calls buildSegmentPage for each segment)
  └── Assembles into Document and downloads
```

### 3. Overview page shows horizontal structure
```
+----------+----------+----------+------------------+
| Division | Section  | Segment  | Key Verse: 1:1   |
+----------+----------+----------+------------------+
|          |          | Intro    |                  |
| Div 1    | Sec 1    | 1:1-1:21 |                  |
|          +----------+----------+                  |
|          | Sec 2    | Setup    |                  |
|          |          | 1:22-2:5 |                  |
+----------+----------+----------+------------------+
```

### 4. Each segment gets its own page
- Title, verse ranges, paragraph titles
- Space for writing notes

---

## 🎯 Common Editing Tasks

### Change Overview Table Column Widths
**File:** `overviewPage.js`
**Lines:** ~181-185

```javascript
const DIV_W = 3000;  // Division column width (DXA units)
const SEC_W = 3000;  // Section column width
const SEG_W = 3000;  // Segment column width
const KEY_W = 1701;  // Key verse column width
```

**DXA to inches:** 1440 DXA = 1 inch
**Example:** 3000 DXA ≈ 2.08 inches

### Change Font Sizes
**Overview page:** `overviewPage.js` line ~191
```javascript
const fontSize = 18;  // Increase or decrease
```

**Segment pages:** `segmentPage.js` (search for `size:` properties)

### Change Cell Spacing (Margins)
**Overview page:** `overviewPage.js` line ~61
```javascript
margins: { top: 60, bottom: 60, left: 80, right: 80 }
```

**Standard cells:** `docxUtils.js` line ~38
```javascript
margins: { top: 120, bottom: 120, left: 120, right: 120 }
```

**Larger numbers** = more white space
**Smaller numbers** = more compact

### Change Border Thickness
Look for `borders:` sections in any file:
```javascript
borders: {
  top: { style: "single", size: 4 },  // Change '4' to adjust thickness
  // ...
}
```

---

## 🔧 Key Concepts

### DXA Units
- **DXA** = Document Exchange Units
- Word's internal measurement unit
- **1 inch = 1440 DXA**
- **Page width** = 11906 DXA (8.27 inches)
- **Page height** = 16838 DXA (11.69 inches)

### Vertical Merge (Row Spanning)
Allows a cell to span multiple rows (like HTML `rowspan`):

```javascript
// First row: Start the merge
verticalMerge: docx.VerticalMerge.RESTART

// Subsequent rows: Continue the merge
verticalMerge: docx.VerticalMerge.CONTINUE
```

**Example:** Division "Div 1" spans 5 rows
- Row 1: `RESTART` (shows "Div 1")
- Rows 2-5: `CONTINUE` (empty, merged with row 1)

### Segment Math
Segments are **dividers**, not boxes:
- A segment **starts** at its first assigned paragraph
- A segment **ends** just before the next segment starts
- The last segment extends to the end of the book

**Example:**
```
Book has 50 paragraphs
Segment A assigned to: [0, 5, 10]  → Starts at 0
Segment B assigned to: [25, 30]    → Starts at 25

Result:
  Segment A: paragraphs 0-24  (0 to 24)
  Segment B: paragraphs 25-49 (25 to end)
```

---

## 🐛 Troubleshooting

### Table overflows to next page
**Problem:** Too much content or spacing
**Solutions:**
1. Reduce column widths (`DIV_W`, `SEC_W`, etc.)
2. Reduce cell margins (change `60` to `40`, etc.)
3. Reduce font size (change `18` to `16`)
4. Let it flow naturally (current approach - no forced heights)

### Text is cut off or truncated
**Problem:** Cell width too small for content
**Solutions:**
1. Increase column width for that column
2. Reduce font size
3. Use word wrapping (already enabled by default)

### Divisions/Sections not merging correctly
**Problem:** `lastDiv` or `lastSec` tracking is broken
**Check:**
- Lines ~210-270 in `overviewPage.js`
- Ensure `lastDiv = div?.id` happens at end of loop

### Verse ranges incorrect
**Problem:** Paragraph ranges not calculating correctly
**Check:**
- `segmentMath.js` - `computeSegStart` and `computeSegEnd`
- `textUtils.js` - `humanRangeFromIdx`
- Verify paragraph `.range` property format is `"1:1–1:5"`

---

## 📐 Page Dimensions Reference

```
Page Size (Portrait):
  Width:  11906 DXA (8.27")
  Height: 16838 DXA (11.69")

Default Margins:
  Top, Right, Bottom, Left: 284 DXA each (0.20")

Usable Area:
  Width:  11338 DXA (7.87")
  Height: 16270 DXA (11.30")
```

---

## 🔄 Alternative Export Options

If `docx.js` becomes too difficult:

### Option 1: **Docxtemplater** (Recommended)
- Create a Word template with placeholders
- Fill in placeholders with data
- Much easier for complex layouts
- **Pros:** Easier, more control, templates editable in Word
- **Cons:** Requires creating template file

### Option 2: **HTML Export + Print to PDF**
- Generate HTML version of the structure
- Use browser print or library to convert to PDF
- **Pros:** Easier to style, preview in browser
- **Cons:** Not a native Word file

### Option 3: **Export to JSON → Python script → Word**
- Export structure as JSON
- Use Python's `python-docx` library
- **Pros:** Python's docx library is more intuitive
- **Cons:** Requires Python, extra step

---

## 🎓 Learning Resources

### docx.js Documentation
- Official docs: https://docx.js.org/
- API Reference: https://docx.js.org/api/

### Key Classes to Understand
- `Document` - The entire Word document
- `Table` - A table element
- `TableRow` - A row in a table
- `TableCell` - A cell in a table
- `Paragraph` - A paragraph of text
- `TextRun` - A formatted piece of text within a paragraph

### Useful Properties
- `alignment` - Text alignment (LEFT, CENTER, RIGHT)
- `margins` - Cell padding
- `borders` - Cell border styling
- `width` - Column widths
- `verticalMerge` - Row spanning
- `spacing` - Paragraph spacing

---

## 💡 Tips for Editing

1. **Start Small:** Make one change at a time and test
2. **Use Constants:** Define values at the top (like `DIV_W`) rather than hardcoding
3. **Keep DXA Reference Handy:** 1440 DXA = 1 inch
4. **Test with Real Data:** Use actual book content, not sample data
5. **Comment Your Changes:** Future you will thank you!
6. **Backup Before Major Changes:** Copy the file before big refactors

---

## 📞 Need Help?

If you're stuck:
1. Check this guide first
2. Look at inline comments in the code files (now heavily documented)
3. Check docx.js documentation: https://docx.js.org/
4. Search for error messages online
5. Try simplifying - remove features until it works, then add back

---

## ✅ Quick Reference

| Task | File | Line # (approx) |
|------|------|-----------------|
| Change column widths | `overviewPage.js` | 181-185 |
| Change font size | `overviewPage.js` | 191 |
| Change cell margins | `overviewPage.js` | 61 |
| Fix verse ranges | `textUtils.js` | 32-61 |
| Fix segment boundaries | `segmentMath.js` | 44-84 |
| Adjust page margins | `exportWord.js` | 28-32 |
| Change border style | `docxUtils.js` | 39-44 |

---

**Last Updated:** 2026-01-13
**Maintainer:** Your team
**Library Version:** docx.js 7.3.0
