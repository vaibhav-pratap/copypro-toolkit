// Initializing popup settings
document.addEventListener("DOMContentLoaded", () => {
  const slugCheckbox = document.getElementById("enable-slug");
  const cleanTextCheckbox = document.getElementById("enable-clean-text");
  const imageNameCheckbox = document.getElementById("enable-image-name");
  const altTextCheckbox = document.getElementById("enable-alt-text");

  // Load saved settings
  chrome.storage.sync.get(['enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText'], (settings) => {
    slugCheckbox.checked = settings.enableSlug !== false;
    cleanTextCheckbox.checked = settings.enableCleanText !== false;
    imageNameCheckbox.checked = settings.enableImageName !== false;
    altTextCheckbox.checked = settings.enableAltText !== false;
  });

  // Save settings and update context menus
  slugCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableSlug: slugCheckbox.checked });
  });

  cleanTextCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableCleanText: cleanTextCheckbox.checked });
  });

  imageNameCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableImageName: imageNameCheckbox.checked });
  });

  altTextCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableAltText: altTextCheckbox.checked });
  });
});