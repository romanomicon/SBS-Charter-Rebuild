/* domUtils.js
   Lightweight DOM utility helpers.

   These helpers are intentionally generic so they can be reused
   across many UI modules without duplication.
*/

export function getById(id) {
  return document.getElementById(id);
}

export function createEl(tag, opts = {}) {
  const el = document.createElement(tag);

  if (opts.className) el.className = opts.className;
  if (opts.text) el.textContent = opts.text;
  if (opts.html) el.innerHTML = opts.html;

  if (opts.attrs) {
    Object.entries(opts.attrs).forEach(([k, v]) =>
      el.setAttribute(k, v)
    );
  }

  return el;
}
