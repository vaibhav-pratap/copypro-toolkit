// js/background/main.js - Background Service Worker Entry Point

import { initializeContextMenus } from './menus.js';
import { initializeCommands } from './commands.js';
import { copySlug, copySelectionAsSlug } from '../features/slug.js';
import { copyCleanText } from '../features/text.js';
import { copyLabel } from '../features/label.js';
import { copyPage } from '../features/page.js';
import { copyCssSelector } from '../features/selector.js';
import { copyHeadingStructure } from '../features/seo.js';

// History logic
function addToHistory(item) {
  chrome.storage.local.get(['copyHistory'], (result) => {
    let history = result.copyHistory || [];
    history.unshift({
      ...item,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random().toString(36).substr(2, 4) // More unique ID
    });
    // Keep last 30 items
    history = history.slice(0, 30);
    chrome.storage.local.set({ copyHistory: history });
  });
}

// Unified Script Execution Helper
function executeFeature(tabId, func, args = []) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: func,
    args: args
  });
}

// Initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log("CopyPro Toolkit Modular: Extension installed or updated");
  initializeContextMenus();

  chrome.storage.sync.set({
    enableSlug: true,
    enableCleanText: true,
    enableImageName: true,
    enableAltText: true,
    enableLabel: true,
    enablePage: true,
    enableSelector: true,
    enableSeo: true
  });
});

// Settings cache for synchronous access
let settingsCache = {
  preferMarkdown: false
};

// Load settings initially
chrome.storage.sync.get(['preferMarkdown'], (result) => {
  settingsCache = { ...settingsCache, ...result };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const [key, { newValue }] of Object.entries(changes)) {
      settingsCache[key] = newValue;
    }
  }
});

// Export helper for commands
export function getSettings() {
  return settingsCache;
}

// Messaging
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'updateContextMenus') {
    initializeContextMenus();
  } else if (request.action === 'addToHistory') {
    addToHistory(request.data);
  } else if (request.action === 'show-toast') {
    // Relay to current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  }
});

initializeCommands();

// Context menu click handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id || tab.id === -1) return;

  // Use cached settings to avoid async delay (preserving user gesture)
  const preferMd = settingsCache.preferMarkdown === true;
  let func = null;
  let args = [];

  switch (info.menuItemId) {
    case "copy-slug":
      func = copySlug;
      args = [info.linkUrl];
      break;
    case "copy-selection-slug":
      func = copySelectionAsSlug;
      break;
    case "copy-clean-text":
      func = copyCleanText;
      args = [preferMd];
      break;
    case "copy-image-name":
      chrome.tabs.sendMessage(tab.id, { action: 'copy-image-name' });
      break;
    case "copy-alt-text":
      chrome.tabs.sendMessage(tab.id, { action: 'copy-alt-text' });
      break;
    case "copy-image-data":
      chrome.tabs.sendMessage(tab.id, { action: 'copy-image-data' });
      break;
    case "copy-label":
      func = copyLabel;
      break;
    case "copy-page":
      func = copyPage;
      break;
    case "copy-selector":
      func = copyCssSelector;
      break;
    case "copy-heading-structure":
      func = copyHeadingStructure;
      break;
  }

  if (func) {
    executeFeature(tab.id, func, args);
  }
});
