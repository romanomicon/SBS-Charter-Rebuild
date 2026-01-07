/* paragraphUI.js
   Renders paragraph rows
*/

import { state } from "./state.js";
import { getById, createEl } from "./domUtils.js";
import { addDivision, addSection, addSegment } from "./structureLogic.js";
import { renderStructure } from "./structureUI.js";

export function renderParagraphRows() {
  const container = getById('paragraphRows');
  if (!container) return;
  container.innerHTML = '';

  state.paragraphs.forEach((p, i) => {
    const row = createEl('div', { className: 'paragraph-row compact' });

    const range = createEl('div', {
      className: 'verse-label small',
      text: p.range
    });

    const editorRow = createEl('div', { className: 'paragraph-editor' });

    const title = createEl('input', {
      className: 'paragraph-title',
      attrs: { placeholder: 'Paragraph title' }
    });
    title.value = p.title || '';
    title.oninput = e => (p.title = e.target.value);

    const show = createEl('button', {
      className: 'btn small',
      text: '👁'
    });

    const text = createEl('div', {
      className: 'verse-text-box',
      text: p.text || ''
    });
    text.style.display = 'none';

    show.onclick = () => {
      text.style.display = text.style.display === 'none' ? 'block' : 'none';
    };

    editorRow.append(title, show);

    [
      ['D', () => addDivision(i)],
      ['S', () => addSection(i)],
      ['G', () => addSegment(i)]
    ].forEach(([label, fn]) => {
      const btn = createEl('button', {
        className: 'btn small compact-btn',
        text: label
      });
      btn.onclick = () => {
        fn();
        renderStructure();
      };
      editorRow.appendChild(btn);
    });

    row.append(range, editorRow, text);
    container.appendChild(row);
  });
}
