# Advanced Preview Features Guide

## 🎉 New Features Overview

You now have three powerful enhancements to the HTML preview:

1. **🔄 Sync Changes Back** - Edit in preview, save to main app
2. **⚡ Auto-Refresh** - Preview updates when you edit main app
3. **🎨 Custom Themes** - Choose different visual styles

---

## 1. 🔄 Sync Changes Back to Main App

### How It Works

Previously, edits in the preview were lost when you closed it. Now you can **sync them back** to the main app!

### Step-by-Step

1. **Open Preview** - Click 👁️ Preview button
2. **Enable Editing** - Click ✏️ Enable Editing
3. **Make Changes** - Edit any text (titles, key verse, etc.)
4. **Click Sync** - Click 🔄 Sync Changes button
5. **Success!** - Changes are now in the main app
6. **Save** - Click Save in main app to persist changes

### What Gets Synced

✅ **Division titles** - All division names
✅ **Section titles** - All section names
✅ **Segment titles** - All segment names
✅ **Paragraph titles** - All paragraph labels
✅ **Key verse** - The key verse text

❌ **NOT synced** - Writing space content (those are for notes only)

### Visual Feedback

- **Yellow highlight** when you hover over editable text
- **Gold border** when editing
- **Alert** confirms successful sync
- **Main app refreshes** to show changes

### Use Cases

**Quick Typo Fixes:**
1. Preview your book
2. Spot a typo in a title
3. Edit and sync
4. Done!

**Bulk Title Editing:**
1. Preview shows all segments on one screen
2. Edit multiple titles quickly
3. Sync all changes at once
4. Much faster than editing one-by-one in main app

---

## 2. ⚡ Auto-Refresh Feature

### How It Works

When you edit content in the main app while preview is open, the preview can **automatically refresh** to show your changes!

### Triggering a Refresh

The preview window will prompt you to refresh when:
- You make changes in the main app
- The preview detects state updates
- You save changes in the main app

### What Happens

1. **You edit** in main app (add segment, change title, etc.)
2. **Preview detects** the change via message passing
3. **Prompt appears** "Main app has updated content. Refresh preview?"
4. **Click OK** - Preview reloads with new content
5. **Click Cancel** - Keep current preview (lose new changes)

### Manual Refresh

Don't want to wait? Just refresh the preview window:
- **Windows:** Press `F5` or `Ctrl+R`
- **Mac:** Press `Cmd+R`

### Tips

**Keep Both Windows Open:**
- Use dual monitors if available
- Arrange side-by-side on single monitor
- Edit in main app, check in preview

**Save Often:**
- Sync preview changes back before editing main app
- Or your preview edits will be overwritten

---

## 3. 🎨 Custom Themes

### Available Themes

Choose from 4 visual styles in the preview toolbar dropdown:

#### **Default Theme** (Current)
- Balanced spacing and sizing
- Professional appearance
- 18pt font
- Standard padding
- **Best for:** General use, printing

#### **Compact Theme**
- Smaller font (14pt)
- Reduced padding
- Tighter spacing
- Shorter writing spaces
- **Best for:** Fitting more content, quick overview

#### **Spacious Theme**
- Larger font (20pt)
- Extra padding
- More breathing room
- Taller writing spaces
- **Best for:** Presentations, readability, screen sharing

#### **Minimal Theme**
- Lighter borders
- White backgrounds
- No shadows
- Clean, simple look
- **Best for:** Minimal printing, focus on content

### How to Change Themes

1. **Open Preview** - Click 👁️ Preview
2. **Find Dropdown** - Look for theme selector in toolbar
3. **Select Theme** - Choose from dropdown
4. **Instant Change** - Page updates immediately

### Theme Comparison

| Feature | Default | Compact | Spacious | Minimal |
|---------|---------|---------|----------|---------|
| Font Size | 18pt | 14pt | 20pt | 18pt |
| Cell Padding | 12px | 8px | 20px | 12px |
| Writing Space | 100px | 60px | 150px | 100px |
| Background | Gray | Gray | Gray | White |
| Shadows | Yes | Yes | Yes | No |

### Print Considerations

**Best for Printing:**
- **Default** - Good all-around
- **Compact** - Fit more per page
- **Minimal** - Save ink

**Avoid for Printing:**
- **Spacious** - May span too many pages

### Customizing Themes Further

Want to create your own theme? Edit `exportHTML.js`:

**Find the theme CSS** (around line 454):
```css
/* Theme: YourTheme */
.theme-yourtheme .overview-table {
  font-size: 16px;
  /* Add your styles */
}
```

**Add to dropdown** (line 66):
```html
<option value="yourtheme">Your Theme</option>
```

---

## 🔧 Advanced Usage Patterns

### Pattern 1: Edit-Sync-Export Workflow

1. Open preview to see full structure
2. Enable editing
3. Make multiple changes
4. Sync back to main app
5. Export to Word with all changes

**Time saved:** Much faster than editing in main app!

