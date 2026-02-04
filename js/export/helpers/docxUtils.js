/*
========================================================================
📄 DOCX UTILITIES - TABLE CELL HELPERS
========================================================================
PURPOSE: Reusable helper functions for creating Word table cells with
         consistent styling. Reduces code duplication and makes table
         creation more readable.

IMPORTANT CONCEPTS:
- DXA: Document units (1 inch = 1440 DXA)
- Margins: Space inside cell borders (120 DXA ≈ 0.08 inches)
- Borders: "single" style with size 4 creates thin black lines
- VerticalMerge: Allows cells to span multiple rows (like rowspan in HTML)

TO ADJUST CELL SPACING: Change the margins values (currently 120)
TO ADJUST BORDER THICKNESS: Change border size (currently 4)
========================================================================
*/

/**
 * Creates a table cell with borders and standard margins
 *
 * @param {Object} docx - The docx library instance (window.docx)
 * @param {Array} children - Array of Paragraph objects to display in cell
 * @param {Object} opts - Additional cell options (width, alignment, merge, etc.)
 * @returns {TableCell} A docx TableCell with borders and margins
 *
 * USAGE:
 *   borderedCell(docx, [new docx.Paragraph("Hello")], { width: {...} })
 *
 * MARGINS EXPLAINED:
 *   120 DXA = approximately 0.08 inches of padding inside the cell
 *   Increase for more spacing, decrease for tighter layout
 */
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

/**
 * Creates an empty bordered cell that merges with cells above/below it
 * Used for creating cells that span multiple rows (like HTML rowspan)
 *
 * @param {Object} docx - The docx library instance
 * @param {string} mergeType - Either "restart" (first cell) or "continue" (subsequent cells)
 * @param {number} widthDXA - Width of cell in DXA units
 * @returns {TableCell} An empty merged cell
 *
 * USAGE PATTERN:
 *   Row 1: mergedCell(docx, "restart", 3000)    // Starts the merge
 *   Row 2: mergedCell(docx, "continue", 3000)   // Continues merge from row 1
 *   Row 3: mergedCell(docx, "continue", 3000)   // Still part of the merge
 *
 * VISUAL RESULT:
 *   +-------+       The first cell spans all three rows
 *   |       |
 *   | Text  |
 *   |       |
 *   +-------+
 */
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

/**
 * Creates a centered, bold text cell (used for headers and titles)
 *
 * @param {Object} docx - The docx library instance
 * @param {string} text - The text to display
 * @param {number} widthDXA - Width of cell in DXA units
 * @param {string|null} mergeType - Optional: "restart" or "continue" for merged cells
 * @returns {TableCell} A cell with centered, bold text
 *
 * USAGE:
 *   centeredTextCell(docx, "Division", 3000)           // Regular cell
 *   centeredTextCell(docx, "Title", 3000, "restart")   // Merged cell
 *
 * TEXT STYLING:
 *   - Always bold
 *   - Always centered horizontally
 *   - Vertically centered in cell
 */
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

/**
 * Parses HTML content and converts it to an array of docx Paragraphs
 * Supports bold, italic, underline, strikethrough, highlight colors, and lists
 *
 * @param {Object} docx - The docx library instance
 * @param {string} html - HTML string to parse
 * @returns {Array} Array of docx Paragraph objects
 *
 * SUPPORTED TAGS:
 *   <b>, <strong> - Bold
 *   <i>, <em> - Italic
 *   <u> - Underline
 *   <s>, <strike>, <del> - Strikethrough
 *   <span style="background-color:..."> - Highlight
 *   <br> - Line break
 *   <ul>, <ol>, <li> - Lists (bullet and numbered)
 *   <div>, <p> - Paragraph breaks
 */
