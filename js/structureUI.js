/* structureUI.js
   Renders the stacked structure panel:
   Divisions → Sections → Segments
*/

import { state } from "./state.js";
import { getById, createEl } from "./domUtils.js";
import {
  deleteDivision,
  deleteSection,
  deleteSegment
} from "./structureLogic.js";

export function renderStructure() {
  const container = getById('structureList');
  if (!container) return;

  container.innerHTML = '';

  function addHeading(text) {
    const heading = createEl('div', {
      className: 'structure-heading',
      text
    });
    container.appendChild(heading);
  }

  function renderGroup(items = [], type) {
    if (!Array.isArray(items)) return;

    items
      .filter(i => Array.isArray(i.paragraphIndexes) && i.paragraphIndexes.length)
      .sort((a, b) => a.paragraphIndexes[0] - b.paragraphIndexes[0])
      .forEach(item => {
        const box = createEl('div', {
          className: `structure-box ${type}-box`
        });

        const row = createEl('div', { className: 'structure-row' });

        const range =
          state.paragraphs?.[item.paragraphIndexes[0]]?.range || '';

        const rangeLabel = createEl('div', {
          className: 'verse-label small',
          text: range
        });

        const title = createEl('input', {
          attrs: { placeholder: `${type} title` }
        });
        title.value = item.title || '';
        title.oninput = e => (item.title = e.target.value);

        const del = createEl('button', {
          className: 'btn small delete-btn',
          text: '✖',
          attrs: { title: `Delete ${type}` }
        });

        del.onclick = () => {
          if (type === 'division') deleteDivision(item.id);
          if (type === 'section') deleteSection(item.id);
          if (type === 'segment') deleteSegment(item.id);
          renderStructure();
        };

        row.append(rangeLabel, title, del);
        box.appendChild(row);
        container.appendChild(box);
      });
  }

  // ---- Render with headings ----
  addHeading('Divisions');
  renderGroup(state.divisions, 'division');

  container.appendChild(
    createEl('hr', { className: 'structure-separator' })
  );

  addHeading('Sections');
  renderGroup(state.sections, 'section');

  container.appendChild(
    createEl('hr', { className: 'structure-separator' })
  );

  addHeading('Segments');
  renderGroup(state.segments, 'segment');
}
