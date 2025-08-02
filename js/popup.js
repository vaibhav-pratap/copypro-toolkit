// Initializing popup settings
document.addEventListener("DOMContentLoaded", () => {
  const slugCheckbox = document.getElementById("enable-slug");
  const cleanTextCheckbox = document.getElementById("enable-clean-text");
  const imageNameCheckbox = document.getElementById("enable-image-name");
  const altTextCheckbox = document.getElementById("enable-alt-text");
  const pageCheckbox = document.getElementById("enable-page");
  const labelCheckbox = document.getElementById("enable-label");

  // Load saved settings
  chrome.storage.sync.get(['enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText', 'enablePage', 'enableLabel'], (settings) => {
    slugCheckbox.checked = settings.enableSlug !== false;
    cleanTextCheckbox.checked = settings.enableCleanText !== false;
    imageNameCheckbox.checked = settings.enableImageName !== false;
    altTextCheckbox.checked = settings.enableAltText !== false;
    pageCheckbox.checked = settings.enablePage !== false;
    labelCheckbox.checked = settings.enableLabel !== false;
  });

  // Save settings and update context menus
  slugCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableSlug: slugCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });

  cleanTextCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableCleanText: cleanTextCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });

  imageNameCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableImageName: imageNameCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });

  altTextCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableAltText: altTextCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });

  pageCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enablePage: pageCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });

  labelCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ enableLabel: labelCheckbox.checked }, () => {
      chrome.runtime.sendMessage({ action: 'updateContextMenus' });
    });
  });
});