### Pattern 2: Review-Refine Workflow

1. Export preview
2. Share screen with team
3. Get feedback on layout
4. Make changes live in preview
5. Sync changes
6. Re-export to Word

**Benefit:** Collaborative editing!

### Pattern 3: Theme-Test Workflow

1. Open preview
2. Try different themes
3. See which fits best on page
4. Choose optimal theme
5. Print or export

**Benefit:** Visual comparison!

### Pattern 4: Dual-Monitor Workflow

**Setup:**
- Main app on left monitor
- Preview on right monitor

**Workflow:**
- Edit structure in main app
- Preview auto-refreshes
- See changes instantly
- No switching windows!

---

## 🐛 Troubleshooting

### "Main app is closed" Error

**Problem:** Clicked Sync but main app closed
**Solution:** Reopen main app, then try sync again

### Changes Didn't Sync

**Check these:**
1. Did you click 🔄 Sync Changes?
2. Was main app window still open?
3. Did you see success message?
4. Did you save in main app after syncing?

**Fix:** Try syncing again, check console for errors

### Preview Won't Refresh

**Problem:** Made changes in main app but preview didn't update
**Solutions:**
- Click the refresh button in preview
- Close and reopen preview
- Check if popup blocker is blocking

### Theme Not Changing

**Problem:** Selected theme but nothing changed
**Solutions:**
- Try selecting different theme then back
- Refresh the preview window
- Check browser console for errors

### Sync Warning on Close

**Problem:** Tried to close but got unsaved changes warning
**This is intentional!** Options:
1. Click 🔄 Sync Changes, then close
2. Click OK to close anyway (lose changes)
3. Click Cancel to stay in preview

---

## 💡 Pro Tips

### Tip 1: Keyboard Shortcuts
While in preview:
- `Ctrl+P` - Print
- `Ctrl+W` - Close (warns if unsaved)
- `Ctrl+F` - Find text
- `Ctrl+R` - Refresh

### Tip 2: Sync Before Export
Always sync preview changes before exporting to Word:
1. Make edits in preview
2. Click 🔄 Sync
3. Go to main app
4. Click Word export
5. Your edits are included!

### Tip 3: Theme for Purpose
- **Reviewing:** Spacious
- **Quick edit:** Compact
- **Presenting:** Spacious
- **Printing:** Default or Minimal

### Tip 4: Use with Screen Share
When collaborating:
1. Open preview
2. Share preview window
3. Enable editing
4. Make changes as team discusses
5. Sync when done
6. Everyone sees updates immediately!

### Tip 5: Preview as Backup
Before making major changes:
1. Open preview (snapshot of current state)
2. Make changes in main app
3. If you don't like changes, copy from preview
4. Or just don't save in main app

---

## 🔐 Security & Privacy

### Data Storage
- All edits happen in browser memory
- Nothing sent to external servers
- Sync uses `postMessage` (window-to-window)
- Safe for sensitive content

### Window Communication
- Messages only between your windows
- Origin checking could be added for extra security
- Close preview to stop communication

---

## 🚀 Future Enhancements

Possible future features:

- **Cloud sync** - Share preview link with others
- **Real-time collaboration** - Multiple users edit simultaneously
- **Version history** - See what changed and when
- **Export custom themes** - Save your theme preferences
- **Mobile-optimized** - Better preview on phones/tablets

---

## 📋 Quick Reference Card

| Action | How To |
|--------|--------|
| Enable editing | Click ✏️ Enable Editing |
| Sync changes back | Click 🔄 Sync Changes |
| Change theme | Use theme dropdown |
| Refresh preview | Press F5 or Ctrl+R |
| Close preview | Click ❌ Close |
| Print | Click 🖨️ or Ctrl+P |
| Export to Word | Click 📄 Export to Word |

---

## ❓ FAQ

**Q: Will syncing overwrite my main app content?**
A: No! Sync only updates the specific titles you edited. It doesn't delete anything.

**Q: Can I undo a sync?**
A: Not automatically, but you can manually change things back in the main app, or don't click Save after syncing.

**Q: Do I need to sync every time I edit?**
A: Only if you want those edits saved. Otherwise they're temporary in the preview.

**Q: Can I have multiple preview windows open?**
A: Yes, but only the most recent one will receive refresh notifications.

**Q: What if my browser blocks popups?**
A: Allow popups for your site, or the preview window won't open.

**Q: Can I share the preview with others?**
A: Not directly - it's in your browser only. But you can:
- Share your screen
- Print to PDF and share that
- Export to Word and share

**Q: Does this work offline?**
A: Yes! Everything happens in your browser. No internet needed.

---

**Happy previewing! 🎉**

For more help, see:
- [HTML_PREVIEW_GUIDE.md](./HTML_PREVIEW_GUIDE.md) - Basic preview guide
- [EXPORT_GUIDE.md](./EXPORT_GUIDE.md) - Main export documentation
- [QUICK_EDITS.md](./QUICK_EDITS.md) - Quick edit cheatsheet
