# Project Nehemiah — SBS Charter Rebuild

## What this is
A client-side Bible study planning tool. Users pick one of the 66 canonical Bible books,
assign its paragraphs into a three-level hierarchy (Divisions → Sections → Segments),
then view and export a structured chart. All data lives in `localStorage` — no server.

---

## Pages & their scripts

| Page | Purpose | Scripts loaded |
|---|---|---|
| `index.html` | Home — book picker, library | `sidebar.js`, `home.js` |
| `book.html` | Charter Builder — paragraph editor + structure panel | `sidebar.js`, `bookPage.js` (module) |
| `settings.html` | Theme presets | `sidebar.js`, `settings.js` |
| `preview.html` | Chart editor + Word export | `sidebar.js`, `previewPage.js` (module) |

All four pages share the same `<aside class="sidebar">` HTML block and load `sidebar.js`
before the page-specific script.

---

## JavaScript file map

```
js/
  sidebar.js          IIFE. Sidebar expand/collapse toggle, active-page highlight,
                      JS-positioned tooltips, mobile overlay, light/dark theme toggle.
                      Uses localStorage keys: sbExpanded, themePreset.

  home.js             Home page. Tab UI (All Books / Saved Books). Renders book tiles
                      from BOOKS constant. Delete with 10s undo toast.

  bookPage.js         Charter Builder controller. Reads URL params (bookId or name),
                      loads verse ranges, wires Save button, Show/Hide All.

  previewPage.js      Chart editor. Builds overview table + per-segment pages.
                      Rich-text toolbar (30+ formatting options via execCommand).
                      Loads key verse text. Keyboard shortcuts: Ctrl+B/I/U.

  settings.js         Preset buttons → data-preset attribute + localStorage.
                      Ctrl+Shift+T toggles grayscale ↔ dark.

  state.js            Single shared mutable state object:
                        { bookId, bookName, bookTitle, keyVerse,
                          paragraphs:[{range,title,text,content}],
                          divisions:[{id,title,paragraphIndexes}],
                          sections:[{id,title,paragraphIndexes,divisionId}],
                          segments:[{id,title,paragraphIndexes,sectionId}] }
                      Exports: state, isDirty, markDirty(), clearDirty()

  storage.js          localStorage CRUD. Keys: one entry per bookId + "bookIndex".
                      Functions: saveBook(), loadBook(id), listBooks(),
                      deleteBook(id), isBookSaved(id)

  autosave.js         scheduleAutosave(delay=700ms). Debounced — call on every edit.

  structureLogic.js   Hierarchy engine. addSegment/addSection/addDivision(parIndex).
                      Auto-creates at index 0 if no top-level item exists.
                      Cleanup: cleanupSections(), cleanupDivisions() remove orphans.
                      Validation: sectionHasFoundation(), divisionHasWalls().

  paragraphUI.js      Renders left panel paragraph rows (range label, title input,
                      show/hide toggle, D/S/G buttons).

  structureUI.js      Renders right panel structure list (divisions, sections, segments
                      each with verse range, editable title, delete button).

  bookInfoUI.js       Renders inline title + key verse inputs above the panels.

  verseRanges.js      Async fetch from Books/cleaned/{BookName}_ranges.json.
                      Populates state.paragraphs with {range, title:"", text}.

  books.js            BOOKS constant — array of 66 canonical book names in order.

  exportHandlers.js   Bridges book.html buttons → preview.html redirect and exportWord().

  exportWord.js       DOCX generation via docx@7.3.0 CDN library.
                      Overview table with rowspan merging, per-segment pages,
                      full HTML→DOCX conversion (bold/italic/color/highlight/lists).
```

---

## CSS file map

