// ================================
// Theme Settings Controller
// Complete version with all features
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll(".preset-button");

  // Load saved preset from localStorage (use consistent key name)
  const savedPreset = localStorage.getItem("themePreset") || "green";
  setPreset(savedPreset);

  // Highlight the active button
  updateActiveButton(savedPreset);

  // Add click listeners to preset buttons
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset;
      setPreset(preset);
      // Use consistent key name across all pages
      localStorage.setItem("themePreset", preset);
      updateActiveButton(preset);
      
      // Show brief confirmation
      showConfirmation(`Theme changed to ${getPresetName(preset)}`);
    });
  });

  // Function to apply preset
  function setPreset(presetName) {
    root.setAttribute("data-preset", presetName);
  }

  // Function to update active button styling
  function updateActiveButton(activePreset) {
    buttons.forEach(btn => {
      if (btn.dataset.preset === activePreset) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Get friendly preset name
  function getPresetName(preset) {
    const names = {
      'green': 'Forest Green',
      'blue': 'Ocean Blue',
      'dark': 'Dark Mode',
      'orange': 'Sunset Orange',
      'purple': 'Purple Haze'
    };
    return names[preset] || preset;
  }

  // Show confirmation message
  function showConfirmation(message) {
    // Check if confirmation element exists, create if not
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
    
    // Trigger animation
    setTimeout(() => {
      confirmation.style.opacity = '1';
      confirmation.style.transform = 'translateY(0)';
    }, 10);

    // Hide after 2 seconds
    setTimeout(() => {
      confirmation.style.opacity = '0';
      confirmation.style.transform = 'translateY(20px)';
    }, 2000);
  }

  // ================================
  // Export/Import Theme Settings (Future)
  // ================================
  
  // Export current theme settings
  function exportThemeSettings() {
    const settings = {
      preset: localStorage.getItem("themePreset") || "green",
      customColors: JSON.parse(localStorage.getItem("customColors") || '{}'),
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'theme-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import theme settings
  function importThemeSettings(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
        if (settings.preset) {
          localStorage.setItem("themePreset", settings.preset);
          setPreset(settings.preset);
          updateActiveButton(settings.preset);
        }
        
        if (settings.customColors) {
          localStorage.setItem("customColors", JSON.stringify(settings.customColors));
          applyCustomColors(settings.customColors);
        }
        
        showConfirmation('Theme settings imported successfully');
      } catch (error) {
        console.error('Failed to import theme settings:', error);
        showConfirmation('Failed to import theme settings');
      }
    };
    
    reader.readAsText(file);
  }

  // ================================
  // Custom Color Support (Future)
  // ================================
  
  function applyCustomColors(customColors) {
    Object.entries(customColors).forEach(([variable, color]) => {
      root.style.setProperty(variable, color);
    });
  }

  function resetToDefaults() {
    localStorage.removeItem("themePreset");
    localStorage.removeItem("customColors");
    setPreset("green");
    updateActiveButton("green");
    
    // Remove any custom color overrides
    const customColors = [
      '--bg-primary', '--bg-surface', '--text-primary', 
      '--accent-primary', '--accent-hover'
    ];
    customColors.forEach(variable => {
      root.style.removeProperty(variable);
    });
    
    showConfirmation('Reset to default theme');
  }

  // ================================
  // Keyboard Shortcuts (Optional)
  // ================================
  
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + T = Toggle between light and dark
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      const currentPreset = localStorage.getItem("themePreset") || "green";
      const newPreset = currentPreset === 'dark' ? 'green' : 'dark';
      setPreset(newPreset);
      localStorage.setItem("themePreset", newPreset);
      updateActiveButton(newPreset);
      showConfirmation(`Switched to ${getPresetName(newPreset)}`);
    }
  });

  // Make functions available globally if needed
  window.themeSettings = {
    setPreset,
    exportThemeSettings,
    importThemeSettings,
    resetToDefaults,
    getCurrentPreset: () => localStorage.getItem("themePreset") || "green"
  };
});