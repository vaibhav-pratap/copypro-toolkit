// js/background/menus.js - Context menu initialization logic

/**
 * Initialize and update context menus based on stored settings
 */
export function initializeContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.sync.get([
      'enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText', 'enableLabel', 'enablePage', 'enableSelector', 'enableSeo'
    ], (settings) => {
      
      // Slug
      if (settings.enableSlug !== false) {
        chrome.contextMenus.create({
          id: "copy-slug",
          title: "Copy Slug Address",
          contexts: ["link"]
        });
        chrome.contextMenus.create({
          id: "copy-selection-slug",
          title: "Copy Selection as Slug",
          contexts: ["selection"]
        });
      }
      
      // Clean Text
      if (settings.enableCleanText !== false) {
        chrome.contextMenus.create({
          id: "copy-clean-text",
          title: "Copy Clean Text",
          contexts: ["selection"]
        });
      }
      
      // Image Name
      if (settings.enableImageName !== false) {
        chrome.contextMenus.create({
          id: "copy-image-name",
          title: "Copy Image Name",
          contexts: ["image", "all"]
        });
        chrome.contextMenus.create({
          id: "copy-image-data",
          title: "Copy as Data URI",
          contexts: ["image"]
        });
      }
      
      // Alt Text
      if (settings.enableAltText !== false) {
        chrome.contextMenus.create({
          id: "copy-alt-text",
          title: "Copy Alt Text",
          contexts: ["image", "all"]
        });
      }

      // Selector
      if (settings.enableSelector !== false) {
        chrome.contextMenus.create({
          id: "copy-selector",
          title: "Copy CSS Selector",
          contexts: ["all"]
        });
      }

      // SEO
      if (settings.enableSeo !== false) {
        chrome.contextMenus.create({
          id: "copy-heading-structure",
          title: "Copy SEO Heading Tree",
          contexts: ["all"]
        });
      }
      
      // Label
      if (settings.enableLabel !== false) {
        chrome.contextMenus.create({
          id: "copy-label",
          title: "Copy Button/Link Label",
          contexts: ["link", "all"]
        });
      }
      
      // Page URL
      if (settings.enablePage !== false) {
        chrome.contextMenus.create({
          id: "copy-page",
          title: "Copy Page URL",
          contexts: ["all"]
        });
      }
    });
  });
}
