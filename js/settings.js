// ================================
// Theme Settings — Modal Controller
// ================================
// Plain non-module script, compatible with a regular <script> tag.
// Powers the floating settings modal on all 4 active pages.
// The core theme-switching logic is unchanged from the original.

document.addEventListener("DOMContentLoaded", () => {
  const root     = document.documentElement;
  const buttons  = document.querySelectorAll(".preset-button");
  const modal    = document.getElementById("stgModal");
  const backdrop = document.getElementById("stgBackdrop");
  const closeBtn = document.getElementById("stgClose");

  // Intercept the Settings sidebar link — open modal instead of navigating
  const settingsLink = document.querySelector('.sb-item[data-page="settings"]');

  // ── Theme init ──────────────────────────────────────────────
  const savedPreset = localStorage.getItem("themePreset") || "grayscale";
  setPreset(savedPreset);
  updateActiveButton(savedPreset);

  // ── Preset buttons ──────────────────────────────────────────
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset;
      setPreset(preset);
      localStorage.setItem("themePreset", preset);
      updateActiveButton(preset);
      showConfirmation(`Theme changed to ${getPresetName(preset)}`);
    });
  });

  // ── Modal open / close ──────────────────────────────────────
  function openModal() {
    if (!modal || !backdrop) return;
    modal.classList.add("stg-is-open");
    backdrop.classList.add("stg-is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.classList.remove("stg-is-open");
    backdrop.classList.remove("stg-is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // Open when Settings sidebar item is clicked
  if (settingsLink) {
    settingsLink.addEventListener("click", e => {
      e.preventDefault();
      openModal();
    });
  }

  // Close via X button, backdrop click, or Escape key
  if (closeBtn)  closeBtn.addEventListener("click", closeModal);
  if (backdrop)  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // ── Helpers ─────────────────────────────────────────────────
  function setPreset(presetName) {
    root.setAttribute("data-preset", presetName);
  }

  function updateActiveButton(activePreset) {
    buttons.forEach(btn => {
      if (btn.dataset.preset === activePreset) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function getPresetName(preset) {
    const names = {
      'grayscale': 'Grayscale',
      'grayscale-inverted': 'Inverted',
      'green': 'Forest Green',
      'blue': 'Ocean Blue',
      'dark': 'Dark Mode',
      'orange': 'Sunset Orange',
      'purple': 'Purple Haze'
    };
    return names[preset] || preset;
  }

  function showConfirmation(message) {
    let confirmation = document.getElementById('theme-confirmation');

    if (!confirmation) {
      confirmation = document.createElement('div');
      confirmation.id = 'theme-confirmation';
      confirmation.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--toast-bg);
        color: var(--toast-text);
        padding: 12px 20px;
        border-radius: var(--radius-medium);
        box-shadow: var(--shadow-strong);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 1000;
        font-size: 0.9rem;
        pointer-events: none;
      `;
      document.body.appendChild(confirmation);
    }

    confirmation.textContent = message;

    setTimeout(() => {
      confirmation.style.opacity = '1';
      confirmation.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      confirmation.style.opacity = '0';
      confirmation.style.transform = 'translateY(20px)';
    }, 2000);
  }

  // Ctrl/Cmd + Shift + T = Toggle between light and dark
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      const currentPreset = localStorage.getItem("themePreset") || "grayscale";
      const newPreset = currentPreset === 'dark' ? 'grayscale' : 'dark';
      setPreset(newPreset);
      localStorage.setItem("themePreset", newPreset);
      updateActiveButton(newPreset);
      showConfirmation(`Switched to ${getPresetName(newPreset)}`);
    }
  });
});
