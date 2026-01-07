/* utils.js
   Utility DOM helper functions used across bookPage.js and others.
   Keep these small and well-documented.
*/

/**
 * getById - safe shorthand for document.getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getById(id) {
  return document.getElementById(id);
}

/**
 * createEl - create an element with classes & attrs quickly
 * @param {string} tag
 * @param {Object} options - { className, attrs: {k:v}, text }
 * @returns HTMLElement
 */
function createEl(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  if (options.attrs) {
    Object.keys(options.attrs).forEach(k => el.setAttribute(k, options.attrs[k]));
  }
  return el;
}

/**
 * readQueryParam - read a query parameter from current page URL
 * @param {string} name
 * @returns {string|null}
 */
function readQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/**
 * sanitize - very small helper to escape text inserted into textContent mode.
 * Use for safety when setting textContent.
 */
function sanitize(str) {
  if (str == null) return '';
  return String(str);
}
