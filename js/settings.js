// ================================
// Theme Settings Controller
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll(".preset-button");

  const savedPreset = localStorage.getItem("themePreset") || "grayscale";
  setPreset(savedPreset);
  updateActiveButton(savedPreset);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset;
      setPreset(preset);
      localStorage.setItem("themePreset", preset);
      updateActiveButton(preset);
      showConfirmation(`Theme changed to ${getPresetName(preset)}`);
    });
  });

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
