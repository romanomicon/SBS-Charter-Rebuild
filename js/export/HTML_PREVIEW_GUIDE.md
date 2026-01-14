# HTML Preview Feature - User Guide

## 🎯 What is it?

The HTML Preview feature lets you see your book structure in a web browser **before** exporting to Word. You can edit content, check the layout, and even print to PDF - all without downloading anything!

---

## 🚀 How to Use

### Step 1: Click the Preview Button
In your book editor, look for the **👁️ Preview** button in the top-right toolbar.

### Step 2: Preview Opens in New Tab
A new browser tab/window opens showing your complete book structure:
- Overview table on page 1
- Individual segment pages following

### Step 3: Use the Toolbar
At the top of the preview, you'll see buttons:

| Button | What it Does |
|--------|--------------|
| 🖨️ **Print / Save as PDF** | Opens print dialog - can save as PDF |
| 📄 **Export to Word** | Reminder to export from main app |
| ✏️ **Enable Editing** | Turns on live editing mode |
| ❌ **Close Preview** | Closes the preview window |

### Step 4: Edit Content (Optional)
1. Click **✏️ Enable Editing**
2. Click on any text to edit it
3. Changes are highlighted in yellow
4. Content becomes editable:
   - Division/Section/Segment titles
   - Paragraph titles
   - Key verse text
   - Writing spaces

### Step 5: Print or Export
**To save as PDF:**
1. Click **🖨️ Print / Save as PDF**
2. Select "Save as PDF" as the printer
3. Click Save

**To export to Word:**
- Go back to the main app
- Click the **Word** button
- Your edits in the preview won't be saved (see limitations below)

---

## ⚠️ Important Limitations

### Edits Don't Sync Back (Yet)
Changes you make in the preview are **NOT** saved back to your main book structure.

**Why?**
This is a view-only preview. To save edits, you'd need to:
1. Make changes in the main app
2. Preview again
3. Or export to Word

**Future Enhancement:**
We could add a "Copy Edits Back" feature if needed!

### Browser Compatibility
- Works best in Chrome, Firefox, Edge
- Safari may have minor styling differences
- Mobile browsers: layout may be cramped

---

## 💡 Use Cases

### 1. Quick Layout Check
Before exporting to Word, preview to ensure:
- All segments are present
- Tables look correct
- No missing content

### 2. Print to PDF Instead
Don't need Word? Print directly to PDF:
- Faster than Word export
- Same visual layout
- Shareable without Word

### 3. Share for Review
Open preview and share your screen to:
- Show structure to team
- Get feedback before finalizing
- Walk through the layout

### 4. Make Quick Edits
While previewing, you can:
- Fix typos you notice
- Adjust wording
- But remember: edits won't save back!

---

## 🎨 Customizing the Preview

Want to change how the preview looks? Edit `exportHTML.js`:

### Change Font Size
**Line ~129 in `getPreviewStyles()`:**
```css
font-size: 18px;  /* Change this number */
```

### Change Colors
**Line ~159:**
```css
.overview-table th {
  background: #f8f9fa;  /* Light gray - change to any color */
}
```

### Change Page Width
**Line ~105:**
```css
max-width: 8.5in;  /* Standard letter width - adjust as needed */
```

---

## 🐛 Troubleshooting

### Preview Opens But Is Blank
- Check browser console for errors (F12)
- Ensure you have content in your book structure
- Try a different browser

### Text Is Cut Off
- Browser zoom might be set incorrectly
- Reset zoom to 100% (Ctrl+0 or Cmd+0)

### Can't Enable Editing
- JavaScript might be disabled
- Check browser settings
- Try a different browser

### Print Looks Different
- This is normal - print preview may adjust layout
- Try "Background Graphics" option in print settings
- Use "Save as PDF" for best results

---

## 🔮 Future Enhancements

Potential features we could add:

1. **Sync Edits Back** - Save preview changes to main app
2. **Custom Templates** - Choose different layout styles
3. **Export Options** - More control over formatting
4. **Collaboration** - Share preview link with others
5. **Auto-refresh** - Preview updates as you edit main app

Let us know what you'd like to see!

---

## 📋 Keyboard Shortcuts (In Preview)

| Shortcut | Action |
|----------|--------|
| **Ctrl+P** (Cmd+P) | Open print dialog |
| **Ctrl+W** (Cmd+W) | Close preview tab |
| **Ctrl+F** (Cmd+F) | Find text in preview |
| **Ctrl+Plus/Minus** | Zoom in/out |

---

## 🎓 Tips & Tricks

### Tip 1: Use Preview First
Always preview before exporting to Word. It's faster and you can catch issues early.

### Tip 2: Print to PDF for Sharing
If you just need to share the structure, PDF is often better than Word:
- Smaller file size
- Can't be accidentally edited
- Opens on any device

### Tip 3: Keep Preview Open
Open preview alongside main app:
- Edit in main app
- Refresh preview to see changes
- Use dual monitors for best experience

### Tip 4: Check Page Breaks
Preview shows where pages break. If something looks off:
- Adjust content in main app
- Preview again
- Repeat until perfect

---

## ❓ FAQ

**Q: Do I still need to export to Word?**
A: Only if you need a .docx file. For viewing and PDF, preview is enough!

**Q: Can I print from the preview?**
A: Yes! Click 🖨️ or press Ctrl+P to print or save as PDF.

**Q: Will my edits in preview save?**
A: No, currently edits in preview are temporary. Edit in the main app instead.

**Q: Can I share the preview with others?**
A: The preview opens in your browser only. To share:
- Print to PDF and share that
- Share your screen while preview is open
- Export to Word and share the file

**Q: Why does preview look different than Word?**
A: They use different rendering engines. The preview is close but may have minor differences.

**Q: Can I customize the preview layout?**
A: Yes! Edit `exportHTML.js` - see "Customizing the Preview" section above.

---

**Need Help?** Check the main EXPORT_GUIDE.md for more details!
