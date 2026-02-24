/**
 * Sidebar — Project Nehemiah
 * Handles:
 *   - Toggle expand/collapse (desktop, persisted)
 *   - Active-page highlighting
 *   - Hover tooltips in collapsed state (JS-positioned to avoid overflow clip)
 *   - Mobile open/close with overlay
 *   - Light/dark theme toggle (syncs with app data-preset system)
 */
(function () {
  'use strict';

  var PRESET_KEY  = 'themePreset';
  var SIDEBAR_KEY = 'sbExpanded';

  /* ── Sidebar toggle icons ──────────────────────────────────────── */
  var EXPAND_SVG   = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
  var COLLAPSE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

  /* ── Theme toggle icons ────────────────────────────────────────── */
  var MOON_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SUN_SVG  = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  /* ── Hamburger icon (mobile open button) ──────────────────────── */
  var MENU_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

  /* ── Helpers ───────────────────────────────────────────────────── */
  function applyPreset(preset) {
    document.documentElement.setAttribute('data-preset', preset);
    localStorage.setItem(PRESET_KEY, preset);
    updateThemeBtn(preset);
  }

  function updateThemeBtn(preset) {
    var btn = document.getElementById('sbThemeToggle');
    if (!btn) return;
    if (preset === 'dark') {
      btn.innerHTML = SUN_SVG;
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      btn.innerHTML = MOON_SVG;
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  function updateCollapseBtn(btn, expanded) {
    if (!btn) return;
    btn.innerHTML = expanded ? COLLAPSE_SVG : EXPAND_SVG;
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    btn.setAttribute('aria-label', expanded ? 'Collapse navigation' : 'Expand navigation');
  }

  /* ── DOM ready ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    var sidebar = document.getElementById('mainSidebar');
    if (sidebar) {
      document.body.classList.add('has-sidebar');

      /* ── Restore expanded state (no transition — must be instant) */
      var wasExpanded = localStorage.getItem(SIDEBAR_KEY) === 'true';
      if (wasExpanded) {
        sidebar.classList.add('sb-notransition', 'sb-expanded');
        sidebar.offsetHeight; /* force reflow before removing guard */
        sidebar.classList.remove('sb-notransition');
      }

      /* ── Active page detection ──────────────────────────────── */
      var filename = location.pathname.split('/').pop() || '';
      sidebar.querySelectorAll('.sb-item[data-page]').forEach(function (item) {
        var page = item.dataset.page;
        var isActive =
          (page === 'landing'  && (filename === 'index.html' || filename === '')) ||
          (page === 'home'     && filename === 'home.html') ||
          (page === 'settings' && filename === 'settings.html');
        if (isActive) item.classList.add('active');
      });

      /* ── Collapse / expand toggle (desktop) ─────────────────── */
      var collapseBtn = document.getElementById('sbCollapseToggle');
      updateCollapseBtn(collapseBtn, wasExpanded);

      if (collapseBtn) {
        collapseBtn.addEventListener('click', function () {
          var expanded = sidebar.classList.toggle('sb-expanded');
          localStorage.setItem(SIDEBAR_KEY, expanded ? 'true' : 'false');
          updateCollapseBtn(collapseBtn, expanded);
        });
      }

      /* ── Tooltips ───────────────────────────────────────────── */
      /* Use a JS-positioned fixed div — CSS ::after can't escape  */
      /* the sidebar's overflow:hidden. Delay set via CSS class.   */
      var tooltip = document.createElement('div');
      tooltip.className = 'sb-tooltip';
      tooltip.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltip);

      sidebar.querySelectorAll('.sb-item[data-tooltip]').forEach(function (item) {
        item.addEventListener('mouseenter', function () {
          if (sidebar.classList.contains('sb-expanded')) return;
          var rect = item.getBoundingClientRect();
          tooltip.textContent = item.dataset.tooltip;
          tooltip.style.top  = (rect.top + rect.height / 2) + 'px';
          tooltip.style.left = (rect.right + 12) + 'px';
          tooltip.classList.add('sb-tooltip--visible');
        });
        item.addEventListener('mouseleave', function () {
          tooltip.classList.remove('sb-tooltip--visible');
        });
      });

      /* ── Mobile open / close ────────────────────────────────── */
      var mobileBtn = document.getElementById('sbMobileBtn');
      if (mobileBtn) mobileBtn.innerHTML = MENU_SVG;

      var overlay = document.createElement('div');
      overlay.className = 'sb-mobile-overlay';
      document.body.appendChild(overlay);

      function openMobile() {
        sidebar.classList.add('sb-mobile-open');
        overlay.classList.add('sb-overlay-visible');
        if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'true');
      }

      function closeMobile() {
        sidebar.classList.remove('sb-mobile-open');
        overlay.classList.remove('sb-overlay-visible');
        if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
      }

      if (mobileBtn) {
        mobileBtn.addEventListener('click', function () {
          sidebar.classList.contains('sb-mobile-open') ? closeMobile() : openMobile();
        });
      }

      overlay.addEventListener('click', closeMobile);

      /* Close on nav item tap (mobile) */
      sidebar.querySelectorAll('.sb-item').forEach(function (item) {
        item.addEventListener('click', function () {
          if (window.innerWidth <= 768) closeMobile();
        });
      });
    }

    /* ── Theme toggle — cycles grayscale ↔ dark ─────────────────── */
    var themeBtn = document.getElementById('sbThemeToggle');
    if (themeBtn) {
      var currentPreset = localStorage.getItem(PRESET_KEY) || 'grayscale';
      updateThemeBtn(currentPreset);
      themeBtn.addEventListener('click', function () {
        var active = document.documentElement.getAttribute('data-preset') || 'grayscale';
        applyPreset(active === 'dark' ? 'grayscale' : 'dark');
      });
    }
  });
}());