```
css/
  theme.css     CSS custom properties for all 7 presets, applied via
                [data-preset="name"] on <html>. NEVER hardcode colors — always
                use the variables defined here.

  base.css      Global reset, typography, .global-nav, .container, buttons,
                inputs, .panel-header, status indicators, utility classes.

  sidebar.css   Sidebar shell + all sidebar sub-components. Uses only app
                CSS variables from theme.css — no private --sb-* vars.

  home.css      Hero, tab bar + animated indicator, books grid, book tiles,
                saved card layout, undo toast.

  book.css      Two-column panel layout, paragraph rows, structure list.

  preview.css   A4 page sizing, overview table, segment pages, formatting toolbar.

  settings.css  Settings cards, preset button grid.

  mobile.css    Responsive breakpoints.
```

---

## Key CSS variables (all themes define these)

```
Backgrounds:  --bg-primary, --bg-surface, --bg-surface-muted, --bg-hover
Text:         --text-primary, --text-secondary, --text-muted, --text-inverse
Accents:      --accent-primary, --accent-hover, --accent-light, --accent-light-hover
Borders:      --border-primary, --border-secondary, --border-input
Status:       --color-success, --color-danger, --color-warning
Structure:    --structure-division, --structure-section, --structure-segment
Shadows:      --shadow-soft, --shadow-medium, --shadow-strong
Radius:       --radius-small (6px), --radius-medium (10px), --radius-large (14px)
Headers:      --header-bg, --header-text
```

---

## Sidebar — important details

- `sidebar.js` is a **non-module IIFE** — it must load with a plain `<script>` tag,
  before the page-specific module script.
- Sidebar HTML is **duplicated** across all 4 pages (no server-side includes).
  Any structural change must be made in all 4 files: `index.html`, `book.html`,
  `settings.html`, `preview.html`.
- `.sidebar.sb-expanded` → 220px wide. `.sidebar` (default) → 60px collapsed.
- Expand state persisted to `localStorage.sbExpanded`.
- `.sb-notransition` is applied for one frame during page load to prevent the
  expand animation from replaying on navigation.
- Theme toggle cycles `themePreset` between `'grayscale'` and `'dark'`.
  Full theme switching (all 7 presets) is on `settings.html`.
- Mobile (≤768px): sidebar is `transform: translateX(-100%)` (hidden off-screen),
  revealed by `.sb-mobile-open` class via hamburger button `#sbMobileBtn`.
  A dark overlay (`div.sb-mobile-overlay`) is created by JS and appended to body.
- Tooltips are JS-positioned `position:fixed` divs (class `sb-tooltip`) rather
  than CSS `::after` because the sidebar has `overflow:hidden`.

---

## Data persistence

- `localStorage['bookIndex']` — JSON map of `{ bookId: { title, keyVerse, savedAt } }`
- `localStorage[bookId]` — Full serialized state object for each book
- `localStorage['themePreset']` — Active theme name string
- `localStorage['sbExpanded']` — `'true'` or `'false'`

---

## Hierarchy rules

Segment is the atomic unit. A Section must have at least one Segment. A Division must
have at least one Section. Adding a higher-level item auto-creates the lower levels at
index 0 if none exist. Deleting the last supporting item cascades upward (orphan cleanup).

---

## Conventions to follow

1. **No hardcoded colors** — always use CSS custom properties from `theme.css`.
2. **Sidebar HTML is identical across all 4 pages** — changes must be applied to all.
3. `state.js` is mutable shared state — call `markDirty()` and `scheduleAutosave()`
   after any state mutation.
4. `sidebar.js` is non-module (IIFE) — keep it compatible with plain `<script>` loading.
5. `bookPage.js` and `previewPage.js` are ES6 modules — load with `type="module"`.
6. Verse range format: `"3:14–3:16"` (en-dash, chapter:verse).
7. Key verse format: `"3:14"` or `"1:1"` validated with `/^\d{0,3}:?\d{0,3}$/`.
8. External dependency: `docx@7.3.0` loaded from CDN only on `book.html` and
   `preview.html` — do not add it elsewhere.