export function parseHtmlToParagraphs(docx, html) {
  if (!html || typeof html !== 'string') {
    return [new docx.Paragraph('')];
  }

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const paragraphs = [];
  let currentRuns = [];
  let listCounter = 0;
  let currentListType = null; // 'bullet' or 'number'

  function flushCurrentParagraph(listType = null, listNum = 0) {
    if (currentRuns.length > 0) {
      const paraOptions = { children: currentRuns };

      if (listType === 'bullet') {
        // Add bullet character as prefix
        currentRuns.unshift(new docx.TextRun({ text: '• ' }));
        paraOptions.indent = { left: 360 }; // Indent list items
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

    // Create a fresh formatting object for this element
    // Only inherit formatting that should cascade
    const newFormatting = {
      bold: formatting.bold || false,
      italic: formatting.italic || false,
      underline: formatting.underline || false,
      strike: formatting.strike || false,
      highlight: null, // Don't inherit highlight - it must be explicitly set
      color: formatting.color || null,
      fontSize: formatting.fontSize || null
    };

    // Check for formatting tags
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
      // Check for background color (highlight) - only on this specific span
      const bgColor = node.style.backgroundColor;
      if (bgColor && bgColor.trim() !== '' && bgColor !== 'transparent') {
        newFormatting.highlight = bgColor;
      }
      // Check for text color in style
      const textColor = node.style.color;
      if (textColor && textColor.trim() !== '') {
        newFormatting.color = parseColor(textColor);
      }
    } else if (tag === 'FONT') {
      // Handle FONT tag for color and size
      const fontColor = node.getAttribute('color');
      if (fontColor) {
        newFormatting.color = fontColor;
      }
      const fontSize = node.getAttribute('size');
      if (fontSize) {
        // Convert HTML font size (1-7) to Word half-points
        newFormatting.fontSize = mapFontSize(fontSize);
      }
    } else if (tag === 'H1') {
      newFormatting.bold = true;
      newFormatting.fontSize = 48; // 24pt in half-points
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'H2') {
      newFormatting.bold = true;
      newFormatting.fontSize = 36; // 18pt in half-points
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'H3') {
      newFormatting.bold = true;
      newFormatting.fontSize = 28; // 14pt in half-points
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    } else if (tag === 'UL') {
      // Unordered list - process each LI
      const prevListType = currentListType;
      currentListType = 'bullet';
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      currentListType = prevListType;
      return;
    } else if (tag === 'OL') {
      // Ordered list - process each LI
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
      // List item - flush previous and start new paragraph
      flushCurrentParagraph();
      listCounter++;
      // Process LI content
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      // Flush this list item as a paragraph
      flushCurrentParagraph(currentListType, listCounter);
      return;
    } else if (tag === 'DIV' || tag === 'P') {
      // Block elements cause paragraph breaks
      flushCurrentParagraph();
      for (const child of node.childNodes) {
        processNode(child, newFormatting);
      }
      flushCurrentParagraph();
      return;
    }

    // Process child nodes for inline elements
    for (const child of node.childNodes) {
      processNode(child, newFormatting);
    }
  }

  // Process all child nodes of the temp element
  for (const child of temp.childNodes) {
    processNode(child, {});
  }

  // Flush any remaining content
  flushCurrentParagraph();

  // If no paragraphs were created, return an empty paragraph
  if (paragraphs.length === 0) {
    return [new docx.Paragraph('')];
  }

  return paragraphs;
}

/**
 * Legacy function for backward compatibility - returns TextRuns
 * Use parseHtmlToParagraphs for full list support
 */
export function parseHtmlToTextRuns(docx, html) {
  if (!html || typeof html !== 'string') {
    return [new docx.TextRun({ text: '' })];
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const runs = [];

  function processNode(node, formatting = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
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
        runs.push(new docx.TextRun(runOptions));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toUpperCase();

    // Create fresh formatting - don't inherit highlight
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
      runs.push(new docx.TextRun({ break: 1 }));
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
    } else if (tag === 'H2') {
      newFormatting.bold = true;
      newFormatting.fontSize = 36;
    } else if (tag === 'H3') {
      newFormatting.bold = true;
      newFormatting.fontSize = 28;
    } else if (tag === 'LI') {
      // Add bullet for list items in TextRun mode
      runs.push(new docx.TextRun({ text: '• ' }));
    }

    for (const child of node.childNodes) {
      processNode(child, newFormatting);
    }

    // Add line break after block elements
    if (tag === 'LI' || tag === 'DIV' || tag === 'P' || tag === 'H1' || tag === 'H2' || tag === 'H3') {
      runs.push(new docx.TextRun({ break: 1 }));
    }
  }

  for (const child of temp.childNodes) {
    processNode(child, {});
  }

  if (runs.length === 0) {
    return [new docx.TextRun({ text: '' })];
  }

  return runs;
}

/**
 * Maps CSS background colors to Word highlight colors
 * Word has a limited set of highlight colors
 * Returns null if color is not recognized (no highlight applied)
 */
function mapHighlightColor(cssColor) {
  if (!cssColor || cssColor.trim() === '' || cssColor === 'transparent') {
    return null;
  }

  // Normalize the color string
  const color = cssColor.toLowerCase().replace(/\s/g, '');

  // Map common highlight colors - check RGB values (browser computed style)
  // Yellow: rgb(255, 245, 157) or #fff59d
  if (color.includes('rgb(255,245,157)') || color.includes('255,245,157') ||
      color.includes('#fff59d') || color === 'yellow') {
    return 'yellow';
  }
  // Green: rgb(165, 214, 167) or #a5d6a7
  if (color.includes('rgb(165,214,167)') || color.includes('165,214,167') ||
      color.includes('#a5d6a7') || color === 'green') {
    return 'green';
  }
  // Blue: rgb(144, 202, 249) or #90caf9
  if (color.includes('rgb(144,202,249)') || color.includes('144,202,249') ||
      color.includes('#90caf9') || color === 'blue' || color === 'cyan') {
    return 'cyan';
  }
  // Pink: rgb(244, 143, 177) or #f48fb1
  if (color.includes('rgb(244,143,177)') || color.includes('244,143,177') ||
      color.includes('#f48fb1') || color === 'pink' || color === 'magenta') {
    return 'magenta';
  }
  // Orange: rgb(255, 204, 128) or #ffcc80 - map to yellow (Word doesn't have orange)
  if (color.includes('rgb(255,204,128)') || color.includes('255,204,128') ||
      color.includes('#ffcc80') || color === 'orange') {
    return 'yellow';
  }
  // Purple: rgb(206, 147, 216) or #ce93d8
  if (color.includes('rgb(206,147,216)') || color.includes('206,147,216') ||
      color.includes('#ce93d8') || color === 'purple') {
    return 'magenta';
  }

  // Return null for unknown colors - don't apply any highlight
  return null;
}

/**
 * Parses a CSS color value and returns a hex color string
 * Handles rgb(), rgba(), and hex formats
 */
function parseColor(cssColor) {
  if (!cssColor || cssColor.trim() === '') return null;

  // If already a hex color
  if (cssColor.startsWith('#')) {
    return cssColor;
  }

  // Parse rgb/rgba format
  const rgbMatch = cssColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Return as-is for named colors
  return cssColor;
}

/**
 * Maps HTML font size (1-7) to Word half-points
 * Word uses half-points (1pt = 2 half-points)
 */
function mapFontSize(htmlSize) {
  const sizeMap = {
    '1': 16,  // 8pt
    '2': 20,  // 10pt
    '3': 24,  // 12pt
    '4': 28,  // 14pt
    '5': 36,  // 18pt
    '6': 48,  // 24pt
    '7': 72   // 36pt
  };
  return sizeMap[htmlSize] || 24; // Default to 12pt
}

/**
 * Creates a merged cell with HTML content that supports formatting
 * Used for side columns in segment pages
 *
 * @param {Object} docx - The docx library instance
 * @param {string} mergeType - Either "restart" (first cell) or "continue" (subsequent cells)
 * @param {number} widthPercent - Width as percentage
 * @param {string} htmlContent - HTML content to render (optional)
 * @returns {TableCell} A merged cell with formatted content
 */
export function mergedCellWithContent(docx, mergeType, widthPercent, htmlContent = '') {
  let children = [];

  if (htmlContent && mergeType === 'restart') {
    // Only add content in the restart cell (first cell of merge)
    // Use parseHtmlToParagraphs for full list support
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

